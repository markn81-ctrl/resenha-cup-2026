import { CardsEdge, CardsRange, Phase } from "@prisma/client";
import { addHours, subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { deriveCardsEdge, deriveCardsRange } from "@/lib/scoring";

export const FIFA_API_BASE_URL = "https://api.fifa.com/api/v3";
export const FIFA_WORLD_CUP_COMPETITION_ID = "17";
export const FIFA_WORLD_CUP_2026_SEASON_ID = "285023";

type LocalizedText = Array<{
  Locale?: string | null;
  Description?: string | null;
}>;

export type FifaCalendarMatch = {
  IdCompetition?: string | null;
  IdSeason?: string | null;
  IdMatch?: string | null;
  MatchNumber?: number | null;
  Date?: string | null;
  Home?: {
    Abbreviation?: string | null;
  } | null;
  Away?: {
    Abbreviation?: string | null;
  } | null;
};

type FifaPlayer = {
  IdPlayer?: string | null;
  PlayerName?: LocalizedText;
  ShortName?: LocalizedText;
};

type FifaGoal = {
  Type?: number | null;
  IdPlayer?: string | null;
  IdTeam?: string | null;
  Minute?: string | null;
};

type FifaBooking = {
  Card?: number | null;
  IdPlayer?: string | null;
  IdTeam?: string | null;
  Minute?: string | null;
};

type FifaTeamDetails = {
  IdTeam?: string | null;
  Score?: number | null;
  Abbreviation?: string | null;
  TeamName?: LocalizedText;
  Players?: FifaPlayer[] | null;
  Goals?: FifaGoal[] | null;
  Bookings?: FifaBooking[] | null;
};

export type FifaMatchDetails = {
  IdCompetition?: string | null;
  IdSeason?: string | null;
  IdMatch?: string | null;
  MatchNumber?: number | null;
  Date?: string | null;
  Period?: number | null;
  MatchTime?: string | null;
  CompetitionName?: LocalizedText;
  SeasonName?: LocalizedText;
  HomeTeam?: FifaTeamDetails | null;
  AwayTeam?: FifaTeamDetails | null;
};

export type OfficialResultPreview = {
  source: {
    name: string;
    matchId: string;
    url: string;
    fetchedAt: string;
  };
  match: {
    number: number;
    startsAt: string;
    finished: boolean;
    matchTime?: string | null;
    homeTeam: string;
    awayTeam: string;
    homeCode: string;
    awayCode: string;
  };
  score: {
    home: number;
    away: number;
  };
  finalScore: {
    home: number;
    away: number;
  };
  scoringScope: "FULL_MATCH" | "REGULATION_TIME";
  stages: Array<{
    label: string;
    home: number;
    away: number;
    usedForScoring: boolean;
  }>;
  scorers: string[];
  goals: Array<{
    player: string;
    teamCode: string;
    minute?: string | null;
    typeCode?: number | null;
  }>;
  cards: {
    homeYellow: number;
    awayYellow: number;
    totalYellow: number;
    edge: CardsEdge;
    range: CardsRange;
    events: Array<{
      player: string;
      teamCode: string;
      minute?: string | null;
      color: "YELLOW" | "RED" | "OTHER";
    }>;
  };
  warnings: string[];
};

function localizedDescription(value?: LocalizedText) {
  return value?.find((item) => item.Description)?.Description?.trim() ?? null;
}

function normalizeCode(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

export function formatFifaApiDate(value: Date) {
  return value.toISOString().replace(".000Z", "Z");
}

function bookingColor(card?: number | null): "YELLOW" | "RED" | "OTHER" {
  if (card === 1) {
    return "YELLOW";
  }

  if (card === 2 || card === 3) {
    return "RED";
  }

  return "OTHER";
}

function regulationMinute(value?: string | null) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/(\d+)/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function isRegulationTimeEvent(value?: string | null) {
  const minute = regulationMinute(value);

  return minute === null || minute <= 90;
}

function scoreFromGoals(args: {
  goals: Array<{ teamCode: string }>;
  homeCode: string;
  awayCode: string;
}) {
  return {
    home: args.goals.filter((goal) => goal.teamCode === args.homeCode).length,
    away: args.goals.filter((goal) => goal.teamCode === args.awayCode).length
  };
}

export function parseFifaMatchDetails(
  details: FifaMatchDetails,
  expected: {
    number: number;
    startsAt: Date;
    homeCode?: string | null;
    awayCode?: string | null;
    phase?: Phase;
  }
): OfficialResultPreview {
  if (
    details.IdCompetition !== FIFA_WORLD_CUP_COMPETITION_ID ||
    details.IdSeason !== FIFA_WORLD_CUP_2026_SEASON_ID
  ) {
    throw new Error("A FIFA retornou uma partida de outra competicao.");
  }

  if (details.MatchNumber !== expected.number) {
    throw new Error("O numero da partida retornada pela FIFA nao confere.");
  }

  const home = details.HomeTeam;
  const away = details.AwayTeam;
  const homeCode = normalizeCode(home?.Abbreviation);
  const awayCode = normalizeCode(away?.Abbreviation);

  if (!home || !away || !homeCode || !awayCode) {
    throw new Error("A FIFA ainda nao publicou as selecoes desta partida.");
  }

  if (
    (expected.homeCode && normalizeCode(expected.homeCode) !== homeCode) ||
    (expected.awayCode && normalizeCode(expected.awayCode) !== awayCode)
  ) {
    throw new Error("As selecoes retornadas pela FIFA nao conferem com a tabela da aplicacao.");
  }

  if (!Number.isInteger(home.Score) || !Number.isInteger(away.Score)) {
    throw new Error("O placar oficial ainda nao esta disponivel na FIFA.");
  }

  const players = [...(home.Players ?? []), ...(away.Players ?? [])];
  const playerNames = new Map(
    players
      .filter((player) => player.IdPlayer)
      .map((player) => [
        player.IdPlayer as string,
        localizedDescription(player.PlayerName) ??
          localizedDescription(player.ShortName) ??
          "Jogador nao identificado"
      ])
  );
  const teamCodes = new Map([
    [home.IdTeam ?? "", homeCode],
    [away.IdTeam ?? "", awayCode]
  ]);

  const allGoals = [...(home.Goals ?? []), ...(away.Goals ?? [])].map((goal) => ({
    player: playerNames.get(goal.IdPlayer ?? "") ?? "Jogador nao identificado",
    teamCode: teamCodes.get(goal.IdTeam ?? "") ?? "N/A",
    minute: goal.Minute,
    typeCode: goal.Type
  }));
  const allCardEvents = [...(home.Bookings ?? []), ...(away.Bookings ?? [])].map((booking) => ({
    player: playerNames.get(booking.IdPlayer ?? "") ?? "Jogador nao identificado",
    teamCode: teamCodes.get(booking.IdTeam ?? "") ?? "N/A",
    minute: booking.Minute,
    color: bookingColor(booking.Card)
  }));
  const usesRegulationTime =
    expected.phase !== undefined && expected.phase !== Phase.GROUP_STAGE;
  const goals = usesRegulationTime
    ? allGoals.filter((goal) => isRegulationTimeEvent(goal.minute))
    : allGoals;
  const cardEvents = usesRegulationTime
    ? allCardEvents.filter((booking) => isRegulationTimeEvent(booking.minute))
    : allCardEvents;
  const homeYellow = cardEvents.filter(
    (booking) => booking.teamCode === homeCode && booking.color === "YELLOW"
  ).length;
  const awayYellow = cardEvents.filter(
    (booking) => booking.teamCode === awayCode && booking.color === "YELLOW"
  ).length;
  const totalYellow = homeYellow + awayYellow;
  const warnings: string[] = [];
  const finished = details.Period === 10;
  const finalScore = {
    home: home.Score as number,
    away: away.Score as number
  };
  const score = usesRegulationTime
    ? scoreFromGoals({ goals, homeCode, awayCode })
    : finalScore;

  if (!finished) {
    warnings.push("A FIFA ainda nao marcou a partida como encerrada.");
  }

  if (allGoals.length !== finalScore.home + finalScore.away) {
    warnings.push(
      "A quantidade de eventos de gol difere do placar. Confira gols contra ou eventos pendentes."
    );
  }

  if (usesRegulationTime && allGoals.some((goal) => !isRegulationTimeEvent(goal.minute))) {
    warnings.push(
      "Houve gol fora do tempo regulamentar. Para o bolao, o placar carregado considera apenas 90 minutos mais acrescimos."
    );
  }

  if (usesRegulationTime && allCardEvents.some((card) => !isRegulationTimeEvent(card.minute))) {
    warnings.push(
      "Houve cartao fora do tempo regulamentar. Para o bolao, esses cartoes nao entram na pontuacao."
    );
  }

  if (allGoals.some((goal) => regulationMinute(goal.minute) === null)) {
    warnings.push("Existe evento de gol sem minuto claro. Confira a sumula antes de aprovar.");
  }

  if (allCardEvents.some((card) => regulationMinute(card.minute) === null)) {
    warnings.push("Existe evento de cartao sem minuto claro. Confira a sumula antes de aprovar.");
  }

  if (allCardEvents.some((booking) => booking.color === "OTHER")) {
    warnings.push("Existem eventos de cartao com tipo nao reconhecido. Confira a sumula.");
  }

  return {
    source: {
      name: "FIFA",
      matchId: details.IdMatch ?? "",
      url: `${FIFA_API_BASE_URL}/live/football/${details.IdMatch}?language=en`,
      fetchedAt: new Date().toISOString()
    },
    match: {
      number: expected.number,
      startsAt: (details.Date ? new Date(details.Date) : expected.startsAt).toISOString(),
      finished,
      matchTime: details.MatchTime,
      homeTeam: localizedDescription(home.TeamName) ?? homeCode,
      awayTeam: localizedDescription(away.TeamName) ?? awayCode,
      homeCode,
      awayCode
    },
    score: {
      home: score.home,
      away: score.away
    },
    finalScore,
    scoringScope: usesRegulationTime ? "REGULATION_TIME" : "FULL_MATCH",
    stages: [
      {
        label: usesRegulationTime ? "Tempo regulamentar + acrescimos" : "Resultado oficial",
        home: score.home,
        away: score.away,
        usedForScoring: true
      },
      ...(usesRegulationTime
        ? [
            {
              label: "Resultado final FIFA",
              home: finalScore.home,
              away: finalScore.away,
              usedForScoring: false
            }
          ]
        : [])
    ],
    scorers: goals.map((goal) => goal.player),
    goals,
    cards: {
      homeYellow,
      awayYellow,
      totalYellow,
      edge: deriveCardsEdge(homeYellow, awayYellow),
      range: deriveCardsRange(totalYellow),
      events: cardEvents
    },
    warnings
  };
}

export async function fetchFifaJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(12_000)
  });

  if (!response.ok) {
    throw new Error(`A FIFA respondeu com status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const body = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error("A FIFA rejeitou os parametros da consulta. Tente novamente.");
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error("A FIFA retornou dados em formato inesperado. Tente novamente.");
  }
}

export async function fetchOfficialResultPreview(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true
    }
  });

  if (!match) {
    throw new Error("Jogo nao encontrado.");
  }

  const calendarUrl = new URL(`${FIFA_API_BASE_URL}/calendar/matches`);
  calendarUrl.searchParams.set("idCompetition", FIFA_WORLD_CUP_COMPETITION_ID);
  calendarUrl.searchParams.set("idSeason", FIFA_WORLD_CUP_2026_SEASON_ID);
  calendarUrl.searchParams.set("from", formatFifaApiDate(subHours(match.startsAt, 12)));
  calendarUrl.searchParams.set("to", formatFifaApiDate(addHours(match.startsAt, 18)));
  calendarUrl.searchParams.set("language", "en");
  calendarUrl.searchParams.set("count", "100");

  const calendar = await fetchFifaJson<{ Results?: FifaCalendarMatch[] }>(calendarUrl);
  const fifaMatch = (calendar.Results ?? []).find(
    (item) =>
      item.IdCompetition === FIFA_WORLD_CUP_COMPETITION_ID &&
      item.IdSeason === FIFA_WORLD_CUP_2026_SEASON_ID &&
      item.MatchNumber === match.number
  );

  if (!fifaMatch?.IdMatch) {
    throw new Error("A partida ainda nao foi localizada na fonte oficial da FIFA.");
  }

  const detailUrl = new URL(
    `${FIFA_API_BASE_URL}/live/football/${encodeURIComponent(fifaMatch.IdMatch)}`
  );
  detailUrl.searchParams.set("language", "en");
  const details = await fetchFifaJson<FifaMatchDetails>(detailUrl);
  const preview = parseFifaMatchDetails(details, {
    number: match.number,
    startsAt: match.startsAt,
    homeCode: match.homeTeam?.code,
    awayCode: match.awayTeam?.code,
    phase: match.phase
  });

  if (!preview.match.finished) {
    throw new Error("A FIFA ainda nao marcou esta partida como encerrada.");
  }

  return preview;
}
