// Portfolio math for /apply. Pure functions over plain objects, no React, no I/O.
//
// /major picks one of three. /apply picks a SET of ~15 from ~34, which is a different
// question: ranking schools and taking the top N can hand you eight reaches that all
// reject you on the same afternoon. Everything here answers the set-shaped question —
// what is the expected quality of the best offer you actually receive.
//
// The fit half of that question is already solved: computeAHP -> computeWSM in
// ../major/model.js gives every school a 0..1 fit score, and it never knew or cared that
// its "alternatives" used to be majors. Only the admissions half is new, and it is three
// things model.js has no notion of: admit probabilities, CORRELATED outcomes, and the
// marginal value of adding one more school to a set.

// ── Numerics ────────────────────────────────────────────────────────────────────
// Box-Muller and the normal CDF/quantile live here rather than being imported, because
// model.js keeps its own sampleNormal module-private. Duplicating ~15 lines beats
// widening that module's public surface for a second consumer.

// Hart's rational approximation to the standard normal CDF, accurate to ~1e-15 in double
// precision. The obvious alternative, Abramowitz & Stegun 7.1.26, tops out around 1.5e-7 —
// which sounds harmless until you remember this function is called 1200 times inside a
// quadrature whose result is the headline number on the page. Cheap accuracy here means
// the reported odds never move for a reason that isn't real.
export function normalCdf(x) {
  const z = Math.abs(x);
  if (z > 37) return x > 0 ? 1 : 0;

  const e = Math.exp(-(z * z) / 2);
  let tail;

  if (z < 7.07106781186547) {
    let numerator = 3.52624965998911e-2 * z + 0.700383064443688;
    numerator = numerator * z + 6.37396220353165;
    numerator = numerator * z + 33.912866078383;
    numerator = numerator * z + 112.079291497871;
    numerator = numerator * z + 221.213596169931;
    numerator = numerator * z + 220.206867912376;

    let denominator = 8.83883476483184e-2 * z + 1.75566716318264;
    denominator = denominator * z + 16.064177579207;
    denominator = denominator * z + 86.7807322029461;
    denominator = denominator * z + 296.564248779674;
    denominator = denominator * z + 637.333633378831;
    denominator = denominator * z + 793.826512519948;
    denominator = denominator * z + 440.413735824752;

    tail = (e * numerator) / denominator;
  } else {
    const continued = z + 1 / (z + 2 / (z + 3 / (z + 4 / (z + 0.65))));
    tail = e / (2.506628274631 * continued);
  }

  return x > 0 ? 1 - tail : tail;
}

// Acklam's rational approximation to the normal quantile. Relative error < 1.15e-9.
export function normalQuantile(p) {
  if (!(p > 0)) return -Infinity;
  if (!(p < 1)) return Infinity;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416,
  ];

  const low = 0.02425;
  let q;
  if (p < low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > 1 - low) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

function normalPdf(z) {
  return Math.exp(-(z * z) / 2) / Math.sqrt(2 * Math.PI);
}

function logit(p) {
  return Math.log(p / (1 - p));
}

function expit(x) {
  return 1 / (1 + Math.exp(-x));
}

function clampProbability(p) {
  return Math.min(0.99, Math.max(0.001, p));
}

// ── Admit probability ───────────────────────────────────────────────────────────

// Judgment calls, not cited constants. Named and exported so they are visible and
// tunable rather than buried as magic numbers, in the same spirit as model.js
// documenting its own k = max(2, 50 * (1 - CR)) weight-jitter heuristic.
export const ADMIT_TUNING = {
  // Logit shift per standard deviation of applicant strength above the admitted median.
  strengthBeta: 0.9,
  // Public in-state advantage. Real and large at most publics; a single number cannot
  // capture how much it varies, so the interval below is deliberately wide.
  inStateLogit: 0.5,
  // Early Decision lift. Genuinely large at some schools and near zero at others; this
  // is the single least defensible number here, which is exactly why ED gets modeled as
  // a scarce resource to be placed rather than a free bonus.
  edLogit: 0.7,
  // Extra difficulty when the target major is impacted / capped.
  impactedLogit: -0.6,
  // Uncertainty on strength, in standard deviations, when the profile is fully known
  // versus when nothing about the applicant has been entered yet.
  sigmaKnown: 0.5,
  sigmaUnknown: 1.5,
};

function resolveValue(field) {
  if (field == null) return null;
  if (typeof field === 'number') return field;
  if (typeof field === 'object' && 'value' in field) return field.value;
  return null;
}

