import assert from "node:assert/strict";
import { CardsEdge, CardsRange, Phase, PredictionOutcome } from "@prisma/client";
import {
  calculatePredictionScore,
  deriveCardsEdge,
  deriveCardsRange,
  deriveOutcome
} from "@/lib/scoring";

const basePrediction = {
  outcome: PredictionOutcome.HOME_WIN,
  score: { home: 2, away: 1 },
  scorers: ["vinicius", "rodrygo"],
  cardsEdge: CardsEdge.HOME,
  cardsRange: CardsRange.THREE_FOUR
};

const baseResult = {
  outcome: PredictionOutcome.HOME_WIN,
  score: { home: 2, away: 1 },
  scorers: ["vinicius", "rodrygo", "raphinha"],
  cardsEdge: CardsEdge.HOME,
  cardsRange: CardsRange.THREE_FOUR
};

function runCase(name: string, execute: () => void) {
  execute();
  console.log(`PASS ${name}`);
}

runCase("derive helpers classify scorelines and cards correctly", () => {
  assert.equal(deriveOutcome({ home: 3, away: 1 }), PredictionOutcome.HOME_WIN);
  assert.equal(deriveOutcome({ home: 1, away: 1 }), PredictionOutcome.DRAW);
  assert.equal(deriveOutcome({ home: 0, away: 2 }), PredictionOutcome.AWAY_WIN);

  assert.equal(deriveCardsRange(0), CardsRange.ZERO);
  assert.equal(deriveCardsRange(2), CardsRange.ONE_TWO);
  assert.equal(deriveCardsRange(4), CardsRange.THREE_FOUR);
  assert.equal(deriveCardsRange(6), CardsRange.FIVE_PLUS);

  assert.equal(deriveCardsEdge(4, 1), CardsEdge.HOME);
  assert.equal(deriveCardsEdge(2, 2), CardsEdge.EQUAL);
  assert.equal(deriveCardsEdge(1, 3), CardsEdge.AWAY);
});

runCase("scores only the winner when exact score, scorers and cards all miss", () => {
  const breakdown = calculatePredictionScore({
    prediction: {
      ...basePrediction,
      score: { home: 1, away: 0 },
      scorers: ["gabriel-jesus", "martinelli"],
      cardsEdge: CardsEdge.AWAY,
      cardsRange: CardsRange.ONE_TWO
    },
    result: baseResult,
    phase: Phase.GROUP_STAGE,
    streakBefore: 0
  });

  assert.deepEqual(breakdown, {
    base: 3,
    exactScore: 0,
    scorers: 0,
    cards: 0,
    comboBonus: 0,
    streakBonus: 0,
    multiplier: 1,
    total: 3,
    exactHit: false,
    winnerHit: true
  });
});

runCase("awards full base score, cards, scorers and combo on an exact hit", () => {
  const breakdown = calculatePredictionScore({
    prediction: basePrediction,
    result: baseResult,
    phase: Phase.GROUP_STAGE,
    streakBefore: 1
  });

  assert.deepEqual(breakdown, {
    base: 3,
    exactScore: 6,
    scorers: 6,
    cards: 6,
    comboBonus: 2,
    streakBonus: 0,
    multiplier: 1,
    total: 23,
    exactHit: true,
    winnerHit: true
  });
});

runCase("caps scorer points at two players even if more names overlap", () => {
  const breakdown = calculatePredictionScore({
    prediction: {
      ...basePrediction,
      scorers: ["vinicius", "rodrygo", "raphinha"]
    },
    result: baseResult,
    phase: Phase.GROUP_STAGE
  });

  assert.equal(breakdown.scorers, 6);
  assert.equal(breakdown.total, 23);
});

runCase("awards partial card points when only the card edge is correct", () => {
  const breakdown = calculatePredictionScore({
    prediction: {
      ...basePrediction,
      cardsRange: CardsRange.FIVE_PLUS
    },
    result: baseResult,
    phase: Phase.GROUP_STAGE
  });

  assert.equal(breakdown.cards, 2);
  assert.equal(breakdown.total, 19);
});

runCase("applies the 3-hit streak bonus when the winner streak reaches three", () => {
  const breakdown = calculatePredictionScore({
    prediction: {
      ...basePrediction,
      score: { home: 1, away: 0 },
      scorers: [],
      cardsEdge: CardsEdge.AWAY,
      cardsRange: CardsRange.ZERO
    },
    result: {
      ...baseResult,
      score: { home: 2, away: 0 },
      scorers: ["vinicius"],
      cardsEdge: CardsEdge.HOME,
      cardsRange: CardsRange.THREE_FOUR
    },
    phase: Phase.GROUP_STAGE,
    streakBefore: 2
  });

  assert.equal(breakdown.streakBonus, 2);
  assert.equal(breakdown.total, 5);
});

runCase("applies the 5-hit streak bonus and knockout multiplier together", () => {
  const breakdown = calculatePredictionScore({
    prediction: {
      ...basePrediction,
      score: { home: 1, away: 0 },
      scorers: [],
      cardsEdge: CardsEdge.EQUAL,
      cardsRange: CardsRange.ONE_TWO
    },
    result: {
      ...baseResult,
      score: { home: 3, away: 2 },
      scorers: ["vinicius"],
      cardsEdge: CardsEdge.AWAY,
      cardsRange: CardsRange.THREE_FOUR
    },
    phase: Phase.FINAL,
    streakBefore: 4
  });

  assert.equal(breakdown.base, 3);
  assert.equal(breakdown.streakBonus, 5);
  assert.equal(breakdown.multiplier, 2);
  assert.equal(breakdown.total, 16);
});

runCase("returns zero points when the predicted winner is wrong", () => {
  const breakdown = calculatePredictionScore({
    prediction: {
      ...basePrediction,
      outcome: PredictionOutcome.AWAY_WIN,
      score: { home: 0, away: 1 },
      scorers: [],
      cardsEdge: CardsEdge.EQUAL,
      cardsRange: CardsRange.ZERO
    },
    result: baseResult,
    phase: Phase.ROUND_OF_32,
    streakBefore: 4
  });

  assert.deepEqual(breakdown, {
    base: 0,
    exactScore: 0,
    scorers: 0,
    cards: 0,
    comboBonus: 0,
    streakBonus: 0,
    multiplier: 1.2,
    total: 0,
    exactHit: false,
    winnerHit: false
  });
});

console.log("Scoring validation completed successfully.");
