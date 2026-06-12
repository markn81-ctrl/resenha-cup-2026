import {
  LeaderboardScope,
  MatchStatus,
  Prisma,
  type CardsEdge,
  type CardsRange
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildLeaderboardSummaries, calculateMovement } from "@/lib/ranking";
import {
  calculatePredictionScore,
  countScorerHits,
  deriveOutcome,
  normalizePlayerName
} from "@/lib/scoring";
import { syncRivalries } from "@/lib/rivalries";

export type FinalResultInput = {
  matchId: string;
  score: {
    home: number;
    away: number;
  };
  scorers: string[];
  cardsEdge: CardsEdge;
  cardsRange: CardsRange;
};

type EvaluatedPrediction = {
  userId: string;
  points: number;
  exactHit: boolean;
  winnerHit: boolean;
  scorerHits: number;
  match: {
    phase: Parameters<typeof calculatePredictionScore>[0]["phase"];
  };
};

type PredictionUpdate = {
  id: string;
  points: number;
  streakApplied: number;
  multiplier: number;
};

function resultMatchesInput(
  result: {
    outcome: ReturnType<typeof deriveOutcome>;
    scorers: string[];
    cardsEdge: CardsEdge;
    cardsRange: CardsRange;
    score: { home: number; away: number };
  },
  input: FinalResultInput
) {
  const resultScorers = result.scorers.map(normalizePlayerName).sort();
  const inputScorers = input.scorers.map(normalizePlayerName).sort();

  return (
    result.outcome === deriveOutcome(input.score) &&
    result.score.home === input.score.home &&
    result.score.away === input.score.away &&
    result.cardsEdge === input.cardsEdge &&
    result.cardsRange === input.cardsRange &&
    JSON.stringify(resultScorers) === JSON.stringify(inputScorers)
  );
}

async function rebuildRankings(tx: Prisma.TransactionClient) {
  const [finishedMatches, previousRows] = await Promise.all([
    tx.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        result: { isNot: null }
      },
      include: {
        result: {
          include: {
            score: true
          }
        },
        predictions: {
          include: {
            score: true
          }
        }
      },
      orderBy: [{ startsAt: "asc" }, { number: "asc" }]
    }),
    tx.leaderboard.findMany()
  ]);

  const streaks = new Map<string, number>();
  const evaluated: EvaluatedPrediction[] = [];
  const predictionUpdates: PredictionUpdate[] = [];
  const evaluatedAt = new Date();

  for (const match of finishedMatches) {
    if (!match.result) {
      continue;
    }

    for (const prediction of match.predictions) {
      const streakBefore = streaks.get(prediction.userId) ?? 0;
      const breakdown = calculatePredictionScore({
        prediction: {
          outcome: prediction.outcome,
          score: prediction.score,
          scorers: prediction.scorers,
          cardsEdge: prediction.cardsEdge,
          cardsRange: prediction.cardsRange
        },
        result: match.result,
        phase: match.phase,
        streakBefore
      });
      const currentStreak = breakdown.winnerHit ? streakBefore + 1 : 0;
      const scorerHits = Math.min(
        countScorerHits(prediction.scorers, match.result.scorers),
        2
      );

      streaks.set(prediction.userId, currentStreak);
      evaluated.push({
        userId: prediction.userId,
        points: breakdown.total,
        exactHit: breakdown.exactHit,
        winnerHit: breakdown.winnerHit,
        scorerHits,
        match: {
          phase: match.phase
        }
      });

      predictionUpdates.push({
        id: prediction.id,
        points: breakdown.total,
        streakApplied: currentStreak,
        multiplier: breakdown.multiplier
      });
    }
  }

  if (predictionUpdates.length) {
    const rows = Prisma.join(
      predictionUpdates.map((update) => Prisma.sql`(
        ${update.id}::text,
        ${update.points}::double precision,
        ${update.streakApplied}::integer,
        ${update.multiplier}::double precision,
        ${evaluatedAt}::timestamp with time zone
      )`)
    );

    await tx.$executeRaw`
      UPDATE "Prediction" AS prediction
      SET
        "points" = updates."points",
        "streakApplied" = updates."streakApplied",
        "multiplier" = updates."multiplier",
        "isLockedSnapshot" = TRUE,
        "evaluatedAt" = updates."evaluatedAt"
      FROM (
        VALUES ${rows}
      ) AS updates("id", "points", "streakApplied", "multiplier", "evaluatedAt")
      WHERE prediction."id" = updates."id"
    `;
  }

  const scopes = [
    LeaderboardScope.OVERALL,
    LeaderboardScope.GROUP_STAGE,
    LeaderboardScope.KNOCKOUT
  ];
  const previousMap = new Map(
    previousRows.map((row) => [`${row.scope}:${row.userId}`, row])
  );
  const summaries = scopes.flatMap((scope) =>
    buildLeaderboardSummaries(evaluated, scope).map((summary) => {
      const previous = previousMap.get(`${scope}:${summary.userId}`) ?? null;

      return {
        scope,
        summary,
        previous
      };
    })
  );

  await tx.playerStatus.deleteMany();
  await tx.leaderboard.deleteMany();

  if (summaries.length) {
    await tx.leaderboard.createMany({
      data: summaries.map(({ scope, summary, previous }) => ({
        userId: summary.userId,
        scope,
        totalPoints: summary.totalPoints,
        exactScores: summary.exactScores,
        correctWinners: summary.correctWinners,
        correctScorers: summary.correctScorers,
        rankPosition: summary.rankPosition,
        previousPosition: previous?.rankPosition ?? null,
        movement: calculateMovement(previous, summary.rankPosition),
        pointsToNext: summary.pointsToNext,
        snapshotAt: evaluatedAt
      }))
    });

    await tx.playerStatus.createMany({
      data: summaries.map(({ summary }) => ({
        userId: summary.userId,
        ...summary.playerStatus
      }))
    });
  }

  return {
    evaluatedPredictions: evaluated.length,
    leaderboardRows: summaries.length,
    exactHits: evaluated.filter((prediction) => prediction.exactHit).length
  };
}

