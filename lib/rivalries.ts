import { LeaderboardScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type LeaderboardRowWithUser = {
  userId: string;
  totalPoints: number;
  rankPosition: number;
  previousPosition: number | null;
  movement: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

const KEEP_CURRENT_THRESHOLD = 8;

function detectRecentSwap(a: LeaderboardRowWithUser, b: LeaderboardRowWithUser) {
  if (a.previousPosition === null || b.previousPosition === null) {
    return false;
  }

  const orderedBefore = a.previousPosition < b.previousPosition;
  const orderedNow = a.rankPosition < b.rankPosition;
  return orderedBefore !== orderedNow;
}

function buildRivalryScore(user: LeaderboardRowWithUser, candidate: LeaderboardRowWithUser) {
  const rankDistance = Math.abs(user.rankPosition - candidate.rankPosition);
  const pointsDistance = Math.abs(user.totalPoints - candidate.totalPoints);
  const proximityScore = Math.max(0, 80 - rankDistance * 24 - pointsDistance * 2.4);
  const swapBonus = detectRecentSwap(user, candidate) ? 18 : 0;
  const movementBonus = Math.min(8, Math.abs(user.movement) + Math.abs(candidate.movement));

  return Number((proximityScore + swapBonus + movementBonus).toFixed(2));
}

function chooseRival(args: {
  row: LeaderboardRowWithUser;
  leaderboard: LeaderboardRowWithUser[];
  currentRivalId?: string | null;
  currentScore?: number | null;
}) {
  const index = args.leaderboard.findIndex((item) => item.userId === args.row.userId);
  const candidates = [args.leaderboard[index - 1], args.leaderboard[index + 1]].filter(
    Boolean
  ) as LeaderboardRowWithUser[];

  if (!candidates.length) {
    return null;
  }

  const scoredCandidates = candidates
    .map((candidate) => ({
      row: candidate,
      score: buildRivalryScore(args.row, candidate)
    }))
    .sort((a, b) => b.score - a.score);

  const best = scoredCandidates[0];
  const current = args.currentRivalId
    ? scoredCandidates.find((candidate) => candidate.row.userId === args.currentRivalId)
    : null;

  if (
    current &&
    args.currentScore !== null &&
    args.currentScore !== undefined &&
    current.score + KEEP_CURRENT_THRESHOLD >= best.score
  ) {
    return {
      rivalUserId: current.row.userId,
      score: current.score
    };
  }

  return {
    rivalUserId: best.row.userId,
    score: best.score
  };
}

export async function syncRivalries(scope: LeaderboardScope = LeaderboardScope.OVERALL) {
  const [leaderboardRows, existing] = await Promise.all([
    prisma.leaderboard.findMany({
      where: { scope },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      },
      orderBy: { rankPosition: "asc" }
    }),
    prisma.rivalry.findMany({
      where: { scope }
    })
  ]);

  if (!leaderboardRows.length) {
    return [];
  }

  const existingMap = new Map(existing.map((item) => [item.userId, item]));

  const writes = leaderboardRows.map((row) => {
    const current = existingMap.get(row.userId);
    const next = chooseRival({
      row,
      leaderboard: leaderboardRows,
      currentRivalId: current?.rivalUserId ?? null,
      currentScore: current?.score ?? null
    });

    if (!next) {
      if (current) {
        return prisma.rivalry.delete({
          where: { id: current.id }
        });
      }

      return null;
    }

    return prisma.rivalry.upsert({
      where: {
        userId_scope: {
          userId: row.userId,
          scope
        }
      },
      update: {
        rivalUserId: next.rivalUserId,
        score: next.score
      },
      create: {
        userId: row.userId,
        rivalUserId: next.rivalUserId,
        scope,
        score: next.score
      }
    });
  });

  const operations = writes.filter(
    (
      value
    ): value is Exclude<(typeof writes)[number], null> => value !== null
  );

  return prisma.$transaction(operations);
}

export async function getUserRivalry(userId: string, scope: LeaderboardScope = LeaderboardScope.OVERALL) {
  await syncRivalries(scope);

  return prisma.rivalry.findUnique({
    where: {
      userId_scope: {
        userId,
        scope
      }
    },
    include: {
      rivalUser: true
    }
  });
}