// Program-specific rate wins over the campus rate. Berkeley's College of Engineering and
// Berkeley overall differ by roughly 2x, and quietly substituting one for the other is
// the single most common way these estimates go wrong.
export function baseAdmitRate(school) {
  const rates = (school && school.admitRate) || {};
  const engineering = resolveValue(rates.engineering);
  if (engineering != null) return { value: engineering, source: 'engineering' };
  const overall = resolveValue(rates.overall);
  if (overall != null) return { value: overall, source: 'overall' };
  return { value: null, source: null };
}

// Mean of whatever percentile signals the profile actually has, mapped to a z score.
// Returns null when the profile is empty, which is the seeded state: every personal
// field starts as 'TODO — Ollie' and gets typed in EDIT mode, so "unknown" has to be a
// real answer rather than silently becoming "average".
function applicantStrength(profile) {
  if (!profile) return null;
  const signals = ['gpaPercentile', 'testPercentile', 'rigorPercentile', 'activitiesPercentile']
    .map((key) => profile[key])
    .filter((value) => typeof value === 'number' && value >= 0 && value <= 1);
  if (signals.length === 0) return null;
  const mean = signals.reduce((sum, v) => sum + v, 0) / signals.length;
  // Percentile -> z, clamped. A 99th-percentile applicant is strong, not infinitely so.
  return Math.max(-2.5, Math.min(2.5, normalQuantile(Math.min(0.999, Math.max(0.001, mean)))));
}

/**
 * Admission probability for one school as a triangular range, never a point estimate.
 *
 * Returns null when there is no admit rate to build on — an unresearched school is
 * unknown, not unlikely, and the caller must be able to tell those apart.
 */
export function admitProbability(school, profile, options = {}) {
  const { ed = false } = options;
  const base = baseAdmitRate(school);
  if (base.value == null) return null;

  const strength = applicantStrength(profile);
  const sigma = strength == null ? ADMIT_TUNING.sigmaUnknown : ADMIT_TUNING.sigmaKnown;
  const z = strength == null ? 0 : strength;

  let shift = 0;
  if (profile && profile.residency === 'in' && school.publicInState) {
    shift += ADMIT_TUNING.inStateLogit;
  }
  if (ed) shift += ADMIT_TUNING.edLogit;
  if (school.majorImpacted) shift += ADMIT_TUNING.impactedLogit;

  const center = logit(clampProbability(base.value)) + ADMIT_TUNING.strengthBeta * z + shift;
  const spread = ADMIT_TUNING.strengthBeta * sigma;

  return {
    lo: clampProbability(expit(center - spread)),
    mid: clampProbability(expit(center)),
    hi: clampProbability(expit(center + spread)),
    rateSource: base.source,
    profileKnown: strength != null,
  };
}

// Judgment thresholds for the reach/target/likely bands in S3. Round numbers on purpose:
// pretending to a sharper boundary than the underlying estimate supports would be false
// precision.
export function classifyTier(probability) {
  const p = typeof probability === 'number' ? probability : probability && probability.mid;
  if (p == null) return 'unknown';
  if (p >= 0.6) return 'likely';
  if (p >= 0.25) return 'target';
  return 'reach';
}

// ── Correlated outcomes ─────────────────────────────────────────────────────────

const QUADRATURE_NODES = 1200; // even, so Simpson's rule applies
const QUADRATURE_LIMIT = 8; // +/- 8 sigma captures the standard normal to ~1e-15

function toProbability(entry) {
  const p = entry && entry.p;
  if (typeof p === 'number') return clampProbability(p);
  if (p && typeof p.mid === 'number') return clampProbability(p.mid);
  return null;
}

// Integrate f(z) * phi(z) dz over [-8, 8] by Simpson's rule.
//
// Quadrature rather than Monte Carlo on purpose: P(at least one admit) is the headline
// number on the page, and it must not shimmer when an unrelated field is edited. This is
// deterministic to ~1e-12 and costs 1200 evaluations. Monte Carlo is still used where it
// genuinely earns its keep — model.js's runMonteCarlo over the fit scores.
function integrateOverLatent(f) {
  const h = (2 * QUADRATURE_LIMIT) / QUADRATURE_NODES;
  let total = 0;
  for (let i = 0; i <= QUADRATURE_NODES; i++) {
    const z = -QUADRATURE_LIMIT + i * h;
    const weight = i === 0 || i === QUADRATURE_NODES ? 1 : i % 2 ? 4 : 2;
    total += weight * normalPdf(z) * f(z);
  }
  return (total * h) / 3;
}

// rho this close to 1 is treated as exactly 1 and routed to the closed forms below.
const DEGENERATE_RHO = 1 - 1e-9;

