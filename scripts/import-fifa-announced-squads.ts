import { createHash } from "node:crypto";
import { PlayerPosition, PrismaClient } from "@prisma/client";
import rawSquads from "./data/fifa-world-cup-2026-squads.json";

const prisma = new PrismaClient();

const positionMap = {
  Goalkeeper: PlayerPosition.GOALKEEPER,
  Defender: PlayerPosition.DEFENDER,
  Midfielder: PlayerPosition.MIDFIELDER,
  Forward: PlayerPosition.FORWARD
} as const;

type SquadImport = {
  code: string;
  slug: string;
  sourceUrl: string;
  players: Array<{
    name: string;
    position: keyof typeof positionMap;
  }>;
};

const squads = rawSquads as SquadImport[];

function shortName(name: string) {
  return name
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(-2)
    .join(" ");
}

async function getPredictionIntegritySnapshot() {
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

async function importSquad(squad: SquadImport) {
  const team = await prisma.team.findUnique({
    where: { code: squad.code },
    select: { id: true, code: true, name: true }
  });

  if (!team) {
    return { code: squad.code, skipped: true, reason: "team_not_found", count: 0 };
  }

  const activeSlots = squad.players.map((_, index) => index + 1);

  await prisma.$transaction(async (tx) => {
    await tx.player.updateMany({
      where: {
        teamId: team.id,
        slotNumber: {
          notIn: activeSlots
        }
      },
      data: {
        isActive: false
      }
    });

    for (const [index, player] of squad.players.entries()) {
      const slotNumber = index + 1;

      await tx.player.upsert({
        where: {
          teamId_slotNumber: {
            teamId: team.id,
            slotNumber
          }
        },
        update: {
          name: player.name,
          shortName: shortName(player.name),
          position: positionMap[player.position],
          isOfficial: true,
          isActive: true
        },
        create: {
          teamId: team.id,
          slotNumber,
          name: player.name,
          shortName: shortName(player.name),
          position: positionMap[player.position],
          isOfficial: true,
          isActive: true
        }
      });
    }

    await tx.auditLog.create({
      data: {
        action: "players.fifa_final_squad_imported",
        entityType: "Team",
        entityId: team.id,
        payload: {
          code: team.code,
          name: team.name,
          status: "final",
          sourceUrl: squad.sourceUrl,
          players: squad.players.length
        }
      }
    });
  });

  return {
    code: team.code,
    skipped: false,
    status: "final",
    count: squad.players.length
  };
}

async function main() {
  if (squads.length !== 48 || squads.some((squad) => squad.players.length !== 26)) {
    throw new Error("A coleta oficial precisa conter 48 selecoes com 26 jogadores cada.");
  }

  const predictionsBefore = await getPredictionIntegritySnapshot();
  const results = [];

  for (const squad of squads) {
    results.push(await importSquad(squad));
  }

  const predictionsAfter = await getPredictionIntegritySnapshot();

  if (
    predictionsBefore.count !== predictionsAfter.count ||
    predictionsBefore.hash !== predictionsAfter.hash
  ) {
    throw new Error("A integridade dos palpites mudou durante a importacao dos elencos.");
  }

  console.table(results);
  console.log({
    importedTeams: results.filter((result) => !result.skipped).length,
    importedPlayers: results.reduce((total, result) => total + result.count, 0),
    preservedPredictions: predictionsAfter.count,
    predictionIntegrityHash: predictionsAfter.hash
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
