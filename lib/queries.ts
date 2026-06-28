import {
  ApprovalStatus,
  LeaderboardScope,
  MatchStatus,
  PlayerTier,
  Role
} from "@prisma/client";
import { buildPlayerStatus } from "@/lib/player-status";
import { prisma } from "@/lib/prisma";
import { getScopeForPhase } from "@/lib/ranking";
import { getUserRivalry } from "@/lib/rivalries";
import { getEffectiveMatchStatus } from "@/lib/locks";
import type {
  AdminTeamRosterView,
  AdminView,
  DashboardView,
  FeedPostView,
  LeaderboardRowView,
  MatchCardData,
  NotificationView,
  PalpiteiroView
} from "@/types/app";

export function mapTeamPlayers(
  team?:
    | {
        players?: Array<{
          id: string;
          name: string;
          shortName: string;
          position: any;
          slotNumber: number;
        }>;
      }
    | null
) {
  return (team?.players ?? []).map((player) => ({
    id: player.id,
    name: player.name,
    shortName: player.shortName,
    position: player.position,
    slotNumber: player.slotNumber
  }));
}

function mapAdminTeamRoster(teams: Array<{
  id: string;
  name: string;
  shortName: string;
  code: string;
  countryCode?: string | null;
  players: Array<{
    id: string;
    name: string;
    shortName: string;
    position: any;
    slotNumber: number;
  }>;
}>): AdminTeamRosterView[] {
  return teams.map((team) => ({
    teamId: team.id,
    name: team.name,
    shortName: team.shortName,
    code: team.code,
    countryCode: team.countryCode ?? null,
    players: mapTeamPlayers(team)
  }));
}

function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function buildEmptyDashboard(userId = "unknown"): DashboardView {
  return {
    user: {
      id: userId,
      name: "Participante",
      username: "sem_username",
      role: Role.USER,
      approvalStatus: ApprovalStatus.APPROVED
    },
    currentStanding: {
      position: 0,
      totalPoints: 0,
      movement: 0,
      pointsToNext: null,
      tier: PlayerTier.AVERAGE
    },
    rivalry: null,
    topTen: [],
    upcomingMatches: [],
    hotFeed: []
  };
}

function buildEmptyAdminData(): AdminView {
  return {
    pendingUsers: [],
    recentAudit: [],
    stats: {
      users: 0,
      approvedUsers: 0,
      pendingUsers: 0,
      posts: 0,
      predictions: 0
    },
    leaderboardScopes: [
      { scope: LeaderboardScope.OVERALL, leader: "Sem dados", points: 0 },
      { scope: LeaderboardScope.GROUP_STAGE, leader: "Sem dados", points: 0 },
      { scope: LeaderboardScope.KNOCKOUT, leader: "Sem dados", points: 0 }
    ],
    simulationMatches: [],
    playerTeams: []
  };
}

