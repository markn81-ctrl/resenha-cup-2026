import bcrypt from "bcryptjs";
import {
  ApprovalStatus,
  FeedPostType,
  LeaderboardScope,
  NotificationType,
  PlayerTier,
  PrismaClient,
  Role
} from "@prisma/client";
import { buildTeamPlayerSlots, buildTournamentMatches, groups } from "./tournament-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.feedPost.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.playerStatus.deleteMany();
  await prisma.leaderboard.deleteMany();
  await prisma.rivalry.deleteMany();
  await prisma.matchResult.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.score.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();

  const playerPassword = await bcrypt.hash("Senha12345!", 10);

  const seededUsers = await Promise.all(
    [
      ["Joao Martins", "joaom", "joao@resenhacup.local"],
      ["Carla Dias", "carlad", "carla@resenhacup.local"],
      ["Bruno Costa", "brunoc", "bruno@resenhacup.local"],
      ["Marina Alves", "marina", "marina@resenhacup.local"],
      ["Pedro Lima", "pedrol", "pedro@resenhacup.local"]
    ].map(([name, username, email]) =>
      prisma.user.create({
        data: {
          name,
          username,
          email,
          passwordHash: playerPassword,
          role: Role.USER,
          approvalStatus: ApprovalStatus.APPROVED
        }
      })
    )
  );

  const pendingUser = await prisma.user.create({
    data: {
      name: "Rafa Nunes",
      username: "rafa_n",
      email: "rafa@resenhacup.local",
      passwordHash: playerPassword,
      role: Role.USER,
      approvalStatus: ApprovalStatus.PENDING
    }
  });

  const createdTeams = await Promise.all(
    Object.entries(groups).flatMap(([groupKey, teams]) =>
      teams.map((team, index) =>
        prisma.team.create({
          data: {
            ...team,
            groupKey,
            seedNumber: index + 1
          }
        })
      )
    )
  );

  await prisma.player.createMany({
    data: createdTeams.flatMap((team) =>
      buildTeamPlayerSlots({
        teamId: team.id,
        teamShortName: team.shortName
      })
    )
  });

  const teamIdByCode = new Map(createdTeams.map((team) => [team.code, team.id]));
  const matches = buildTournamentMatches(teamIdByCode);

  await prisma.match.createMany({ data: matches });

  const leaderboardSeeds = [
    { user: seededUsers[0], points: 148, exact: 8, winners: 21, scorers: 13, movement: 2, tier: PlayerTier.LEGENDARY },
    { user: seededUsers[1], points: 142, exact: 7, winners: 20, scorers: 12, movement: -1, tier: PlayerTier.LEGENDARY },
    { user: seededUsers[2], points: 139, exact: 7, winners: 19, scorers: 10, movement: 1, tier: PlayerTier.GOOD },
    { user: seededUsers[3], points: 131, exact: 6, winners: 17, scorers: 11, movement: 0, tier: PlayerTier.GOOD },
    { user: seededUsers[4], points: 128, exact: 5, winners: 17, scorers: 9, movement: 3, tier: PlayerTier.GOOD }
  ];

  for (const scope of [LeaderboardScope.OVERALL, LeaderboardScope.GROUP_STAGE, LeaderboardScope.KNOCKOUT]) {
    for (const [index, seed] of leaderboardSeeds.entries()) {
      const points =
        scope === LeaderboardScope.OVERALL
          ? seed.points
          : scope === LeaderboardScope.GROUP_STAGE
            ? seed.points - 22
            : 22 + index * 2;

      await prisma.leaderboard.create({
        data: {
          userId: seed.user.id,
          scope,
          totalPoints: points,
          exactScores: seed.exact,
          correctWinners: seed.winners,
          correctScorers: seed.scorers,
          rankPosition: index + 1,
          previousPosition: Math.max(1, index + 1 - seed.movement),
          movement: seed.movement,
          pointsToNext: index === 0 ? null : leaderboardSeeds[index - 1].points - points
        }
      });

      await prisma.playerStatus.create({
        data: {
          userId: seed.user.id,
          scope,
          tier: seed.tier,
          percentile: (index + 1) / leaderboardSeeds.length,
          rankPosition: index + 1,
          colorHex:
            seed.tier === PlayerTier.LEGENDARY
              ? "#34d399"
              : seed.tier === PlayerTier.GOOD
                ? "#38bdf8"
                : "#facc15"
        }
      });
    }
  }

  await prisma.feedPost.createMany({
    data: [
      {
        type: FeedPostType.AI_COMMENTARY,
        title: "Rodada pegando fogo",
        content:
          "Joao assumiu a ponta na marra e deixou a mesa toda olhando o retrovisor. Carlos escorregou feio hoje, mas a Copa ta longe de acabar."
      },
      {
        type: FeedPostType.SYSTEM_EVENT,
        title: "Palpites do jogo 19 fecham hoje",
        content:
          "Brasil x Mexico trava automaticamente duas horas antes da bola rolar. Quem bobear vai ver a rodada do banco."
      },
      {
        type: FeedPostType.USER_POST,
        authorId: seededUsers[3].id,
        content: "Alguem explica como o Pedro acerta marcador improvavel e erra o vencedor no mesmo jogo?"
      }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: seededUsers[0].id,
        type: NotificationType.RANKING_CHANGE,
        title: "Voce assumiu a lideranca",
        body: "A rodada foi sua. Agora o desafio e sustentar a bronca.",
        href: "/leaderboard"
      },
      {
        userId: pendingUser.id,
        type: NotificationType.ACCESS_PENDING,
        title: "Conta aguardando aprovacao",
        body: "Assim que o admin liberar, seu dashboard sera ativado.",
        href: "/pending"
      }
    ]
  });

  await prisma.auditLog.create({
    data: {
      actorId: null,
      action: "seed.completed",
      entityType: "System",
      entityId: "bootstrap",
      payload: {
        teams: createdTeams.length,
        players: createdTeams.length * 26,
        matches: matches.length,
        users: seededUsers.length + 1
      }
    }
  });

  console.log(
    `Seed demo concluido com ${createdTeams.length} selecoes, ${createdTeams.length * 26} jogadores e ${matches.length} jogos.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
