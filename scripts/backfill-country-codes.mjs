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

const countryCodeByTeamCode = {
  BRA: "br",
  MEX: "mx",
  SUI: "ch",
  EGY: "eg",
  FRA: "fr",
  JPN: "jp",
  CAN: "ca",
  GHA: "gh",
  ARG: "ar",
  NED: "nl",
  KOR: "kr",
  NGA: "ng",
  ESP: "es",
  POR: "pt",
  USA: "us",
  ECU: "ec",
  ENG: "gb",
  URU: "uy",
  MAR: "ma",
  AUS: "au",
  GER: "de",
  COL: "co",
  SEN: "sn",
  CRC: "cr",
  ITA: "it",
  DEN: "dk",
  IRN: "ir",
  CMR: "cm",
  BEL: "be",
  CRO: "hr",
  PAR: "py",
  KSA: "sa",
  TUR: "tr",
  POL: "pl",
  ALG: "dz",
  PER: "pe",
  SWE: "se",
  CHI: "cl",
  TUN: "tn",
  NOR: "no",
  CZE: "cz",
  CIV: "ci",
  SCO: "gb",
  UAE: "ae",
  AUT: "at",
  GRE: "gr",
  MLI: "ml",
  NZL: "nz"
};

const env = readEnvFile(".env");
process.env.DATABASE_URL = env.DATABASE_URL;
process.env.DIRECT_URL = env.DIRECT_URL;

const prisma = new PrismaClient();

try {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      code: true,
      countryCode: true
    }
  });

  let updatedCount = 0;
  for (const team of teams) {
    const nextCountryCode = countryCodeByTeamCode[team.code];
    if (!nextCountryCode || team.countryCode === nextCountryCode) {
      continue;
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { countryCode: nextCountryCode }
    });
    updatedCount += 1;
  }

  console.log(`Country codes atualizados em ${updatedCount} selecoes.`);
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
