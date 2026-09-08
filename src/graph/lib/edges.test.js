import { describe, it, expect } from 'vitest';
import {
  edgePath, resolveEdgeStyle, arcSagitta, weightedSagitta,
  EDGE_STYLES, DEFAULT_EDGE_STYLE,
  ARC_SAGITTA_MAX, WEIGHTED_STRAIGHT_MAX,
} from './edges.js';

/* tiny d-string helpers */
const nums = (d) => d.match(/-?\d+(?:\.\d+)?/g).map(Number);
const first = (d) => nums(d).slice(0, 2);
const last = (d) => nums(d).slice(-2);
const cmds = (d) => d.match(/[A-Za-z]/g);

const A = { x: 0, y: 0 };
const CASES = [
  [{ x: 0, y: 0 }, { x: 100, y: 40 }],          // short
  [{ x: 0, y: 0 }, { x: 500, y: -60 }],         // long, dx dominant
  [{ x: 900, y: -430 }, { x: 900, y: -605 }],   // vertical (operator → day-1)
  [{ x: -500, y: -180 }, { x: -880, y: -320 }], // negative coords
  [{ x: 12.5, y: -3.25 }, { x: -200.75, y: 310.5 }], // non-integer
];

describe('edgePath invariants — all styles (Gate G1)', () => {
  for (const style of EDGE_STYLES) {
    describe(style, () => {
      it('single subpath: exactly one M, drawn parent→child, endpoints exact', () => {
        for (const [a, b] of CASES) {
          const d = edgePath(a, b, style);
          expect(cmds(d).filter((c) => c.toUpperCase() === 'M')).toHaveLength(1);
          expect(d[0]).toBe('M');
          const [sx, sy] = first(d);
          const [ex, ey] = last(d);
          expect(sx).toBeCloseTo(a.x, 2);
          expect(sy).toBeCloseTo(a.y, 2);
          expect(ex).toBeCloseTo(b.x, 2);
          expect(ey).toBeCloseTo(b.y, 2);
        }
      });

      it('uses only pathLength-safe commands (M/L/Q/A)', () => {
        for (const [a, b] of CASES) {
          for (const c of cmds(edgePath(a, b, style))) {
            expect('MLQA').toContain(c.toUpperCase());
          }
        }
      });

      it('degenerate zero-length edge yields a valid path, no NaN', () => {
        const d = edgePath(A, { x: 0, y: 0 }, style);
        expect(d).not.toMatch(/NaN/);
        expect(d[0]).toBe('M');
      });
    });
  }

  it('unknown style throws', () => {
    expect(() => edgePath(A, { x: 10, y: 10 }, 'roads')).toThrow(/unknown style/);
  });
});

describe('arc style', () => {
  it('long edges render as a circular arc (A command)', () => {
    expect(edgePath(A, { x: 600, y: 0 }, 'arc')).toContain('A');
  });
  it('sagitta caps at 18 world units', () => {
    expect(arcSagitta(400)).toBeCloseTo(10, 5);
    expect(arcSagitta(5000)).toBe(ARC_SAGITTA_MAX);
  });
  it('tiny edges degrade to a straight line (no numeric blow-up)', () => {
    expect(edgePath(A, { x: 10, y: 0 }, 'arc')).toBe('M 0 0 L 10 0');
  });
});

describe('elbow style', () => {
  it('two straight legs + one rounded fillet (Q) at the bend', () => {
    const d = edgePath(A, { x: 300, y: 120 }, 'elbow');
    expect(cmds(d).join('')).toBe('MLQL');
  });
  it('bend runs the dominant axis first', () => {
    // dx dominant → first leg horizontal (same y as start)
    const d = edgePath({ x: 0, y: 50 }, { x: 300, y: 120 }, 'elbow');
    const n = nums(d);
    expect(n[3]).toBeCloseTo(50, 2); // y of first L point
    // dy dominant → first leg vertical (same x as start)
    const d2 = edgePath({ x: 40, y: 0 }, { x: 120, y: 400 }, 'elbow');
    const n2 = nums(d2);
    expect(n2[2]).toBeCloseTo(40, 2); // x of first L point
  });
  it('axis-aligned edges degrade to a straight line', () => {
    expect(edgePath(A, { x: 250, y: 0 }, 'elbow')).toBe('M 0 0 L 250 0');
    expect(edgePath(A, { x: 0, y: -250 }, 'elbow')).toBe('M 0 0 L 0 -250');
  });
});

describe('weighted style (ship default)', () => {
  it('is the default', () => {
    expect(DEFAULT_EDGE_STYLE).toBe('weighted');
  });
  it('straight below the 220-unit threshold', () => {
    expect(edgePath(A, { x: 219, y: 0 }, 'weighted')).toBe('M 0 0 L 219 0');
    expect(edgePath(A, { x: WEIGHTED_STRAIGHT_MAX, y: 0 }, 'weighted')).toBe(`M 0 0 L ${WEIGHTED_STRAIGHT_MAX} 0`);
    expect(edgePath({ x: 100, y: 100 }, { x: 200, y: 180 }, 'weighted')).toBe('M 100 100 L 200 180');
  });
  it('long edges curve, easing toward the arc sagitta', () => {
    expect(edgePath(A, { x: 600, y: 0 }, 'weighted')).toContain('A');
    expect(weightedSagitta(200)).toBe(0);
    expect(weightedSagitta(480)).toBe(arcSagitta(480)); // ramp complete
    const mid = weightedSagitta(350);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(arcSagitta(350));
  });
  it('curvature is continuous at the threshold (no visual pop)', () => {
    expect(weightedSagitta(221)).toBeLessThan(0.1);
  });
});

describe('resolveEdgeStyle (?edges= dev switch)', () => {
  it('parses valid styles', () => {
    expect(resolveEdgeStyle('?edges=arc')).toBe('arc');
    expect(resolveEdgeStyle('?edges=elbow')).toBe('elbow');
    expect(resolveEdgeStyle('?edges=weighted')).toBe('weighted');
    expect(resolveEdgeStyle('?still&edges=arc')).toBe('arc');
  });
  it('falls back to the ship default', () => {
    expect(resolveEdgeStyle('')).toBe('weighted');
    expect(resolveEdgeStyle(undefined)).toBe('weighted');
    expect(resolveEdgeStyle('?edges=roads')).toBe('weighted');
  });
});
