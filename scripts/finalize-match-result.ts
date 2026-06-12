import { CardsEdge, CardsRange } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { finalizeMatchResult } from "../lib/result-finalization";

async function main() {
  const [matchNumberRaw, homeRaw, awayRaw, cardsEdgeRaw, cardsRangeRaw, scorersRaw = ""] =
    process.argv.slice(2);
  const matchNumber = Number(matchNumberRaw);
  const home = Number(homeRaw);
  const away = Number(awayRaw);

  if (
    !Number.isInteger(matchNumber) ||
    !Number.isInteger(home) ||
    !Number.isInteger(away) ||
    !Object.values(CardsEdge).includes(cardsEdgeRaw as CardsEdge) ||
    !Object.values(CardsRange).includes(cardsRangeRaw as CardsRange)
  ) {
    throw new Error(
      "Uso: npm run finalize:result -- <jogo> <casa> <fora> <HOME|AWAY|EQUAL> <ZERO|ONE_TWO|THREE_FOUR|FIVE_PLUS> \"Artilheiro 1,Artilheiro 2\""
    );
  }

  const match = await prisma.match.findUnique({
    where: { number: matchNumber },
    select: { id: true }
  });

  if (!match) {
    throw new Error(`Jogo ${matchNumber} nao encontrado.`);
  }

  const result = await finalizeMatchResult({
    matchId: match.id,
    score: { home, away },
    scorers: scorersRaw
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
    cardsEdge: cardsEdgeRaw as CardsEdge,
    cardsRange: cardsRangeRaw as CardsRange
  });

  console.log(result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
