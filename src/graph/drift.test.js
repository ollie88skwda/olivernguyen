import { describe, it, expect } from 'vitest';
import startDrift, {
  driftAt, seed, DRIFT_AMP, DRIFT_MIN_PERIOD, DRIFT_PERIOD_RANGE,
} from './drift.js';

describe('graph idle shimmer (BRAND.md §6 / D-27)', () => {
  it('seed is deterministic and in range', () => {
    for (let i = 0; i < 30; i += 1) {
      expect(seed(i)).toBeGreaterThanOrEqual(0);
      expect(seed(i)).toBeLessThan(1);
      expect(seed(i)).toBe(seed(i)); // same node, same drift, every mount
    }
  });

  it('stays inside the ±2.5 world-px amplitude §6 allows', () => {
    for (let i = 0; i < 30; i += 1) {
      for (let t = 0; t < 20000; t += 250) {
        const { x, y } = driftAt(i, t);
        expect(Math.abs(x)).toBeLessThanOrEqual(DRIFT_AMP + 1e-9);
        expect(Math.abs(y)).toBeLessThanOrEqual(DRIFT_AMP + 1e-9);
      }
    }
  });

  it('nodes are out of phase — the field breathes, it does not pulse', () => {
    const t = 3000;
    const xs = Array.from({ length: 12 }, (_, i) => driftAt(i, t).x);
    const unique = new Set(xs.map((x) => x.toFixed(3)));
    expect(unique.size).toBe(xs.length);
  });

  it('every node cycles between 6s and 9.5s', () => {
    for (let i = 0; i < 30; i += 1) {
      const period = DRIFT_MIN_PERIOD + seed(i) * DRIFT_PERIOD_RANGE;
      expect(period).toBeGreaterThanOrEqual(DRIFT_MIN_PERIOD);
      expect(period).toBeLessThanOrEqual(DRIFT_MIN_PERIOD + DRIFT_PERIOD_RANGE);
    }
  });

  it('is a no-op without a world element, and stopping restores the DOM', () => {
    expect(startDrift(null)()).toBeUndefined();

    const world = document.createElement('div');
    const a = document.createElement('div');
    a.className = 'drift';
    world.appendChild(a);
    document.body.appendChild(world);

    const stop = startDrift(world);
    a.style.transform = 'translate(1px, 1px)'; // pretend a frame ran
    stop();
    expect(a.style.transform).toBe('');
    document.body.removeChild(world);
  });
});
