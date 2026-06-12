import { CardsEdge, CardsRange } from "@prisma/client";
import { addHours, subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { deriveCardsEdge, deriveCardsRange } from "@/lib/scoring";

const FIFA_API_BASE_URL = "https://api.fifa.com/api/v3";
const FIFA_WORLD_CUP_COMPETITION_ID = "17";
const FIFA_WORLD_CUP_2026_SEASON_ID = "285023";

type LocalizedText = Array<{
  Locale?: string | null;
  Description?: string | null;
}>;

type FifaCalendarMatch = {
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

export function parseFifaMatchDetails(
  details: FifaMatchDetails,
  expected: {
    number: number;
    startsAt: Date;
    homeCode?: string | null;
    awayCode?: string | null;
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

  const goals = [...(home.Goals ?? []), ...(away.Goals ?? [])].map((goal) => ({
    player: playerNames.get(goal.IdPlayer ?? "") ?? "Jogador nao identificado",
    teamCode: teamCodes.get(goal.IdTeam ?? "") ?? "N/A",
    minute: goal.Minute,
    typeCode: goal.Type
  }));
  const cardEvents = [...(home.Bookings ?? []), ...(away.Bookings ?? [])].map((booking) => ({
    player: playerNames.get(booking.IdPlayer ?? "") ?? "Jogador nao identificado",
    teamCode: teamCodes.get(booking.IdTeam ?? "") ?? "N/A",
    minute: booking.Minute,
    color: bookingColor(booking.Card)
  }));
  const homeYellow = cardEvents.filter(
    (booking) => booking.teamCode === homeCode && booking.color === "YELLOW"
  ).length;
  const awayYellow = cardEvents.filter(
    (booking) => booking.teamCode === awayCode && booking.color === "YELLOW"
  ).length;
  const totalYellow = homeYellow + awayYellow;
  const warnings: string[] = [];
  const finished = details.Period === 10;

  if (!finished) {
    warnings.push("A FIFA ainda nao marcou a partida como encerrada.");
  }

  if (goals.length !== (home.Score as number) + (away.Score as number)) {
    warnings.push(
      "A quantidade de eventos de gol difere do placar. Confira gols contra ou eventos pendentes."
    );
  }

  if (cardEvents.some((booking) => booking.color === "OTHER")) {
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
      home: home.Score as number,
      away: away.Score as number
    },
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

async function fetchFifaJson<T>(url: URL): Promise<T> {
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
      awayTeam: true,
      result: true
    }
  });

  if (!match) {
    throw new Error("Jogo nao encontrado.");
  }

  if (match.result) {
    throw new Error("Este jogo ja possui resultado oficial confirmado.");
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
    awayCode: match.awayTeam?.code
  });

  if (!preview.match.finished) {
    throw new Error("A FIFA ainda nao marcou esta partida como encerrada.");
  }

  return preview;
}
