import fs from "node:fs";
import path from "node:path";
import { PrismaClient, ApprovalStatus, Role } from "@prisma/client";

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
  console.error("Uso: node scripts/promote-admin.mjs email@dominio.com");
  process.exit(1);
}

const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

try {
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: {
          role: Role.ADMIN,
          approvalStatus: ApprovalStatus.APPROVED,
          username: existing.username ?? username
        }
      })
    : await prisma.user.create({
        data: {
          email,
          name: "Mark",
          username,
          role: Role.ADMIN,
          approvalStatus: ApprovalStatus.APPROVED
        }
      });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.promoted.admin",
      entityType: "User",
      entityId: user.id,
      payload: { email }
    }
  });

  console.log(`Conta ${email} pronta como ADMIN aprovado.`);
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
