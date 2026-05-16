import {
  ApprovalStatus,
  FeedPostType,
  LeaderboardScope,
  MatchStatus,
  NotificationType
} from "@prisma/client";
import { generateAiCommentary } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export const PICK_LOCK_REMINDER_LEAD_MINUTES = 15;
export const PICK_LOCK_REMINDER_ACTION = "pick_lock_reminder.sent";

type ReminderMatch = {
  id: string;
  number: number;
  lockAt: Date;
  startsAt: Date;
  homeName: string;
  awayName: string;
};

export type PickLockReminderSummary = {
  checkedMatches: number;
  remindedMatches: number;
  createdNotifications: number;
  createdFeedPosts: number;
  skippedAlreadySent: number;
};

export function getPickLockReminderWindow(now = new Date()) {
  return {
    startsAt: now,
    endsAt: new Date(now.getTime() + PICK_LOCK_REMINDER_LEAD_MINUTES * 60 * 1000)
  };
}

export function isInsidePickLockReminderWindow(lockAt: Date | string, now = new Date()) {
  const lockDate = new Date(lockAt);
  const window = getPickLockReminderWindow(now);

  return lockDate > window.startsAt && lockDate <= window.endsAt;
}

function formatMatchTitle(match: ReminderMatch) {
  return `${match.homeName} x ${match.awayName}`;
}

async function createAiReminderContent(match: ReminderMatch, pendingUsersCount: number) {
  const matchTitle = formatMatchTitle(match);

  return generateAiCommentary({
    scope: LeaderboardScope.OVERALL,
    headline: `Faltam 15 minutos para fechar os palpites de ${matchTitle}.`,
    rankingChanges: [],
    hotStreaks: [],
    coldStreaks: [],
    matchResults: [],
    matchSummary:
      pendingUsersCount > 0
        ? `${pendingUsersCount} participante(s) ainda nao palpitaram. Hora de largar o cafe e cravar esse placar.`
        : `Todo mundo ja palpitou nesse jogo. A resenha esta organizada demais, ate suspeito.`
  });
}

export async function sendPickLockReminders(now = new Date()): Promise<PickLockReminderSummary> {
  const window = getPickLockReminderWindow(now);
  const summary: PickLockReminderSummary = {
    checkedMatches: 0,
    remindedMatches: 0,
    createdNotifications: 0,
    createdFeedPosts: 0,
    skippedAlreadySent: 0
  };

  const matches = await prisma.match.findMany({
    where: {
      status: { not: MatchStatus.FINISHED },
      lockAt: {
        gt: window.startsAt,
        lte: window.endsAt
      }
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        select: {
          userId: true
        }
      }
    },
    orderBy: {
      lockAt: "asc"
    }
  });

  summary.checkedMatches = matches.length;

  if (!matches.length) {
    return summary;
  }

  const approvedUsers = await prisma.user.findMany({
    where: {
      approvalStatus: ApprovalStatus.APPROVED
    },
    select: {
      id: true
    }
  });

  for (const match of matches) {
    const alreadySent = await prisma.auditLog.findFirst({
      where: {
        action: PICK_LOCK_REMINDER_ACTION,
        entityType: "Match",
        entityId: match.id
      },
      select: {
        id: true
      }
    });

    if (alreadySent) {
      summary.skippedAlreadySent += 1;
      continue;
    }

    const predictedUserIds = new Set(match.predictions.map((prediction) => prediction.userId));
    const pendingUsers = approvedUsers.filter((user) => !predictedUserIds.has(user.id));
    const homeName = match.homeTeam?.name ?? match.homePlaceholder ?? "Time A";
    const awayName = match.awayTeam?.name ?? match.awayPlaceholder ?? "Time B";
    const reminderMatch: ReminderMatch = {
      id: match.id,
      number: match.number,
      lockAt: match.lockAt,
      startsAt: match.startsAt,
      homeName,
      awayName
    };
    const matchTitle = formatMatchTitle(reminderMatch);

    const notifications = pendingUsers.map((user) => ({
      userId: user.id,
      type: NotificationType.PICK_LOCK_REMINDER,
      title: "Palpite fecha em 15 minutos",
      body: `Corre para cravar ${matchTitle}. Depois da trava, nem a IAestagiaria consegue dar jeitinho.`,
      href: "/matches",
      metadata: {
        source: "pick_lock_reminder",
        matchId: match.id,
        matchNumber: match.number,
        lockAt: match.lockAt.toISOString(),
        startsAt: match.startsAt.toISOString(),
        leadMinutes: PICK_LOCK_REMINDER_LEAD_MINUTES
      }
    }));

    const aiContent = await createAiReminderContent(reminderMatch, pendingUsers.length);

    await prisma.$transaction(async (tx) => {
      if (notifications.length) {
        await tx.notification.createMany({
          data: notifications
        });
      }

      const feedPost = await tx.feedPost.create({
        data: {
          type: FeedPostType.AI_COMMENTARY,
          matchId: match.id,
          title: "IAestagiaria: palpite fechando",
          content: aiContent,
          metadata: {
            source: "pick_lock_reminder",
            matchId: match.id,
            matchNumber: match.number,
            lockAt: match.lockAt.toISOString(),
            leadMinutes: PICK_LOCK_REMINDER_LEAD_MINUTES,
            pendingUsersCount: pendingUsers.length
          }
        }
      });

      await tx.auditLog.create({
        data: {
          action: PICK_LOCK_REMINDER_ACTION,
          entityType: "Match",
          entityId: match.id,
          payload: {
            matchId: match.id,
            matchNumber: match.number,
            lockAt: match.lockAt.toISOString(),
            startsAt: match.startsAt.toISOString(),
            pendingUsersCount: pendingUsers.length,
            feedPostId: feedPost.id
          }
        }
      });
    });

    summary.remindedMatches += 1;
    summary.createdNotifications += notifications.length;
    summary.createdFeedPosts += 1;
  }

  return summary;
}
