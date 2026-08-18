/**
 * src/terminal/panes/dev.jsx — standalone panes harness entry (N-2.2, DEV
 * ONLY). Served via /terminal-panes-dev.html; never a build input.
 *
 * GATE N2/N3 driver: NO window key listeners here (panes never binds them —
 * P3/§5; core owns THE ONE listener and will call prefixStep from it at X-1).
 * Playwright injects synthetic key events through window.__panes.send(e),
 * which runs the pure prefixStep reducer and applies any action via tree ops
 * — exactly the wiring core replicates at X-1 (applyAction below is the
 * reference implementation; harness-local on purpose, core owns its copy).
 *
 * window.__panes = { send(e), act(id, act), open(program, opts), day(n),
 * getState(), reset() } — DEV hook only, mirrors core's window.__term
 * pattern. open()/day() are the reference `panes.open` / replay-follows-day
 * implementations core replicates at X-1 (§5 commands→panes surface).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import '../../styles/sakura.css';
import '../terminal.css';
import PaneGrid, { paneStatus, toastText } from './PaneGrid.jsx';
import PROGRAMS from './programs.jsx';
import {
  createTree,
  split,
  close,
  focusDir,
  cycle,
  zoom,
  resizeStep,
  setLeaf,
  leaves,
  layoutRects,
} from './tree.js';
import {
  createPrefixState,
  prefixStep,
  expire,
  indicator,
  PREFIX_EXPIRY_MS,
} from './prefix.js';

/** Fixed harness cell dims: big enough that depth/count limits bite before
 * the 40×12 min-size floor — deterministic for the gate specs. */
const DIMS = { cols: 240, rows: 60 };

const initial = () => ({
  tree: createTree(),
  focusedId: 'main',
  zoomedId: null,
  prefix: createPrefixState(),
  lastErr: '',
  helpOpen: false,
  toast: null,
});

/** P9 mobile flatten breakpoint (§2): below ~880px → single pane. */
const FLAT_MQ = '(max-width: 880px)';
const isFlat = () => window.matchMedia(FLAT_MQ).matches;

/**
 * Action executor — the §5 "core executes actions via tree ops + setState"
 * reference. targetId = the pane the action applies to (focused pane for
 * keyboard actions; the clicked pane for title-row buttons). Any successful
 * layout/focus change drops zoom (tmux behavior); zoom/resize keep it.
 */
function applyAction(s, action, targetId) {
  switch (action.type) {
    case 'split': {
      const r = split(s.tree, targetId, action.dir, { dims: DIMS });
      if (!r.ok) return { ...s, lastErr: r.err };
      return { ...s, tree: r.tree, focusedId: r.id, zoomedId: null, lastErr: '' };
    }
    case 'close': {
      const r = close(s.tree, targetId);
      if (!r.ok) return { ...s, lastErr: r.err };
      return { ...s, tree: r.tree, focusedId: r.focusId, zoomedId: null, lastErr: '' };
    }
    case 'focus': {
      const id = focusDir(s.tree, targetId, action.dir);
      return id ? { ...s, focusedId: id, zoomedId: null, lastErr: '' } : s;
    }
    case 'cycle':
      return { ...s, focusedId: cycle(s.tree, targetId), zoomedId: null, lastErr: '' };
    case 'zoom':
      return { ...s, zoomedId: zoom(s.zoomedId, targetId), lastErr: '' };
    case 'resize': {
      const r = resizeStep(s.tree, targetId, action.axis, action.delta);
      if (!r.ok) return { ...s, lastErr: r.err };
      return { ...s, tree: r.tree, lastErr: '' };
    }
    case 'help':
      return { ...s, helpOpen: !s.helpOpen, lastErr: '' };
    default:
      return s;
  }
}

const BTN_ACTIONS = {
  'split-right': { type: 'split', dir: 'right' },
  'split-down': { type: 'split', dir: 'down' },
  zoom: { type: 'zoom' },
  close: { type: 'close' },
};

/** Harness-only stand-in for core's session-buffer slot (X-1). Manual `^G v`
 * splits also land here via `fallback` (their leaves carry program:null). */
function MainSlot({ id = 'main' }) {
  const rows = Array.from({ length: 36 }, (_, i) => i + 1);
  return (
    <div className="term-buffer" tabIndex={0} aria-label={`${id} placeholder content`}>
      <p className="ln mut">placeholder — core's session slot mounts here at X-1</p>
      {rows.map((n) => (
        <p className="ln dim" key={n}>
          {String(n).padStart(2, '0')} · pane {id} scrollback row
        </p>
      ))}
    </div>
  );
}

