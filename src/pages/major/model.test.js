import {
  computeAHP,
  computeConfidence,
  computeVOI,
  computeWSM,
  flipDistance,
  mulberry32,
  normalizeScores,
  runMonteCarlo,
  sampleTriangular,
} from './model';

const CRITERIA_3 = [
  { id: 'money', label: 'Money', direction: 'max' },
  { id: 'fun', label: 'Fun', direction: 'max' },
  { id: 'grind', label: 'Grind', direction: 'max' },
];

describe('computeAHP', () => {
  test('a perfectly consistent matrix recovers its true weights with CR ~ 0', () => {
    // True weights 4:2:1, every ratio derived exactly from them.
    const pairwise = { 'money|fun': 2, 'money|grind': 4, 'fun|grind': 2 };
    const { weights, consistencyRatio, worstTriad } = computeAHP(CRITERIA_3, pairwise);

    expect(consistencyRatio).toBeLessThan(1e-9);
    expect(worstTriad).toBeNull();
    expect(weights.money).toBeCloseTo(4 / 7, 9);
    expect(weights.fun).toBeCloseTo(2 / 7, 9);
    expect(weights.grind).toBeCloseTo(1 / 7, 9);
    expect(weights.money + weights.fun + weights.grind).toBeCloseTo(1, 12);
  });

  test('a cyclic matrix trips the CR threshold and names the offending triad', () => {
    // money > fun, fun > grind, grind > money, all "strongly". Cannot all be true.
    const pairwise = { 'money|fun': 5, 'fun|grind': 5, 'grind|money': 5 };
    const { consistencyRatio, worstTriad } = computeAHP(CRITERIA_3, pairwise);

    expect(consistencyRatio).toBeGreaterThan(0.1);
    expect(worstTriad).not.toBeNull();
    expect(worstTriad).toHaveLength(3);
    expect(worstTriad.slice().sort()).toEqual(['fun', 'grind', 'money']);
  });

  test('missing pairs default to 1 and unstated directions fill in as reciprocals', () => {
    const { weights, consistencyRatio } = computeAHP(CRITERIA_3, { 'fun|money': 1 / 2 });

    expect(consistencyRatio).toBeLessThan(0.1);
    expect(weights.money).toBeGreaterThan(weights.fun);
  });
});

describe('normalizeScores and computeWSM', () => {
  const criteria = [
    { id: 'pay', direction: 'max' },
    { id: 'cost', direction: 'min' },
  ];
  const alternatives = [
    { id: 'a', scores: { pay: { lo: 0, mid: 100, hi: 0 }, cost: { lo: 0, mid: 10, hi: 0 } } },
    { id: 'b', scores: { pay: { lo: 0, mid: 50, hi: 0 }, cost: { lo: 0, mid: 30, hi: 0 } } },
  ];

  test('"min" criteria invert so a lower mid normalizes higher', () => {
    const normalized = normalizeScores(alternatives, criteria);

    expect(normalized.pay).toEqual({ a: 1, b: 0 });
    expect(normalized.cost).toEqual({ a: 1, b: 0 });
  });

  test('everyone tied on a criterion normalizes to 0.5', () => {
    const tied = [
      { id: 'a', scores: { pay: { lo: 0, mid: 7, hi: 0 }, cost: { lo: 0, mid: 1, hi: 0 } } },
      { id: 'b', scores: { pay: { lo: 0, mid: 7, hi: 0 }, cost: { lo: 0, mid: 1, hi: 0 } } },
    ];

    expect(normalizeScores(tied, criteria).pay).toEqual({ a: 0.5, b: 0.5 });
  });

  test('contributions are weight times normalized score and sum to the total', () => {
    const wsm = computeWSM(alternatives, criteria, { pay: 0.7, cost: 0.3 });

    expect(wsm.a.contributions).toEqual({ pay: 0.7, cost: 0.3 });
    expect(wsm.a.total).toBeCloseTo(1, 12);
    expect(wsm.b.total).toBeCloseTo(0, 12);
  });
});

