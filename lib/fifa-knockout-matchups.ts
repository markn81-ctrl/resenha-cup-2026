import { MatchStatus, Phase, Prisma } from "@prisma/client";
import { addHours, subHours } from "date-fns";
import {
  fetchFifaJson,
  FIFA_API_BASE_URL,
  FIFA_WORLD_CUP_COMPETITION_ID,
  FIFA_WORLD_CUP_2026_SEASON_ID,
  formatFifaApiDate,
  type FifaCalendarMatch
} from "@/lib/fifa-results";
import { prisma } from "@/lib/prisma";

type LocalTeam = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  countryCode?: string | null;
};

type MatchupStatus = "READY" | "UNCHANGED" | "UNAVAILABLE" | "MISSING_TEAM" | "FINISHED";

type InternalMatchup = {
  matchId: string;
  number: number;
  phase: Phase;
  startsAt: string;
  status: MatchupStatus;
  canApply: boolean;
  warnings: string[];
  current: {
    homeTeam: string;
    awayTeam: string;
    homeCode?: string | null;
    awayCode?: string | null;
  };
  official?: {
    fifaMatchId: string;
    homeTeam: string;
    awayTeam: string;
    homeCode: string;
    awayCode: string;
    homeCountryCode?: string | null;
    awayCountryCode?: string | null;
    homeTeamId: string;
    awayTeamId: string;
  };
};

export type KnockoutMatchupPreview = {
  source: {
    name: string;
    url: string;
    fetchedAt: string;
  };
  summary: {
    total: number;
    ready: number;
    unchanged: number;
    unavailable: number;
    missingTeam: number;
    finished: number;
  };
  matches: Array<Omit<InternalMatchup, "official"> & {
    official?: Omit<NonNullable<InternalMatchup["official"]>, "homeTeamId" | "awayTeamId">;
  }>;
};

