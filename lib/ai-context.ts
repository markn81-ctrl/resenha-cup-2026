import { FeedPostType, LeaderboardScope, MatchStatus, Phase, type CardsEdge, type CardsRange, type MatchResult, type Prediction, type PredictionOutcome, type Score } from "@prisma/client";
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

function displayName(row: { user: { name?: string | null; username?: string | null } }) {
  return row.user.name ?? row.user.username ?? "Participante";
}

function buildRankingBattles(
  rows: Array<{
    rankPosition: number;
    totalPoints: number;
    user: { name?: string | null; username?: string | null };
  }>
) {
  return rows
    .slice(1)
    .map((row, index) => {
      const previous = rows[index];
      const gap = previous.totalPoints - row.totalPoints;

      return {
        gap,
        label:
          gap === 0
            ? `${displayName(row)} tem os mesmos pontos de ${displayName(previous)} na briga #${previous.rankPosition} x #${row.rankPosition}`
            : `${displayName(row)} esta a ${gap} ponto(s) de ${displayName(previous)} na briga #${previous.rankPosition} x #${row.rankPosition}`
      };
    })
    .filter((item) => item.gap >= 0 && item.gap <= 12)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 5)
    .map((item) => item.label);
}

function buildBottomWatch(
  rows: Array<{
    rankPosition: number;
    totalPoints: number;
    user: { name?: string | null; username?: string | null };
  }>
) {
  const bottomRows = rows.slice(Math.max(0, rows.length - 5));

  return bottomRows.map((row, index) => {
    const previous = bottomRows[index - 1] ?? rows[row.rankPosition - 2];
    const gap = previous ? previous.totalPoints - row.totalPoints : 0;
    return gap > 0
      ? `${displayName(row)} esta em #${row.rankPosition}, a ${gap} ponto(s) de encostar em ${displayName(previous)}`
      : `${displayName(row)} esta em #${row.rankPosition} com ${row.totalPoints} ponto(s) e precisa de uma rodada de reacao`;
  });
}

function matchTitle(match: {
  number: number;
  homeTeam?: { name: string } | null;
  awayTeam?: { name: string } | null;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
}) {
  const homeName = match.homeTeam?.name ?? match.homePlaceholder ?? "Time A";
  const awayName = match.awayTeam?.name ?? match.awayPlaceholder ?? "Time B";

  return `Jogo ${match.number}: ${homeName} x ${awayName}`;
}

function buildMatchStatusLabel(status: MatchStatus, lockAt: Date, now: Date) {
  if (status === MatchStatus.FINISHED) {
    return "finalizado";
  }

  return lockAt <= now ? "travado aguardando resultado" : "aberto para palpites";
}

function pickFocus(dateKey: string, recentPosts: string[]) {
  const focusOptions = [
    "briga pela lideranca",
    "perseguidores do top 3",
    "duelos do meio da tabela",
    "recuperacao do fundo da tabela",
    "ultimos resultados",
    "proximos palpites decisivos"
  ];
  const seed =
    [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0) + recentPosts.length;

  return focusOptions[seed % focusOptions.length];
}

