import {
  CardsEdge,
  CardsRange,
  FeedPostType,
  LeaderboardScope,
  Phase,
  PlayerPosition,
  PlayerTier,
  PredictionOutcome
} from "@prisma/client";

export const phaseLabels: Record<Phase, string> = {
  GROUP_STAGE: "Fase de grupos",
  ROUND_OF_32: "32 avos",
  ROUND_OF_16: "16 avos",
  QUARTER_FINAL: "Quartas",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3º lugar",
  FINAL: "Final"
};

export const phaseMultipliers: Record<Phase, number> = {
  GROUP_STAGE: 1,
  ROUND_OF_32: 1.2,
  ROUND_OF_16: 1.3,
  QUARTER_FINAL: 1.4,
  SEMI_FINAL: 1.6,
  THIRD_PLACE: 1.3,
  FINAL: 2
};

export const outcomeLabels: Record<PredictionOutcome, string> = {
  HOME_WIN: "Vitória mandante",
  DRAW: "Empate",
  AWAY_WIN: "Vitória visitante"
};

export const cardsEdgeLabels: Record<CardsEdge, string> = {
  HOME: "Time A",
  AWAY: "Time B",
  EQUAL: "Igual"
};

export const cardsRangeLabels: Record<CardsRange, string> = {
  ZERO: "0",
  ONE_TWO: "1-2",
  THREE_FOUR: "3-4",
  FIVE_PLUS: "5+"
};

export const playerPositionLabels: Record<PlayerPosition, string> = {
  GOALKEEPER: "Goleiro",
  DEFENDER: "Defensor",
  MIDFIELDER: "Meio-campo",
  FORWARD: "Atacante"
};

export const playerPositionShortLabels: Record<PlayerPosition, string> = {
  GOALKEEPER: "GOL",
  DEFENDER: "DEF",
  MIDFIELDER: "MEI",
  FORWARD: "ATA"
};

export const playerTierMeta: Record<
  PlayerTier,
  { label: string; color: string; description: string }
> = {
  LEGENDARY: {
    label: "Lendario",
    color: "#34d399",
    description: "Top 10% do campeonato"
  },
  GOOD: {
    label: "Bom",
    color: "#38bdf8",
    description: "Top 30% do campeonato"
  },
  AVERAGE: {
    label: "Medio",
    color: "#facc15",
    description: "Top 60% do campeonato"
  },
  POOR: {
    label: "Ruim",
    color: "#f87171",
    description: "Ainda da para virar o jogo"
  }
};

export const leaderboardLabels: Record<LeaderboardScope, string> = {
  OVERALL: "Geral",
  GROUP_STAGE: "Fase de grupos",
  KNOCKOUT: "Mata-mata"
};

export const feedTypeLabels: Record<FeedPostType, string> = {
  AI_COMMENTARY: "IAestagiaria",
  SYSTEM_EVENT: "Sistema",
  USER_POST: "Amigos"
};

export const playerNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/matches", label: "Jogos" },
  { href: "/leaderboard", label: "Ranking" },
  { href: "/feed", label: "Feed" },
  { href: "/notifications", label: "Alertas" },
  { href: "/profile", label: "Perfil" }
];

export const adminNavigation = [{ href: "/admin", label: "Painel Admin" }];
