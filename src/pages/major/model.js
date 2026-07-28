// Decision math for /major. Pure functions over plain objects, no React, no I/O.

const RANDOM_INDEX = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
const NO_SCORE = { lo: 0, mid: 0, hi: 0 };

function randomIndex(n) {
  return n > 10 ? 1.49 : RANDOM_INDEX[n] || 0;
}

function scoreOf(alternative, criterionId) {
  const scores = alternative && alternative.scores;
  return (scores && scores[criterionId]) || NO_SCORE;
}

function normalizeValue(value, min, max, direction) {
  if (max === min) return 0.5;
  const t = (value - min) / (max - min);
  return direction === 'min' ? 1 - t : t;
}

export function computeAHP(criteria, pairwise) {
  const ids = criteria.map((c) => c.id);
  const n = ids.length;
  if (n === 0) return { weights: {}, consistencyRatio: 0, worstTriad: null };

  const map = pairwise || {};
  const matrix = ids.map((rowId, i) =>
    ids.map((colId, j) => {
      if (i === j) return 1;
      const direct = map[`${rowId}|${colId}`];
      if (direct != null) return direct;
      const inverse = map[`${colId}|${rowId}`];
      if (inverse != null) return 1 / inverse;
      return 1;
    })
  );

  const geometric = matrix.map(
    (row) => Math.exp(row.reduce((sum, v) => sum + Math.log(v), 0) / n)
  );
  const geometricSum = geometric.reduce((sum, v) => sum + v, 0);
  const weights = {};
  ids.forEach((id, i) => {
    weights[id] = geometric[i] / geometricSum;
  });

  // Power-iterate to the true principal eigenvalue rather than reading lambda off the
  // geometric-mean vector, which is only an approximation of the principal eigenvector.
  let vector = new Array(n).fill(1 / n);
  let lambdaMax = n;
  for (let iter = 0; iter < 500; iter++) {
    const current = vector;
    const product = matrix.map((row) =>
      row.reduce((sum, value, j) => sum + value * current[j], 0)
    );
    const total = product.reduce((sum, v) => sum + v, 0);
    const next = product.map((v) => v / total);
    const delta = next.reduce((max, v, i) => Math.max(max, Math.abs(v - current[i])), 0);
    vector = next;
    lambdaMax = total;
    if (delta < 1e-12) break;
  }

  const ri = randomIndex(n);
  const ci = n > 1 ? Math.max(0, (lambdaMax - n) / (n - 1)) : 0;
  const consistencyRatio = ri === 0 ? 0 : ci / ri;

  let worstTriad = null;
  if (consistencyRatio > 0.1 && n >= 3) {
    let worst = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          const cycle = Math.abs(
            Math.log(matrix[i][j] * matrix[j][k] * matrix[k][i])
          );
          if (cycle > worst) {
            worst = cycle;
            worstTriad = [ids[i], ids[j], ids[k]];
          }
        }
      }
    }
  }

  return { weights, consistencyRatio, worstTriad };
}

// Shape: { [criterionId]: { [alternativeId]: 0..1 } }. "min" criteria are inverted so a
// higher normalized value is always better. Everyone tied on a criterion gets 0.5.
export function normalizeScores(alternatives, criteria) {
  const result = {};
  for (const criterion of criteria) {
    const column = {};
    if (alternatives.length > 0) {
      const mids = alternatives.map((a) => scoreOf(a, criterion.id).mid);
      const min = Math.min(...mids);
      const max = Math.max(...mids);
      alternatives.forEach((a, i) => {
        column[a.id] = normalizeValue(mids[i], min, max, criterion.direction);
      });
    }
    result[criterion.id] = column;
  }
  return result;
}

function weightedSum(altIds, criteria, weights, normalized) {
  const result = {};
  for (const id of altIds) {
    const contributions = {};
    let total = 0;
    for (const criterion of criteria) {
      const value = (weights[criterion.id] || 0) * (normalized[criterion.id][id] || 0);
      contributions[criterion.id] = value;
      total += value;
    }
    result[id] = { total, contributions };
  }
  return result;
}

