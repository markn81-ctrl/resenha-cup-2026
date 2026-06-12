import { createHash } from "node:crypto";
import { MatchStatus, PrismaClient } from "@prisma/client";
import { getMatchLockDate } from "../lib/locks";

const prisma = new PrismaClient();

async function predictionSnapshot() {
  const predictions = await prisma.prediction.findMany({
    select: {
      id: true,
      userId: true,
      matchId: true,
      outcome: true,
      scorers: true,
      cardsEdge: true,
      cardsRange: true,
      score: {
        select: {
          home: true,
          away: true
        }
      }
    },
    orderBy: { id: "asc" }
  });

  return {
    count: predictions.length,
    hash: createHash("sha256").update(JSON.stringify(predictions)).digest("hex")
  };
}

async function main() {
  const before = await predictionSnapshot();
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      startsAt: true,
      status: true
    }
  });
  const now = new Date();

  await prisma.$transaction(
    matches.map((match) => {
      const lockAt = getMatchLockDate(match.startsAt);
      const status =
        match.status === MatchStatus.FINISHED
          ? MatchStatus.FINISHED
          : now >= lockAt
            ? MatchStatus.LOCKED
            : MatchStatus.SCHEDULED;

      return prisma.match.update({
        where: { id: match.id },
        data: {
          lockAt,
          status
        }
      });
    })
  );

  const after = await predictionSnapshot();

  if (before.count !== after.count || before.hash !== after.hash) {
    throw new Error("A integridade dos palpites mudou durante a atualizacao dos locks.");
  }

  console.log({
    updatedMatches: matches.length,
    preservedPredictions: after.count,
    predictionIntegrityHash: after.hash
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
