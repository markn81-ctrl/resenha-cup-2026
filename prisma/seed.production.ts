import { PrismaClient } from "@prisma/client";
import { buildTeamPlayerSlots, buildTournamentMatches, groups } from "./tournament-data";

const prisma = new PrismaClient();

async function main() {
  const resetGameplay = process.argv.includes("--reset-gameplay");
  const [existingPredictions, existingResults] = await Promise.all([
    prisma.prediction.count(),
    prisma.matchResult.count()
  ]);

  if (existingPredictions > 0 || existingResults > 0) {
    if (!resetGameplay) {
      throw new Error(
        "O banco ja possui palpites ou resultados. Para proteger a operacao, rode novamente com --reset-gameplay se quiser limpar apenas dados de jogo e aplicar a tabela oficial."
      );
    }

    await prisma.$transaction([
      prisma.matchResult.deleteMany(),
      prisma.prediction.deleteMany(),
      prisma.leaderboard.deleteMany(),
      prisma.playerStatus.deleteMany(),
      prisma.rivalry.deleteMany(),
      prisma.score.deleteMany({
        where: {
          prediction: null,
          matchResult: null
        }
      })
    ]);
  }

  const officialTeamCodes = Object.values(groups).flatMap((groupTeams) =>
    groupTeams.map((team) => team.code)
  );

  for (const [groupKey, teams] of Object.entries(groups)) {
    for (const [index, team] of teams.entries()) {
      await prisma.team.upsert({
        where: { code: team.code },
        update: {
          name: team.name,
          shortName: team.shortName,
          countryCode: team.countryCode,
          flagEmoji: team.flagEmoji,
          groupKey,
          seedNumber: index + 1,
          isPlaceholder: false
        },
        create: {
          code: team.code,
          name: team.name,
          shortName: team.shortName,
          countryCode: team.countryCode,
          flagEmoji: team.flagEmoji,
          groupKey,
          seedNumber: index + 1,
          isPlaceholder: false
        }
      });
    }
  }

  const createdTeams = await prisma.team.findMany({
    where: {
      code: {
        in: officialTeamCodes
      }
    }
  });

  await prisma.player.createMany({
    data: createdTeams.flatMap((team) =>
      buildTeamPlayerSlots({
        teamId: team.id,
        teamShortName: team.shortName
      })
    ),
    skipDuplicates: true
  });

  const teamIdByCode = new Map(createdTeams.map((team) => [team.code, team.id]));
  const matches = buildTournamentMatches(teamIdByCode);

  for (const match of matches) {
    await prisma.match.upsert({
      where: { number: match.number },
      update: {
        slug: match.slug,
        phase: match.phase,
        groupKey: match.groupKey ?? null,
        startsAt: match.startsAt,
        lockAt: match.lockAt,
        venue: match.venue ?? null,
        city: match.city ?? null,
        country: match.country ?? null,
        homeTeamId: match.homeTeamId ?? null,
        awayTeamId: match.awayTeamId ?? null,
        homePlaceholder: match.homePlaceholder ?? null,
        awayPlaceholder: match.awayPlaceholder ?? null
      },
      create: {
        number: match.number,
        slug: match.slug,
        phase: match.phase,
        groupKey: match.groupKey ?? null,
        startsAt: match.startsAt,
        lockAt: match.lockAt,
        venue: match.venue ?? null,
        city: match.city ?? null,
        country: match.country ?? null,
        homeTeamId: match.homeTeamId ?? null,
        awayTeamId: match.awayTeamId ?? null,
        homePlaceholder: match.homePlaceholder ?? null,
        awayPlaceholder: match.awayPlaceholder ?? null
      }
    });
  }

  await prisma.team.deleteMany({
    where: {
      code: {
        notIn: officialTeamCodes
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: null,
      action: "seed.production.completed",
      entityType: "System",
      entityId: "production-bootstrap",
      payload: {
        teams: createdTeams.length,
        matches: matches.length,
        source: "official-fifa-2026-schedule"
      }
    }
  });

  console.log(`Seed de producao concluido com ${createdTeams.length} selecoes e ${matches.length} jogos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
