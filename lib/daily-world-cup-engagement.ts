import { ApprovalStatus, FeedPostType, LeaderboardScope, NotificationType } from "@prisma/client";
import { generateAiCommentary } from "@/lib/ai";
import { buildAutomaticCommentary } from "@/lib/ai-context";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";

const DAILY_ENGAGEMENT_ACTION = "daily_world_cup_engagement.published";
const WORLD_CUP_OPENING_DATE = new Date("2026-06-11T00:00:00.000Z");

const preWorldCupTopics = [
  "contagem regressiva para a Copa",
  "chamada para novos palpites",
  "boas-vindas aos novos integrantes",
  "provocacao leve para movimentar o feed",
  "lembrete para completar perfil e foto",
  "clima de resenha antes da abertura"
];

const inProgressTopics = [
  "briga pela lideranca",
  "perseguidores do top 3",
  "duelos do meio da tabela",
  "recuperacao do fundo da tabela",
  "ultimos resultados",
  "proximos palpites decisivos"
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

function getTournamentStatus(now = new Date()) {
  return now >= WORLD_CUP_OPENING_DATE ? "in_progress" : "pre_world_cup";
}

function pickDailyTopic(dateKey: string, tournamentStatus: "pre_world_cup" | "in_progress") {
  const dailyTopics =
    tournamentStatus === "pre_world_cup" ? preWorldCupTopics : inProgressTopics;
  const seed = [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return dailyTopics[seed % dailyTopics.length];
}

async function buildDailyCommentaryInput(args: {
  dateKey: string;
  daysUntilWorldCup: number;
  dailyTopic: string;
  tournamentStatus: "pre_world_cup" | "in_progress";
  newMembers: string[];
  totalUsers: number;
  approvedUsers: number;
  pendingUsers: number;
}) {
  const common = {
    timeContext: {
      localDate: args.dateKey,
      daysUntilWorldCup: args.daysUntilWorldCup,
      openingMatchDate: "2026-06-11",
      tournamentStatus: args.tournamentStatus
    },
    newMembers: args.newMembers,
    communityStats: {
      totalUsers: args.totalUsers,
      approvedUsers: args.approvedUsers,
      pendingUsers: args.pendingUsers
    },
    dailyTopic: args.dailyTopic
  };

  if (args.tournamentStatus === "in_progress") {
    const commentary = await buildAutomaticCommentary(LeaderboardScope.OVERALL);

    return {
      ...commentary,
      ...common,
      focus: args.dailyTopic,
      headline:
        commentary.matchResults?.length || commentary.rankingBattles?.length
          ? commentary.headline
          : "Giro diario da Resenha Cup"
    };
  }

  return {
    scope: LeaderboardScope.OVERALL,
    headline: `Faltam ${args.daysUntilWorldCup} dia(s) para a Copa do Mundo 2026`,
    rankingChanges: [],
    hotStreaks: [],
    coldStreaks: [],
    matchResults: [],
    matchSummary:
      "A Resenha Cup esta em aquecimento: hora de chamar a turma, arrumar perfil e entrar no clima do bolao.",
    ...common
  };
}

export async function publishDailyWorldCupEngagementPost(now = new Date()) {
  const dateKey = getSaoPauloDateKey(now);
  const daysUntilWorldCup = getDaysUntilWorldCup(now);
  const tournamentStatus = getTournamentStatus(now);

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
  const [newUsers, totalUsers, approvedUserRows, pendingUsers] = await Promise.all([
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
    prisma.user.findMany({
      where: { approvalStatus: ApprovalStatus.APPROVED },
      select: { id: true }
    }),
    prisma.user.count({ where: { approvalStatus: ApprovalStatus.PENDING } })
  ]);

  const newMembers = newUsers.map((user) => user.name ?? user.username ?? "novo integrante");
  const approvedUsers = approvedUserRows.length;
  const dailyTopic = pickDailyTopic(dateKey, tournamentStatus);
  const commentary = await buildDailyCommentaryInput({
    dateKey,
    daysUntilWorldCup,
    dailyTopic,
    tournamentStatus,
    newMembers,
    totalUsers,
    approvedUsers,
    pendingUsers
  });
  const content = await generateAiCommentary(commentary);
  const notificationBody =
    tournamentStatus === "pre_world_cup"
      ? `Faltam ${daysUntilWorldCup} dia(s) para a Copa. Tem provocacao nova no feed.`
      : "Tem giro novo da IAestagiaria sobre resultados, ranking e proximos palpites.";

  const post = await prisma.$transaction(async (tx) => {
    const createdPost = await tx.feedPost.create({
      data: {
        type: FeedPostType.AI_COMMENTARY,
        title:
          tournamentStatus === "pre_world_cup"
            ? "IAestagiaria no aquecimento da Copa"
            : "IAestagiaria no giro da Resenha Cup",
        content,
        metadata: {
          source: "daily_world_cup_engagement",
          dateKey,
          daysUntilWorldCup,
          tournamentStatus,
          newMembers,
          dailyTopic,
          commentary,
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
          tournamentStatus,
          newMembers,
          dailyTopic
        }
      }
    });

    if (approvedUserRows.length) {
      await tx.notification.createMany({
        data: approvedUserRows.map((user) => ({
          userId: user.id,
          type: NotificationType.AI_MENTION,
          title: "IAestagiaria movimentou a resenha",
          body: notificationBody,
          href: "/resenha",
          metadata: {
            source: "daily_world_cup_engagement",
            postId: createdPost.id,
            dateKey,
            daysUntilWorldCup,
            tournamentStatus
          }
        }))
      });
    }

    return createdPost;
  });

  await sendPushToUsers(
    approvedUserRows.map((user) => user.id),
    {
      title: "IAestagiaria movimentou a resenha",
      body: notificationBody,
      url: "/resenha"
    }
  );

  return {
    skipped: false,
    dateKey,
    postId: post.id,
    daysUntilWorldCup,
    tournamentStatus,
    dailyTopic,
    newMembersCount: newMembers.length
  };
}
