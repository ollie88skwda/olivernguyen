import {
  ADMIT_TUNING,
  admitProbability,
  applyEarlyDecision,
  baseAdmitRate,
  classifyTier,
  expectedBestFit,
  greedySelect,
  marginalValue,
  normalCdf,
  normalQuantile,
  placeEarlyDecision,
  portfolioOutcome,
  probabilityAtLeastOne,
  probabilityNoAdmit,
} from './portfolio';
import { runMonteCarlo } from '../major/model';

const set = (...probabilities) =>
  probabilities.map((p, i) => ({ id: `s${i}`, p, fit: 1 - i * 0.05 }));

describe('numerics', () => {
  test('normalQuantile inverts normalCdf', () => {
    [0.01, 0.05, 0.1, 0.35, 0.5, 0.72, 0.95, 0.99].forEach((p) => {
      expect(normalCdf(normalQuantile(p))).toBeCloseTo(p, 6);
    });
  });
});

describe('probabilityAtLeastOne', () => {
  // The headline claim of the whole page. If this is wrong, the tool is a liability.
  // Precision 7, not more: the floor is Acklam's ~1e-9 relative error on the normal
  // quantile compounded across five schools, not anything about the model.
  test('rho = 0 reproduces the independent Bernoulli answer exactly', () => {
    const entries = set(0.07, 0.07, 0.35, 0.35, 0.78);
    const independent = 1 - entries.reduce((product, e) => product * (1 - e.p), 1);

    expect(probabilityAtLeastOne(entries, 0)).toBeCloseTo(independent, 7);
  });

  test('rho = 1 collapses to the single best school — the correlation floor', () => {
    const entries = set(0.07, 0.12, 0.35, 0.4);

    expect(probabilityAtLeastOne(entries, 1)).toBeCloseTo(0.4, 6);
  });

  test('correlation strictly reduces the odds, and monotonically', () => {
    const entries = set(0.07, 0.07, 0.07, 0.07, 0.07, 0.07);
    const values = [0, 0.2, 0.4, 0.6, 0.8, 0.95].map((rho) =>
      probabilityAtLeastOne(entries, rho)
    );

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]);
    }
    // The gap is the false comfort a spreadsheet sells. It should be large enough to
    // matter, not a rounding detail.
    expect(values[0] - values[3]).toBeGreaterThan(0.05);
  });

  test('piling on more reaches stops buying insurance once outcomes correlate', () => {
    const four = probabilityAtLeastOne(set(0.07, 0.07, 0.07, 0.07), 0.6);
    const eight = probabilityAtLeastOne(set(...Array(8).fill(0.07)), 0.6);
    const independentFour = probabilityAtLeastOne(set(0.07, 0.07, 0.07, 0.07), 0);
    const independentEight = probabilityAtLeastOne(set(...Array(8).fill(0.07)), 0);

    // Doubling the reaches helps materially less under correlation. Measured at these
    // inputs the correlated gain is ~61% of the independent one, so assert a real
    // reduction rather than the halving I first guessed at — the effect is strong, but
    // rho = 0.6 does not cut the marginal value of an extra reach in half.
    expect(eight - four).toBeLessThan((independentEight - independentFour) * 0.75);
  });

  test('an empty set never admits you anywhere', () => {
    expect(probabilityNoAdmit([], 0.6)).toBe(1);
    expect(probabilityAtLeastOne([], 0.6)).toBe(0);
  });

  test('unpriced schools are skipped rather than treated as certain rejections', () => {
    const withUnpriced = [...set(0.4), { id: 'unknown', p: null, fit: 0.9 }];

    expect(probabilityAtLeastOne(withUnpriced, 0.6)).toBeCloseTo(
      probabilityAtLeastOne(set(0.4), 0.6),
      9
    );
  });
});

