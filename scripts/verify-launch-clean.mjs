import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function readEnvFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const entries = raw
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
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

try {
  const [users, posts, predictions, leaderboard, results, notifications] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: "asc" },
      select: {
        email: true,
        role: true,
        approvalStatus: true
      }
    }),
    prisma.feedPost.count(),
    prisma.prediction.count(),
    prisma.leaderboard.count(),
    prisma.matchResult.count(),
    prisma.notification.count()
  ]);

  console.log(
    JSON.stringify(
      {
        users,
        posts,
        predictions,
        leaderboard,
        results,
        notifications
      },
      null,
      2
    )
  );
} finally {
  await prisma.$disconnect();
}
