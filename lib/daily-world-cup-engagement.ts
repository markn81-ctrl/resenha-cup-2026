import { ApprovalStatus, FeedPostType, LeaderboardScope } from "@prisma/client";
import { generateAiCommentary } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

const DAILY_ENGAGEMENT_ACTION = "daily_world_cup_engagement.published";
const WORLD_CUP_OPENING_DATE = new Date("2026-06-11T00:00:00.000Z");

const dailyTopics = [
  "contagem regressiva para a Copa",
  "chamada para novos palpites",
  "boas-vindas aos novos integrantes",
  "provocacao leve para movimentar o feed",
  "lembrete para completar perfil e foto",
  "clima de resenha antes da abertura"
];

function getSaoPauloDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

function getDaysUntilWorldCup(now = new Date()) {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const openingUtc = Date.UTC(
    WORLD_CUP_OPENING_DATE.getUTCFullYear(),
    WORLD_CUP_OPENING_DATE.getUTCMonth(),
    WORLD_CUP_OPENING_DATE.getUTCDate()
  );

  return Math.max(0, Math.ceil((openingUtc - todayUtc) / (24 * 60 * 60 * 1000)));
}

function pickDailyTopic(dateKey: string) {
  const seed = [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return dailyTopics[seed % dailyTopics.length];
}

export async function publishDailyWorldCupEngagementPost(now = new Date()) {
  const dateKey = getSaoPauloDateKey(now);
  const daysUntilWorldCup = getDaysUntilWorldCup(now);

  if (now >= WORLD_CUP_OPENING_DATE) {
    return {
      skipped: true,
      reason: "world_cup_already_started",
      dateKey
    };
  }

  const alreadyPublished = await prisma.auditLog.findFirst({
    where: {
      action: DAILY_ENGAGEMENT_ACTION,
      entityType: "FeedPost",
      entityId: dateKey
    },
    select: {
      id: true
    }
  });

  if (alreadyPublished) {
    return {
      skipped: true,
      reason: "already_published_today",
      dateKey
    };
  }

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [newUsers, totalUsers, approvedUsers, pendingUsers] = await Promise.all([
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: yesterday
        },
        approvalStatus: {
          in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.user.count(),
    prisma.user.count({ where: { approvalStatus: ApprovalStatus.APPROVED } }),
    prisma.user.count({ where: { approvalStatus: ApprovalStatus.PENDING } })
  ]);

  const newMembers = newUsers.map((user) => user.name ?? user.username ?? "novo integrante");
  const dailyTopic = pickDailyTopic(dateKey);
  const content = await generateAiCommentary({
    scope: LeaderboardScope.OVERALL,
    headline: `Faltam ${daysUntilWorldCup} dia(s) para a Copa do Mundo 2026`,
    rankingChanges: [],
    hotStreaks: [],
    coldStreaks: [],
    matchResults: [],
    matchSummary:
      "A Resenha Cup esta em aquecimento: hora de chamar a turma, arrumar perfil e entrar no clima do bolao.",
    timeContext: {
      localDate: dateKey,
      daysUntilWorldCup,
      openingMatchDate: "2026-06-11",
      tournamentStatus: "pre_world_cup"
    },
    newMembers,
    communityStats: {
      totalUsers,
      approvedUsers,
      pendingUsers
    },
    dailyTopic
  });

  const post = await prisma.$transaction(async (tx) => {
    const createdPost = await tx.feedPost.create({
      data: {
        type: FeedPostType.AI_COMMENTARY,
        title: "IAestagiaria no aquecimento da Copa",
        content,
        metadata: {
          source: "daily_world_cup_engagement",
          dateKey,
          daysUntilWorldCup,
          newMembers,
          dailyTopic,
          communityStats: {
            totalUsers,
            approvedUsers,
            pendingUsers
          }
        }
      }
    });

    await tx.auditLog.create({
      data: {
        action: DAILY_ENGAGEMENT_ACTION,
        entityType: "FeedPost",
        entityId: dateKey,
        payload: {
          postId: createdPost.id,
          dateKey,
          daysUntilWorldCup,
          newMembers,
          dailyTopic
        }
      }
    });

    return createdPost;
  });

  return {
    skipped: false,
    dateKey,
    postId: post.id,
    daysUntilWorldCup,
    newMembersCount: newMembers.length
  };
}