describe('expectedBestFit', () => {
  test('a single certain admit returns exactly its own fit', () => {
    expect(expectedBestFit([{ id: 'a', p: 0.99, fit: 0.8 }], 0.6)).toBeCloseTo(
      0.99 * 0.8,
      2
    );
  });

  test('a guaranteed top-fit school makes everything below it irrelevant', () => {
    const top = { id: 'top', p: 0.999, fit: 1 };
    const alone = expectedBestFit([top], 0.6);
    const withNoise = expectedBestFit([top, { id: 'x', p: 0.5, fit: 0.2 }], 0.6);

    expect(withNoise).toBeCloseTo(alone, 3);
  });

  test('is order-independent — sorting happens internally', () => {
    const entries = [
      { id: 'a', p: 0.3, fit: 0.4 },
      { id: 'b', p: 0.6, fit: 0.9 },
      { id: 'c', p: 0.5, fit: 0.1 },
    ];
    const reversed = [...entries].reverse();

    expect(expectedBestFit(entries, 0.6)).toBeCloseTo(expectedBestFit(reversed, 0.6), 12);
  });
});

describe('marginalValue', () => {
  const current = [
    { id: 'a', p: 0.3, fit: 0.7 },
    { id: 'b', p: 0.5, fit: 0.5 },
  ];

  test('is never negative — an extra application cannot make the best offer worse', () => {
    const candidates = [
      { id: 'weak', p: 0.02, fit: 0.01 },
      { id: 'strong', p: 0.9, fit: 0.99 },
      { id: 'middling', p: 0.4, fit: 0.5 },
    ];

    candidates.forEach((candidate) => {
      expect(marginalValue(candidate, current, { rho: 0.6 })).toBeGreaterThanOrEqual(0);
    });
  });

  test('is ~zero for a school dominated on both fit and odds', () => {
    // Worse fit than everything already in the set, and it almost never admits.
    const dominated = { id: 'dominated', p: 0.001, fit: 0.001 };

    expect(marginalValue(dominated, current, { rho: 0.6 })).toBeLessThan(1e-4);
  });

  test('a better school is worth more than a worse one', () => {
    const better = marginalValue({ id: 'x', p: 0.6, fit: 0.95 }, current, { rho: 0.6 });
    const worse = marginalValue({ id: 'y', p: 0.6, fit: 0.6 }, current, { rho: 0.6 });

    expect(better).toBeGreaterThan(worse);
  });

  test('the same school is worth less once the set already covers its outcome', () => {
    const candidate = { id: 'c', p: 0.5, fit: 0.6 };
    const thin = marginalValue(candidate, [{ id: 'a', p: 0.2, fit: 0.3 }], { rho: 0.6 });
    const thick = marginalValue(
      candidate,
      [
        { id: 'a', p: 0.2, fit: 0.3 },
        { id: 'b', p: 0.9, fit: 0.9 },
      ],
      { rho: 0.6 }
    );

    expect(thick).toBeLessThan(thin);
  });
});

describe('greedySelect', () => {
  const candidates = [
    { id: 'reach1', p: 0.07, fit: 1.0, effort: 3 },
    { id: 'reach2', p: 0.09, fit: 0.95, effort: 3 },
    { id: 'target1', p: 0.35, fit: 0.7, effort: 2 },
    { id: 'target2', p: 0.4, fit: 0.65, effort: 2 },
    { id: 'likely1', p: 0.78, fit: 0.4, effort: 1 },
    { id: 'likely2', p: 0.85, fit: 0.3, effort: 1 },
  ];

  test('expected fit is monotone non-decreasing as the essay budget rises', () => {
    const values = [1, 3, 5, 8, 12, Infinity].map(
      (budget) => greedySelect(candidates, { budget, rho: 0.6 }).expectedBestFit
    );

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1] - 1e-12);
    }
  });

  test('respects the effort budget', () => {
    const { totalEffort } = greedySelect(candidates, { budget: 5, rho: 0.6 });

    expect(totalEffort).toBeLessThanOrEqual(5);
  });

  test('the marginal-value curve is the shape that tells you when to stop', () => {
    const { curve } = greedySelect(candidates, { rho: 0.6 });

    expect(curve.length).toBe(candidates.length);
    expect(curve[0].marginal).toBeGreaterThan(curve[curve.length - 1].marginal);
    curve.forEach((point) => expect(point.marginal).toBeGreaterThanOrEqual(0));
  });

  test('is deterministic — no sampling noise anywhere in the selection path', () => {
    const first = greedySelect(candidates, { budget: 7, rho: 0.6 });
    const second = greedySelect(candidates, { budget: 7, rho: 0.6 });

    expect(first.selected.map((s) => s.id)).toEqual(second.selected.map((s) => s.id));
    expect(first.expectedBestFit).toBe(second.expectedBestFit);
  });
});