function normalizeCode(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

function getTeamLabel(team: LocalTeam | null | undefined, placeholder?: string | null) {
  return team?.name ?? placeholder ?? "Time indefinido";
}

function buildCalendarUrl(from: Date, to: Date) {
  const url = new URL(`${FIFA_API_BASE_URL}/calendar/matches`);
  url.searchParams.set("idCompetition", FIFA_WORLD_CUP_COMPETITION_ID);
  url.searchParams.set("idSeason", FIFA_WORLD_CUP_2026_SEASON_ID);
  url.searchParams.set("from", formatFifaApiDate(from));
  url.searchParams.set("to", formatFifaApiDate(to));
  url.searchParams.set("language", "en");
  url.searchParams.set("count", "100");
  return url;
}

function toPublicPreview(args: {
  source: KnockoutMatchupPreview["source"];
  matches: InternalMatchup[];
}): KnockoutMatchupPreview {
  const summary = args.matches.reduce(
    (acc, match) => {
      acc.total += 1;

      if (match.status === "READY") acc.ready += 1;
      if (match.status === "UNCHANGED") acc.unchanged += 1;
      if (match.status === "UNAVAILABLE") acc.unavailable += 1;
      if (match.status === "MISSING_TEAM") acc.missingTeam += 1;
      if (match.status === "FINISHED") acc.finished += 1;

      return acc;
    },
    {
      total: 0,
      ready: 0,
      unchanged: 0,
      unavailable: 0,
      missingTeam: 0,
      finished: 0
    }
  );

  return {
    source: args.source,
    summary,
    matches: args.matches.map((match) => ({
      ...match,
      official: match.official
        ? {
            fifaMatchId: match.official.fifaMatchId,
            homeTeam: match.official.homeTeam,
            awayTeam: match.official.awayTeam,
            homeCode: match.official.homeCode,
            awayCode: match.official.awayCode,
            homeCountryCode: match.official.homeCountryCode,
            awayCountryCode: match.official.awayCountryCode
          }
        : undefined
    }))
  };
}

async function buildInternalKnockoutMatchupPreview() {
  const matches = await prisma.match.findMany({
    where: {
      phase: {
        not: Phase.GROUP_STAGE
      }
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      result: true
    },
    orderBy: [{ startsAt: "asc" }, { number: "asc" }]
  });

  if (!matches.length) {
    throw new Error("Nenhum jogo de mata-mata encontrado na tabela.");
  }

  const firstStart = matches[0].startsAt;
  const lastStart = matches[matches.length - 1].startsAt;
  const calendarUrl = buildCalendarUrl(subHours(firstStart, 12), addHours(lastStart, 18));
  const [calendar, teams] = await Promise.all([
    fetchFifaJson<{ Results?: FifaCalendarMatch[] }>(calendarUrl),
    prisma.team.findMany({
      where: { isPlaceholder: false },
      select: {
        id: true,
        code: true,
        name: true,
        shortName: true,
        countryCode: true
      }
    })
  ]);
  const calendarByNumber = new Map(
    (calendar.Results ?? [])
      .filter(
        (item) =>
          item.IdCompetition === FIFA_WORLD_CUP_COMPETITION_ID &&
          item.IdSeason === FIFA_WORLD_CUP_2026_SEASON_ID &&
          typeof item.MatchNumber === "number"
      )
      .map((item) => [item.MatchNumber as number, item])
  );
  const teamsByCode = new Map(teams.map((team) => [normalizeCode(team.code), team]));

  const source = {
    name: "FIFA",
    url: calendarUrl.toString(),
    fetchedAt: new Date().toISOString()
  };
  const previewMatches: InternalMatchup[] = matches.map((match) => {
    const current = {
      homeTeam: getTeamLabel(match.homeTeam, match.homePlaceholder),
      awayTeam: getTeamLabel(match.awayTeam, match.awayPlaceholder),
      homeCode: match.homeTeam?.code ?? null,
      awayCode: match.awayTeam?.code ?? null
    };

    if (match.status === MatchStatus.FINISHED || match.result) {
      return {
        matchId: match.id,
        number: match.number,
        phase: match.phase,
        startsAt: match.startsAt.toISOString(),
        status: "FINISHED",
        canApply: false,
        warnings: ["Jogo ja finalizado; confronto nao sera alterado."],
        current
      };
    }

    const fifaMatch = calendarByNumber.get(match.number);
    const homeCode = normalizeCode(fifaMatch?.Home?.Abbreviation);
    const awayCode = normalizeCode(fifaMatch?.Away?.Abbreviation);

    if (!fifaMatch?.IdMatch || !homeCode || !awayCode) {
      return {
        matchId: match.id,
        number: match.number,
        phase: match.phase,
        startsAt: match.startsAt.toISOString(),
        status: "UNAVAILABLE",
        canApply: false,
        warnings: ["A FIFA ainda nao publicou as selecoes deste confronto."],
        current
      };
    }

    const homeTeam = teamsByCode.get(homeCode);
    const awayTeam = teamsByCode.get(awayCode);

    if (!homeTeam || !awayTeam) {
      return {
        matchId: match.id,
        number: match.number,
        phase: match.phase,
        startsAt: match.startsAt.toISOString(),
        status: "MISSING_TEAM",
        canApply: false,
        warnings: [
          `Selecao retornada pela FIFA nao existe no cadastro local: ${[
            homeTeam ? null : homeCode,
            awayTeam ? null : awayCode
          ]
            .filter(Boolean)
            .join(", ")}.`
        ],
        current
      };
    }

    const unchanged = match.homeTeamId === homeTeam.id && match.awayTeamId === awayTeam.id;

    return {
      matchId: match.id,
      number: match.number,
      phase: match.phase,
      startsAt: match.startsAt.toISOString(),
      status: unchanged ? "UNCHANGED" : "READY",
      canApply: !unchanged,
      warnings: unchanged ? ["Confronto ja esta atualizado."] : [],
      current,
      official: {
        fifaMatchId: fifaMatch.IdMatch,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        homeCode: homeTeam.code,
        awayCode: awayTeam.code,
        homeCountryCode: homeTeam.countryCode,
        awayCountryCode: awayTeam.countryCode,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id
      }
    };
  });

  return {
    source,
    matches: previewMatches
  };
}

export async function fetchKnockoutMatchupPreview() {
  const preview = await buildInternalKnockoutMatchupPreview();
  return toPublicPreview(preview);
}

export async function applyKnockoutMatchups(actorId?: string | null) {
  const preview = await buildInternalKnockoutMatchupPreview();
  const applicable = preview.matches.filter(
    (match) => match.status === "READY" && match.official
  );

  if (!applicable.length) {
    return {
      applied: 0,
      preview: toPublicPreview(preview)
    };
  }

  const changes = applicable.map((match) => ({
    matchId: match.matchId,
    matchNumber: match.number,
    from: match.current,
    to: {
      homeTeam: match.official!.homeTeam,
      awayTeam: match.official!.awayTeam,
      homeCode: match.official!.homeCode,
      awayCode: match.official!.awayCode
    }
  }));

  const applied = await prisma.$transaction(async (tx) => {
    let updated = 0;

    for (const match of applicable) {
      const result = await tx.match.updateMany({
        where: {
          id: match.matchId,
          status: {
            not: MatchStatus.FINISHED
          }
        },
        data: {
          homeTeamId: match.official!.homeTeamId,
          awayTeamId: match.official!.awayTeamId
        }
      });
      updated += result.count;
    }

    await tx.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action: "admin.knockout_matchups.updated",
        entityType: "Match",
        entityId: "knockout",
        payload: {
          source: preview.source,
          requested: applicable.length,
          applied: updated,
          changes
        } satisfies Prisma.JsonObject
      }
    });

    return updated;
  });

  return {
    applied,
    preview: toPublicPreview(preview)
  };
}
