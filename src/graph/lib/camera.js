/**
 * src/graph/lib/camera.js — pure camera math (build-plan G-2.2 groundwork,
 * ported from prototype/graph/app.js; rationale in 06-graph-research §4).
 *
 * A transform t = { k, x, y } maps world → screen: screen = world * k + (x, y)
 * (same semantics as d3.zoomTransform). Everything here is pure — the React
 * `useCamera` hook owns d3-zoom/DOM and calls into this module. Viewport is
 * always passed in as { w, h }; no globals.
 */

/* ---- constants (prototype-tuned; do not retune without screenshots) ---- */

// Zoom-out floor lowered 0.35 → 0.25 (2026-08-25). fitTransform clamps to this
// floor, so a bbox that needs less than the floor to fit STOPS FITTING — nodes
// fall off the edge at rest. The authored layout needs ~0.42 at 1440×900, so
// 0.35 left room for barely half again as many nodes. 0.25 roughly doubles the
// world that can be framed, and only ever permits more zoom-out.
export const SCALE_EXTENT = [0.25, 2.2];
export const TRANSLATE_PAD = { x: 700, y: 600 };     // world-units slack around bbox
// topInset/bottomInset are chrome the camera must frame CLEAR of: the site bar
// overlays the top of the stage, the prompt bar the bottom. topInset defaults
// to 0 and is supplied per-call, because the dev harness has no site bar.
export const FIT = { pad: 90, kMax: 1.1, topInset: 0, bottomInset: 120 };
export const CLUSTER_FIT = { pad: 130, kMax: 1.2, topInset: 0, bottomInset: 120 };
export const FLY_MIN_MS = 380;                       // van Wijk duration clamp
export const FLY_MAX_MS = 1050;
export const FLY_SCALE = 0.9;                        // × d3.interpolateZoom's duration
export const INERTIA_TAU = 240;                      // exp(-dt/240) decay
export const INERTIA_START_MIN = 0.12;               // px/ms — below this, no glide
export const INERTIA_STOP = 0.015;                   // px/ms — glide ends
export const INERTIA_STALE_MS = 100;                 // release long after last move = no glide
export const INERTIA_MAX_FRAME_MS = 40;
export const GRID_BASE = 26;                         // dot-grid cell at k=1
export const FAR_K = 0.45;                           // below this: semantic-zoom far mode
// …but never above this fraction of the RESTING zoom. Semantic zoom means "you
// zoomed out past the view you started at", and the resting view is the fit.
// With a fixed 0.45 the two collide as soon as the graph is big enough to fit
// below 0.45 — every card loses its kicker and description at rest, which is
// exactly when more nodes make labels matter more. See farThreshold().
export const FAR_RATIO = 0.85;
export const FOCUS_K = { root: 1, day: 1.3, default: 1.15 };

export const identity = { k: 1, x: 0, y: 0 };

/* ------------------------------ transforms ------------------------------ */

/** CSS transform for the world div. */
export function worldCss(t) {
  return `translate(${t.x}px, ${t.y}px) scale(${t.k})`;
}

/** Dot-grid background sync for the stage. */
export function gridCss(t) {
  return {
    backgroundPosition: `${t.x}px ${t.y}px`,
    backgroundSize: `${GRID_BASE * t.k}px ${GRID_BASE * t.k}px`,
  };
}

export function worldToScreen(t, p) {
  return { x: p.x * t.k + t.x, y: p.y * t.k + t.y };
}

export function screenToWorld(t, p) {
  return { x: (p.x - t.x) / t.k, y: (p.y - t.y) / t.k };
}

/** d3.interpolateZoom view triple [cx, cy, w] for a transform. */
export function viewOf(t, vp) {
  return [(vp.w / 2 - t.x) / t.k, (vp.h / 2 - t.y) / t.k, vp.w / t.k];
}

/** Inverse of viewOf — drive zoom.transform from interpolateZoom frames. */
export function transformOfView(view, vp) {
  const k = vp.w / view[2];
  return { k, x: vp.w / 2 - k * view[0], y: vp.h / 2 - k * view[1] };
}

