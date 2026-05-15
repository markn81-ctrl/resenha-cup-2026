import { LeaderboardScope, MatchStatus, type CardsEdge, type CardsRange, type MatchResult, type Phase, type Prediction, type PredictionOutcome, type Score } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePredictionScore } from "@/lib/scoring";
import type { CommentaryInput } from "@/lib/ai";

type ScoreWithScore = Pick<Prediction, "outcome" | "cardsEdge" | "cardsRange" | "scorers"> & {
  score: Pick<Score, "home" | "away">;
};

type ResultWithScore = Pick<MatchResult, "outcome" | "cardsEdge" | "cardsRange" | "scorers"> & {
  score: Pick<Score, "home" | "away">;
};

function uniqueNames(values: string[]) {
  return [...new Set(values)].slice(0, 5);
}

function buildHeadline(args: {
  biggestRise?: string | null;
  biggestFall?: string | null;
  exactScoreHits: string[];
  pointsGap?: number | null;
}) {
  if (args.exactScoreHits.length) {
    return "Teve gente cravando bonito nessa rodada";
  }

  if (args.biggestRise) {
    return `${args.biggestRise} baguncou a tabela`;
  }

  if (args.pointsGap !== null && args.pointsGap !== undefined && args.pointsGap <= 3) {
    return "O topo da tabela ta no detalhe";
  }

  if (args.biggestFall) {
    return `${args.biggestFall} sentiu a rodada`;
  }

  return "Rodada pegando fogo";
}

export async function buildAutomaticCommentary(scope: LeaderboardScope = LeaderboardScope.OVERALL): Promise<CommentaryInput> {
  const [leaderboardRows, recentMatches] = await Promise.all([
    prisma.leaderboard.findMany({
      where: { scope },
      include: { user: true },
      orderBy: [{ rankPosition: "asc" }],
      take: 5
    }),
    prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        result: {
          isNot: null
        }
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        result: {
          include: { score: true }
        },
        predictions: {
          include: {
            user: true,
            score: true
          }
        }
      },
      orderBy: { startsAt: "desc" },
      take: 6
    })
  ]);

  const top3 = leaderboardRows.slice(0, 3).map((row) => row.user.name ?? row.user.username ?? "Participante");
  const biggestRiseRow = [...leaderboardRows]
    .filter((row) => row.movement > 0)
    .sort((a, b) => b.movement - a.movement)[0];
  const biggestFallRow = [...leaderboardRows]
    .filter((row) => row.movement < 0)
    .sort((a, b) => a.movement - b.movement)[0];

  const exactScoreHits: string[] = [];
  const totalMisses: string[] = [];
  const recentPoints = new Map<string, number>();
  const recentWinnerMatrix = new Map<string, boolean[]>();
  const matchResults: string[] = [];

  for (const match of [...recentMatches].reverse()) {
    if (!match.result) {
      continue;
    }

    const homeName = match.homeTeam?.name ?? match.homePlaceholder ?? "Time A";
    const awayName = match.awayTeam?.name ?? match.awayPlaceholder ?? "Time B";
    matchResults.push(`${homeName} ${match.result.score.home} x ${match.result.score.away} ${awayName}`);

    for (const prediction of match.predictions) {
      const breakdown = calculatePredictionScore({
        prediction: {
          outcome: prediction.outcome as PredictionOutcome,
          cardsEdge: prediction.cardsEdge as CardsEdge,
          cardsRange: prediction.cardsRange as CardsRange,
          scorers: prediction.scorers,
          score: prediction.score
        } satisfies ScoreWithScore,
        result: {
          outcome: match.result.outcome as PredictionOutcome,
          cardsEdge: match.result.cardsEdge as CardsEdge,
          cardsRange: match.result.cardsRange as CardsRange,
          scorers: match.result.scorers,
          score: match.result.score
        } satisfies ResultWithScore,
        phase: match.phase as Phase
      });

      const displayName = prediction.user.name ?? prediction.user.username ?? "Participante";
      recentPoints.set(displayName, (recentPoints.get(displayName) ?? 0) + breakdown.total);
      recentWinnerMatrix.set(displayName, [...(recentWinnerMatrix.get(displayName) ?? []), breakdown.winnerHit]);

      if (breakdown.exactHit) {
        exactScoreHits.push(displayName);
      }

      if (breakdown.total === 0) {
        totalMisses.push(displayName);
      }
    }
  }

  const hotStreaks = [...recentPoints.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name, points]) => `${name} somou ${points} pts nas ultimas partidas`);

  const coldStreaks = [...recentPoints.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([name, points]) => `${name} penou e fez so ${points} pts recentemente`);

  const streak: Record<string, number> = {};
  for (const [name, results] of recentWinnerMatrix.entries()) {
    let consecutive = 0;
    for (let index = results.length - 1; index >= 0; index -= 1) {
      if (!results[index]) {
        break;
      }
      consecutive += 1;
    }

    if (consecutive >= 2) {
      streak[name] = consecutive;
    }
  }

  const pointsGap =
    leaderboardRows.length >= 2
      ? leaderboardRows[0].totalPoints - leaderboardRows[1].totalPoints
      : null;

  const rankingChanges = [
    biggestRiseRow
      ? `${biggestRiseRow.user.name ?? biggestRiseRow.user.username} subiu ${biggestRiseRow.movement} posicoes`
      : null,
    biggestFallRow
      ? `${biggestFallRow.user.name ?? biggestFallRow.user.username} caiu ${Math.abs(biggestFallRow.movement)} posicoes`
      : null,
    pointsGap !== null ? `A diferenca no topo esta em ${pointsGap} ponto(s)` : null
  ].filter(Boolean) as string[];

  return {
    scope,
    headline: buildHeadline({
      biggestRise: biggestRiseRow?.user.name ?? biggestRiseRow?.user.username ?? null,
      biggestFall: biggestFallRow?.user.name ?? biggestFallRow?.user.username ?? null,
      exactScoreHits: uniqueNames(exactScoreHits),
      pointsGap
    }),
    top3,
    biggestRise: biggestRiseRow?.user.name ?? biggestRiseRow?.user.username ?? null,
    biggestFall: biggestFallRow?.user.name ?? biggestFallRow?.user.username ?? null,
    exactScoreHits: uniqueNames(exactScoreHits),
    totalMisses: uniqueNames(totalMisses),
    streak,
    rankingChanges,
    hotStreaks,
    coldStreaks,
    currentRanking: leaderboardRows.map((row) => ({
      name: row.user.name ?? row.user.username ?? "Participante",
      position: row.rankPosition,
      points: row.totalPoints
    })),
    matchResults,
    matchSummary: matchResults.length
      ? `Ultimos resultados: ${matchResults.slice(0, 3).join(" | ")}`
      : "Ainda sem jogos finalizados para comentar."
  };
}
