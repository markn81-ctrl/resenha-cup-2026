import { prisma } from "../lib/prisma";

function findDuplicates(rows: Array<{ userId: string; scope: string }>) {
  const seen = new Set<string>();
  const duplicates = [];

  for (const row of rows) {
    const key = `${row.userId}:${row.scope}`;

    if (seen.has(key)) {
      duplicates.push(row);
    }

    seen.add(key);
  }

  return duplicates;
}

async function main() {
  const [leaderboard, statuses] = await Promise.all([
    prisma.leaderboard.findMany({
      select: {
        userId: true,
        scope: true
      }
    }),
    prisma.playerStatus.findMany({
      select: {
        userId: true,
        scope: true
      }
    })
  ]);
  const leaderboardDuplicates = findDuplicates(leaderboard);
  const statusDuplicates = findDuplicates(statuses);

  console.log({
    leaderboardCount: leaderboard.length,
    statusCount: statuses.length,
    leaderboardDuplicates,
    statusDuplicates
  });

  if (leaderboardDuplicates.length || statusDuplicates.length) {
    throw new Error("Existem duplicidades que impedem a criacao dos indices unicos.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