function Harness() {
  const [st, setSt] = useState(initial);
  const stRef = useRef(st);
  stRef.current = st;
  const [flat, setFlat] = useState(isFlat);

  useEffect(() => {
    const mq = window.matchMedia(FLAT_MQ);
    const onChange = () => setFlat(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // auto-split toast expires on its own (info, not motion — not RM-gated)
  useEffect(() => {
    if (!st.toast) return undefined;
    const t = setTimeout(() => setSt((s) => ({ ...s, toast: null })), 4000);
    return () => clearTimeout(t);
  }, [st.toast]);

  // prefix pending expiry — the timer feed core owns in prod (§5): clears
  // the '^G‥' indicator even when no further key arrives.
  useEffect(() => {
    if (st.prefix.mode !== 'prefix') return undefined;
    const t = setTimeout(
      () =>
        setSt((s) => ({ ...s, prefix: expire(s.prefix, performance.now()) })),
      PREFIX_EXPIRY_MS + 50,
    );
    return () => clearTimeout(t);
  }, [st.prefix]);

  const send = useCallback((e) => {
    const ev = {
      key: '',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      timeStamp: performance.now(),
      ...e,
    };
    flushSync(() => {
      setSt((s) => {
        const r = prefixStep(s.prefix, ev);
        let next = { ...s, prefix: r.state };
        // P9: splits disabled below the breakpoint (auto-splits print
        // in-buffer instead — core's panes.open handles that side)
        if (r.action && !(isFlat() && r.action.type === 'split'))
          next = applyAction(next, r.action, next.focusedId);
        // Esc cascade tail (core's at C-2.1/X-1): … → zoom → …
        else if (!r.handled && ev.key === 'Escape' && next.zoomedId)
          next = { ...next, zoomedId: null };
        return next;
      });
    });
  }, []);

  /**
   * Reference `panes.open(program, {entity, title, day, split})` (§5).
   * Ranger-style reuse: an existing pane running `program` is retargeted
   * (setLeaf) instead of stacking new panes until the limit refuses.
   * Fresh panes split off MAIN — right by default, so main stays LEFT (P7)
   * — with the `^G x` toast. Flat/split:false → caller prints in-buffer.
   */
  const open = useCallback((program, opts = {}) => {
    const { entity, title, day, split: dir = 'right' } = opts;
    let out;
    flushSync(() => {
      setSt((s) => {
        if (isFlat() || dir === false) {
          out = { ok: false, inBuffer: true };
          return s;
        }
        const existing = leaves(s.tree).find(
          (l) => l.program === program && l.id !== 'main',
        );
        if (existing) {
          const r = setLeaf(s.tree, existing.id, { entity, title, day });
          out = { ok: true, id: existing.id, reused: true };
          return { ...s, tree: r.tree, focusedId: existing.id, zoomedId: null, lastErr: '' };
        }
        const r = split(s.tree, 'main', dir, { program, entity, title, day, dims: DIMS });
        if (!r.ok) {
          out = { ok: false, err: r.err };
          return { ...s, lastErr: r.err };
        }
        out = { ok: true, id: r.id };
        return {
          ...s,
          tree: r.tree,
          focusedId: r.id,
          zoomedId: null,
          lastErr: '',
          toast: toastText(leaves(r.tree).length),
        };
      });
    });
    return out;
  }, []);

  /** Reference "replay follows the last `day N`" (§3.2). */
  const setDay = useCallback((n) => {
    flushSync(() => {
      setSt((s) => {
        const replay = leaves(s.tree).find((l) => l.program === 'replay');
        if (!replay) return s;
        return { ...s, tree: setLeaf(s.tree, replay.id, { day: Number(n) }).tree };
      });
    });
  }, []);

  const act = useCallback((id, name) => {
    const action = BTN_ACTIONS[name];
    if (!action) return;
    flushSync(() => {
      // button actions focus their pane first, then apply (Pane.jsx contract)
      setSt((s) => applyAction({ ...s, focusedId: id }, action, id));
    });
  }, []);

  const focusPane = useCallback((id) => {
    setSt((s) => (s.focusedId === id ? s : { ...s, focusedId: id, lastErr: '' }));
  }, []);

  useEffect(() => {
    window.__panes = {
      send,
      act,
      open,
      day: setDay,
      reset: () => flushSync(() => setSt(initial())),
      getState: () => {
        const s = stRef.current;
        return {
          tree: s.tree,
          rects: layoutRects(s.tree),
          leaves: leaves(s.tree).map((l) => l.id),
          paneCount: leaves(s.tree).length,
          focusedId: s.focusedId,
          zoomedId: s.zoomedId,
          prefixMode: s.prefix.mode,
          indicator: indicator(s.prefix),
          lastErr: s.lastErr,
          helpOpen: s.helpOpen,
          toast: s.toast,
          flat: isFlat(),
        };
      },
    };
    return () => {
      delete window.__panes;
    };
  }, [send, act, open, setDay]);

  const sb = paneStatus({ tree: st.tree, zoomedId: st.zoomedId, prefix: st.prefix });

  return (
    <main className="sakura term-screen" data-testid="panes-harness">
      <div className="term-main">
        <PaneGrid
          tree={st.tree}
          focusedId={st.focusedId}
          zoomedId={st.zoomedId}
          programs={{
            // element entry (core's session-slot pattern) + real N-3 adapters
            ...PROGRAMS,
            main: <MainSlot />,
            fallback: MainSlot,
          }}
          onPaneClick={focusPane}
          onPaneAction={act}
          toast={st.toast}
          flat={flat}
        />
      </div>
      <footer className="term-statusbar" data-testid="panes-statusbar">
        <span className="sb-sess">[panes-dev]</span>
        <span className="sb-panes" data-testid="sb-panes">
          {sb.paneCount} pane{sb.paneCount === 1 ? '' : 's'}
        </span>
        {sb.zoomed && (
          <span className="sb-zoom" data-testid="sb-zoom">
            [Z]
          </span>
        )}
        {sb.prefix && (
          <span className="sb-prefix" data-testid="sb-prefix">
            {sb.prefix}
          </span>
        )}
        {st.helpOpen && <span className="sb-dim">?help (core's sheet at C-2.2)</span>}
        {st.lastErr && (
          <span className="err" data-testid="sb-err">
            {st.lastErr}
          </span>
        )}
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Harness />);