// Conditional admit probability given the latent applicant-strength draw z.
//
// The one-factor Gaussian copula: school i admits when U_i < p_i, where
// U_i = Phi(rho * z + sqrt(1 - rho^2) * eps_i) is uniform on its own but shares the
// factor z with every other school. rho is how much a single underlying "how strong is
// this application, really" quantity drives all the decisions together.
function conditionalProbabilities(probabilities, rho) {
  const r = Math.max(0, Math.min(1, rho));
  const thresholds = probabilities.map((p) => normalQuantile(p));
  const s = Math.sqrt(1 - r * r);
  return (z) => thresholds.map((t) => normalCdf((t - r * z) / s));
}

// At rho = 1 a single shared factor decides every outcome, so school i admits exactly
// when z < threshold_i. The conditional probabilities become a step function of z, and
// Simpson's rule is O(h) rather than O(h^4) across a discontinuity — at 1200 nodes it was
// wrong in the third decimal place. Both quantities have exact closed forms in that
// limit, so use them instead of throwing nodes at the problem.
//
// The admit sets are nested: a higher p means a higher threshold, so anyone admitted by a
// pickier school is admitted by every less picky one.
function degenerateNoAdmit(probabilities) {
  return 1 - Math.max(...probabilities);
}

function degenerateBestFit(entries) {
  // Sorted by fit descending. Walking down, school i is the best admit exactly on the
  // slice of z where it admits and nothing better-fitting does — a slice of width
  // max(0, p_i - max p over better-fitting schools).
  let covered = 0;
  let total = 0;
  for (const entry of entries) {
    total += entry.fit * Math.max(0, entry.prob - covered);
    covered = Math.max(covered, entry.prob);
  }
  return total;
}

/**
 * Probability that a set of applications yields no admission at all.
 *
 * This is the correction the whole page exists to make. Every "chance me" spreadsheet
 * computes 1 - prod(1 - p_i), which assumes the decisions are independent. They are not:
 * the same transcript, essays and person go to every committee, so a weak application is
 * weak nearly everywhere at once. Independence badly overstates your odds, and it does so
 * exactly where the stakes are highest — the tail where you are shut out.
 */
export function probabilityNoAdmit(entries, rho = 0.6) {
  const probabilities = entries.map(toProbability).filter((p) => p != null);
  if (probabilities.length === 0) return 1;
  if (rho >= DEGENERATE_RHO) return degenerateNoAdmit(probabilities);

  const conditional = conditionalProbabilities(probabilities, rho);
  return integrateOverLatent((z) => {
    const ps = conditional(z);
    let product = 1;
    for (let i = 0; i < ps.length; i++) product *= 1 - ps[i];
    return product;
  });
}

export function probabilityAtLeastOne(entries, rho = 0.6) {
  return 1 - probabilityNoAdmit(entries, rho);
}

/**
 * Expected fit score of the BEST school that actually admits you — zero if none do.
 *
 * Closed form rather than simulation. Sort by fit descending; conditional on the latent
 * draw z the decisions are independent, so school i is the best admit exactly when it
 * admits and everything above it does not:
 *
 *   E[best | z] = sum_i fit_i * p_i(z) * prod_{j above i} (1 - p_j(z))
 *
 * Integrating that against phi(z) gives the answer with no sampling noise, which is what
 * makes marginalValue below stable enough to rank 34 schools by.
 */
export function expectedBestFit(entries, rho = 0.6) {
  const usable = entries
    .map((entry) => ({ ...entry, prob: toProbability(entry), fit: entry.fit || 0 }))
    .filter((entry) => entry.prob != null);
  if (usable.length === 0) return 0;

  // Stable order: fit descending, then id, so equal-fit schools do not reorder between
  // calls and make marginal values jitter.
  usable.sort((a, b) => b.fit - a.fit || String(a.id).localeCompare(String(b.id)));

  if (rho >= DEGENERATE_RHO) return degenerateBestFit(usable);

  const conditional = conditionalProbabilities(usable.map((e) => e.prob), rho);
  return integrateOverLatent((z) => {
    const ps = conditional(z);
    let survives = 1; // probability every better-fitting school has already said no
    let total = 0;
    for (let i = 0; i < usable.length; i++) {
      total += usable[i].fit * ps[i] * survives;
      survives *= 1 - ps[i];
    }
    return total;
  });
}

/**
 * Full portfolio readout for S3.
 */
