/**
 * src/graph/lib/pulse.js — intent-pulse routing math (pure port of the
 * prototype's runPulse; build-plan G-3.2 groundwork).
 *
 * The component owns the SVG bead + rAF loop; this module plans the route and
 * paces it. Works on any §3.2 edge geometry because the bead follows the real
 * <path> via getPointAtLength — nothing here assumes a curve shape.
 */

export const SEG_MIN_MS = 180;      // per-segment duration clamp
export const SEG_MAX_MS = 400;
export const SEG_MS_PER_UNIT = 0.5; // duration = L * 0.5, clamped
export const ROUTING_LINGER_MS = 300; // .routing class outlives the bead per segment
export const ARRIVED_FLASH_MS = 700;  // .arrived flash on the target card

/** Drawn-edge key set from buildEdges() pairs (direction as drawn). */
export function edgeKeySet(edges) {
  return new Set(edges.map(([a, b]) => `${a}|${b}`));
}

/**
 * Plan bead segments for a root chain (from structure.pathFromRoot).
 * Each hop uses the drawn edge if present in either direction; `rev: true`
 * means the drawn path runs child→parent and the bead must traverse 1→0.
 * Hops with no drawn edge are skipped (prototype behavior).
 *
 * @param {string[]} chain e.g. ['oliver','agents','operator','day-4']
 * @param {Set<string>} keys from edgeKeySet
 * @returns {{ from: string, to: string, rev: boolean }[]}
 */
export function planPulseSegments(chain, keys) {
  const segs = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i], b = chain[i + 1];
    if (keys.has(`${a}|${b}`)) segs.push({ from: a, to: b, rev: false });
    else if (keys.has(`${b}|${a}`)) segs.push({ from: b, to: a, rev: true });
  }
  return segs;
}

/** Bead duration for a segment of path length L (world units). */
export function segDuration(L) {
  return Math.max(SEG_MIN_MS, Math.min(SEG_MAX_MS, L * SEG_MS_PER_UNIT));
}

/** Ease applied to bead progress: linear mid-route, ease-out on the final
 *  segment (prototype: e = t * (2 - t) when arriving). */
export function beadProgress(t, isLastSegment) {
  return isLastSegment ? t * (2 - t) : t;
}

/** Fractional position along the drawn path for a segment at eased progress
 *  e ∈ [0,1] (handles reversed traversal). Multiply by getTotalLength(). */
export function beadPathFraction(e, rev) {
  return rev ? 1 - e : e;
}
