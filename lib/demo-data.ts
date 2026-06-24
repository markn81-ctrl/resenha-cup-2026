import {
  ApprovalStatus,
  CardsEdge,
  CardsRange,
  FeedPostType,
  LeaderboardScope,
  MatchStatus,
  Phase,
  PlayerTier,
  PredictionOutcome
} from "@prisma/client";
import type { PlayerPosition } from "@prisma/client";
import type {
  AdminTeamRosterView,
  AdminView,
  DashboardView,
  FeedPostView,
  LeaderboardRowView,
  MatchCardData,
  NotificationView
} from "@/types/app";

const now = new Date();

function buildDemoPlayers(team: string, prefix: string) {
  return [
    {
      id: `${prefix}-1`,
      name: `${team} Jogador 01`,
      shortName: "J01",
      position: "FORWARD" as PlayerPosition,
      slotNumber: 1
    },
    {
      id: `${prefix}-2`,
      name: `${team} Jogador 02`,
      shortName: "J02",
      position: "MIDFIELDER" as PlayerPosition,
      slotNumber: 2
    },
    {
      id: `${prefix}-3`,
      name: `${team} Jogador 03`,
      shortName: "J03",
      position: "DEFENDER" as PlayerPosition,
      slotNumber: 3
    },
    {
      id: `${prefix}-4`,
      name: `${team} Jogador 04`,
      shortName: "J04",
      position: "GOALKEEPER" as PlayerPosition,
      slotNumber: 4
    }
  ];
}

const demoPlayerTeams: AdminTeamRosterView[] = [
  {
    teamId: "team-bra",
    name: "Brasil",
    shortName: "Brasil",
    code: "BRA",
    countryCode: "br",
    players: buildDemoPlayers("Brasil", "bra")
  },
  {
    teamId: "team-por",
    name: "Portugal",
    shortName: "Portugal",
    code: "POR",
    countryCode: "pt",
    players: buildDemoPlayers("Portugal", "por")
  }
];

export const demoMatches: MatchCardData[] = [
  {
    id: "demo-match-1",
    number: 19,
    phase: Phase.GROUP_STAGE,
    groupKey: "D",
    startsAt: new Date(now.getTime() + 9 * 60 * 60 * 1000),
    lockAt: new Date(now.getTime() + (9 * 60 - 10) * 60 * 1000),
    status: MatchStatus.SCHEDULED,
    homeTeam: "Brasil",
    awayTeam: "Japao",
    homeCode: "BRA",
    awayCode: "JPN",
    homeCountryCode: "br",
    awayCountryCode: "jp",
    homePlayers: buildDemoPlayers("Brasil", "bra"),
    awayPlayers: buildDemoPlayers("Japao", "jpn"),
    city: "Toronto",
    venue: "BMO Field",
    prediction: {
      outcome: PredictionOutcome.HOME_WIN,
      score: { home: 2, away: 0 },
      scorers: ["Vinicius Jr.", "Rodrygo"],
      cardsEdge: CardsEdge.AWAY,
      cardsRange: CardsRange.THREE_FOUR
    }
  },
  {
    id: "demo-match-2",
    number: 20,
    phase: Phase.GROUP_STAGE,
    groupKey: "D",
    startsAt: new Date(now.getTime() + 14 * 60 * 60 * 1000),
    lockAt: new Date(now.getTime() + (14 * 60 - 10) * 60 * 1000),
    status: MatchStatus.SCHEDULED,
    homeTeam: "Portugal",
    awayTeam: "Mexico",
    homeCode: "POR",
    awayCode: "MEX",
    homeCountryCode: "pt",
    awayCountryCode: "mx",
    homePlayers: buildDemoPlayers("Portugal", "por"),
    awayPlayers: buildDemoPlayers("Mexico", "mex"),
    city: "Monterrey",
    venue: "Estadio BBVA"
  },
  {
    id: "demo-match-3",
    number: 61,
    phase: Phase.GROUP_STAGE,
    groupKey: "K",
    startsAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    lockAt: new Date(now.getTime() - (10 * 60 + 10) * 60 * 1000),
    status: MatchStatus.FINISHED,
    homeTeam: "Argentina",
    awayTeam: "Estados Unidos",
    homeCode: "ARG",
    awayCode: "USA",
    homeCountryCode: "ar",
    awayCountryCode: "us",
    homePlayers: buildDemoPlayers("Argentina", "arg"),
    awayPlayers: buildDemoPlayers("Estados Unidos", "usa"),
    city: "Atlanta",
    venue: "Mercedes-Benz Stadium",
    prediction: {
      outcome: PredictionOutcome.DRAW,
      score: { home: 1, away: 1 },
      scorers: ["Messi", "Pulisic"],
      cardsEdge: CardsEdge.EQUAL,
      cardsRange: CardsRange.ONE_TWO,
      points: 11
    },
    result: {
      outcome: PredictionOutcome.DRAW,
      score: { home: 1, away: 1 },
      scorers: ["Messi"],
      cardsEdge: CardsEdge.EQUAL,
      cardsRange: CardsRange.ONE_TWO
    }
  }
];

