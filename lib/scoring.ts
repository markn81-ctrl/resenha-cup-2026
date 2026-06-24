import { CardsEdge, CardsRange, Phase, PredictionOutcome, type MatchResult, type Prediction, type Score } from "@prisma/client";
import { phaseMultipliers } from "@/lib/constants";

type ScoreablePrediction = Pick<Prediction, "outcome" | "cardsEdge" | "cardsRange" | "scorers"> & {
  score: Pick<Score, "home" | "away">;
};

type ScoreableResult = Pick<MatchResult, "outcome" | "cardsEdge" | "cardsRange" | "scorers"> & {
  score: Pick<Score, "home" | "away">;
};

export type ScoreBreakdown = {
  base: number;
  exactScore: number;
  scorers: number;
  cards: number;
  comboBonus: number;
  streakBonus: number;
  multiplier: number;
  total: number;
  exactHit: boolean;
  winnerHit: boolean;
};

export type StreakBonusRule = "LEGACY_CUMULATIVE" | "CYCLE_RESET";

export const STREAK_CYCLE_EFFECTIVE_MATCH_NUMBER = 48;

export function getStreakBonusRuleForMatch(matchNumber: number): StreakBonusRule {
  return matchNumber >= STREAK_CYCLE_EFFECTIVE_MATCH_NUMBER
    ? "CYCLE_RESET"
    : "LEGACY_CUMULATIVE";
}

export function calculateStreakBonus(args: {
  winnerHit: boolean;
  streakBefore?: number;
  rule?: StreakBonusRule;
}) {
  const streakBefore = args.streakBefore ?? 0;

  if (!args.winnerHit) {
    return {
      streakAfter: 0,
      bonus: 0
    };
  }

  const streak = streakBefore + 1;

  if (args.rule === "CYCLE_RESET") {
    if (streak === 5) {
      return {
        streakAfter: 0,
        bonus: 5
      };
    }

    return {
      streakAfter: streak,
      bonus: streak === 3 ? 2 : 0
    };
  }

  return {
    streakAfter: streak,
    bonus: streak >= 5 ? 5 : streak >= 3 ? 2 : 0
  };
}

export function normalizePlayerName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function countScorerHits(predictedScorers: string[], resultScorers: string[]) {
  const normalizedResultScorers = new Set(resultScorers.map(normalizePlayerName));

  return predictedScorers.filter((scorer) =>
    normalizedResultScorers.has(normalizePlayerName(scorer))
  ).length;
}

export function deriveOutcome(score: Pick<Score, "home" | "away">): PredictionOutcome {
  if (score.home > score.away) {
    return PredictionOutcome.HOME_WIN;
  }

  if (score.home < score.away) {
    return PredictionOutcome.AWAY_WIN;
  }

  return PredictionOutcome.DRAW;
}

export function deriveCardsRange(totalCards: number): CardsRange {
  if (totalCards === 0) {
    return CardsRange.ZERO;
  }

  if (totalCards <= 2) {
    return CardsRange.ONE_TWO;
  }

  if (totalCards <= 4) {
    return CardsRange.THREE_FOUR;
  }

  return CardsRange.FIVE_PLUS;
}

export function deriveCardsEdge(homeCards: number, awayCards: number): CardsEdge {
  if (homeCards > awayCards) {
    return CardsEdge.HOME;
  }

  if (homeCards < awayCards) {
    return CardsEdge.AWAY;
  }

  return CardsEdge.EQUAL;
}

export function calculatePredictionScore(args: {
  prediction: ScoreablePrediction;
  result: ScoreableResult;
  phase: Phase;
  streakBefore?: number;
  streakRule?: StreakBonusRule;
}): ScoreBreakdown {
  const winnerHit = args.prediction.outcome === args.result.outcome;
  const exactHit =
    args.prediction.score.home === args.result.score.home &&
    args.prediction.score.away === args.result.score.away;

  const scorerHits = countScorerHits(args.prediction.scorers, args.result.scorers);

  const cardsEdgeHit = args.prediction.cardsEdge === args.result.cardsEdge;
  const cardsRangeHit = args.prediction.cardsRange === args.result.cardsRange;

  const base = winnerHit ? 3 : 0;
  const exactScore = exactHit ? 6 : 0;
  const scorers = Math.min(scorerHits, 2) * 3;
  const cards = (cardsEdgeHit ? 2 : 0) + (cardsRangeHit ? 2 : 0) + (cardsEdgeHit && cardsRangeHit ? 2 : 0);
  const comboBonus = winnerHit && exactHit ? 2 : 0;
  const streakBonus = calculateStreakBonus({
    winnerHit,
    streakBefore: args.streakBefore,
    rule: args.streakRule
  }).bonus;
  const rawTotal = base + exactScore + scorers + cards + comboBonus + streakBonus;
  const multiplier = phaseMultipliers[args.phase];
  const total = Number((rawTotal * multiplier).toFixed(1));

  return {
    base,
    exactScore,
    scorers,
    cards,
    comboBonus,
    streakBonus,
    multiplier,
    total,
    exactHit,
    winnerHit
  };
}
