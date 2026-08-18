/**
 * src/terminal/panes/tree.js — binary split tree for terminal panes.
 * Build-plan 11 §5 contract + 09 §C grammar. PURE: no DOM, no React.
 *
 * Node shapes (exactly Herdr's model, 09 §C sketch):
 *   { type:'split', dir:'right'|'down', ratio:0..1, a:<node>, b:<node> }
 *   { type:'leaf',  id:'main'|'pN', program:string|null, title?:string }
 *
 * All mutating ops are immutable (structural sharing) and return
 *   { ok:true, tree, ... }  or  { ok:false, err:'E…' }
 * — core prints `err` in the statusbar verbatim (P7).
 *
 * Limits (P7) enforced HERE: max 4 panes, split depth 2 per axis,
 * min pane ~40ch × 12 rows (checked only when dims are supplied),
 * ratio clamped [0.2, 0.8]. 'main' refuses close.
 */

export const MAX_PANES = 4;
export const MAX_DEPTH_PER_AXIS = 2;
export const MIN_COLS = 40;
export const MIN_ROWS = 12;
export const RATIO_MIN = 0.2;
export const RATIO_MAX = 0.8;
export const RESIZE_STEP = 0.05;

const EPS = 1e-6;

/** Statusbar-printable E-errors (vim-styled numbers, our own grammar). */
export const ERR = {
  MAX_PANES: `E94: pane limit reached (max ${MAX_PANES})`,
  DEPTH: `E95: split depth limit (${MAX_DEPTH_PER_AXIS} per axis)`,
  MIN_SIZE: `E96: pane too small to split (min ${MIN_COLS}\u00d7${MIN_ROWS})`,
  CLOSE_MAIN: `E97: 'main' refuses close`,
  NOT_FOUND: `E98: no such pane`,
  NO_AXIS: `E99: nothing to resize on that axis`,
};

/** Boot state: one full-screen main pane (09 §C defaults). */
export function createTree() {
  return { type: 'leaf', id: 'main', program: 'main' };
}

/** All leaves, in-order (a before b) — render + cycle + statusbar order. */
export function leaves(tree) {
  if (tree.type === 'leaf') return [tree];
  return [...leaves(tree.a), ...leaves(tree.b)];
}

/** Leaf node by id, or null. */
export function findLeaf(tree, id) {
  return leaves(tree).find((l) => l.id === id) ?? null;
}

/** Root→leaf node path (splits then the leaf), or null when id is absent. */
function pathTo(node, id, acc = []) {
  if (node.type === 'leaf') return node.id === id ? [...acc, node] : null;
  return pathTo(node.a, id, [...acc, node]) || pathTo(node.b, id, [...acc, node]);
}