export const demoLeaderboard: Record<LeaderboardScope, LeaderboardRowView[]> = {
  OVERALL: [
    {
      userId: "u1",
      name: "Joao Martins",
      username: "joaom",
      totalPoints: 148,
      exactScores: 8,
      correctWinners: 21,
      correctScorers: 13,
      correctCards: 9,
      rankPosition: 1,
      movement: 2,
      pointsToNext: null,
      tier: PlayerTier.LEGENDARY,
      featuredMatch: {
        homeCountryCode: "br",
        awayCountryCode: "jp",
        homeCode: "BRA",
        awayCode: "JPN"
      }
    },
    {
      userId: "u2",
      name: "Carla Dias",
      username: "carlad",
      totalPoints: 142,
      exactScores: 7,
      correctWinners: 20,
      correctScorers: 12,
      correctCards: 8,
      rankPosition: 2,
      movement: -1,
      pointsToNext: 6,
      tier: PlayerTier.LEGENDARY,
      featuredMatch: {
        homeCountryCode: "pt",
        awayCountryCode: "mx",
        homeCode: "POR",
        awayCode: "MEX"
      }
    },
    {
      userId: "u3",
      name: "Bruno Costa",
      username: "brunoc",
      totalPoints: 139,
      exactScores: 7,
      correctWinners: 19,
      correctScorers: 10,
      correctCards: 7,
      rankPosition: 3,
      movement: 1,
      pointsToNext: 3,
      tier: PlayerTier.GOOD,
      featuredMatch: {
        homeCountryCode: "ar",
        awayCountryCode: "us",
        homeCode: "ARG",
        awayCode: "USA"
      }
    },
    {
      userId: "u4",
      name: "Marina Alves",
      username: "marina",
      totalPoints: 131,
      exactScores: 6,
      correctWinners: 17,
      correctScorers: 11,
      correctCards: 6,
      rankPosition: 4,
      movement: 0,
      pointsToNext: 8,
      tier: PlayerTier.GOOD,
      featuredMatch: {
        homeCountryCode: "es",
        awayCountryCode: "ec",
        homeCode: "ESP",
        awayCode: "ECU"
      }
    },
    {
      userId: "u5",
      name: "Pedro Lima",
      username: "pedrol",
      totalPoints: 128,
      exactScores: 5,
      correctWinners: 17,
      correctScorers: 9,
      correctCards: 5,
      rankPosition: 5,
      movement: 3,
      pointsToNext: 3,
      tier: PlayerTier.GOOD,
      featuredMatch: {
        homeCountryCode: "de",
        awayCountryCode: "co",
        homeCode: "GER",
        awayCode: "COL"
      }
    }
  ],
  GROUP_STAGE: [],
  KNOCKOUT: []
};

demoLeaderboard.GROUP_STAGE = demoLeaderboard.OVERALL.map((row, index) => ({
  ...row,
  rankPosition: index + 1,
  totalPoints: row.totalPoints - 22
}));

demoLeaderboard.KNOCKOUT = demoLeaderboard.OVERALL.map((row, index) => ({
  ...row,
  rankPosition: index + 1,
  totalPoints: 22 + index * 2
}));

