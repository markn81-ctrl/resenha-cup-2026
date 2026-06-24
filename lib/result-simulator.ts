import { LeaderboardScope, MatchStatus, type CardsEdge, type CardsRange } from "@prisma/client";
import {
  calculatePredictionScore,
  calculateStreakBonus,
  countScorerHits,
  deriveOutcome,
  getStreakBonusRuleForMatch
} from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import type { AdminSimulationView } from "@/types/app";

type SimulationInput = {
  matchId: string;
  score: {
    home: number;
    away: number;
  };
  scorers: string[];
  cardsEdge: CardsEdge;
  cardsRange: CardsRange;
};

async function getStreakMap(args: {
  userIds: string[];
  startsAt: Date;
  matchNumber: number;
}) {
  const streaks = new Map<string, number>();

  if (!args.userIds.length) {
    return streaks;
  }

  const targetRule = getStreakBonusRuleForMatch(args.matchNumber);
  const previousMatches = await prisma.match.findMany({
    where: {
      status: MatchStatus.FINISHED,
      startsAt: { lt: args.startsAt },
      result: { isNot: null },
      ...(targetRule === "CYCLE_RESET"
        ? {
            number: {
              gte: 48
            }
          }
        : {}),
      predictions: {
        some: {
          userId: {
            in: args.userIds
          }
        }
      }
    },
    include: {
      result: true,
      predictions: {
        where: {
          userId: {
            in: args.userIds
          }
        },
        select: {
          userId: true,
          outcome: true
        }
      }
    },
    orderBy: [{ startsAt: "asc" }, { number: "asc" }]
  });

  for (const match of previousMatches) {
    const outcome = match.result?.outcome;

    if (!outcome) {
      continue;
    }

    for (const prediction of match.predictions) {
      const current = streaks.get(prediction.userId) ?? 0;
      streaks.set(
        prediction.userId,
        calculateStreakBonus({
          winnerHit: prediction.outcome === outcome,
          streakBefore: current,
          rule: getStreakBonusRuleForMatch(match.number)
        }).streakAfter
      );
    }
  }

  return streaks;
}

