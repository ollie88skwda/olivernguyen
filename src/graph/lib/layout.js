/**
 * src/graph/lib/layout.js — authored world-space layout (build-plan G-1.3).
 *
 * Positions are hand-tuned, ported verbatim from prototype/graph/app.js.
 * Content (src/content/site.js) is position-free; this module is the only
 * place world coordinates live. Pure: no DOM, no imports.
 */

/** Operator week ring (7 day nodes around the operator node). */
export const RING = { cx: 900, cy: -430, r: 175, startDeg: -90, count: 7 };

const AUTHORED = {
  oliver: [0, 0],
  /* agents */
  agents: [500, -60],
  operator: [900, -430],
  'mac-agent': [1060, -30],
  'mcp-tools': [1330, -140],
  scopecreep: [880, 200],
  articlewriter: [650, 360],
  /* robotics */
  robotics: [-500, -180],
  techx: [-880, -320],
  worlds: [-940, -80],
  /* leadership */
  leadership: [-420, 240],
  'virtual-enterprise': [-800, 200],
  'eagle-scout': [-680, 430],
  /* pages */
  pages: [120, 460],
  pull: [-140, 640],
  permit: [160, 700],
  license: [430, 760],
  'sat-resources': [580, 560],
  /* contact */
  contact: [-40, -380],
  email: [230, -540],
  github: [10, -660],
  linkedin: [-250, -620],
  resume: [-470, -470],
};

/** Ring position for day n (1-based), same formula/rounding as the prototype. */
export function dayPosition(n) {
  const a = ((RING.startDeg + (n - 1) * (360 / RING.count)) * Math.PI) / 180;
  return {
    x: Math.round(RING.cx + RING.r * Math.cos(a)),
    y: Math.round(RING.cy + RING.r * Math.sin(a)),
  };
}

/** id → { x, y } for all 30 nodes. */
export const POSITIONS = (() => {
  const m = {};
  for (const [id, [x, y]] of Object.entries(AUTHORED)) m[id] = { x, y };
  for (let n = 1; n <= RING.count; n++) m[`day-${n}`] = dayPosition(n);
  return m;
})();

export function positionOf(id) {
  const p = POSITIONS[id];
  if (!p) throw new Error(`layout: no authored position for "${id}"`);
  return p;
}

/** Node half-extents [hw, hh] in world units, per kind (prototype HALF). */
export function nodeHalf(kind) {
  if (kind === 'root') return [150, 72];
  if (kind === 'group') return [92, 30];
  if (kind === 'day') return [48, 20];
  return [106, 48]; // leaf card
}

/** Bounding box of a set of entities ({ id, kind }) in world space. */
export function worldBBox(ents) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of ents) {
    const { x, y } = positionOf(e.id);
    const [hw, hh] = nodeHalf(e.kind);
    if (x - hw < x0) x0 = x - hw;
    if (x + hw > x1) x1 = x + hw;
    if (y - hh < y0) y0 = y - hh;
    if (y + hh > y1) y1 = y + hh;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