function buildAvoidTerms(recentPosts: string[]) {
  const watchedTerms = [
    "auditoria",
    "cravou bonito",
    "ta voando",
    "voando baixo",
    "sumiu",
    "virou novela"
  ];
  const normalizedPosts = recentPosts.map((post) =>
    post
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  );

  return watchedTerms.filter((term) => {
    const normalizedTerm = term
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return normalizedPosts.filter((post) => post.includes(normalizedTerm)).length >= 2;
  });
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

function getPhaseFilter(scope: LeaderboardScope) {
  if (scope === LeaderboardScope.GROUP_STAGE) {
    return { phase: Phase.GROUP_STAGE };
  }

  if (scope === LeaderboardScope.KNOCKOUT) {
    return {
      phase: {
        not: Phase.GROUP_STAGE
      }
    };
  }

  return {};
}

export async function buildAutomaticCommentary(scope: LeaderboardScope = LeaderboardScope.OVERALL): Promise<CommentaryInput> {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const now = new Date();
  const phaseFilter = getPhaseFilter(scope);
  const [leaderboardRows, recentMatches, currentMatches, upcomingMatches, recentPredictions, recentAiPosts] = await Promise.all([
    prisma.leaderboard.findMany({
      where: { scope },
      include: { user: true },
      orderBy: [{ rankPosition: "asc" }],
      take: 30
    }),
    prisma.match.findMany({
      where: {
        ...phaseFilter,
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
    }),
    prisma.match.findMany({
      where: {
        ...phaseFilter,
        OR: [
          {
            startsAt: {
              gte: new Date(now.getTime() - 12 * 60 * 60 * 1000),
              lte: new Date(now.getTime() + 12 * 60 * 60 * 1000)
            }
          },
          {
            status: MatchStatus.FINISHED,
            result: {
              isNot: null
            }
          }
        ]
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        result: {
          include: { score: true }
        },
        _count: {
          select: { predictions: true }
        }
      },
      orderBy: { startsAt: "desc" },
      take: 6
    }),
    prisma.match.findMany({
      where: {
        ...phaseFilter,
        status: { not: MatchStatus.FINISHED },
        lockAt: {
          gt: now
        }
      },
      include: {
        homeTeam: true,
        awayTeam: true
      },
      orderBy: { startsAt: "asc" },
      take: 4
    }),
    prisma.prediction.findMany({
      where: {
        updatedAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        },
        match: phaseFilter
      },
      include: {
        user: true,
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            result: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 8
    }),
    prisma.feedPost.findMany({
      where: { type: FeedPostType.AI_COMMENTARY },
      orderBy: { createdAt: "desc" },
      select: { content: true },
      take: 8
    })
  ]);

  const top3 = leaderboardRows.slice(0, 3).map((row) => displayName(row));
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

      const predictionUserName = prediction.user.name ?? prediction.user.username ?? "Participante";
      recentPoints.set(predictionUserName, (recentPoints.get(predictionUserName) ?? 0) + breakdown.total);
      recentWinnerMatrix.set(predictionUserName, [...(recentWinnerMatrix.get(predictionUserName) ?? []), breakdown.winnerHit]);

      if (breakdown.exactHit) {
        exactScoreHits.push(predictionUserName);
      }

      if (breakdown.total === 0) {
        totalMisses.push(predictionUserName);
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
      ? `${displayName(biggestRiseRow)} subiu ${biggestRiseRow.movement} posicoes`
      : null,
    biggestFallRow
      ? `${displayName(biggestFallRow)} caiu ${Math.abs(biggestFallRow.movement)} posicoes`
      : null,
    pointsGap !== null ? `A diferenca no topo esta em ${pointsGap} ponto(s)` : null
  ].filter(Boolean) as string[];
  const recentPosts = recentAiPosts.map((post) => post.content);
  const rankingBattles = buildRankingBattles(leaderboardRows);
  const bottomWatch = buildBottomWatch(leaderboardRows);
  const currentMatchLabels = currentMatches.map((match) => {
    const statusLabel = buildMatchStatusLabel(match.status, match.lockAt, now);
    const resultLabel = match.result
      ? `resultado ${match.result.score.home} x ${match.result.score.away}`
      : `${match._count.predictions} palpite(s) registrado(s)`;

    return `${matchTitle(match)} esta ${statusLabel}, ${resultLabel}`;
  });
  const upcomingMatchLabels = upcomingMatches.map((match) => matchTitle(match));
  const latestPredictionHighlights = recentPredictions.map((prediction) => {
    const playerName = prediction.user.name ?? prediction.user.username ?? "Participante";
    const hiddenPickLabel = prediction.match.result
      ? "ja virou historico de pontuacao"
      : "entrou na fila sem abrir o placar para a concorrencia";

    return `${playerName} mexeu em palpite do ${matchTitle(prediction.match)}; ${hiddenPickLabel}`;
  });

  return {
    scope,
    headline: buildHeadline({
      biggestRise: biggestRiseRow ? displayName(biggestRiseRow) : null,
      biggestFall: biggestFallRow ? displayName(biggestFallRow) : null,
      exactScoreHits: uniqueNames(exactScoreHits),
      pointsGap
    }),
    top3,
    biggestRise: biggestRiseRow ? displayName(biggestRiseRow) : null,
    biggestFall: biggestFallRow ? displayName(biggestFallRow) : null,
    exactScoreHits: uniqueNames(exactScoreHits),
    totalMisses: uniqueNames(totalMisses),
    streak,
    rankingChanges,
    rankingBattles,
    bottomWatch,
    currentMatches: currentMatchLabels,
    upcomingMatches: upcomingMatchLabels,
    latestPredictionHighlights,
    hotStreaks,
    coldStreaks,
    currentRanking: leaderboardRows.map((row) => ({
      name: displayName(row),
      position: row.rankPosition,
      points: row.totalPoints
    })),
    matchResults,
    matchSummary: matchResults.length
      ? `Ultimos resultados: ${matchResults.slice(0, 3).join(" | ")}`
      : "Ainda sem jogos finalizados para comentar.",
    recentPosts,
    avoidTerms: buildAvoidTerms(recentPosts),
    focus: pickFocus(dateKey, recentPosts)
  };
}
