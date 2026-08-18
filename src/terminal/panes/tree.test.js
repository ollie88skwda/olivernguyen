/**
 * tree.js unit tests — GATE N1: split/close/zoom/resize/cycle invariants,
 * limit refusals return E-errors, close(main) refused, geometry moves.
 */
import { describe, it, expect } from 'vitest';
import {
  createTree,
  leaves,
  findLeaf,
  layoutRects,
  split,
  close,
  focusDir,
  cycle,
  zoom,
  resizeStep,
  ERR,
  MAX_PANES,
  RATIO_MIN,
  RATIO_MAX,
  RESIZE_STEP,
} from './tree.js';

/** Herdr's observed 4-pane layout: main LEFT, right column of three. */
function herdrLayout() {
  let t = createTree();
  ({ tree: t } = split(t, 'main', 'right')); // main | p2
  ({ tree: t } = split(t, 'p2', 'down')); //    main | (p2 / p3)
  ({ tree: t } = split(t, 'p3', 'down')); //    main | (p2 / (p3 / p4))
  return t;
}

describe('createTree', () => {
  it('boots as the single main leaf', () => {
    expect(createTree()).toEqual({ type: 'leaf', id: 'main', program: 'main' });
  });
});

describe('split', () => {
  it('right: old leaf keeps slot a (LEFT), new pane is b, ratio .5', () => {
    const r = split(createTree(), 'main', 'right');
    expect(r.ok).toBe(true);
    expect(r.id).toBe('p2');
    expect(r.tree).toEqual({
      type: 'split',
      dir: 'right',
      ratio: 0.5,
      a: { type: 'leaf', id: 'main', program: 'main' },
      b: { type: 'leaf', id: 'p2', program: null },
    });
  });

  it('down: old leaf on top', () => {
    const r = split(createTree(), 'main', 'down');
    expect(r.ok).toBe(true);
    expect(r.tree.dir).toBe('down');
    expect(r.tree.a.id).toBe('main');
    expect(r.tree.b.id).toBe('p2');
  });

  it('carries program + title options onto the new leaf', () => {
    const r = split(createTree(), 'main', 'right', { program: 'artifact', title: 'mac-agent' });
    expect(r.tree.b).toEqual({ type: 'leaf', id: 'p2', program: 'artifact', title: 'mac-agent' });
  });

  it('generates unique incrementing ids', () => {
    let t = createTree();
    const r1 = split(t, 'main', 'right');
    const r2 = split(r1.tree, 'p2', 'down');
    const r3 = split(r2.tree, 'p3', 'down');
    expect([r1.id, r2.id, r3.id]).toEqual(['p2', 'p3', 'p4']);
    expect(new Set(leaves(r3.tree).map((l) => l.id)).size).toBe(4);
  });

  it('is immutable — the input tree is untouched', () => {
    const t = createTree();
    split(t, 'main', 'right');
    expect(t).toEqual({ type: 'leaf', id: 'main', program: 'main' });
    const four = herdrLayout();
    const before = JSON.parse(JSON.stringify(four));
    split(four, 'main', 'down');
    expect(four).toEqual(before);
  });

  it('unknown pane id → E-not-found', () => {
    const r = split(createTree(), 'nope', 'right');
    expect(r).toEqual({ ok: false, err: ERR.NOT_FOUND });
    expect(r.err[0]).toBe('E');
  });

  it(`refuses pane #${MAX_PANES + 1} with an E-error`, () => {
    const t = herdrLayout(); // 4 panes
    const r = split(t, 'main', 'down');
    expect(r).toEqual({ ok: false, err: ERR.MAX_PANES });
  });

  it('refuses a 3rd same-axis split on the path (depth 2 per axis)', () => {
    let t = createTree();
    ({ tree: t } = split(t, 'main', 'right'));
    ({ tree: t } = split(t, 'p2', 'right')); // p3's path now has 2 'right' splits
    const r = split(t, 'p3', 'right'); // only 3 panes — depth fires, not count
    expect(r).toEqual({ ok: false, err: ERR.DEPTH });
    // other axis still fine from the same leaf
    expect(split(t, 'p3', 'down').ok).toBe(true);
  });

  it('herdr layout allows the 2nd down split (depth counts the PATH, not the tree)', () => {
    expect(leaves(herdrLayout()).map((l) => l.id)).toEqual(['main', 'p2', 'p3', 'p4']);
  });

  it('min-size: refuses when a child would drop under 40 cols', () => {
    let t = createTree();
    ({ tree: t } = split(t, 'main', 'right', { dims: { cols: 100, rows: 30 } })); // 50/50 ok
    const r = split(t, 'p2', 'right', { dims: { cols: 100, rows: 30 } }); // 25 < 40
    expect(r).toEqual({ ok: false, err: ERR.MIN_SIZE });
  });

  it('min-size: refuses when a child would drop under 12 rows', () => {
    const ok = split(createTree(), 'main', 'down', { dims: { cols: 100, rows: 24 } }); // 12 exactly
    expect(ok.ok).toBe(true);
    const r = split(createTree(), 'main', 'down', { dims: { cols: 100, rows: 23 } }); // 11.5 < 12
    expect(r).toEqual({ ok: false, err: ERR.MIN_SIZE });
  });

  it('min-size: cross-axis floor also checked (short pane refuses right split)', () => {
    let t = createTree();
    ({ tree: t } = split(t, 'main', 'down')); // each 0.5 high
    const r = split(t, 'p2', 'right', { dims: { cols: 200, rows: 20 } }); // h = 10 < 12
    expect(r).toEqual({ ok: false, err: ERR.MIN_SIZE });
  });

  it('min-size check is skipped when dims are omitted', () => {
    let t = createTree();
    ({ tree: t } = split(t, 'main', 'down'));
    expect(split(t, 'p2', 'right').ok).toBe(true);
  });
});