export function portfolioOutcome(entries, options = {}) {
  const { rho = 0.6 } = options;
  const priced = entries.filter((entry) => toProbability(entry) != null);

  const byTier = { reach: [], target: [], likely: [], unknown: [] };
  for (const entry of entries) {
    const tier = classifyTier(entry.p);
    byTier[tier].push(entry);
  }

  const pAtLeastOne = probabilityAtLeastOne(priced, rho);

  return {
    rho,
    counted: priced.length,
    unpriced: entries.length - priced.length,
    pAtLeastOne,
    pShutOut: 1 - pAtLeastOne,
    pAtLeastOneReach: probabilityAtLeastOne(byTier.reach, rho),
    expectedBestFit: expectedBestFit(priced, rho),
    byTier: {
      reach: byTier.reach.length,
      target: byTier.target.length,
      likely: byTier.likely.length,
      unknown: byTier.unknown.length,
    },
    // Independence is not the model — it is reported alongside so the page can show the
    // size of the error the correlated model is correcting.
    naivePAtLeastOne:
      1 - priced.reduce((product, entry) => product * (1 - toProbability(entry)), 1),
  };
}

/**
 * How much does adding one school raise the expected best offer?
 *
 * The headline output of the whole page: it turns "is Cornell good?" into "Cornell adds
 * 0.4% and costs three supplemental essays", which is the sentence that actually
 * shortens a list. Never negative — adding an application can only improve the best
 * outcome pointwise, so it can only improve the expectation.
 */
export function marginalValue(school, currentSet, options = {}) {
  const { rho = 0.6 } = options;
  const without = expectedBestFit(currentSet, rho);
  const withIt = expectedBestFit([...currentSet, school], rho);
  return Math.max(0, withIt - without);
}

// ── Choosing the set ────────────────────────────────────────────────────────────

function effortOf(entry) {
  if (typeof entry.effort === 'number') return Math.max(entry.effort, 0.0001);
  const count = entry.essays && entry.essays.count;
  return Math.max(typeof count === 'number' ? count : 1, 0.0001);
}

/**
 * Build the recommended list greedily by marginal value per essay.
 *
 * Returns the whole curve, not just the final set, because where the curve flattens is
 * the actual answer to "how many schools should I apply to".
 *
 * ED is a hard single-use constraint, which is what makes this more than a knapsack:
 * you may spend it exactly once, so the search has to decide WHERE. Candidates carry an
 * optional `pEd` (their probability under Early Decision); after the set is chosen, each
 * ED-eligible member is tried in turn and the placement that maximizes expected best fit
 * wins.
 */
export function greedySelect(candidates, options = {}) {
  const { budget = Infinity, rho = 0.6, maxSchools = Infinity, allowEd = true } = options;

  const remaining = candidates.filter((c) => toProbability(c) != null);
  const selected = [];
  const curve = [];
  let spent = 0;

  while (remaining.length > 0 && selected.length < maxSchools) {
    let best = null;
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const cost = effortOf(candidate);
      if (spent + cost > budget) continue;
      const gain = marginalValue(candidate, selected, { rho });
      const rate = gain / cost;
      if (!best || rate > best.rate) best = { index: i, candidate, gain, cost, rate };
    }
    if (!best) break;

    remaining.splice(best.index, 1);
    selected.push(best.candidate);
    spent += best.cost;
    curve.push({
      step: selected.length,
      id: best.candidate.id,
      marginal: best.gain,
      effort: best.cost,
      cumulativeEffort: spent,
      expectedBestFit: expectedBestFit(selected, rho),
    });
  }

  const ed = allowEd ? placeEarlyDecision(selected, { rho }) : null;

  return {
    selected,
    curve,
    totalEffort: spent,
    expectedBestFit: expectedBestFit(selected, rho),
    ed,
  };
}

/**
 * Decide which single school to spend Early Decision on.
 *
 * Binding and single-use, so this is a genuine allocation problem rather than a bonus.
 * Returns null when no selected school is ED-eligible.
 */
export function placeEarlyDecision(selected, options = {}) {
  const { rho = 0.6 } = options;
  const eligible = selected.filter((s) => s.pEd != null);
  if (eligible.length === 0) return null;

  const baseline = expectedBestFit(selected, rho);
  let best = null;

  for (const target of eligible) {
    const swapped = selected.map((s) => (s.id === target.id ? { ...s, p: s.pEd, ed: true } : s));
    const value = expectedBestFit(swapped, rho);
    if (!best || value > best.expectedBestFit) {
      best = { id: target.id, expectedBestFit: value, gain: value - baseline };
    }
  }
  return best;
}

/**
 * Apply an ED placement to a set, enforcing the one-ED-only rule at the point where the
 * set is materialized so no caller can accidentally produce two.
 */
export function applyEarlyDecision(selected, edId) {
  return selected.map((school) =>
    school.id === edId && school.pEd != null
      ? { ...school, p: school.pEd, ed: true }
      : { ...school, ed: false }
  );
}