describe('mulberry32', () => {
  test('the same seed replays the same sequence', () => {
    const first = mulberry32(12345);
    const second = mulberry32(12345);
    const a = Array.from({ length: 20 }, () => first());
    const b = Array.from({ length: 20 }, () => second());

    expect(a).toEqual(b);
    a.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  test('different seeds diverge immediately', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('sampleTriangular', () => {
  test('samples stay in range and the mean lands near (lo + mid + hi) / 3', () => {
    const rng = mulberry32(99);
    const samples = Array.from({ length: 5000 }, () => sampleTriangular(2, 3, 10, rng));

    samples.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(10);
    });
    const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length;
    expect(Math.abs(mean - 5)).toBeLessThan(0.3);
  });

  test('a collapsed range returns mid and still consumes exactly one draw', () => {
    const used = mulberry32(7);
    const reference = mulberry32(7);

    expect(sampleTriangular(5, 5, 5, used)).toBe(5);
    reference();
    expect(used()).toBe(reference());
  });
});

describe('runMonteCarlo', () => {
  const criteria = [
    { id: 'pay', direction: 'max' },
    { id: 'joy', direction: 'max' },
  ];
  const weights = { pay: 0.6, joy: 0.4 };

  test('the same seed produces identical win rates', () => {
    const alternatives = [
      { id: 'a', scores: { pay: { lo: 40, mid: 60, hi: 80 }, joy: { lo: 30, mid: 50, hi: 70 } } },
      { id: 'b', scores: { pay: { lo: 35, mid: 55, hi: 90 }, joy: { lo: 40, mid: 55, hi: 65 } } },
    ];
    const options = { runs: 800, seed: 4242 };

    const first = runMonteCarlo(alternatives, criteria, weights, 0.05, options);
    const second = runMonteCarlo(alternatives, criteria, weights, 0.05, options);

    expect(first.winRate).toEqual(second.winRate);
    expect(first.pairwiseBeats).toEqual(second.pairwiseBeats);
    expect(first.distributions.a).toHaveLength(800);
  });

  test('a strictly dominant alternative wins every run', () => {
    const alternatives = [
      { id: 'a', scores: { pay: { lo: 90, mid: 95, hi: 100 }, joy: { lo: 90, mid: 95, hi: 100 } } },
      { id: 'b', scores: { pay: { lo: 10, mid: 20, hi: 30 }, joy: { lo: 10, mid: 20, hi: 30 } } },
      { id: 'c', scores: { pay: { lo: 0, mid: 5, hi: 9 }, joy: { lo: 0, mid: 5, hi: 9 } } },
    ];

    const { winRate, pairwiseBeats } = runMonteCarlo(alternatives, criteria, weights, 0.2, {
      runs: 500,
      seed: 11,
    });

    expect(winRate.a).toBe(1);
    expect(winRate.b).toBe(0);
    expect(winRate.c).toBe(0);
    expect(pairwiseBeats.a__b).toBe(1);
    expect(pairwiseBeats.b__a).toBe(0);
  });
});

describe('flipDistance', () => {
  const criteria = [
    { id: 'c1', direction: 'max' },
    { id: 'c2', direction: 'max' },
  ];
  const weights = { c1: 0.6, c2: 0.4 };

  test('matches the hand-computed flip point', () => {
    // a leads c1 outright, b leads c2 outright, so normalized scores are 1 and 0.
    // Totals: a = 0.6, b = 0.4. They tie when both weights reach 0.5, which is a 0.1 drop
    // on c1 (c2 renormalizes 0.4 -> 0.5) or a 0.1 rise on c2 (c1 renormalizes 0.6 -> 0.5).
    const alternatives = [
      { id: 'a', scores: { c1: { lo: 0, mid: 10, hi: 0 }, c2: { lo: 0, mid: 0, hi: 0 } } },
      { id: 'b', scores: { c1: { lo: 0, mid: 0, hi: 0 }, c2: { lo: 0, mid: 10, hi: 0 } } },
    ];

    const result = flipDistance(alternatives, criteria, weights);

    expect(result.c1.delta).toBeCloseTo(0.1, 9);
    expect(result.c1.direction).toBe('decrease');
    expect(result.c2.delta).toBeCloseTo(0.1, 9);
    expect(result.c2.direction).toBe('increase');
  });

  test('an alternative that leads on every criterion is robust to any reweighting', () => {
    const alternatives = [
      { id: 'a', scores: { c1: { lo: 0, mid: 10, hi: 0 }, c2: { lo: 0, mid: 10, hi: 0 } } },
      { id: 'b', scores: { c1: { lo: 0, mid: 5, hi: 0 }, c2: { lo: 0, mid: 1, hi: 0 } } },
      { id: 'c', scores: { c1: { lo: 0, mid: 1, hi: 0 }, c2: { lo: 0, mid: 5, hi: 0 } } },
    ];

    const result = flipDistance(alternatives, criteria, weights);

    expect(result.c1).toEqual({ delta: Infinity, direction: null });
    expect(result.c2).toEqual({ delta: Infinity, direction: null });
  });
});

describe('computeVOI', () => {
  const criteria = [
    { id: 'market', direction: 'max' },
    { id: 'fit', direction: 'max' },
  ];
  const weights = { market: 0.5, fit: 0.5 };
  // market is wide open and identical for both, so it decides runs at random.
  // fit is already certain and favors a.
  const alternatives = [
    { id: 'a', scores: { market: { lo: 0, mid: 50, hi: 100 }, fit: { lo: 60, mid: 60, hi: 60 } } },
    { id: 'b', scores: { market: { lo: 0, mid: 50, hi: 100 }, fit: { lo: 40, mid: 40, hi: 40 } } },
  ];
  const unknowns = [
    { id: 'u_market', criteria: ['market'], effort: 2 },
    { id: 'u_fit', criteria: ['fit'], effort: 1 },
  ];

  test('resolving a live uncertainty flips runs, resolving a settled one does nothing', () => {
    const voi = computeVOI(unknowns, alternatives, criteria, weights, 0.08, {
      runs: 600,
      seed: 2026,
    });

    expect(voi.u_fit.flipFraction).toBe(0);
    expect(voi.u_fit.evpi).toBe(0);
    expect(voi.u_market.flipFraction).toBeGreaterThan(0.1);
    expect(voi.u_market.flipFraction).toBeGreaterThan(voi.u_fit.flipFraction);
    expect(voi.u_market.evpi).toBeGreaterThan(0);
  });

  test('is deterministic under a fixed seed', () => {
    const options = { runs: 400, seed: 5 };
    const first = computeVOI(unknowns, alternatives, criteria, weights, 0.08, options);
    const second = computeVOI(unknowns, alternatives, criteria, weights, 0.08, options);

    expect(first).toEqual(second);
  });
});

describe('computeConfidence', () => {
  test('a certain winner scores 100 and reads CLEAR', () => {
    expect(computeConfidence({ a: 1, b: 0 })).toEqual({ score: 100, label: 'CLEAR' });
  });

  test('a three-way tie scores 0 and reads COIN FLIP', () => {
    const { score, label } = computeConfidence({ a: 1 / 3, b: 1 / 3, c: 1 / 3 });

    expect(score).toBeCloseTo(0, 9);
    expect(label).toBe('COIN FLIP');
  });

  test('a strong but not certain favorite reads LEAN', () => {
    const { score, label } = computeConfidence({ a: 0.92, b: 0.08 });

    expect(score).toBeGreaterThanOrEqual(55);
    expect(score).toBeLessThan(75);
    expect(label).toBe('LEAN');
  });
});