export function computeWSM(alternatives, criteria, weights) {
  return weightedSum(
    alternatives.map((a) => a.id),
    criteria,
    weights,
    normalizeScores(alternatives, criteria)
  );
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sorted keys: the doc has two writers (browser + scripts/decision.mjs), so key insertion
// order drifts. Without sorting, identical data would reseed and every number would move.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value);
    return encoded === undefined ? 'null' : encoded;
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

export function hashDoc(doc) {
  const text = stableStringify(doc);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function sampleTriangular(lo, mid, hi, rng) {
  // Draw before branching. Collapsed ranges must consume exactly as many RNG values as
  // uncertain ones, or computeVOI's paired runs desynchronise and flipFraction is noise.
  const u = rng();
  if (!(hi > lo)) return mid;
  const peak = Math.min(Math.max(mid, lo), hi);
  const span = hi - lo;
  const cut = (peak - lo) / span;
  if (u < cut) return lo + Math.sqrt(u * span * (peak - lo));
  return hi - Math.sqrt((1 - u) * span * (hi - peak));
}

function sampleNormal(rng) {
  const u = Math.max(rng(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

function sampleGamma(alpha, rng) {
  if (alpha < 1) {
    return sampleGamma(alpha + 1, rng) * Math.pow(rng() || Number.MIN_VALUE, 1 / alpha);
  }
  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x;
    let v;
    do {
      x = sampleNormal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

// Judgment call, not a cited formula: k = max(2, 50 * (1 - min(CR, 1))), alpha_i = w_i * k.
// The draw stays centered on the AHP weights; concentration falls as the pairwise answers
// get more contradictory. CR 0 -> k 50, weights barely move. CR >= 1 -> k 2, near-uniform.
function jitterWeights(critIds, weights, consistencyRatio, rng) {
  const cr = Number.isFinite(consistencyRatio) ? Math.max(0, consistencyRatio) : 0;
  const k = Math.max(2, 50 * (1 - Math.min(cr, 1)));
  const raw = critIds.map((id) => sampleGamma(Math.max((weights[id] || 0) * k, 1e-6), rng));
  const total = raw.reduce((sum, v) => sum + v, 0);
  const jittered = {};
  critIds.forEach((id, i) => {
    jittered[id] = total > 0 ? raw[i] / total : 1 / critIds.length;
  });
  return jittered;
}

function simulate(alternatives, criteria, weights, consistencyRatio, runs, seed, collapsed) {
  const rng = mulberry32(seed);
  const altIds = alternatives.map((a) => a.id);
  const critIds = criteria.map((c) => c.id);

  const distributions = {};
  const wins = {};
  const beats = {};
  for (const id of altIds) {
    distributions[id] = new Array(runs);
    wins[id] = 0;
    for (const other of altIds) {
      if (other !== id) beats[`${id}__${other}`] = 0;
    }
  }
  const winners = new Array(runs);
  const topScores = new Array(runs);
  const samples = new Array(altIds.length);

  for (let run = 0; run < runs; run++) {
    const jittered = jitterWeights(critIds, weights, consistencyRatio, rng);

    const normalized = {};
    for (const criterion of criteria) {
      const collapse = collapsed ? collapsed.has(criterion.id) : false;
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < alternatives.length; i++) {
        const score = scoreOf(alternatives[i], criterion.id);
        const value = collapse
          ? sampleTriangular(score.mid, score.mid, score.mid, rng)
          : sampleTriangular(score.lo, score.mid, score.hi, rng);
        samples[i] = value;
        if (value < min) min = value;
        if (value > max) max = value;
      }
      const column = {};
      altIds.forEach((id, i) => {
        column[id] = normalizeValue(samples[i], min, max, criterion.direction);
      });
      normalized[criterion.id] = column;
    }

    let bestId = null;
    let bestTotal = -Infinity;
    for (const id of altIds) {
      let total = 0;
      for (const criterion of criteria) {
        total += (jittered[criterion.id] || 0) * normalized[criterion.id][id];
      }
      distributions[id][run] = total;
      if (total > bestTotal) {
        bestTotal = total;
        bestId = id;
      }
    }
    winners[run] = bestId;
    topScores[run] = bestTotal;
    if (bestId != null) wins[bestId] += 1;

    for (let i = 0; i < altIds.length; i++) {
      for (let j = i + 1; j < altIds.length; j++) {
        const a = altIds[i];
        const b = altIds[j];
        if (distributions[a][run] > distributions[b][run]) beats[`${a}__${b}`] += 1;
        else if (distributions[b][run] > distributions[a][run]) beats[`${b}__${a}`] += 1;
      }
    }
  }

  const winRate = {};
  for (const id of altIds) winRate[id] = runs > 0 ? wins[id] / runs : 0;
  const pairwiseBeats = {};
  for (const key of Object.keys(beats)) pairwiseBeats[key] = runs > 0 ? beats[key] / runs : 0;

  return { winRate, distributions, pairwiseBeats, winners, topScores };
}

export function runMonteCarlo(alternatives, criteria, weights, consistencyRatio, options = {}) {
  const { runs = 10000, seed } = options;
  const resolved = seed != null ? seed >>> 0 : hashDoc({ alternatives, criteria, weights });
  const { winRate, distributions, pairwiseBeats } = simulate(
    alternatives,
    criteria,
    weights,
    consistencyRatio,
    runs,
    resolved,
    null
  );
  return { winRate, distributions, pairwiseBeats };
}

export function flipDistance(alternatives, criteria, weights) {
  const altIds = alternatives.map((a) => a.id);
  const normalized = normalizeScores(alternatives, criteria);

  const weightTotal = criteria.reduce((sum, c) => sum + (weights[c.id] || 0), 0);
  const unit = {};
  for (const criterion of criteria) {
    unit[criterion.id] = weightTotal > 0 ? (weights[criterion.id] || 0) / weightTotal : 0;
  }

  const base = weightedSum(altIds, criteria, unit, normalized);
  let leader = null;
  for (const id of altIds) {
    if (leader === null || base[id].total > base[leader].total) leader = id;
  }

  const result = {};
  for (const criterion of criteria) {
    result[criterion.id] = { delta: Infinity, direction: null };
    const own = unit[criterion.id];
    const rest = 1 - own;
    if (leader === null || rest <= 0) continue;

    // Bumping w_c by d and scaling the rest by (1 - w_c - d) / (1 - w_c) keeps every total
    // linear in d, so each challenger crosses the leader at most once and the crossing has
    // a closed form. Bounds d in [-w_c, 1 - w_c] keep all weights inside [0, 1].
    const rho = 1 / rest;
    const slope = (id) =>
      normalized[criterion.id][id] - rho * (base[id].total - own * normalized[criterion.id][id]);
    const leaderSlope = slope(leader);

    let best = Infinity;
    let direction = null;
    for (const id of altIds) {
      if (id === leader) continue;
      const slopeGap = slope(id) - leaderSlope;
      if (slopeGap === 0) continue;
      const d = (base[leader].total - base[id].total) / slopeGap;
      if (d > 0 && d <= rest && d < best) {
        best = d;
        direction = 'increase';
      } else if (d < 0 && -d <= own && -d < best) {
        best = -d;
        direction = 'decrease';
      }
    }
    if (direction) result[criterion.id] = { delta: best, direction };
  }
  return result;
}

export function computeVOI(
  unknowns,
  alternatives,
  criteria,
  weights,
  consistencyRatio,
  options = {}
) {
  const { runs = 2000, seed } = options;
  const resolved = seed != null ? seed >>> 0 : hashDoc({ alternatives, criteria, weights });
  const full = simulate(
    alternatives,
    criteria,
    weights,
    consistencyRatio,
    runs,
    resolved,
    null
  );

  const result = {};
  for (const unknown of unknowns) {
    const collapsed = new Set(unknown.criteria || []);
    const resolvedRun = simulate(
      alternatives,
      criteria,
      weights,
      consistencyRatio,
      runs,
      resolved,
      collapsed
    );

    // evpi is expected opportunity loss: per paired run, the best score once this unknown is
    // resolved minus the score of the pick you would have made without resolving it. Always
    // >= 0, exactly 0 when the pick never changes. Two simplifications: collapsing to `mid`
    // models the expected resolution rather than a sampled one, and the units are normalized
    // WSM points in 0..1, not money.
    let flips = 0;
    let regret = 0;
    for (let run = 0; run < runs; run++) {
      const naive = full.winners[run];
      if (naive !== resolvedRun.winners[run]) flips += 1;
      if (naive != null) regret += resolvedRun.topScores[run] - resolvedRun.distributions[naive][run];
    }
    result[unknown.id] = {
      flipFraction: runs > 0 ? flips / runs : 0,
      evpi: runs > 0 ? regret / runs : 0,
    };
  }
  return result;
}

export function computeConfidence(winRate) {
  const shares = Object.values(winRate);
  const k = shares.length;
  if (k === 0) return { score: 0, label: 'COIN FLIP' };
  if (k === 1) return { score: 100, label: 'CLEAR' };

  const total = shares.reduce((sum, p) => sum + p, 0);
  let entropy = 0;
  for (const share of shares) {
    const p = total > 0 ? share / total : 1 / k;
    if (p > 0) entropy -= p * Math.log(p);
  }
  const score = Math.max(0, Math.min(100, (1 - entropy / Math.log(k)) * 100));
  const label = score >= 75 ? 'CLEAR' : score >= 55 ? 'LEAN' : 'COIN FLIP';
  return { score, label };
}
