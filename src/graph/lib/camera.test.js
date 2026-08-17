import { describe, it, expect } from 'vitest';
import {
  identity, worldCss, gridCss, worldToScreen, screenToWorld,
  viewOf, transformOfView, boundsTransform, fitTransform, dossierWidth,
  focusTransform, translateExtent, flyDuration, releaseVelocity, inertiaStep,
  SCALE_EXTENT, FIT, FLY_MIN_MS, FLY_MAX_MS, FAR_K, GRID_BASE,
} from './camera.js';
import { worldBBox } from './layout.js';
import { allEntities } from '../../content/site.js';

const VP = { w: 1440, h: 900 };
const BB = worldBBox(allEntities);

describe('camera — transform math', () => {
  it('world↔screen round-trip', () => {
    const t = { k: 1.3, x: -120, y: 45 };
    const p = { x: 900, y: -430 };
    expect(screenToWorld(t, worldToScreen(t, p)).x).toBeCloseTo(p.x, 9);
    expect(screenToWorld(t, worldToScreen(t, p)).y).toBeCloseTo(p.y, 9);
  });

  it('viewOf ↔ transformOfView round-trip (van Wijk fly-to plumbing)', () => {
    const t = { k: 0.8, x: 200, y: -60 };
    const back = transformOfView(viewOf(t, VP), VP);
    expect(back.k).toBeCloseTo(t.k, 9);
    expect(back.x).toBeCloseTo(t.x, 9);
    expect(back.y).toBeCloseTo(t.y, 9);
  });

  it('css strings match the prototype format', () => {
    expect(worldCss({ k: 1.5, x: 10, y: -20 })).toBe('translate(10px, -20px) scale(1.5)');
    const g = gridCss({ k: 2, x: 5, y: 6 });
    expect(g.backgroundPosition).toBe('5px 6px');
    expect(g.backgroundSize).toBe(`${GRID_BASE * 2}px ${GRID_BASE * 2}px`);
  });
});

describe('camera — framing', () => {
  it('fitTransform centers the graph bbox above the bottom chrome', () => {
    const t = fitTransform(BB, VP);
    const c = worldToScreen(t, { x: BB.x + BB.w / 2, y: BB.y + BB.h / 2 });
    expect(c.x).toBeCloseTo(VP.w / 2, 6);
    expect(c.y).toBeCloseTo((VP.h - FIT.bottomInset) / 2, 6);
    expect(t.k).toBeGreaterThanOrEqual(SCALE_EXTENT[0]);
    expect(t.k).toBeLessThanOrEqual(FIT.kMax);
  });

  it('whole graph is visible at fit', () => {
    const t = fitTransform(BB, VP);
    const tl = worldToScreen(t, { x: BB.x, y: BB.y });
    const br = worldToScreen(t, { x: BB.x + BB.w, y: BB.y + BB.h });
    expect(tl.x).toBeGreaterThanOrEqual(0);
    expect(tl.y).toBeGreaterThanOrEqual(0);
    expect(br.x).toBeLessThanOrEqual(VP.w);
    expect(br.y).toBeLessThanOrEqual(VP.h - 0); // inset already applied to center
  });

  it('kMax clamps tiny bboxes (no over-zoom on cluster fit)', () => {
    const t = boundsTransform({ x: 0, y: 0, w: 10, h: 10 }, VP, FIT);
    expect(t.k).toBe(FIT.kMax);
  });

  it('dossierWidth: 34vw capped at 430', () => {
    expect(dossierWidth(1440)).toBe(430);
    expect(dossierWidth(1000)).toBeCloseTo(340, 6);
  });

  it('focusTransform puts the node center-left of the dossier at kind zoom', () => {
    const pos = { x: 900, y: -430 };
    for (const [kind, k] of [['root', 1], ['day', 1.3], ['project', 1.15]]) {
      const t = focusTransform({ kind }, pos, VP);
      expect(t.k).toBe(k);
      const s = worldToScreen(t, pos);
      expect(s.x).toBeCloseTo((VP.w - dossierWidth(VP.w)) / 2, 6);
      expect(s.y).toBeCloseTo(VP.h * 0.5, 6);
    }
  });

  it('translateExtent pads the bbox by 700×600 (prototype)', () => {
    const [[x0, y0], [x1, y1]] = translateExtent(BB);
    expect(x0).toBe(BB.x - 700);
    expect(y0).toBe(BB.y - 600);
    expect(x1).toBe(BB.x + BB.w + 700);
    expect(y1).toBe(BB.y + BB.h + 600);
  });
});

describe('camera — fly pacing', () => {
  it('clamps to 380–1050ms and scales by 0.9', () => {
    expect(flyDuration(100)).toBe(FLY_MIN_MS);
    expect(flyDuration(600)).toBeCloseTo(540, 6);
    expect(flyDuration(5000)).toBe(FLY_MAX_MS);
  });
  it('reduced motion → instant', () => {
    expect(flyDuration(600, true)).toBe(0);
  });
});

describe('camera — release inertia (exp(-dt/240))', () => {
  const samples = [
    { x: 0, y: 0, t: 0 },
    { x: 10, y: 0, t: 16 },
    { x: 24, y: 2, t: 32 },
  ];

  it('velocity from the last two samples', () => {
    const v = releaseVelocity(samples, 40);
    expect(v.vx).toBeCloseTo(14 / 16, 6);
    expect(v.vy).toBeCloseTo(2 / 16, 6);
  });

  it('no glide when stale, slow, or under-sampled', () => {
    expect(releaseVelocity(samples, 200)).toBeNull();          // released late
    expect(releaseVelocity([samples[0]], 10)).toBeNull();      // one sample
    expect(releaseVelocity(null, 10)).toBeNull();
    const slow = [{ x: 0, y: 0, t: 0 }, { x: 1, y: 0, t: 16 }]; // 0.0625 px/ms
    expect(releaseVelocity(slow, 20)).toBeNull();
  });

  it('decays with tau=240 and stops below 0.015 px/ms', () => {
    let v = { vx: 1, vy: 0 };
    const s = inertiaStep(v, 24);
    expect(s.dx).toBeCloseTo(24, 6);
    expect(s.next.vx).toBeCloseTo(Math.exp(-24 / 240), 6);
    // long frames are capped at 40ms of travel
    expect(inertiaStep(v, 500).dx).toBeCloseTo(40, 6);
    // glide terminates
    let steps = 0;
    let cur = { vx: 1, vy: 0.5 };
    while (cur && steps < 500) {
      cur = inertiaStep(cur, 16).next;
      steps++;
    }
    expect(cur).toBeNull();
    expect(steps).toBeLessThan(200);
  });

  it('far-fade threshold matches the prototype', () => {
    expect(FAR_K).toBe(0.45);
  });
});
