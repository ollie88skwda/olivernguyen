/**
 * src/graph/drift.js — the canvas's idle shimmer (BRAND.md §6, D-27).
 *
 * WHY THIS IS NOT A CSS ANIMATION
 * The obvious implementation is `animation: g-drift 7.5s infinite` on each
 * node. It is also unusable here, and the failure is invisible until you
 * screenshot it: a running transform animation makes Chromium promote that
 * element to its own composited layer, and a composited layer is rasterised in
 * its OWN space before `.g-world`'s `scale(k)` is applied. At the resting fit
 * (k ≈ 0.42) the card's 16px title is a 6.7px raster after the downscale, and
 * the glyphs are dropped entirely — every card on the canvas renders as an
 * empty box. Verified by A/B screenshot: identical frame, shimmer class on →
 * no text, off → text.
 *
 * So the shimmer is driven imperatively instead. Discrete style writes repaint
 * without promoting a layer, so the text rasterises at the composed scale and
 * stays legible. One rAF loop for the whole field (not one per node), throttled
 * to DRIFT_FPS because the motion is ±2.5 WORLD px — at the resting zoom that
 * is under a screen pixel, and nothing about it needs 60fps.
 *
 * Motion budget (§6): transform only, no opacity flicker, no sweep, no spring.
 * The caller does not start it at all under prefers-reduced-motion or ?still,
 * which leaves every card exactly where the static layout puts it.
 */

export const DRIFT_AMP = 2.5;        // world px
export const DRIFT_MIN_PERIOD = 6000;
export const DRIFT_PERIOD_RANGE = 3500;
export const DRIFT_FPS = 20;

/** Deterministic 0..1 from an integer — a per-node phase without Math.random,
 *  so the same node drifts the same way on every mount. */
export function seed(i) {
  const r = Math.sin((i + 1) * 12.9898) * 43758.5453;
  return r - Math.floor(r);
}

/** Offset for one node at time t (ms). Pure — unit-tested. */
export function driftAt(i, t) {
  const f = seed(i);
  const period = DRIFT_MIN_PERIOD + f * DRIFT_PERIOD_RANGE;
  const a = (t / period) * Math.PI * 2 + f * Math.PI * 2;
  return { x: Math.sin(a) * DRIFT_AMP, y: Math.cos(a * 0.8) * DRIFT_AMP };
}

/**
 * Start the shimmer over every `.drift` inside `worldEl`.
 * Returns a stop function that also clears the inline transforms, so the
 * resting DOM is identical to the never-started one.
 */
export default function startDrift(worldEl) {
  if (!worldEl || typeof requestAnimationFrame !== 'function') return () => {};
  const els = Array.from(worldEl.querySelectorAll('.drift'));
  if (!els.length) return () => {};

  const interval = 1000 / DRIFT_FPS;
  let raf = null;
  let last = -Infinity;

  const step = (t) => {
    if (t - last >= interval) {
      last = t;
      for (let i = 0; i < els.length; i += 1) {
        const { x, y } = driftAt(i, t);
        els[i].style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      }
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);

  return () => {
    if (raf) cancelAnimationFrame(raf);
    for (const el of els) el.style.transform = '';
  };
}