describe('Early Decision as a single-use resource', () => {
  const withEd = [
    { id: 'reach1', p: 0.07, pEd: 0.16, fit: 1.0, effort: 3 },
    { id: 'reach2', p: 0.09, pEd: 0.18, fit: 0.95, effort: 3 },
    { id: 'target1', p: 0.35, pEd: 0.5, fit: 0.7, effort: 2 },
    { id: 'likely1', p: 0.78, fit: 0.4, effort: 1 },
  ];

  test('never spends ED on more than one school', () => {
    const { selected, ed } = greedySelect(withEd, { rho: 0.6 });
    const materialized = applyEarlyDecision(selected, ed && ed.id);

    expect(materialized.filter((s) => s.ed).length).toBeLessThanOrEqual(1);
  });

  test('placing ED never makes the portfolio worse', () => {
    const selected = withEd.slice(0, 3);
    const ed = placeEarlyDecision(selected, { rho: 0.6 });

    expect(ed).not.toBeNull();
    expect(ed.gain).toBeGreaterThanOrEqual(0);
  });

  test('returns null when nothing in the set is ED-eligible', () => {
    expect(placeEarlyDecision([{ id: 'a', p: 0.5, fit: 0.5 }], { rho: 0.6 })).toBeNull();
  });

  test('applyEarlyDecision clears ed on every other school', () => {
    const materialized = applyEarlyDecision(withEd, 'reach1');

    expect(materialized.find((s) => s.id === 'reach1').ed).toBe(true);
    expect(materialized.find((s) => s.id === 'reach1').p).toBe(0.16);
    expect(materialized.filter((s) => s.ed).length).toBe(1);
  });
});

describe('admitProbability', () => {
  const school = {
    id: 'x',
    admitRate: { overall: { value: 0.2 }, engineering: { value: 0.09 } },
  };
  const strongProfile = {
    gpaPercentile: 0.95,
    testPercentile: 0.95,
    rigorPercentile: 0.9,
    activitiesPercentile: 0.9,
  };

  test('prefers the program-specific rate over the campus rate', () => {
    expect(baseAdmitRate(school)).toEqual({ value: 0.09, source: 'engineering' });
    expect(baseAdmitRate({ admitRate: { overall: { value: 0.2 } } })).toEqual({
      value: 0.2,
      source: 'overall',
    });
  });

  test('returns null for an unresearched school — unknown, not unlikely', () => {
    expect(admitProbability({ id: 'new', admitRate: {} }, strongProfile)).toBeNull();
  });

  test('an empty profile yields a WIDER range than a complete one, not a worse one', () => {
    const unknown = admitProbability(school, null);
    const known = admitProbability(school, strongProfile);

    expect(unknown.hi - unknown.lo).toBeGreaterThan(known.hi - known.lo);
    expect(unknown.profileKnown).toBe(false);
    expect(known.profileKnown).toBe(true);
  });

  test('a stronger applicant gets a higher probability', () => {
    const weak = admitProbability(school, { gpaPercentile: 0.4, testPercentile: 0.4 });
    const strong = admitProbability(school, strongProfile);

    expect(strong.mid).toBeGreaterThan(weak.mid);
  });

  test('ED raises the estimate, and by the documented amount', () => {
    const regular = admitProbability(school, strongProfile);
    const early = admitProbability(school, strongProfile, { ed: true });

    expect(early.mid).toBeGreaterThan(regular.mid);
    const shift =
      Math.log(early.mid / (1 - early.mid)) - Math.log(regular.mid / (1 - regular.mid));
    expect(shift).toBeCloseTo(ADMIT_TUNING.edLogit, 6);
  });

  test('probabilities stay inside (0, 1) even for absurd inputs', () => {
    const extreme = admitProbability(
      { admitRate: { overall: { value: 0.999 } }, publicInState: true },
      { gpaPercentile: 1, testPercentile: 1, residency: 'in' },
      { ed: true }
    );

    expect(extreme.hi).toBeLessThan(1);
    expect(extreme.lo).toBeGreaterThan(0);
  });
});