/** Next fresh pane id: p2, p3, … (main is conceptually p1). */
function nextId(tree) {
  let max = 1;
  for (const l of leaves(tree)) {
    const m = /^p(\d+)$/.exec(l.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `p${max + 1}`;
}

/** Immutable node replacement by identity, with structural sharing. */
function replaceNode(node, target, replacement) {
  if (node === target) return replacement;
  if (node.type === 'leaf') return node;
  const a = replaceNode(node.a, target, replacement);
  const b = replaceNode(node.b, target, replacement);
  if (a === node.a && b === node.b) return node;
  return { ...node, a, b };
}

/**
 * Fractional rects for every leaf in the unit box (x/y/w/h ∈ 0..1).
 * Pure geometry feed for focusDir and min-size checks; PaneGrid renders
 * the same fractions via nested flex, so adjacency here mirrors the DOM.
 */
export function layoutRects(tree) {
  const out = {};
  (function walk(node, r) {
    if (node.type === 'leaf') {
      out[node.id] = r;
      return;
    }
    if (node.dir === 'right') {
      walk(node.a, { x: r.x, y: r.y, w: r.w * node.ratio, h: r.h });
      walk(node.b, { x: r.x + r.w * node.ratio, y: r.y, w: r.w * (1 - node.ratio), h: r.h });
    } else {
      walk(node.a, { x: r.x, y: r.y, w: r.w, h: r.h * node.ratio });
      walk(node.b, { x: r.x, y: r.y + r.h * node.ratio, w: r.w, h: r.h * (1 - node.ratio) });
    }
  })(tree, { x: 0, y: 0, w: 1, h: 1 });
  return out;
}

/** Would splitting `leaf` in `dir` violate the 40ch×12row floor at dims? */
function tooSmall(tree, leaf, dir, { cols, rows }) {
  const r = layoutRects(tree)[leaf.id];
  const w = r.w * cols;
  const h = r.h * rows;
  if (dir === 'right') return w / 2 < MIN_COLS || h < MIN_ROWS;
  return h / 2 < MIN_ROWS || w < MIN_COLS;
}

/**
 * Split leaf `id` in `dir` ('right'|'down') at ratio .5. Old content keeps
 * slot `a` (left/top — main stays LEFT on auto-split), new pane is `b`.
 * opts: { program, title, entity, day, dims:{cols,rows} } — program/title/
 * entity/day land on the new leaf (PaneGrid feeds them to the program
 * component); dims (the screen's usable cell size) enables the min-size
 * refusal; omitted = skip that check.
 * → { ok:true, tree, id:<new pane id> } | { ok:false, err }
 */
export function split(tree, id, dir, opts = {}) {
  const path = pathTo(tree, id);
  if (!path) return { ok: false, err: ERR.NOT_FOUND };
  if (leaves(tree).length >= MAX_PANES) return { ok: false, err: ERR.MAX_PANES };
  const sameDir = path.filter((n) => n.type === 'split' && n.dir === dir).length;
  if (sameDir >= MAX_DEPTH_PER_AXIS) return { ok: false, err: ERR.DEPTH };
  const leaf = path[path.length - 1];
  if (opts.dims && tooSmall(tree, leaf, dir, opts.dims)) return { ok: false, err: ERR.MIN_SIZE };
  const freshId = nextId(tree);
  const fresh = { type: 'leaf', id: freshId, program: opts.program ?? null };
  if (opts.title) fresh.title = opts.title;
  if (opts.entity != null) fresh.entity = opts.entity;
  if (opts.day != null) fresh.day = opts.day;
  const node = { type: 'split', dir, ratio: 0.5, a: leaf, b: fresh };
  return { ok: true, tree: replaceNode(tree, leaf, node), id: freshId };
}

/**
 * Close leaf `id`: its parent split collapses into the sibling.
 * 'main' refuses. → { ok:true, tree, focusId } | { ok:false, err }
 * focusId = first leaf of the surviving sibling (core focuses it).
 */
export function close(tree, id) {
  if (id === 'main') return { ok: false, err: ERR.CLOSE_MAIN };
  const path = pathTo(tree, id);
  if (!path || path.length < 2) return { ok: false, err: ERR.NOT_FOUND };
  const leaf = path[path.length - 1];
  const parent = path[path.length - 2];
  const sibling = parent.a === leaf ? parent.b : parent.a;
  return {
    ok: true,
    tree: replaceNode(tree, parent, sibling),
    focusId: leaves(sibling)[0].id,
  };
}

/**
 * Directional focus move ('h'|'j'|'k'|'l') from leaf `id`, decided on the
 * fractional rect geometry: nearest pane strictly beyond the leading edge
 * with cross-axis overlap; ties → larger overlap, then in-order first
 * (topmost/leftmost). → neighbor leaf id, or null (focus stays put).
 */
export function focusDir(tree, id, key) {
  const rects = layoutRects(tree);
  const cur = rects[id];
  if (!cur) return null;
  const horiz = key === 'h' || key === 'l';
  let best = null;
  for (const l of leaves(tree)) {
    if (l.id === id) continue;
    const r = rects[l.id];
    const overlap = horiz
      ? Math.min(cur.y + cur.h, r.y + r.h) - Math.max(cur.y, r.y)
      : Math.min(cur.x + cur.w, r.x + r.w) - Math.max(cur.x, r.x);
    if (overlap <= EPS) continue;
    let dist;
    if (key === 'l') dist = r.x - (cur.x + cur.w);
    else if (key === 'h') dist = cur.x - (r.x + r.w);
    else if (key === 'j') dist = r.y - (cur.y + cur.h);
    else dist = cur.y - (r.y + r.h);
    if (dist < -EPS) continue;
    if (!best || dist < best.dist - EPS || (Math.abs(dist - best.dist) <= EPS && overlap > best.overlap + EPS)) {
      best = { id: l.id, dist, overlap };
    }
  }
  return best ? best.id : null;
}

/** Cycle focus through leaves in order (dir ±1, wraps). → leaf id. */
export function cycle(tree, id, dir = 1) {
  const ids = leaves(tree).map((l) => l.id);
  const i = ids.indexOf(id);
  return ids[(i + dir + ids.length) % ids.length];
}

/**
 * Zoom toggle — CSS-only concern, tree untouched (P7). Pure helper for
 * core's zoomedId state: zoom(zoomedId, id) → new zoomedId (null = off).
 */
export function zoom(zoomedId, id) {
  return zoomedId === id ? null : id;
}

/**
 * Resize by divider motion: adjusts the ratio of leaf `id`'s NEAREST
 * ancestor split on `axis` ('x' → 'right' splits, 'y' → 'down' splits).
 * Positive delta moves that divider right/down (grows child a). Clamped
 * [0.2, 0.8]; at a bound the op still succeeds as a no-op.
 * → { ok:true, tree } | { ok:false, err }
 */
export function resizeStep(tree, id, axis, delta) {
  const path = pathTo(tree, id);
  if (!path) return { ok: false, err: ERR.NOT_FOUND };
  const dir = axis === 'x' ? 'right' : 'down';
  let target = null;
  for (let i = path.length - 2; i >= 0; i--) {
    if (path[i].type === 'split' && path[i].dir === dir) {
      target = path[i];
      break;
    }
  }
  if (!target) return { ok: false, err: ERR.NO_AXIS };
  const ratio = Math.min(RATIO_MAX, Math.max(RATIO_MIN, target.ratio + delta));
  if (ratio === target.ratio) return { ok: true, tree };
  return { ok: true, tree: replaceNode(tree, target, { ...target, ratio }) };
}