export async function getDashboardData(userId?: string | null): Promise<DashboardView> {
  if (!databaseEnabled() || !userId) {
    return buildEmptyDashboard(userId ?? "unknown");
  }

  try {
    const [
      user,
      standings,
      topTen,
      overallLeaderboardCount,
      knockoutLeaderboardCount,
      matches,
      feed,
      rivalry
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.leaderboard.findFirst({
        where: { userId, scope: LeaderboardScope.OVERALL },
        orderBy: { snapshotAt: "desc" }
      }),
      prisma.leaderboard.findMany({
        where: { scope: LeaderboardScope.KNOCKOUT },
        include: { user: true },
        orderBy: [{ rankPosition: "asc" }],
        take: 10
      }),
      prisma.leaderboard.count({
        where: { scope: LeaderboardScope.OVERALL }
      }),
      prisma.leaderboard.count({
        where: { scope: LeaderboardScope.KNOCKOUT }
      }),
      prisma.match.findMany({
        where: {
          status: { not: MatchStatus.FINISHED }
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          predictions: {
            where: { userId },
            include: { score: true }
          }
        },
        orderBy: { startsAt: "asc" },
        take: 4
      }),
      prisma.feedPost.findMany({
        include: {
          author: true,
          comments: {
            where: { parentId: null },
            include: {
              author: true,
              replies: {
                include: {
                  author: true
                }
              }
            },
            orderBy: { createdAt: "asc" },
            take: 3
          },
          likes: userId ? { where: { userId } } : true,
          _count: { select: { likes: true, comments: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 2
      }),
      getUserRivalry(userId, LeaderboardScope.OVERALL)
    ]);

    if (!user) {
      return buildEmptyDashboard(userId);
    }

    const rivalStanding = rivalry
      ? await prisma.leaderboard.findFirst({
          where: {
            userId: rivalry.rivalUserId,
            scope: LeaderboardScope.OVERALL
          },
          orderBy: { snapshotAt: "desc" }
        })
      : null;

    return {
      user: {
        id: user.id,
        name: user.name ?? "Participante",
        username: user.username ?? "sem_username",
        role: user.role,
        approvalStatus: user.approvalStatus
      },
      currentStanding: {
        position: standings?.rankPosition ?? 0,
        totalPoints: standings?.totalPoints ?? 0,
        movement: standings?.movement ?? 0,
        pointsToNext: standings?.pointsToNext ?? null,
        tier: standings
          ? buildPlayerStatus({
              scope: LeaderboardScope.OVERALL,
              rankPosition: standings.rankPosition,
              totalPlayers: Math.max(overallLeaderboardCount, standings.rankPosition)
            }).tier
          : PlayerTier.AVERAGE
      },
      rivalry: rivalry
        ? {
            rivalId: rivalry.rivalUserId,
            name: rivalry.rivalUser.name ?? "Participante",
            username: rivalry.rivalUser.username ?? "user",
            image: rivalry.rivalUser.image,
            position: rivalStanding?.rankPosition ?? 0,
            points: rivalStanding?.totalPoints ?? 0,
            pointsGap: Math.abs(
              (rivalStanding?.totalPoints ?? 0) - (standings?.totalPoints ?? 0)
            ),
            score: rivalry.score,
            scope: rivalry.scope,
            trendLabel:
              rivalry.score >= 70
                ? "Duelo quente no pelotao da frente"
                : "Rivalidade ativa na briga por posicoes"
          }
        : null,
      topTen: topTen.map((row) => ({
        id: row.user.id,
        name: row.user.name ?? "Participante",
        username: row.user.username ?? "user",
        points: row.totalPoints,
        tier: buildPlayerStatus({
          scope: LeaderboardScope.KNOCKOUT,
          rankPosition: row.rankPosition,
          totalPlayers: knockoutLeaderboardCount
        }).tier
      })),
      upcomingMatches: matches.map((match) => ({
        id: match.id,
        number: match.number,
        phase: match.phase,
        groupKey: match.groupKey,
        startsAt: match.startsAt,
        lockAt: match.lockAt,
        status: getEffectiveMatchStatus(match.status, match.lockAt),
        homeTeam: match.homeTeam?.name ?? match.homePlaceholder ?? "Time A",
        awayTeam: match.awayTeam?.name ?? match.awayPlaceholder ?? "Time B",
        homeCode: match.homeTeam?.code,
        awayCode: match.awayTeam?.code,
        homeCountryCode: match.homeTeam?.countryCode,
        awayCountryCode: match.awayTeam?.countryCode,
        homePlayers: [],
        awayPlayers: [],
        city: match.city,
        venue: match.venue,
        prediction: match.predictions[0]
          ? {
              outcome: match.predictions[0].outcome,
              score: {
                home: match.predictions[0].score.home,
                away: match.predictions[0].score.away
              },
              scorers: match.predictions[0].scorers,
              cardsEdge: match.predictions[0].cardsEdge,
              cardsRange: match.predictions[0].cardsRange,
              points: match.predictions[0].points
            }
          : null
      })),
      hotFeed: feed.map((post) => ({
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        likedByMe: Boolean(userId && Array.isArray(post.likes) && post.likes.length),
        author: post.author
          ? {
              id: post.author.id,
              name: post.author.name ?? "Participante",
              username: post.author.username ?? "user",
              image: post.author.image
            }
          : null,
        comments: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: {
            name: comment.author.name ?? "Participante",
            username: comment.author.username ?? "user"
          },
          replies: comment.replies.map((reply) => ({
            id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt,
            author: {
              name: reply.author.name ?? "Participante",
              username: reply.author.username ?? "user"
            }
          }))
        }))
      }))
    };
  } catch {
    return buildEmptyDashboard(userId);
  }
}

