import { PrismaClient } from "@prisma/client";
import { buildTeamPlayerSlots } from "@/prisma/tournament-data";

const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    where: {
      isPlaceholder: false
    }
  });

  let created = 0;

  for (const team of teams) {
    const existingCount = await prisma.player.count({
      where: { teamId: team.id }
    });

    if (existingCount >= 26) {
      continue;
    }

    const slots = buildTeamPlayerSlots({
      teamId: team.id,
      teamShortName: team.shortName
    });

    const result = await prisma.player.createMany({
      data: slots,
      skipDuplicates: true
    });

    created += result.count;
  }

  await prisma.auditLog.create({
    data: {
      actorId: null,
      action: "players.backfill.completed",
      entityType: "System",
      entityId: "player-slots",
      payload: {
        created
      }
    }
  });

  console.log(`Backfill concluido com ${created} slots de jogadores criados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
