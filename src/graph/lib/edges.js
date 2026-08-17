/**
 * src/graph/lib/edges.js — pluggable edge geometry (build-plan §3.2, L10).
 *
 * Oliver dislikes the prototype's quadratic-bézier "roads" (perpendicular
 * offset = dist * 0.08). Replacement: `edgePath(a, b, style)` returns an SVG
 * path `d` string. Three candidates, switchable via `?edges=` (resolveEdgeStyle):
 *
 *   arc      — gentle circular arc, sagitta ≈ min(dist * 0.025, 18px):
 *              near-straight, soft bow.
 *   elbow    — straight segments with a rounded fillet (r ~14px) at a single
 *              bend on the dominant axis; reads as circuit-trace, not road.
 *   weighted — SHIP DEFAULT. Edges < 220 world units render straight; longer
 *              edges ease up to the arc sagitta cap. Short local links stay
 *              crisp, long cross-cluster links stay graceful.
 *
 * Invariants (all styles — the renderer depends on these):
 *   - ONE `<path>` per edge: single subpath, exactly one M command.
 *   - Drawn parent→child: d starts at `a` (parent) and ends exactly at `b`.
 *   - Plain path commands only (M/L/Q/A) so `pathLength="1"` draw-in animation
 *     and the intent-pulse bead (`getTotalLength`/`getPointAtLength`) work
 *     unchanged.
 *
 * Pure module: no DOM, no imports.
 */

export const EDGE_STYLES = ['arc', 'elbow', 'weighted'];
export const DEFAULT_EDGE_STYLE = 'weighted';

export const ARC_SAGITTA_RATIO = 0.025;
export const ARC_SAGITTA_MAX = 18;
export const WEIGHTED_STRAIGHT_MAX = 220;   // world units — below this, weighted = straight
export const WEIGHTED_RAMP = 260;           // distance over which curvature eases in
export const ELBOW_FILLET = 14;
const MIN_SAGITTA = 0.5;                    // below this a curve is visually a line

const fmt = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};
const pt = (p) => `${fmt(p.x)} ${fmt(p.y)}`;
const line = (a, b) => `M ${pt(a)} L ${pt(b)}`;

/** Arc depth for the `arc` style at a given chord length. */
export function arcSagitta(dist) {
  return Math.min(dist * ARC_SAGITTA_RATIO, ARC_SAGITTA_MAX);
}

/** Arc depth for the `weighted` style: 0 below the straight threshold, then
 *  eases (ease-out quad) up to the `arc` sagitta. */
export function weightedSagitta(dist) {
  if (dist <= WEIGHTED_STRAIGHT_MAX) return 0;
  const t = Math.min(1, (dist - WEIGHTED_STRAIGHT_MAX) / WEIGHTED_RAMP);
  return arcSagitta(dist) * t * (2 - t);
}

/* Circular arc through a→b with sagitta s (bulge side fixed relative to the
   direction of travel, so sibling edges bow consistently). */
function arcPath(a, b, s, dist) {
  if (s < MIN_SAGITTA) return line(a, b);
  const R = (dist * dist / 4 + s * s) / (2 * s);
  return `M ${pt(a)} A ${fmt(R)} ${fmt(R)} 0 0 1 ${pt(b)}`;
}

/* Dominant-axis elbow: run the long axis first, one rounded bend, then the
   short axis. Degenerates to a straight line when either axis is ~0. */
function elbowPath(a, b, dx, dy) {
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < MIN_SAGITTA || ady < MIN_SAGITTA) return line(a, b);
  const c = adx >= ady ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  const dAC = Math.hypot(c.x - a.x, c.y - a.y);
  const dCB = Math.hypot(b.x - c.x, b.y - c.y);
  const r = Math.min(ELBOW_FILLET, dAC, dCB);
  const u1 = { x: (c.x - a.x) / dAC, y: (c.y - a.y) / dAC };
  const u2 = { x: (b.x - c.x) / dCB, y: (b.y - c.y) / dCB };
  const p1 = { x: c.x - u1.x * r, y: c.y - u1.y * r };
  const p2 = { x: c.x + u2.x * r, y: c.y + u2.y * r };
  return `M ${pt(a)} L ${pt(p1)} Q ${pt(c)} ${pt(p2)} L ${pt(b)}`;
}

/**
 * @param {{x:number,y:number}} a parent endpoint (path start)
 * @param {{x:number,y:number}} b child endpoint (path end)
 * @param {'arc'|'elbow'|'weighted'} style
 * @returns {string} SVG path `d`
 */
export function edgePath(a, b, style = DEFAULT_EDGE_STYLE) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return line(a, b);
  switch (style) {
    case 'arc': return arcPath(a, b, arcSagitta(dist), dist);
    case 'elbow': return elbowPath(a, b, dx, dy);
    case 'weighted': return arcPath(a, b, weightedSagitta(dist), dist);
    default: throw new Error(`edgePath: unknown style "${style}"`);
  }
}

/** Resolve the active style from a query string (`?edges=arc|elbow|weighted`).
 *  Anything else → ship default. Pure: pass `location.search` in. */
export function resolveEdgeStyle(search) {
  const v = new URLSearchParams(search || '').get('edges');
  return EDGE_STYLES.includes(v) ? v : DEFAULT_EDGE_STYLE;
}