export async function getMatchesData(
  userId?: string | null,
  tab: "open" | "locked" | "finished" = "open"
): Promise<MatchCardData[]> {
  if (!databaseEnabled() || !userId) {
    return [];
  }

  try {
    const now = new Date();
    const where =
      tab === "finished"
        ? { status: MatchStatus.FINISHED }
        : tab === "locked"
          ? {
              status: {
                not: MatchStatus.FINISHED
              },
              lockAt: {
                lte: now
              }
            }
          : {
              status: {
                not: MatchStatus.FINISHED
              },
              lockAt: {
                gt: now
              }
            };

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        result: {
          include: { score: true }
        },
        predictions: {
          where: { userId },
          include: { score: true }
        }
      },
      orderBy: tab === "open" ? [{ startsAt: "asc" }] : [{ startsAt: "desc" }]
    });

    return matches.map((match) => ({
      id: match.id,
      number: match.number,
      phase: match.phase,
      groupKey: match.groupKey,
      startsAt: match.startsAt,
      lockAt: match.lockAt,
      status: getEffectiveMatchStatus(match.status, match.lockAt),
      homeTeam: match.homeTeam?.name ?? match.homePlaceholder ?? "Time A",
      awayTeam: match.awayTeam?.name ?? match.awayPlaceholder ?? "Time B",
      homeCode: match.homeTeam?.code,
      awayCode: match.awayTeam?.code,
      homeCountryCode: match.homeTeam?.countryCode,
      awayCountryCode: match.awayTeam?.countryCode,
      homePlayers: [],
      awayPlayers: [],
      city: match.city,
      venue: match.venue,
      prediction: match.predictions[0]
        ? {
            outcome: match.predictions[0].outcome,
            score: {
              home: match.predictions[0].score.home,
              away: match.predictions[0].score.away
            },
            scorers: match.predictions[0].scorers,
            cardsEdge: match.predictions[0].cardsEdge,
            cardsRange: match.predictions[0].cardsRange,
            points: match.predictions[0].points
          }
        : null,
      result: match.result
        ? {
            outcome: match.result.outcome,
            score: {
              home: match.result.score.home,
              away: match.result.score.away
            },
            scorers: match.result.scorers,
            cardsEdge: match.result.cardsEdge,
            cardsRange: match.result.cardsRange
          }
        : null
    }));
  } catch {
    return [];
  }
}

