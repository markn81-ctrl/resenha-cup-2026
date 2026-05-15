import fs from "node:fs";
import path from "node:path";

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

const { syncRivalries } = await import("../lib/rivalries.ts");
const { LeaderboardScope } = await import("@prisma/client");

try {
  const scopes = [
    LeaderboardScope.OVERALL,
    LeaderboardScope.GROUP_STAGE,
    LeaderboardScope.KNOCKOUT
  ];

  for (const scope of scopes) {
    const rows = await syncRivalries(scope);
    console.log(`Rivalidades sincronizadas em ${scope}: ${rows.length}`);
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
