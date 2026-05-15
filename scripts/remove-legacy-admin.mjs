import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function readEnvFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const entries = raw
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#"))
    .map((line) => {
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");
      return [key, value];
    });

  return Object.fromEntries(entries);
}

const env = readEnvFile(".env");
process.env.DATABASE_URL = env.DATABASE_URL;
process.env.DIRECT_URL = env.DIRECT_URL;

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
  console.error("Uso: node scripts/remove-legacy-admin.mjs email@dominio.com");
  process.exit(1);
}

try {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
      sessions: true,
      predictions: true,
      feedPosts: true,
      comments: true,
      likes: true,
      notifications: true,
      playerStatuses: true,
      leaderboardRows: true,
      auditLogs: true
    }
  });

  if (!user) {
    console.log(`Nenhuma conta encontrada para ${email}.`);
    process.exit(0);
  }

  await prisma.$transaction(async (tx) => {
    await tx.account.deleteMany({ where: { userId: user.id } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.prediction.deleteMany({ where: { userId: user.id } });
    await tx.feedPost.deleteMany({ where: { authorId: user.id } });
    await tx.comment.deleteMany({ where: { authorId: user.id } });
    await tx.like.deleteMany({ where: { userId: user.id } });
    await tx.notification.deleteMany({ where: { userId: user.id } });
    await tx.playerStatus.deleteMany({ where: { userId: user.id } });
    await tx.leaderboard.deleteMany({ where: { userId: user.id } });
    await tx.auditLog.updateMany({
      where: { actorId: user.id },
      data: { actorId: null }
    });
    await tx.user.delete({ where: { id: user.id } });
  });

  console.log(`Conta legada removida: ${email}`);
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
