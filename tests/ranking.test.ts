import assert from "node:assert/strict";
import { LeaderboardScope, Phase } from "@prisma/client";
import { buildLeaderboardSummaries } from "@/lib/ranking";

const summaries = buildLeaderboardSummaries(
  [
    {
      userId: "user-b",
      points: 9,
      exactHit: false,
      winnerHit: true,
      scorerHits: 1,
      match: { phase: Phase.GROUP_STAGE }
    },
    {
      userId: "user-a",
      points: 9,
      exactHit: false,
      winnerHit: true,
      scorerHits: 0,
      match: { phase: Phase.GROUP_STAGE }
    }
  ],
  LeaderboardScope.OVERALL
);

assert.deepEqual(
  summaries.map((row) => ({
    userId: row.userId,
    rankPosition: row.rankPosition,
    totalPoints: row.totalPoints
  })),
  [
    { userId: "user-a", rankPosition: 1, totalPoints: 9 },
    { userId: "user-b", rankPosition: 2, totalPoints: 9 }
  ]
);

console.log("Ranking validation completed successfully.");
