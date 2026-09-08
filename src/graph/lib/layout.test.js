import { describe, it, expect } from 'vitest';
import { POSITIONS, positionOf, dayPosition, nodeHalf, worldBBox, RING } from './layout.js';
import { allEntities } from '../../content/site.js';

describe('layout — authored positions (Gate G1)', () => {
  it('every entity in the content model has a position', () => {
    for (const e of allEntities) {
      const p = positionOf(e.id);
      expect(Number.isFinite(p.x), e.id).toBe(true);
      expect(Number.isFinite(p.y), e.id).toBe(true);
    }
  });

  it('no orphan positions (layout and content stay in sync)', () => {
    const ids = new Set(allEntities.map((e) => e.id));
    for (const id of Object.keys(POSITIONS)) expect(ids.has(id), id).toBe(true);
  });

  it('prototype anchor positions ported verbatim', () => {
    expect(positionOf('oliver')).toEqual({ x: 0, y: 0 });
    expect(positionOf('agents')).toEqual({ x: 500, y: -60 });
    expect(positionOf('operator')).toEqual({ x: 900, y: -430 });
    expect(positionOf('mcp-tools')).toEqual({ x: 1330, y: -140 });
    expect(positionOf('techx')).toEqual({ x: -880, y: -320 });
    expect(positionOf('resume')).toEqual({ x: -470, y: -470 });
  });

  it('unknown id throws (fail loud, not NaN)', () => {
    expect(() => positionOf('nope')).toThrow(/no authored position/);
  });
});

describe('layout — week ring', () => {
  it('ring is centered on the operator node', () => {
    expect(positionOf('operator')).toEqual({ x: RING.cx, y: RING.cy });
  });

  it('7 distinct day positions, r=175, day-1 due north (prototype formula)', () => {
    expect(dayPosition(1)).toEqual({ x: 900, y: -605 });
    const seen = new Set();
    for (let n = 1; n <= 7; n++) {
      const p = positionOf(`day-${n}`);
      expect(p).toEqual(dayPosition(n));
      seen.add(`${p.x},${p.y}`);
      const dist = Math.hypot(p.x - RING.cx, p.y - RING.cy);
      expect(Math.abs(dist - RING.r)).toBeLessThan(1); // rounded to ints
      expect(Number.isInteger(p.x)).toBe(true);
      expect(Number.isInteger(p.y)).toBe(true);
    }
    expect(seen.size).toBe(7);
  });
});

describe('layout — node metrics + bbox', () => {
  it('half-extents per kind match the prototype', () => {
    expect(nodeHalf('root')).toEqual([150, 72]);
    expect(nodeHalf('group')).toEqual([92, 30]);
    expect(nodeHalf('day')).toEqual([48, 20]);
    for (const k of ['project', 'role', 'credential', 'page', 'channel']) {
      expect(nodeHalf(k)).toEqual([106, 48]);
    }
  });

  it('worldBBox contains every node box', () => {
    const bb = worldBBox(allEntities);
    expect(bb.w).toBeGreaterThan(0);
    expect(bb.h).toBeGreaterThan(0);
    for (const e of allEntities) {
      const { x, y } = positionOf(e.id);
      const [hw, hh] = nodeHalf(e.kind);
      expect(x - hw).toBeGreaterThanOrEqual(bb.x);
      expect(x + hw).toBeLessThanOrEqual(bb.x + bb.w);
      expect(y - hh).toBeGreaterThanOrEqual(bb.y);
      expect(y + hh).toBeLessThanOrEqual(bb.y + bb.h);
    }
  });
});