export async function getMatchPredictionData(
  matchId: string,
  userId?: string | null
): Promise<MatchCardData | null> {
  if (!databaseEnabled() || !userId) {
    return null;
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          include: {
            players: {
              where: { isActive: true },
              orderBy: { slotNumber: "asc" }
            }
          }
        },
        awayTeam: {
          include: {
            players: {
              where: { isActive: true },
              orderBy: { slotNumber: "asc" }
            }
          }
        },
        result: {
          include: { score: true }
        },
        predictions: {
          where: { userId },
          include: { score: true }
        }
      }
    });

    if (!match) {
      return null;
    }

    return {
      id: match.id,
      number: match.number,
      phase: match.phase,
      groupKey: match.groupKey,
      startsAt: match.startsAt,
      lockAt: match.lockAt,
      status: getEffectiveMatchStatus(match.status, match.lockAt),
      homeTeam: match.homeTeam?.name ?? match.homePlaceholder ?? "Time A",
      awayTeam: match.awayTeam?.name ?? match.awayPlaceholder ?? "Time B",
      homeCode: match.homeTeam?.code,
      awayCode: match.awayTeam?.code,
      homeCountryCode: match.homeTeam?.countryCode,
      awayCountryCode: match.awayTeam?.countryCode,
      homePlayers: mapTeamPlayers(match.homeTeam),
      awayPlayers: mapTeamPlayers(match.awayTeam),
      city: match.city,
      venue: match.venue,
      prediction: match.predictions[0]
        ? {
            outcome: match.predictions[0].outcome,
            score: {
              home: match.predictions[0].score.home,
              away: match.predictions[0].score.away
            },
            scorers: match.predictions[0].scorers,
            cardsEdge: match.predictions[0].cardsEdge,
            cardsRange: match.predictions[0].cardsRange,
            points: match.predictions[0].points
          }
        : null,
      result: match.result
        ? {
            outcome: match.result.outcome,
            score: {
              home: match.result.score.home,
              away: match.result.score.away
            },
            scorers: match.result.scorers,
            cardsEdge: match.result.cardsEdge,
            cardsRange: match.result.cardsRange
          }
        : null
    };
  } catch {
    return null;
  }
}

export async function getLeaderboardData(
  scope: LeaderboardScope = LeaderboardScope.OVERALL
): Promise<LeaderboardRowView[]> {
  if (!databaseEnabled()) {
    return [];
  }

  try {
    const rows = await prisma.leaderboard.findMany({
      where: { scope },
      include: {
        user: {
          include: {
            predictions: {
              include: {
                match: {
                  include: {
                    homeTeam: true,
                    awayTeam: true
                  }
                }
              },
              orderBy: { updatedAt: "desc" },
              take: 1
            }
          }
        }
      },
      orderBy: [{ rankPosition: "asc" }]
    });
    const userIds = rows.map((row) => row.userId);
    const correctCardsByUserId = new Map<string, number>();

    if (userIds.length) {
      const evaluatedPredictions = await prisma.prediction.findMany({
        where: {
          userId: { in: userIds },
          match: {
            result: { isNot: null }
          }
        },
        select: {
          userId: true,
          cardsEdge: true,
          cardsRange: true,
          match: {
            select: {
              phase: true,
              result: {
                select: {
                  cardsEdge: true,
                  cardsRange: true
                }
              }
            }
          }
        }
      });

      for (const prediction of evaluatedPredictions) {
        const predictionScope =
          scope === LeaderboardScope.OVERALL ? scope : getScopeForPhase(prediction.match.phase);

        if (scope !== LeaderboardScope.OVERALL && predictionScope !== scope) {
          continue;
        }

        if (
          prediction.match.result &&
          prediction.cardsEdge === prediction.match.result.cardsEdge &&
          prediction.cardsRange === prediction.match.result.cardsRange
        ) {
          correctCardsByUserId.set(
            prediction.userId,
            (correctCardsByUserId.get(prediction.userId) ?? 0) + 1
          );
        }
      }
    }

    return rows.map((row, index) => ({
      userId: row.userId,
      name: row.user.name ?? "Participante",
      username: row.user.username ?? `user${index + 1}`,
      totalPoints: row.totalPoints,
      exactScores: row.exactScores,
      correctWinners: row.correctWinners,
      correctScorers: row.correctScorers,
      correctCards: correctCardsByUserId.get(row.userId) ?? 0,
      rankPosition: row.rankPosition,
      movement: row.movement,
      pointsToNext: row.pointsToNext,
      tier: buildPlayerStatus({
        scope,
        rankPosition: row.rankPosition,
        totalPlayers: rows.length
      }).tier,
      featuredMatch: row.user.predictions[0]
        ? {
            homeCountryCode: row.user.predictions[0].match.homeTeam?.countryCode,
            awayCountryCode: row.user.predictions[0].match.awayTeam?.countryCode,
            homeCode: row.user.predictions[0].match.homeTeam?.code,
            awayCode: row.user.predictions[0].match.awayTeam?.code
          }
        : null
    }));
  } catch {
    return [];
  }
}

