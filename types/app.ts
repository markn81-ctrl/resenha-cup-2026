import {
  ApprovalStatus,
  CardsEdge,
  CardsRange,
  FeedPostType,
  LeaderboardScope,
  MatchStatus,
  Phase,
  PlayerPosition,
  PlayerTier,
  PredictionOutcome,
  Role
} from "@prisma/client";

export type PlayerOptionView = {
  id: string;
  name: string;
  shortName?: string | null;
  position: PlayerPosition;
  slotNumber: number;
};

export type AdminTeamRosterView = {
  teamId: string;
  name: string;
  shortName: string;
  code: string;
  countryCode?: string | null;
  players: PlayerOptionView[];
};

export type DashboardView = {
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
    approvalStatus: ApprovalStatus;
  };
  currentStanding: {
    position: number;
    totalPoints: number;
    movement: number;
    pointsToNext: number | null;
    tier: PlayerTier;
  };
  rivalry: {
    rivalId: string;
    name: string;
    username: string;
    image?: string | null;
    position: number;
    points: number;
    pointsGap: number;
    score: number;
    scope: LeaderboardScope;
    trendLabel: string;
  } | null;
  topTen: Array<{
    id: string;
    name: string;
    username: string;
    points: number;
    tier: PlayerTier;
  }>;
  upcomingMatches: MatchCardData[];
  hotFeed: FeedPostView[];
};

export type AppUserShell = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  role?: Role | string;
};

export type MatchCardData = {
  id: string;
  number: number;
  phase: Phase;
  groupKey?: string | null;
  startsAt: Date;
  lockAt: Date;
  status: MatchStatus;
  homeTeam: string;
  awayTeam: string;
  homeCode?: string;
  awayCode?: string;
  homeCountryCode?: string | null;
  awayCountryCode?: string | null;
  homePlayers: PlayerOptionView[];
  awayPlayers: PlayerOptionView[];
  city?: string | null;
  venue?: string | null;
  prediction?: {
    outcome: PredictionOutcome;
    score: {
      home: number;
      away: number;
    };
    scorers: string[];
    cardsEdge: CardsEdge;
    cardsRange: CardsRange;
    points?: number;
  } | null;
  result?: {
    outcome: PredictionOutcome;
    score: {
      home: number;
      away: number;
    };
    scorers: string[];
    cardsEdge: CardsEdge;
    cardsRange: CardsRange;
  } | null;
};

export type LeaderboardRowView = {
  userId: string;
  name: string;
  username: string;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  correctScorers: number;
  correctCards: number;
  rankPosition: number;
  movement: number;
  pointsToNext: number | null;
  tier: PlayerTier;
  featuredMatch?: {
    homeCountryCode?: string | null;
    awayCountryCode?: string | null;
    homeCode?: string | null;
    awayCode?: string | null;
  } | null;
};

export type FeedPostView = {
  id: string;
  type: FeedPostType;
  author?: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  } | null;
  title?: string | null;
  content: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  likedByMe?: boolean;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: {
      name: string;
      username: string;
    };
    replies?: Array<{
      id: string;
      content: string;
      createdAt: Date;
      author: {
        name: string;
        username: string;
      };
    }>;
  }>;
};

export type NotificationView = {
  id: string;
  type: string;
  title: string;
  body: string;
  href?: string | null;
  isRead: boolean;
  createdAt: Date;
};

export type PalpiteiroView = {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  role: Role;
  createdAt: Date;
  points: number;
  rankPosition: number | null;
  tier: PlayerTier;
  predictionsCount: number;
  postsCount: number;
  commentsCount: number;
};

export type AdminView = {
  pendingUsers: Array<{
    id: string;
    name: string;
    email: string;
    username?: string | null;
    createdAt: Date;
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: Date;
  }>;
  stats: {
    users: number;
    approvedUsers: number;
    pendingUsers: number;
    posts: number;
    predictions: number;
  };
  leaderboardScopes: Array<{
    scope: LeaderboardScope;
    leader: string;
    points: number;
  }>;
  simulationMatches: Array<{
    id: string;
    number: number;
    phase: Phase;
    groupKey?: string | null;
    startsAt: Date;
    homeTeam: string;
    awayTeam: string;
    homeCode?: string | null;
    awayCode?: string | null;
    homeCountryCode?: string | null;
    awayCountryCode?: string | null;
    predictionCount: number;
    status: MatchStatus;
    result?: {
      score: {
        home: number;
        away: number;
      };
      scorers: string[];
      cardsEdge: CardsEdge;
      cardsRange: CardsRange;
    } | null;
  }>;
  playerTeams: AdminTeamRosterView[];
};

export type AdminSimulationView = {
  match: {
    id: string;
    number: number;
    phase: Phase;
    groupKey?: string | null;
    startsAt: Date;
    homeTeam: string;
    awayTeam: string;
    homeCode?: string | null;
    awayCode?: string | null;
    homeCountryCode?: string | null;
    awayCountryCode?: string | null;
    isCorrection?: boolean;
  };
  summary: {
    predictionsCount: number;
    averagePoints: number;
    highestMatchPoints: number;
    winnerHits: number;
    exactHits: number;
  };
  projectedTopFive: Array<{
    userId: string;
    name: string;
    username: string;
    projectedPosition: number;
    projectedTotal: number;
    matchPoints: number;
  }>;
  results: Array<{
    userId: string;
    name: string;
    username: string;
    image?: string | null;
    currentPosition: number | null;
    projectedPosition: number | null;
    previousTotal: number;
    projectedTotal: number;
    matchPoints: number;
    winnerHit: boolean;
    exactHit: boolean;
    scorerHits: number;
    cardsPoints: number;
    comboBonus: number;
    streakBonus: number;
  }>;
};

export type AdminOfficialResultView = {
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

export type AdminKnockoutMatchupsView = {
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
  matches: Array<{
    matchId: string;
    number: number;
    phase: Phase;
    startsAt: string;
    status: "READY" | "UNCHANGED" | "UNAVAILABLE" | "MISSING_TEAM" | "FINISHED";
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
    };
  }>;
};
