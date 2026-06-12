import { createHash } from "node:crypto";
import { LeaderboardScope } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  const [teams, officialPlayers, predictions, match, leaderboard] = await Promise.all([
    prisma.team.count({
      where: { isPlaceholder: false }
    }),
    prisma.player.count({
      where: {
        isActive: true,
        isOfficial: true
      }
    }),
    prisma.prediction.findMany({
      select: {
        id: true,
        userId: true,
        matchId: true,
        outcome: true,
        scorers: true,
        cardsEdge: true,
        cardsRange: true,
        points: true,
        user: {
          select: {
            name: true
          }
        },
        score: {
          select: {
            home: true,
            away: true
          }
        }
      },
      orderBy: { id: "asc" }
    }),
    prisma.match.findUnique({
      where: { number: 1 },
      include: {
        result: {
          include: {
            score: true
          }
        },
        predictions: {
          include: {
            score: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.leaderboard.findMany({
      where: { scope: LeaderboardScope.OVERALL },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { rankPosition: "asc" }
    })
  ]);

  if (!match?.result) {
    throw new Error("O jogo 1 ainda nao possui resultado oficial.");
  }

  const predictionContent = predictions.map(({ points: _points, user: _user, ...prediction }) => prediction);
  const exactHits = match.predictions
    .filter(
      (prediction) =>
        prediction.score.home === match.result?.score.home &&
        prediction.score.away === match.result?.score.away
    )
    .map((prediction) => ({
      name: prediction.user.name,
      points: prediction.points
    }));

  console.log(JSON.stringify({
    teams,
    officialPlayers,
    predictions: predictions.length,
    predictionIntegrityHash: createHash("sha256")
      .update(JSON.stringify(predictionContent))
      .digest("hex"),
    match: {
      number: match.number,
      status: match.status,
      score: match.result.score,
      scorers: match.result.scorers,
      cardsEdge: match.result.cardsEdge,
      cardsRange: match.result.cardsRange,
      evaluatedPredictions: match.predictions.filter((prediction) => prediction.evaluatedAt).length,
      exactHits
    },
    leaderboard: leaderboard.map((row) => ({
      rank: row.rankPosition,
      name: row.user.name,
      points: row.totalPoints
    }))
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