export async function getFeedData(userId?: string | null): Promise<FeedPostView[]> {
  if (!databaseEnabled()) {
    return [];
  }

  try {
    const posts = await prisma.feedPost.findMany({
      include: {
        author: true,
        comments: {
          where: { parentId: null },
          include: {
            author: true,
            replies: {
              include: {
                author: true
              }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        likes: userId ? { where: { userId } } : true,
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return posts.map((post) => ({
      id: post.id,
      type: post.type,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      likedByMe: Boolean(userId && Array.isArray(post.likes) && post.likes.length),
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name ?? "Participante",
            username: post.author.username ?? "user",
            image: post.author.image
          }
        : null,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          name: comment.author.name ?? "Participante",
          username: comment.author.username ?? "user"
        },
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          author: {
            name: reply.author.name ?? "Participante",
            username: reply.author.username ?? "user"
          }
        }))
      }))
    }));
  } catch {
    return [];
  }
}

export async function getPalpiteirosData(): Promise<PalpiteiroView[]> {
  if (!databaseEnabled()) {
    return [];
  }

  try {
    const [users, totalPlayers] = await Promise.all([
      prisma.user.findMany({
        where: {
          approvalStatus: ApprovalStatus.APPROVED
        },
        include: {
          leaderboardRows: {
            where: { scope: LeaderboardScope.OVERALL },
            orderBy: { snapshotAt: "desc" },
            take: 1
          },
          _count: {
            select: {
              predictions: true,
              feedPosts: true,
              comments: true
            }
          }
        },
        orderBy: [{ createdAt: "asc" }]
      }),
      prisma.user.count({
        where: {
          approvalStatus: ApprovalStatus.APPROVED
        }
      })
    ]);

    return users.map((user) => {
      const standing = user.leaderboardRows[0];
      const rankPosition = standing?.rankPosition ?? null;

      return {
        id: user.id,
        name: user.name ?? "Participante",
        username: user.username ?? "user",
        email: user.email,
        image: user.image,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        points: standing?.totalPoints ?? 0,
        rankPosition,
        tier: rankPosition
          ? buildPlayerStatus({
              scope: LeaderboardScope.OVERALL,
              rankPosition,
              totalPlayers
            }).tier
          : PlayerTier.AVERAGE,
        predictionsCount: user._count.predictions,
        postsCount: user._count.feedPosts,
        commentsCount: user._count.comments
      };
    });
  } catch {
    return [];
  }
}

export async function getNotificationsData(userId?: string | null): Promise<NotificationView[]> {
  if (!databaseEnabled() || !userId) {
    return [];
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return notifications.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          body: item.body,
          href: item.href,
          isRead: item.isRead,
          createdAt: item.createdAt
        }));
  } catch {
    return [];
  }
}

export async function getUnreadNotificationsCount(userId?: string | null): Promise<number> {
  if (!databaseEnabled() || !userId) {
    return 0;
  }

  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  } catch {
    return 0;
  }
}

