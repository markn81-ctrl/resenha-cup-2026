import { LeaderboardScope, Phase, type Leaderboard, type Prediction } from "@prisma/client";
import { buildPlayerStatus } from "@/lib/player-status";

type RankedPrediction = Pick<Prediction, "userId" | "points"> & {
  match: {
    phase: Phase;
  };
};

type SummaryRow = {
  userId: string;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  correctScorers: number;
};

export function getScopeForPhase(phase: Phase): LeaderboardScope {
  return phase === Phase.GROUP_STAGE ? LeaderboardScope.GROUP_STAGE : LeaderboardScope.KNOCKOUT;
}

export function buildLeaderboardSummaries(
  predictions: Array<
    RankedPrediction & {
      exactHit?: boolean;
      winnerHit?: boolean;
      scorerHits?: number;
    }
  >,
  scope: LeaderboardScope
) {
  const rows = new Map<string, SummaryRow>();

  for (const prediction of predictions) {
    const predictionScope =
      scope === LeaderboardScope.OVERALL ? scope : getScopeForPhase(prediction.match.phase);

    if (scope !== LeaderboardScope.OVERALL && predictionScope !== scope) {
      continue;
    }

    const row =
      rows.get(prediction.userId) ??
      {
        userId: prediction.userId,
        totalPoints: 0,
        exactScores: 0,
        correctWinners: 0,
        correctScorers: 0
      };

    row.totalPoints += prediction.points;
    row.exactScores += prediction.exactHit ? 1 : 0;
    row.correctWinners += prediction.winnerHit ? 1 : 0;
    row.correctScorers += prediction.scorerHits ?? 0;
    rows.set(prediction.userId, row);
  }

  const ordered = [...rows.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    if (b.exactScores !== a.exactScores) {
      return b.exactScores - a.exactScores;
    }

    if (b.correctWinners !== a.correctWinners) {
      return b.correctWinners - a.correctWinners;
    }

    return a.userId.localeCompare(b.userId);
  });

  return ordered.map((row, index) => {
    const previous = ordered[index - 1];
    return {
      ...row,
      rankPosition: index + 1,
      pointsToNext:
        previous && previous.totalPoints > row.totalPoints
          ? previous.totalPoints - row.totalPoints
          : null,
      playerStatus: buildPlayerStatus({
        scope,
        rankPosition: index + 1,
        totalPlayers: ordered.length
      })
    };
  });
}

export function calculateMovement(previous: Leaderboard | null, currentPosition: number) {
  if (!previous?.rankPosition) {
    return 0;
  }

  return previous.rankPosition - currentPosition;
}