/* ------------------------------- framing ------------------------------- */

/** Transform that frames a world bbox in the viewport: clamped scale, centered
 *  in the band left between the top and bottom chrome. */
export function boundsTransform(bb, vp, opts = FIT) {
  const { pad, kMax, topInset = 0, bottomInset = 0 } = opts;
  const vh = vp.h - topInset - bottomInset;
  const k = Math.max(
    SCALE_EXTENT[0],
    Math.min(kMax, Math.min(vp.w / (bb.w + pad * 2), vh / (bb.h + pad * 2))),
  );
  const cx = bb.x + bb.w / 2;
  const cy = bb.y + bb.h / 2;
  return { k, x: vp.w / 2 - k * cx, y: topInset + vh / 2 - k * cy };
}

export function fitTransform(bb, vp, topInset = 0) {
  return boundsTransform(bb, vp, { ...FIT, topInset });
}

/** The zoom below which leaf detail is hidden (semantic zoom).
 *  Never above FAR_RATIO of the resting fit, so the resting view always keeps
 *  its labels however many nodes the graph grows to. */
export function farThreshold(fitK) {
  return Math.min(FAR_K, fitK * FAR_RATIO);
}

/** Dossier panel width at a viewport width (prototype). */
export function dossierWidth(vw) {
  return Math.min(430, vw * 0.34);
}

/** Focus transform: node eased to the center of the space left of the
 *  dossier, at a kind-dependent zoom. */
export function focusTransform(node, pos, vp, topInset = 0) {
  const k = FOCUS_K[node.kind] ?? FOCUS_K.default;
  const px = (vp.w - dossierWidth(vp.w)) / 2;
  const py = topInset + (vp.h - topInset) * 0.5;
  return { k, x: px - k * pos.x, y: py - k * pos.y };
}

/** translateExtent for d3-zoom: bbox + slack. */
export function translateExtent(bb) {
  return [
    [bb.x - TRANSLATE_PAD.x, bb.y - TRANSLATE_PAD.y],
    [bb.x + bb.w + TRANSLATE_PAD.x, bb.y + bb.h + TRANSLATE_PAD.y],
  ];
}

/* ------------------------------ fly pacing ------------------------------ */

/** Clamp d3.interpolateZoom's suggested duration to prototype pacing.
 *  reducedMotion → 0 (instant). */
export function flyDuration(interpDurationMs, reducedMotion = false) {
  if (reducedMotion) return 0;
  return Math.max(FLY_MIN_MS, Math.min(FLY_MAX_MS, interpDurationMs * FLY_SCALE));
}

/* ---------------------------- release inertia ---------------------------- */

/**
 * Screen-space velocity (px/ms) at drag release, from pointer samples
 * [{ x, y, t }] (last ≤4 kept by the hook). Returns null when the glide
 * should not start: <2 samples, stale release, or too slow.
 */
export function releaseVelocity(samples, now) {
  if (!samples || samples.length < 2) return null;
  const a = samples[samples.length - 2];
  const b = samples[samples.length - 1];
  const dt = b.t - a.t;
  if (now - b.t > INERTIA_STALE_MS || dt <= 0) return null;
  const vx = (b.x - a.x) / dt;
  const vy = (b.y - a.y) / dt;
  if (Math.hypot(vx, vy) < INERTIA_START_MIN) return null;
  return { vx, vy };
}

/** One glide frame: translation delta (screen px) + decayed velocity.
 *  Glide stops when `next` is null. */
export function inertiaStep(v, dtMs) {
  const d = Math.min(INERTIA_MAX_FRAME_MS, dtMs);
  const f = Math.exp(-d / INERTIA_TAU);
  const nvx = v.vx * f;
  const nvy = v.vy * f;
  return {
    dx: v.vx * d,
    dy: v.vy * d,
    next: Math.hypot(nvx, nvy) > INERTIA_STOP ? { vx: nvx, vy: nvy } : null,
  };
}
