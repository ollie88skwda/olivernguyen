/**
 * src/terminal/Buffer.jsx — the buffer engine (C-0.3, §5 contract).
 *
 *   useBuffer() → { ref, api }
 *   api = {
 *     echo(cmdText)                     // prompt-echo line, instant
 *     print(lines|node, {stagger})      // async, queued, line-at-a-time, pins
 *     printErr(text) · clear() · scrollRows(n) · scrollEnd('top'|'bottom')
 *     pos() → 0..100 · onPos(cb)        // statusbar % feed
 *   }
 *   <BufferView api={api} label="…"/>   // role="log", own overflow-y — NEVER the page
 *
 * All prints per buffer go through one promise queue (commands never
 * interleave). exec-term-panes imports this — never reimplements it.
 *
 * Rendering model: the engine is a tiny external store (blocks + version);
 * BufferView subscribes via useSyncExternalStore. Mutations notify inside
 * flushSync so pin-to-bottom always sees the committed DOM. A block prints by
 * advancing its `revealed` counter per §3.1.5 cadence; unrevealed lines carry
 * .pending (display:none), exactly the prototype's mechanism. Reduced motion
 * (or ?still): blocks land fully revealed, zero timers.
 */
import React, {
  cloneElement,
  isValidElement,
  useCallback,
  useState,
  useSyncExternalStore,
} from 'react';
import { flushSync } from 'react-dom';
import { createQueue, motionOK, printDelay, sleep } from './lib/cadence.js';

/** Prompt sigil — one string, shared by echo lines and Prompt.jsx. */
export const SIGIL = 'oliver@on.c:~$ ';

/** Line factory: ln('err', 'nope') → <p class="ln err">nope</p>. Shared with
 * sections.jsx and panes' programs so printed DOM stays uniform. */
export const ln = (cls, children, key) => (
  <p className={'ln' + (cls ? ' ' + cls : '')} key={key}>
    {children}
  </p>
);

function createEngine() {
  const state = { blocks: [], version: 0, el: null };
  const renderListeners = new Set();
  const posListeners = new Set();
  const queue = createQueue();
  let nextId = 1;

  const notify = () => {
    state.version++;
    flushSync(() => {
      renderListeners.forEach((l) => l());
    });
  };

  const pin = () => {
    if (state.el) state.el.scrollTop = state.el.scrollHeight;
  };

  const pos = () => {
    const el = state.el;
    if (!el) return 100;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 4) return 100;
    return Math.min(100, Math.round((el.scrollTop / max) * 100));
  };

  const emitPos = () => {
    const p = pos();
    posListeners.forEach((l) => l(p));
  };

  const toLines = (items) =>
    (Array.isArray(items) ? items : [items]).map((it) =>
      isValidElement(it) ? it : String(it ?? ''),
    );

  const push = (block) => {
    state.blocks = state.blocks.concat(block);
    notify();
    pin();
  };

  /* ---- public api ---- */

  const print = (items, opts = {}) =>
    queue.enqueue(async () => {
      const lines = toLines(items);
      const instant = !motionOK();
      const block = { id: nextId++, lines, revealed: instant ? lines.length : 0 };
      push(block);
      if (!instant) {
        for (let i = 0; i < lines.length; i++) {
          await sleep(printDelay(opts.stagger));
          block.revealed++;
          notify();
          pin();
        }
      }
      emitPos();
    });

  const echo = (cmdText) => {
    const line = (
      <p className="ln echo">
        <span className="psigil">{SIGIL}</span>
        <span className="cmdtext">{cmdText}</span>
      </p>
    );
    push({ id: nextId++, lines: [line], revealed: 1 });
    emitPos();
  };

  const printErr = (text) => print(ln('err', text));

  const clear = () => {
    state.blocks = [];
    notify();
    emitPos();
  };

  const rowPx = () => {
    if (!state.el) return 22;
    const lh = parseFloat(getComputedStyle(state.el).lineHeight);
    return Number.isFinite(lh) && lh > 0 ? lh : 22;
  };

  const scrollRows = (n) => {
    if (state.el) state.el.scrollBy({ top: n * rowPx() });
    emitPos();
  };

  const scrollEnd = (edge) => {
    if (!state.el) return;
    state.el.scrollTop = edge === 'top' ? 0 : state.el.scrollHeight;
    emitPos();
  };

  const onPos = (cb) => {
    posListeners.add(cb);
    return () => posListeners.delete(cb);
  };

  /* ---- view-side internals (BufferView only) ---- */
  const view = {
    subscribe: (l) => {
      renderListeners.add(l);
      return () => renderListeners.delete(l);
    },
    getVersion: () => state.version,
    getBlocks: () => state.blocks,
    setEl: (el) => {
      state.el = el;
    },
    emitPos,
  };

  return {
    ref: {
      get current() {
        return state.el;
      },
    },
    api: {
      echo,
      print,
      printErr,
      clear,
      scrollRows,
      scrollEnd,
      pos,
      onPos,
      idle: queue.idle,
      enqueue: queue.enqueue, // command runner rides the same serializer
      _view: view,
    },
  };
}

export function useBuffer() {
  const [engine] = useState(createEngine);
  return engine;
}

function renderLine(item, i, pending) {
  if (isValidElement(item)) {
    const cls = item.props.className || '';
    // keyed by position: lines are append-only and never reorder, and mixed
    // authored/positional keys would collide (React dup-key warning).
    return cloneElement(item, {
      key: i,
      className: pending ? cls + ' pending' : cls,
    });
  }
  return (
    <p className={'ln' + (pending ? ' pending' : '')} key={i}>
      {item}
    </p>
  );
}

export function BufferView({ api, label }) {
  const view = api._view;
  useSyncExternalStore(view.subscribe, view.getVersion, view.getVersion);
  const refCb = useCallback((el) => view.setEl(el), [view]);
  return (
    <div
      className="term-buffer"
      role="log"
      aria-label={label}
      tabIndex={0}
      ref={refCb}
      onScroll={() => view.emitPos()}
    >
      {view.getBlocks().map((b) => (
        <div className="blk" key={b.id}>
          {b.lines.map((l, i) => renderLine(l, i, i >= b.revealed))}
        </div>
      ))}
    </div>
  );
}

export default BufferView;