describe('close', () => {
  it("'main' refuses close", () => {
    expect(close(herdrLayout(), 'main')).toEqual({ ok: false, err: ERR.CLOSE_MAIN });
    expect(close(createTree(), 'main')).toEqual({ ok: false, err: ERR.CLOSE_MAIN });
  });

  it('unknown id → E-not-found', () => {
    expect(close(createTree(), 'p2')).toEqual({ ok: false, err: ERR.NOT_FOUND });
  });

  it('collapses the parent split into the sibling and hands back a focus id', () => {
    const t = herdrLayout();
    const r = close(t, 'p4'); // inner down split collapses to p3
    expect(r.ok).toBe(true);
    expect(r.focusId).toBe('p3');
    expect(leaves(r.tree).map((l) => l.id)).toEqual(['main', 'p2', 'p3']);
    const r2 = close(r.tree, 'p2');
    expect(r2.focusId).toBe('p3');
    expect(leaves(r2.tree).map((l) => l.id)).toEqual(['main', 'p3']);
    const r3 = close(r2.tree, 'p3');
    expect(r3.tree).toEqual({ type: 'leaf', id: 'main', program: 'main' });
    expect(r3.focusId).toBe('main');
  });

  it('is immutable', () => {
    const t = herdrLayout();
    const before = JSON.parse(JSON.stringify(t));
    close(t, 'p2');
    expect(t).toEqual(before);
  });
});

describe('layoutRects', () => {
  it('mirrors ratios in the unit box', () => {
    const rects = layoutRects(herdrLayout());
    expect(rects.main).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
    expect(rects.p2).toEqual({ x: 0.5, y: 0, w: 0.5, h: 0.5 });
    expect(rects.p3).toEqual({ x: 0.5, y: 0.5, w: 0.5, h: 0.25 });
    expect(rects.p4).toEqual({ x: 0.5, y: 0.75, w: 0.5, h: 0.25 });
  });
});

describe('focusDir', () => {
  const t = herdrLayout();

  it('l from main lands on the topmost right pane', () => {
    expect(focusDir(t, 'main', 'l')).toBe('p2');
  });

  it('h from any right-column pane lands on main', () => {
    expect(focusDir(t, 'p2', 'h')).toBe('main');
    expect(focusDir(t, 'p3', 'h')).toBe('main');
    expect(focusDir(t, 'p4', 'h')).toBe('main');
  });

  it('j/k walk the right column', () => {
    expect(focusDir(t, 'p2', 'j')).toBe('p3');
    expect(focusDir(t, 'p3', 'j')).toBe('p4');
    expect(focusDir(t, 'p4', 'k')).toBe('p3');
    expect(focusDir(t, 'p3', 'k')).toBe('p2');
  });

  it('returns null at the edges (focus stays put)', () => {
    expect(focusDir(t, 'main', 'h')).toBe(null);
    expect(focusDir(t, 'main', 'j')).toBe(null); // nothing below with x-overlap
    expect(focusDir(t, 'main', 'k')).toBe(null);
    expect(focusDir(t, 'p2', 'k')).toBe(null);
    expect(focusDir(t, 'p4', 'j')).toBe(null);
    expect(focusDir(t, 'p2', 'l')).toBe(null);
  });

  it('unknown id → null', () => {
    expect(focusDir(t, 'nope', 'l')).toBe(null);
  });

  it('prefers the nearer pane in the direction of travel', () => {
    // main | p2 | p3 in a row: l from main must hit p2, not p3
    let row = createTree();
    ({ tree: row } = split(row, 'main', 'right'));
    ({ tree: row } = split(row, 'p2', 'right'));
    expect(focusDir(row, 'main', 'l')).toBe('p2');
    expect(focusDir(row, 'p3', 'h')).toBe('p2');
  });
});

