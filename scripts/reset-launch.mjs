import fs from "node:fs";
import path from "node:path";
import { ApprovalStatus, PrismaClient, Role } from "@prisma/client";

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
const emailsFromArgs = process.argv.slice(2).map((value) => value.trim()).filter(Boolean);
const emailsFromEnv = (env.LAUNCH_ADMIN_EMAIL ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const keepEmails = Array.from(new Set([...emailsFromEnv, ...emailsFromArgs]));

try {
  const admins = await prisma.user.findMany({
    where: {
      OR: [
        { role: Role.ADMIN },
        keepEmails.length ? { email: { in: keepEmails } } : undefined
      ].filter(Boolean)
    }
  });

  const keepUserIds = admins.map((user) => user.id);
  const keepSummary = admins.map((user) => user.email ?? user.id);

  await prisma.$transaction(async (tx) => {
    await tx.like.deleteMany();
    await tx.comment.deleteMany();
    await tx.feedPost.deleteMany();
    await tx.notification.deleteMany();
    await tx.playerStatus.deleteMany();
    await tx.leaderboard.deleteMany();
    await tx.rivalry.deleteMany();
    await tx.matchResult.deleteMany();
    await tx.prediction.deleteMany();
    await tx.score.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.session.deleteMany();

    if (keepUserIds.length) {
      await tx.account.deleteMany({
        where: {
          userId: {
            notIn: keepUserIds
          }
        }
      });

      await tx.user.deleteMany({
        where: {
          id: {
            notIn: keepUserIds
          }
        }
      });

      await tx.user.updateMany({
        where: {
          id: {
            in: keepUserIds
          }
        },
        data: {
          approvalStatus: ApprovalStatus.APPROVED
        }
      });
    } else {
      await tx.account.deleteMany();
      await tx.user.deleteMany();
    }

    await tx.match.updateMany({
      data: {
        status: "SCHEDULED"
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: keepUserIds[0] ?? null,
        action: "launch.reset.completed",
        entityType: "System",
        entityId: "launch-reset",
        payload: {
          keptAdmins: keepSummary,
          keptCount: keepUserIds.length
        }
      }
    });
  });

  console.log(
    keepSummary.length
      ? `Reset de lancamento concluido. Admins preservados: ${keepSummary.join(", ")}`
      : "Reset de lancamento concluido. Nenhum usuario foi preservado."
  );
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
