import { createSeed } from './seed';
import { computeAHP } from '../major/model';

describe('seeded duels', () => {
  const doc = createSeed();
  const { weights, consistencyRatio } = computeAHP(doc.criteria, doc.pairwise);

  test('derive the intended weights rather than hardcoding them', () => {
    expect(weights.programs).toBeCloseTo(0.375, 2);
    expect(weights.strength).toBeCloseTo(0.313, 2);
    expect(weights.undecided).toBeCloseTo(0.25, 2);
    expect(weights.kines).toBeCloseTo(0.062, 2);
    expect(
      weights.programs + weights.strength + weights.undecided + weights.kines
    ).toBeCloseTo(1, 10);
  });

  test('kinesiology is capped, not deleted', () => {
    // The stated decision: a nice-to-have, not a co-equal criterion. It should be small
    // enough not to drive the ranking and large enough to still break ties.
    expect(weights.kines).toBeLessThan(0.1);
    expect(weights.kines).toBeGreaterThan(0.02);
  });

  test('special-program access outranks raw program strength', () => {
    expect(weights.programs).toBeGreaterThan(weights.strength);
  });

  test('the seeded answers are mutually consistent', () => {
    // A contradictory set of duels would make computeAHP widen its Monte Carlo jitter and
    // quietly undermine every downstream number. AHP convention is CR < 0.1.
    expect(consistencyRatio).toBeLessThan(0.1);
  });
});

describe('seed doc', () => {
  const doc = createSeed();

  test('carries the researched schools and programs', () => {
    expect(doc.schools.length).toBeGreaterThan(0);
    expect(doc.programs.length).toBeGreaterThan(0);
  });

  // Stronger than the assertion this replaces. The old test checked that personal fields
  // were empty; this checks they cannot be in the shared document at all. /apply is
  // planned to be a public page reading a row the anon key can fetch, so "empty" was never
  // the guarantee worth having.
  test('carries no profile key at all — personal data never enters the shared doc', () => {
    expect('profile' in doc).toBe(false);
  });

  test('program strength stays a placeholder — it is a judgement, not a fact', () => {
    doc.schools.forEach((school) => {
      expect(school.scores.strength.basis).toMatch(/TODO/);
    });
  });

  test('every school carries a needsResearch list rather than implying completeness', () => {
    doc.schools.forEach((school) => {
      expect(Array.isArray(school.needsResearch)).toBe(true);
    });
  });

  test('is a factory — two callers cannot share mutable state', () => {
    const a = createSeed();
    const b = createSeed();
    a.settings.rho = 0.9;

    expect(b.settings.rho).toBe(0.6);
  });

  test('records the refuted senior-only assumption instead of silently dropping it', () => {
    const refuted = doc.assumptions.find((a) => a.id === 'a-senior-only');

    expect(refuted.status).toBe('refuted');
    expect(refuted.note).toMatch(/M&T|M\.E\.T\./);
  });
});