describe('cycle', () => {
  const t = herdrLayout();
  it('walks leaves in order and wraps both ways', () => {
    expect(cycle(t, 'main')).toBe('p2');
    expect(cycle(t, 'p2')).toBe('p3');
    expect(cycle(t, 'p4')).toBe('main');
    expect(cycle(t, 'main', -1)).toBe('p4');
    expect(cycle(t, 'p2', -1)).toBe('main');
  });
  it('single pane cycles to itself', () => {
    expect(cycle(createTree(), 'main')).toBe('main');
  });
});

describe('zoom', () => {
  it('toggles: on, off, and retarget', () => {
    expect(zoom(null, 'p2')).toBe('p2');
    expect(zoom('p2', 'p2')).toBe(null);
    expect(zoom('p2', 'main')).toBe('main');
  });
});

describe('resizeStep', () => {
  it('adjusts the nearest same-axis ancestor split (divider motion)', () => {
    const t = herdrLayout();
    const r = resizeStep(t, 'main', 'x', +RESIZE_STEP);
    expect(r.ok).toBe(true);
    expect(r.tree.ratio).toBeCloseTo(0.55);
    // y-resize from p3 targets the INNER down split, not the outer one
    const r2 = resizeStep(t, 'p3', 'y', -RESIZE_STEP);
    expect(r2.tree.b.b.ratio).toBeCloseTo(0.45);
    expect(r2.tree.b.ratio).toBeCloseTo(0.5); // outer down untouched
  });

  it('clamps to [0.2, 0.8] and no-ops at the bound (still ok)', () => {
    let t = herdrLayout();
    for (let i = 0; i < 10; i++) {
      const r = resizeStep(t, 'main', 'x', +RESIZE_STEP);
      expect(r.ok).toBe(true);
      t = r.tree;
    }
    expect(t.ratio).toBeCloseTo(RATIO_MAX);
    for (let i = 0; i < 20; i++) {
      const r = resizeStep(t, 'main', 'x', -RESIZE_STEP);
      expect(r.ok).toBe(true);
      t = r.tree;
    }
    expect(t.ratio).toBeCloseTo(RATIO_MIN);
  });

  it('no ancestor on that axis → E-error', () => {
    expect(resizeStep(createTree(), 'main', 'x', +RESIZE_STEP)).toEqual({ ok: false, err: ERR.NO_AXIS });
    let t = createTree();
    ({ tree: t } = split(t, 'main', 'right'));
    expect(resizeStep(t, 'p2', 'y', +RESIZE_STEP)).toEqual({ ok: false, err: ERR.NO_AXIS });
    expect(resizeStep(t, 'p2', 'x', +RESIZE_STEP).ok).toBe(true);
  });

  it('unknown id → E-not-found; input tree immutable', () => {
    const t = herdrLayout();
    expect(resizeStep(t, 'nope', 'x', +RESIZE_STEP)).toEqual({ ok: false, err: ERR.NOT_FOUND });
    const before = JSON.parse(JSON.stringify(t));
    resizeStep(t, 'main', 'x', +RESIZE_STEP);
    expect(t).toEqual(before);
  });
});

describe('findLeaf / leaves', () => {
  it('finds leaves by id', () => {
    const t = herdrLayout();
    expect(findLeaf(t, 'p3').id).toBe('p3');
    expect(findLeaf(t, 'nope')).toBe(null);
  });
  it('every ERR message is statusbar-printable E-style', () => {
    for (const msg of Object.values(ERR)) expect(msg).toMatch(/^E\d+: /);
  });
});