export async function simulateMatchResult(
  input: SimulationInput
): Promise<AdminSimulationView> {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      result: {
        include: {
          score: true
        }
      },
      predictions: {
        include: {
          score: true,
          user: true
        }
      }
    }
  });

  if (!match) {
    throw new Error("Jogo nao encontrado.");
  }

  const simulatedResult = {
    outcome: deriveOutcome(input.score),
    score: input.score,
    scorers: input.scorers,
    cardsEdge: input.cardsEdge,
    cardsRange: input.cardsRange
  };

  const userIds = match.predictions.map((prediction) => prediction.userId);
  const streakMap = await getStreakMap({
    userIds,
    startsAt: match.startsAt,
    matchNumber: match.number
  });
  const streakRule = getStreakBonusRuleForMatch(match.number);

  const overallRows = await prisma.leaderboard.findMany({
    where: { scope: LeaderboardScope.OVERALL },
    include: { user: true },
    orderBy: [{ rankPosition: "asc" }]
  });

  const overallMap = new Map(
    overallRows.map((row) => [
      row.userId,
      {
        userId: row.userId,
        name: row.user.name ?? "Participante",
        username: row.user.username ?? "user",
        image: row.user.image,
        currentPosition: row.rankPosition,
        totalPoints: row.totalPoints,
        exactScores: row.exactScores,
        correctWinners: row.correctWinners,
        correctScorers: row.correctScorers
      }
    ])
  );

  const simulationResults = match.predictions.map((prediction) => {
    const breakdown = calculatePredictionScore({
      prediction: {
        outcome: prediction.outcome,
        score: prediction.score,
        scorers: prediction.scorers,
        cardsEdge: prediction.cardsEdge,
        cardsRange: prediction.cardsRange
      },
      result: simulatedResult,
      phase: match.phase,
      streakBefore: streakMap.get(prediction.userId) ?? 0,
      streakRule
    });

    const scorerHits = Math.min(
      countScorerHits(prediction.scorers, simulatedResult.scorers),
      2
    );
    const previousMatchPoints = match.result ? prediction.points : 0;
    const previousScorerHits = match.result
      ? Math.min(countScorerHits(prediction.scorers, match.result.scorers), 2)
      : 0;
    const previousBreakdown = match.result
      ? calculatePredictionScore({
          prediction: {
            outcome: prediction.outcome,
            score: prediction.score,
            scorers: prediction.scorers,
            cardsEdge: prediction.cardsEdge,
            cardsRange: prediction.cardsRange
          },
          result: match.result,
          phase: match.phase,
          streakBefore: 0
        })
      : null;

    return {
      userId: prediction.userId,
      name: prediction.user.name ?? "Participante",
      username: prediction.user.username ?? "user",
      image: prediction.user.image,
      breakdown,
      scorerHits,
      previousMatchPoints,
      previousScorerHits,
      previousExactHit: previousBreakdown?.exactHit ?? false,
      previousWinnerHit: previousBreakdown?.winnerHit ?? false,
      currentOverall: overallMap.get(prediction.userId)
    };
  });

  const projectedOverall = new Map(
    overallRows.map((row) => [
      row.userId,
      {
        userId: row.userId,
        name: row.user.name ?? "Participante",
        username: row.user.username ?? "user",
        projectedTotal: row.totalPoints,
        projectedExactScores: row.exactScores,
        projectedCorrectWinners: row.correctWinners,
        projectedCorrectScorers: row.correctScorers
      }
    ])
  );

  for (const result of simulationResults) {
    const current = projectedOverall.get(result.userId) ?? {
      userId: result.userId,
      name: result.name,
      username: result.username,
      projectedTotal: 0,
      projectedExactScores: 0,
      projectedCorrectWinners: 0,
      projectedCorrectScorers: 0
    };

    projectedOverall.set(result.userId, {
      ...current,
      projectedTotal:
        current.projectedTotal - result.previousMatchPoints + result.breakdown.total,
      projectedExactScores:
        current.projectedExactScores -
        (result.previousExactHit ? 1 : 0) +
        (result.breakdown.exactHit ? 1 : 0),
      projectedCorrectWinners:
        current.projectedCorrectWinners -
        (result.previousWinnerHit ? 1 : 0) +
        (result.breakdown.winnerHit ? 1 : 0),
      projectedCorrectScorers:
        current.projectedCorrectScorers - result.previousScorerHits + result.scorerHits
    });
  }

  const rankedProjection = Array.from(projectedOverall.values())
    .sort((left, right) => {
      if (right.projectedTotal !== left.projectedTotal) {
        return right.projectedTotal - left.projectedTotal;
      }

      if (right.projectedExactScores !== left.projectedExactScores) {
        return right.projectedExactScores - left.projectedExactScores;
      }

      if (right.projectedCorrectWinners !== left.projectedCorrectWinners) {
        return right.projectedCorrectWinners - left.projectedCorrectWinners;
      }

      if (right.projectedCorrectScorers !== left.projectedCorrectScorers) {
        return right.projectedCorrectScorers - left.projectedCorrectScorers;
      }

      return left.name.localeCompare(right.name, "pt-BR");
    })
    .map((row, index) => ({
      ...row,
      projectedPosition: index + 1
    }));

  const projectedPositionMap = new Map(
    rankedProjection.map((row) => [row.userId, row.projectedPosition])
  );

  const results = simulationResults
    .map((result) => ({
      userId: result.userId,
      name: result.name,
      username: result.username,
      image: result.image,
      currentPosition: result.currentOverall?.currentPosition ?? null,
      projectedPosition: projectedPositionMap.get(result.userId) ?? null,
      previousTotal: result.currentOverall?.totalPoints ?? 0,
      projectedTotal:
        (result.currentOverall?.totalPoints ?? 0) -
        result.previousMatchPoints +
        result.breakdown.total,
      matchPoints: result.breakdown.total,
      winnerHit: result.breakdown.winnerHit,
      exactHit: result.breakdown.exactHit,
      scorerHits: result.scorerHits,
      cardsPoints: result.breakdown.cards,
      comboBonus: result.breakdown.comboBonus,
      streakBonus: result.breakdown.streakBonus
    }))
    .sort((left, right) => {
      if (right.matchPoints !== left.matchPoints) {
        return right.matchPoints - left.matchPoints;
      }

      if ((left.projectedPosition ?? 999) !== (right.projectedPosition ?? 999)) {
        return (left.projectedPosition ?? 999) - (right.projectedPosition ?? 999);
      }

      return left.name.localeCompare(right.name, "pt-BR");
    });

  const totalPoints = results.reduce((sum, item) => sum + item.matchPoints, 0);
  const topFive = rankedProjection
    .slice(0, 5)
    .map((row) => {
      const simulated = results.find((item) => item.userId === row.userId);

      return {
        userId: row.userId,
        name: row.name,
        username: row.username,
        projectedPosition: row.projectedPosition,
        projectedTotal: row.projectedTotal,
        matchPoints: simulated?.matchPoints ?? 0
      };
    });

  return {
    match: {
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
      isCorrection: Boolean(match.result)
    },
    summary: {
      predictionsCount: results.length,
      averagePoints: results.length ? Number((totalPoints / results.length).toFixed(1)) : 0,
      highestMatchPoints: results.length ? results[0].matchPoints : 0,
      winnerHits: results.filter((item) => item.winnerHit).length,
      exactHits: results.filter((item) => item.exactHit).length
    },
    projectedTopFive: topFive,
    results
  };
}