export async function getAdminData(): Promise<AdminView> {
  if (!databaseEnabled()) {
    return buildEmptyAdminData();
  }

  try {
    const simulationWindowStart = new Date(Date.now() - 36 * 60 * 60 * 1000);
    const [pendingUsers, recentAudit, users, approvedUsers, posts, predictions, scopes, simulationMatches, playerTeams] = await Promise.all([
      prisma.user.findMany({
        where: { approvalStatus: ApprovalStatus.PENDING, role: Role.USER },
        orderBy: { createdAt: "desc" }
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8
      }),
      prisma.user.count(),
      prisma.user.count({
        where: { approvalStatus: ApprovalStatus.APPROVED }
      }),
      prisma.feedPost.count(),
      prisma.prediction.count(),
      Promise.all([
        prisma.leaderboard.findFirst({
          where: { scope: LeaderboardScope.OVERALL },
          include: { user: true },
          orderBy: { rankPosition: "asc" }
        }),
        prisma.leaderboard.findFirst({
          where: { scope: LeaderboardScope.GROUP_STAGE },
          include: { user: true },
          orderBy: { rankPosition: "asc" }
        }),
        prisma.leaderboard.findFirst({
          where: { scope: LeaderboardScope.KNOCKOUT },
          include: { user: true },
          orderBy: { rankPosition: "asc" }
        })
      ]),
      prisma.match.findMany({
        where: {
          OR: [
            { status: { not: MatchStatus.FINISHED } },
            { startsAt: { gte: simulationWindowStart } }
          ]
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          result: {
            include: {
              score: true
            }
          },
          _count: {
            select: {
              predictions: true
            }
          }
        },
        orderBy: [{ startsAt: "asc" }],
        take: 104
      }),
      prisma.team.findMany({
        where: { isPlaceholder: false },
        include: {
          players: {
            where: { isActive: true },
            orderBy: [{ slotNumber: "asc" }]
          }
        },
        orderBy: [{ groupKey: "asc" }, { seedNumber: "asc" }, { name: "asc" }]
      })
    ]);

    return {
      pendingUsers: pendingUsers.map((user) => ({
        id: user.id,
        name: user.name ?? "Participante",
        email: user.email ?? "sem-email",
        username: user.username,
        createdAt: user.createdAt
      })),
      recentAudit: recentAudit.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        createdAt: log.createdAt
      })),
      stats: {
        users,
        approvedUsers,
        pendingUsers: pendingUsers.length,
        posts,
        predictions
      },
      leaderboardScopes: [
        {
          scope: LeaderboardScope.OVERALL,
          leader: scopes[0]?.user.name ?? "Sem dados",
          points: scopes[0]?.totalPoints ?? 0
        },
        {
          scope: LeaderboardScope.GROUP_STAGE,
          leader: scopes[1]?.user.name ?? "Sem dados",
          points: scopes[1]?.totalPoints ?? 0
        },
        {
          scope: LeaderboardScope.KNOCKOUT,
          leader: scopes[2]?.user.name ?? "Sem dados",
          points: scopes[2]?.totalPoints ?? 0
        }
      ],
      simulationMatches: simulationMatches.map((match) => ({
        id: match.id,
        number: match.number,
        phase: match.phase,
        groupKey: match.groupKey,
        startsAt: match.startsAt,
        homeTeam: match.homeTeam?.name ?? match.homePlaceholder ?? "Time A",
        awayTeam: match.awayTeam?.name ?? match.awayPlaceholder ?? "Time B",
        homeCode: match.homeTeam?.code ?? null,
        awayCode: match.awayTeam?.code ?? null,
        homeCountryCode: match.homeTeam?.countryCode ?? null,
        awayCountryCode: match.awayTeam?.countryCode ?? null,
        predictionCount: match._count.predictions,
        status: getEffectiveMatchStatus(match.status, match.lockAt),
        result: match.result
          ? {
              score: {
                home: match.result.score.home,
                away: match.result.score.away
              },
              scorers: match.result.scorers,
              cardsEdge: match.result.cardsEdge,
              cardsRange: match.result.cardsRange
            }
          : null
      })),
      playerTeams: mapAdminTeamRoster(playerTeams)
    };
  } catch {
    return buildEmptyAdminData();
  }
}
