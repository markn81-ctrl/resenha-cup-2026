import assert from "node:assert/strict";

const Phase = {
  GROUP_STAGE: "GROUP_STAGE",
  ROUND_OF_32: "ROUND_OF_32",
  ROUND_OF_16: "ROUND_OF_16",
  QUARTER_FINAL: "QUARTER_FINAL",
  SEMI_FINAL: "SEMI_FINAL",
  THIRD_PLACE: "THIRD_PLACE",
  FINAL: "FINAL"
};

const PredictionOutcome = {
  HOME_WIN: "HOME_WIN",
  DRAW: "DRAW",
  AWAY_WIN: "AWAY_WIN"
};

const CardsEdge = {
  HOME: "HOME",
  AWAY: "AWAY",
  EQUAL: "EQUAL"
};

const CardsRange = {
  ZERO: "ZERO",
  ONE_TWO: "ONE_TWO",
  THREE_FOUR: "THREE_FOUR",
  FIVE_PLUS: "FIVE_PLUS"
};

const phaseMultipliers = {
  GROUP_STAGE: 1,
  ROUND_OF_32: 1.2,
  ROUND_OF_16: 1.3,
  QUARTER_FINAL: 1.4,
  SEMI_FINAL: 1.6,
  THIRD_PLACE: 1.3,
  FINAL: 2
};

function deriveOutcome(score) {
  if (score.home > score.away) return PredictionOutcome.HOME_WIN;
  if (score.home < score.away) return PredictionOutcome.AWAY_WIN;
  return PredictionOutcome.DRAW;
}

function deriveCardsRange(totalCards) {
  if (totalCards === 0) return CardsRange.ZERO;
  if (totalCards <= 2) return CardsRange.ONE_TWO;
  if (totalCards <= 4) return CardsRange.THREE_FOUR;
  return CardsRange.FIVE_PLUS;
}

function deriveCardsEdge(homeCards, awayCards) {
  if (homeCards > awayCards) return CardsEdge.HOME;
  if (homeCards < awayCards) return CardsEdge.AWAY;
  return CardsEdge.EQUAL;
}

function calculatePredictionScore({ prediction, result, phase, streakBefore = 0 }) {
  const winnerHit = prediction.outcome === result.outcome;
  const exactHit =
    prediction.score.home === result.score.home && prediction.score.away === result.score.away;
  const scorerHits = prediction.scorers.filter((scorer) => result.scorers.includes(scorer)).length;
  const cardsEdgeHit = prediction.cardsEdge === result.cardsEdge;
  const cardsRangeHit = prediction.cardsRange === result.cardsRange;
  const base = winnerHit ? 3 : 0;
  const exactScore = exactHit ? 6 : 0;
  const scorers = Math.min(scorerHits, 2) * 3;
  const cards = (cardsEdgeHit ? 2 : 0) + (cardsRangeHit ? 2 : 0) + (cardsEdgeHit && cardsRangeHit ? 2 : 0);
  const comboBonus = winnerHit && exactHit ? 2 : 0;
  const streak = winnerHit ? streakBefore + 1 : 0;
  const streakBonus = streak >= 5 ? 5 : streak >= 3 ? 2 : 0;
  const rawTotal = base + exactScore + scorers + cards + comboBonus + streakBonus;
  const multiplier = phaseMultipliers[phase];

  return {
    base,
    exactScore,
    scorers,
    cards,
    comboBonus,
    streakBonus,
    multiplier,
    total: Number((rawTotal * multiplier).toFixed(1)),
    exactHit,
    winnerHit
  };
}

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

function runCase(name, execute) {
  execute();
  console.log(`PASS ${name}`);
}

runCase("classifica vencedor e cartoes", () => {
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

runCase("acerto so de vencedor vale 3", () => {
  const breakdown = calculatePredictionScore({
    prediction: {
      ...basePrediction,
      score: { home: 1, away: 0 },
      scorers: ["gabriel-jesus", "martinelli"],
      cardsEdge: CardsEdge.AWAY,
      cardsRange: CardsRange.ONE_TWO
    },
    result: baseResult,
    phase: Phase.GROUP_STAGE
  });

  assert.equal(breakdown.total, 3);
});

runCase("acerto completo na fase de grupos vale 23", () => {
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

runCase("artilheiros ficam limitados a dois acertos", () => {
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

runCase("cartoes parciais pontuam so a parte correta", () => {
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

runCase("sequencia de 3 acertos aplica bonus 2", () => {
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
      scorers: ["vinicius"]
    },
    phase: Phase.GROUP_STAGE,
    streakBefore: 2
  });

  assert.equal(breakdown.streakBonus, 2);
  assert.equal(breakdown.total, 5);
});

runCase("sequencia de 5 e final aplicam bonus e multiplicador", () => {
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
      cardsEdge: CardsEdge.AWAY
    },
    phase: Phase.FINAL,
    streakBefore: 4
  });

  assert.equal(breakdown.base, 3);
  assert.equal(breakdown.streakBonus, 5);
  assert.equal(breakdown.multiplier, 2);
  assert.equal(breakdown.total, 16);
});

runCase("erro de vencedor zera base, combo e sequencia", () => {
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