export async function finalizeMatchResult(
  input: FinalResultInput,
  actorId?: string | null
) {
  const finalized = await prisma.$transaction(
    async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: input.matchId },
        include: {
          result: {
            include: {
              score: true
            }
          }
        }
      });

      if (!match) {
        throw new Error("Jogo nao encontrado.");
      }

      if (match.result) {
        if (!resultMatchesInput(match.result, input)) {
          throw new Error(
            "Este jogo ja possui outro resultado oficial. Use um fluxo de correcao auditada."
          );
        }

        return {
          matchNumber: match.number,
          alreadyFinalized: true,
          score: input.score,
          ...(await rebuildRankings(tx))
        };
      }

      const score = await tx.score.create({
        data: input.score
      });

      await tx.matchResult.create({
        data: {
          matchId: match.id,
          scoreId: score.id,
          outcome: deriveOutcome(input.score),
          scorers: input.scorers,
          cardsEdge: input.cardsEdge,
          cardsRange: input.cardsRange,
          finishedAt: new Date()
        }
      });

      await tx.match.update({
        where: { id: match.id },
        data: {
          status: MatchStatus.FINISHED
        }
      });

      const ranking = await rebuildRankings(tx);

      await tx.auditLog.create({
        data: {
          actorId: actorId ?? null,
          action: "match.result.finalized",
          entityType: "Match",
          entityId: match.id,
          payload: {
            matchNumber: match.number,
            ...input,
            ...ranking
          }
        }
      });

      return {
        matchNumber: match.number,
        alreadyFinalized: false,
        score: input.score,
        ...ranking
      };
    },
    {
      maxWait: 10_000,
      timeout: 30_000
    }
  );

  await Promise.allSettled(
    [
      LeaderboardScope.OVERALL,
      LeaderboardScope.GROUP_STAGE,
      LeaderboardScope.KNOCKOUT
    ].map((scope) => syncRivalries(scope))
  );

  return finalized;
}