export const demoFeed: FeedPostView[] = [
  {
    id: "feed-1",
    type: FeedPostType.AI_COMMENTARY,
    title: "Rodada pegando fogo",
    content:
      "Joao assumiu a ponta na marra e deixou a mesa toda olhando o retrovisor. Carlos escorregou feio hoje, mas a Copa ta longe de acabar.",
    createdAt: new Date(now.getTime() - 60 * 60 * 1000),
    likesCount: 14,
    commentsCount: 4,
    likedByMe: true,
    comments: [
      {
        id: "c-1",
        content: "Nao vou nem abrir o ranking hoje.",
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
        author: {
          name: "Carlos",
          username: "carlinhos"
        }
      }
    ]
  },
  {
    id: "feed-2",
    type: FeedPostType.USER_POST,
    author: {
      id: "u4",
      name: "Marina Alves",
      username: "marina",
      image: null
    },
    content:
      "Alguem explica como o Pedro acerta marcador improvavel e erra o vencedor no mesmo jogo?",
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    likesCount: 9,
    commentsCount: 2,
    comments: []
  },
  {
    id: "feed-3",
    type: FeedPostType.SYSTEM_EVENT,
    title: "Palpites do jogo 19 fecham em 7h",
    content:
      "Brasil x Japao entra em lock automatico duas horas antes da bola rolar. Quem deixar pra depois vai assistir a subida dos outros.",
    createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    likesCount: 3,
    commentsCount: 0,
    comments: []
  }
];

export const demoDashboard: DashboardView = {
  user: {
    id: "me",
    name: "Voce",
    username: "meu_perfil",
    role: "USER",
    approvalStatus: ApprovalStatus.APPROVED
  },
  currentStanding: {
    position: 7,
    totalPoints: 118,
    movement: 1,
    pointsToNext: 4,
    tier: PlayerTier.AVERAGE
  },
  rivalry: {
    rivalId: "u5",
    name: "Pedro Lima",
    username: "pedrol",
    image: null,
    position: 5,
    points: 128,
    pointsGap: 10,
    score: 72,
    scope: LeaderboardScope.OVERALL,
    trendLabel: "Duelo direto por aproximacao no ranking"
  },
  topTen: demoLeaderboard.OVERALL.map((row) => ({
    id: row.userId,
    name: row.name,
    username: row.username,
    points: row.totalPoints,
    tier: row.tier
  })),
  upcomingMatches: demoMatches,
  hotFeed: demoFeed.slice(0, 2)
};

export const demoNotifications: NotificationView[] = [
  {
    id: "n1",
    type: "RANKING_CHANGE",
    title: "Voce subiu 1 posicao",
    body: "Mais 4 pontos e voce encosta no top 5.",
    href: "/leaderboard",
    isRead: false,
    createdAt: new Date(now.getTime() - 20 * 60 * 1000)
  },
  {
    id: "n2",
    type: "PICK_LOCK_REMINDER",
    title: "Palpite fecha hoje",
    body: "Brasil x Japao trava em 7 horas.",
    href: "/matches",
    isRead: false,
    createdAt: new Date(now.getTime() - 90 * 60 * 1000)
  }
];

export const demoAdmin: AdminView = {
  pendingUsers: [
    {
      id: "p1",
      name: "Rafa Nunes",
      email: "rafa@example.com",
      username: "rafa_n",
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
    },
    {
      id: "p2",
      name: "Livia Rocha",
      email: "livia@example.com",
      username: "liviarocha",
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
    }
  ],
  recentAudit: [
    {
      id: "a1",
      action: "prediction.updated",
      entityType: "Prediction",
      entityId: "pred-1",
      createdAt: new Date(now.getTime() - 35 * 60 * 1000)
    },
    {
      id: "a2",
      action: "user.approved",
      entityType: "User",
      entityId: "u9",
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
    }
  ],
  stats: {
    users: 24,
    approvedUsers: 21,
    pendingUsers: 3,
    posts: 57,
    predictions: 418
  },
  leaderboardScopes: [
    { scope: LeaderboardScope.OVERALL, leader: "Joao Martins", points: 148 },
    { scope: LeaderboardScope.GROUP_STAGE, leader: "Carla Dias", points: 126 },
    { scope: LeaderboardScope.KNOCKOUT, leader: "Pedro Lima", points: 22 }
  ],
  simulationMatches: demoMatches
    .filter((match) => match.status !== MatchStatus.FINISHED)
    .map((match, index) => ({
      id: match.id,
      number: match.number,
      phase: match.phase,
      groupKey: match.groupKey,
      startsAt: match.startsAt,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeCode: match.homeCode ?? null,
      awayCode: match.awayCode ?? null,
      homeCountryCode: match.homeCountryCode ?? null,
      awayCountryCode: match.awayCountryCode ?? null,
      predictionCount: 12 - index * 3,
      status: match.status,
      result: null
    })),
  playerTeams: demoPlayerTeams
};
