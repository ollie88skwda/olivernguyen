import { describe, it, expect } from 'vitest';
import {
  edgeKeySet, planPulseSegments, segDuration, beadProgress, beadPathFraction,
  SEG_MIN_MS, SEG_MAX_MS, ROUTING_LINGER_MS, ARRIVED_FLASH_MS,
} from './pulse.js';
import { buildIndex, buildEdges, pathFromRoot } from './structure.js';
import { allEntities } from '../../content/site.js';

const byId = buildIndex(allEntities);
const keys = edgeKeySet(buildEdges(allEntities));

describe('pulse — route planning (Gate G3 groundwork)', () => {
  it('routes root → agents → operator → day-4, all forward', () => {
    const segs = planPulseSegments(pathFromRoot(byId, 'day-4'), keys);
    expect(segs).toEqual([
      { from: 'oliver', to: 'agents', rev: false },
      { from: 'agents', to: 'operator', rev: false },
      { from: 'operator', to: 'day-4', rev: false },
    ]);
  });

  it('every entity has a fully-drawn pulse route (no skipped hops)', () => {
    for (const e of allEntities) {
      const chain = pathFromRoot(byId, e.id);
      const segs = planPulseSegments(chain, keys);
      expect(segs.length, e.id).toBe(chain.length - 1);
    }
  });

  it('root target → no segments (pulse is a no-op)', () => {
    expect(planPulseSegments(pathFromRoot(byId, 'oliver'), keys)).toEqual([]);
  });

  it('reversed drawn edges are traversed 1→0', () => {
    const k = new Set(['b|a']);
    expect(planPulseSegments(['a', 'b'], k)).toEqual([{ from: 'b', to: 'a', rev: true }]);
  });

  it('hops with no drawn edge are skipped (prototype behavior)', () => {
    const k = new Set(['b|c']);
    expect(planPulseSegments(['a', 'b', 'c'], k)).toEqual([{ from: 'b', to: 'c', rev: false }]);
  });
});

describe('pulse — pacing', () => {
  it('segment duration = L/2 clamped to 180–400ms', () => {
    expect(segDuration(100)).toBe(SEG_MIN_MS);
    expect(segDuration(500)).toBe(250);
    expect(segDuration(2000)).toBe(SEG_MAX_MS);
  });

  it('ease-out only on the arrival segment', () => {
    expect(beadProgress(0.5, false)).toBe(0.5);
    expect(beadProgress(0.5, true)).toBeCloseTo(0.75, 9);
    expect(beadProgress(1, true)).toBe(1);
    expect(beadProgress(0, true)).toBe(0);
  });

  it('reversed traversal mirrors the path fraction', () => {
    expect(beadPathFraction(0.25, false)).toBe(0.25);
    expect(beadPathFraction(0.25, true)).toBe(0.75);
  });

  it('flash/linger timings match the prototype', () => {
    expect(ROUTING_LINGER_MS).toBe(300);
    expect(ARRIVED_FLASH_MS).toBe(700);
  });
});