describe('classifyTier', () => {
  test('bands split at the documented thresholds', () => {
    expect(classifyTier(0.05)).toBe('reach');
    expect(classifyTier(0.3)).toBe('target');
    expect(classifyTier(0.8)).toBe('likely');
    expect(classifyTier(null)).toBe('unknown');
    expect(classifyTier({ mid: 0.7 })).toBe('likely');
  });
});

describe('portfolioOutcome', () => {
  const entries = [
    { id: 'r1', p: 0.07, fit: 1.0 },
    { id: 'r2', p: 0.09, fit: 0.9 },
    { id: 't1', p: 0.35, fit: 0.6 },
    { id: 'l1', p: 0.8, fit: 0.35 },
    { id: 'new', p: null, fit: 0.5 },
  ];

  test('reports the naive number alongside the real one so the gap is visible', () => {
    const result = portfolioOutcome(entries, { rho: 0.6 });

    expect(result.naivePAtLeastOne).toBeGreaterThan(result.pAtLeastOne);
    expect(result.pShutOut).toBeCloseTo(1 - result.pAtLeastOne, 12);
  });

  test('counts unpriced schools separately instead of silently dropping them', () => {
    const result = portfolioOutcome(entries, { rho: 0.6 });

    expect(result.counted).toBe(4);
    expect(result.unpriced).toBe(1);
    expect(result.byTier.unknown).toBe(1);
    expect(result.byTier.reach).toBe(2);
  });

  test('a top-heavy list is visibly riskier than a balanced one', () => {
    const topHeavy = Array.from({ length: 8 }, (_, i) => ({
      id: `r${i}`,
      p: 0.07,
      fit: 1 - i * 0.01,
    }));
    const balanced = [
      ...topHeavy.slice(0, 5),
      { id: 't1', p: 0.35, fit: 0.6 },
      { id: 't2', p: 0.4, fit: 0.58 },
      { id: 'l1', p: 0.85, fit: 0.35 },
    ];

    expect(portfolioOutcome(topHeavy, { rho: 0.6 }).pShutOut).toBeGreaterThan(
      portfolioOutcome(balanced, { rho: 0.6 }).pShutOut
    );
  });
});

describe('unresearched schools score as wide, not as zero', () => {
  // A school added mid-cycle on a counselor's recommendation enters with placeholder
  // ranges. model.js must report it as genuinely uncertain rather than quietly bad,
  // which is the entire reason its scores are triangular {lo, mid, hi} in the first place.
  const criteria = [
    { id: 'programs', direction: 'max' },
    { id: 'strength', direction: 'max' },
  ];

  test('a wide-range school produces a wider outcome spread than a known one', () => {
    const alternatives = [
      {
        id: 'known',
        scores: { programs: { lo: 5, mid: 5, hi: 5 }, strength: { lo: 5, mid: 5, hi: 5 } },
      },
      {
        id: 'unresearched',
        scores: { programs: { lo: 0, mid: 5, hi: 10 }, strength: { lo: 0, mid: 5, hi: 10 } },
      },
      {
        id: 'anchor',
        scores: { programs: { lo: 2, mid: 6, hi: 9 }, strength: { lo: 3, mid: 4, hi: 8 } },
      },
    ];

    const { distributions } = runMonteCarlo(
      alternatives,
      criteria,
      { programs: 0.5, strength: 0.5 },
      0.05,
      { runs: 4000, seed: 20260729 }
    );

    const spread = (values) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length * 0.9)] - sorted[Math.floor(sorted.length * 0.1)];
    };

    expect(spread(distributions.unresearched)).toBeGreaterThan(spread(distributions.known));
  });
});
