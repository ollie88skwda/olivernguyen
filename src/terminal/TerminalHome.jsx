/**
 * src/terminal/TerminalHome.jsx — terminal-mode mount root.
 * C-0.2 screen shell · C-1.x runner/boot/tabs · C-2.x overlays/vim keys ·
 * X-1 panes integration (PaneGrid main slot, panes.open, prefix reducer in
 * THE window listener, statusbar pane state).
 *
 * The screen grid ([main 1fr][promptline][statusbar], 100dvh) lives inside
 * `.sakura` — Night Plum tokens light up via html[data-mode="terminal"]
 * (ModeProvider in prod, hardcoded attribute in the dev harness).
 *
 * P3 never-trap: everything is bound in effects with cleanup — zero terminal
 * handlers or page-scroll locks survive unmount. This component deliberately
 * does NOT use useMode(): mode switches go out through the cancelable
 * 'on:set-mode' CustomEvent (dispatchMode below), so the harness mounts it
 * standalone and graph stays untouched.
 *
 * Key routing (§5): THE ONE window keydown listener binds in CAPTURE phase —
 * an armed prefix must intercept the next key BEFORE the prompt input treats
 * it as text (handled → preventDefault + stopPropagation). Palette/help veto
 * the prefix while open. Esc cascade: overlay → resize (prefixStep) → zoom →
 * clear prompt (the input's own Esc).
 *
 * devHook: DEV-harness-only escape hatch (dev.jsx exposes window.__term for
 * the Playwright gates). Production passes nothing.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import '../styles/sakura.css';
import './terminal.css';
import { useBuffer, BufferView, ln } from './Buffer.jsx';
import Prompt from './Prompt.jsx';
import StatusBar from './StatusBar.jsx';
import Palette from './Palette.jsx';
import HelpSheet from './HelpSheet.jsx';
import PaneGrid, { paneStatus, toastText } from './panes/PaneGrid.jsx';
import PROGRAMS from './panes/programs.jsx';
import {
  createTree,
  split,
  close as closePane,
  focusDir,
  cycle,
  zoom as zoomToggle,
  resizeStep,
  setLeaf,
  leaves,
} from './panes/tree.js';
import {
  createPrefixState,
  prefixStep,
  expire,
  PREFIX_EXPIRY_MS,
} from './panes/prefix.js';
import { setStill } from './lib/cadence.js';
import { complete, completionMatches, createRunner } from './lib/commands.js';
import { EMAIL, FILES, WINDOWS, artifact, windowByN } from './lib/terminalModel.js';
import {
  artifactLines,
  bootLines,
  dayLines,
  emailCopiedText,
  helpLines,
  lsLines,
  motdLines,
  quitText,
  sectionLinesByFile,
} from './sections.jsx';

const isPaletteCombo = (e) =>
  (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k';

const isChromeMenuTarget = (target) =>
  typeof Element !== 'undefined' &&
  target instanceof Element &&
  Boolean(
    target.closest(
      '[data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"]',
    ),
  );

/** P9: single pane + touch-first below ~880px OR on coarse pointers. */
const FLAT_MQ = '(max-width: 880px), (pointer: coarse)';
const isFlat = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(FLAT_MQ).matches;

const initialPanes = () => ({
  tree: createTree(),
  focusedId: 'main',
  zoomedId: null,
  prefix: createPrefixState(),
  lastErr: '',
  toast: null,
});

/** Pane title-row buttons → prefix-grammar actions (Pane.jsx contract). */
const BTN_ACTIONS = {
  'split-right': { type: 'split', dir: 'right' },
  'split-down': { type: 'split', dir: 'down' },
  zoom: { type: 'zoom' },
  close: { type: 'close' },
};

/**
 * §5 "core executes actions via tree ops + setState" — core's copy of the
 * reference executor (panes/dev.jsx). Successful layout/focus changes drop
 * zoom (tmux); zoom/resize keep it. Refusals land in lastErr (statusbar).
 */
function applyAction(s, action, targetId, dims) {
  switch (action.type) {
    case 'split': {
      const r = split(s.tree, targetId, action.dir, { dims });
      if (!r.ok) return { ...s, lastErr: r.err };
      return { ...s, tree: r.tree, focusedId: r.id, zoomedId: null, lastErr: '' };
    }
    case 'close': {
      const r = closePane(s.tree, targetId);
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
      return { ...s, zoomedId: zoomToggle(s.zoomedId, targetId), lastErr: '' };
    case 'resize': {
      const r = resizeStep(s.tree, targetId, action.axis, action.delta);
      if (!r.ok) return { ...s, lastErr: r.err };
      return { ...s, tree: r.tree, lastErr: '' };
    }
    default:
      return s;
  }
}

export default function TerminalHome({ devHook, autoboot = true }) {
  const { ref, api } = useBuffer();
  const promptRef = useRef(null);
  const termMainRef = useRef(null);
  const bootedRef = useRef(false);
  const [activeWindow, setActiveWindow] = useState(1);
  const [sbMode, setSbMode] = useState('-- NORMAL --');
  const [sbOverride, setSbOverride] = useState(''); // g‥ pending etc.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingG = useRef(0);
  // overlay state mirrored into a ref so stable callbacks can read it
  const overlayRef = useRef(false);
  overlayRef.current = paletteOpen || helpOpen;

  /* ---- pane state (X-1) ---- */
  const [ps, setPs] = useState(initialPanes);
  const psRef = useRef(ps);
  psRef.current = ps;
  const [flat, setFlat] = useState(isFlat);
  const flatRef = useRef(flat);
  flatRef.current = flat;

  useEffect(() => {
    const mq = window.matchMedia(FLAT_MQ);
    const onChange = () => setFlat(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* usable cell dims of the pane area — feeds the 40ch×12row split floor */
  const measureRef = useRef(null);
  const measureDims = useCallback(() => {
    const el = termMainRef.current;
    if (!el) return { cols: 240, rows: 60 };
    const cs = getComputedStyle(el);
    if (!measureRef.current) measureRef.current = document.createElement('canvas');
    const ctx2d = measureRef.current.getContext('2d');
    ctx2d.font = `${cs.fontSize} ${cs.fontFamily}`;
    const ch = ctx2d.measureText('0'.repeat(100)).width / 100 || 8;
    const rowPx = parseFloat(cs.lineHeight) || 22;
    const r = el.getBoundingClientRect();
    return { cols: r.width / ch, rows: r.height / rowPx };
  }, []);

  // §3.1.1 — the page NEVER scrolls while the terminal is mounted; only the
  // buffer does. Restored on unmount so graph mode is untouched (P3).
  // P9/X-3: coarse pointers get an INSTANT cadence — typing theater is a
  // fine-pointer experience, and the typed boot pushed mobile LCP to ~5s.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = [html.style.overflow, body.style.overflow];
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (window.matchMedia('(pointer: coarse)').matches) setStill(true);
    return () => {
      html.style.overflow = prev[0];
      body.style.overflow = prev[1];
      setStill(false);
    };
  }, []);

  /* ---- overlays (C-2.2): focus returns to the prompt on close ---- */
  const closeOverlays = useCallback(() => {
    setPaletteOpen(false);
    setHelpOpen(false);
    promptRef.current?.focus();
  }, []);

  const openHelp = useCallback(() => {
    setPaletteOpen(false);
    setHelpOpen(true);
  }, []);

  /* ---- §5 commands→panes surface: panes.open (core's copy of the
     reference impl — ranger-style program reuse, split off MAIN so main
     stays LEFT, toast advertises ^G x). Flat/split:false → in-buffer. ---- */
  const panesOpen = useCallback(
    (program, opts = {}) => {
      const { entity, title, day, split: dir = 'right' } = opts;
      if (flatRef.current || dir === false) return { ok: false, inBuffer: true };
      let out;
      // flushSync: `out` is read synchronously below, and command tasks run
      // OUTSIDE React's event batching (reference impl, panes/dev.jsx —
      // dropping this returned undefined and killed the in-buffer fallback)
      flushSync(() =>
        setPs((s) => {
          const existing = leaves(s.tree).find(
            (l) => l.program === program && l.id !== 'main',
          );
          if (existing) {
            const r = setLeaf(s.tree, existing.id, { entity, title, day });
            out = { ok: true, id: existing.id, reused: true };
            return {
              ...s,
              tree: r.tree,
              focusedId: existing.id,
              zoomedId: null,
              lastErr: '',
            };
          }
          const r = split(s.tree, 'main', dir, {
            program,
            entity,
            title,
            day,
            dims: measureDims(),
          });
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
        }),
      );
      return out;
    },
    [measureDims],
  );

  /* toast + prefix-pending expiry timers (reference wiring) */
  useEffect(() => {
    if (!ps.toast) return undefined;
    const t = setTimeout(() => setPs((s) => ({ ...s, toast: null })), 4000);
    return () => clearTimeout(t);
  }, [ps.toast]);

  useEffect(() => {
    if (ps.prefix.mode !== 'prefix') return undefined;
    const t = setTimeout(
      () => setPs((s) => ({ ...s, prefix: expire(s.prefix, performance.now()) })),
      PREFIX_EXPIRY_MS + 50,
    );
    return () => clearTimeout(t);
  }, [ps.prefix]);

  /* ---- command runner: ctx wires the pure table to buffer + sections ---- */
  const navigate = useCallback((href) => {
    const ev = new CustomEvent('on:navigate', { detail: href, cancelable: true });
    window.dispatchEvent(ev);
    return ev.defaultPrevented;
  }, []);

  const runner = useMemo(() => {
    const ctx = {
      echo: api.echo,
      print: api.print,
      printLine: (cls, text) => api.print(ln(cls, text)),
      printErr: api.printErr,
      clear: api.clear,
      autotype: (cmd) =>
        promptRef.current ? promptRef.current.autotype(cmd) : Promise.resolve(),
      clearPrompt: () => promptRef.current?.clear(),
      printBoot: async (day) => {
        await api.print(bootLines(day), { stagger: 70 });
        setActiveWindow(1);
      },
      printSection: async (file) => {
        await api.print(sectionLinesByFile(file));
        setActiveWindow(FILES[file].n);
      },
      printLs: () => api.print(lsLines()),
      printHelp: () => api.print(helpLines()),
      // P5/§3.2: day N prints the beats AND the replay pane follows it
      // (opens on first use — desktop only; flat prints in-buffer alone).
      printDay: async (n) => {
        await api.print(dayLines(n));
        panesOpen('replay', { day: Number(n), title: `operator · day ${n}` });
      },
      // §3.2 artifact pane: auto-split RIGHT (main stays LEFT) + toast;
      // flat/limits → the dossier prints into the session buffer instead.
      openArtifact: async (id) => {
        const a = artifact(id);
        const res = panesOpen('artifact', {
          entity: id,
          title: a ? a.dTitle.toLowerCase() : id,
        });
        if (!res.ok) await api.print(artifactLines(id));
      },
      copyEmail: async () => {
        try {
          await navigator.clipboard?.writeText(EMAIL);
        } catch {
          /* clipboard denied — the printed line still shows the address */
        }
        await api.print(ln('ok', emailCopiedText));
      },
      // C-2.3 contract: cancelable event; uncaught → printErr fallback.
      dispatchMode: async (m) => {
        const ev = new CustomEvent('on:set-mode', { detail: m, cancelable: true });
        window.dispatchEvent(ev);
        if (!ev.defaultPrevented)
          await api.printErr(`mode ${m}: no handler mounted — open /?mode=${m}`);
      },
      navigate: async (href) => {
        if (!navigate(href)) await api.printErr(`cd: no route handler for ${href}`);
      },
      quitLine: () => api.print(ln('mut', quitText)),
    };
    return createRunner(ctx);
  }, [api, navigate, panesOpen]);

  /* ---- boot = the site runs its own first command (§3.1.4) ---- */
  useEffect(() => {
    if (!autoboot || bootedRef.current) return; // StrictMode double-effect guard
    bootedRef.current = true;
    api.print(motdLines(), { stagger: 0 });
    runner.run(windowByN(1).cmd, { autotype: true });
  }, [api, runner, autoboot]);

  const runIntent = useCallback(
    (it) => {
      setPaletteOpen(false);
      if (it.act === 'help') {
        openHelp();
        return;
      }
      promptRef.current?.focus();
      if (it.cmd) runner.run(it.cmd, { autotype: true });
    },
    [runner, openHelp],
  );

  /* ---- vim motions in the empty prompt (C-2.1, §3.1.3). Unprefixed j/k/
     G/gg act on the FOCUSED pane's buffer (09 §C). ---- */
  const focusedBufferEl = useCallback(() => {
    const { focusedId } = psRef.current;
    if (focusedId === 'main') return ref.current;
    return (
      termMainRef.current?.querySelector(
        `[data-pane="${focusedId}"] .term-buffer`,
      ) ?? ref.current
    );
  }, [ref]);

  const scrollFocused = useCallback(
    (rowsOrEdge) => {
      const { focusedId } = psRef.current;
      if (focusedId === 'main') {
        if (typeof rowsOrEdge === 'number') api.scrollRows(rowsOrEdge);
        else api.scrollEnd(rowsOrEdge);
        return;
      }
      const el = focusedBufferEl();
      if (!el) return;
      if (typeof rowsOrEdge === 'number') {
        const rowPx = parseFloat(getComputedStyle(el).lineHeight) || 22;
        el.scrollBy({ top: rowsOrEdge * rowPx });
      } else {
        el.scrollTop = rowsOrEdge === 'top' ? 0 : el.scrollHeight;
      }
    },
    [api, focusedBufferEl],
  );

  const clearPendingG = useCallback(() => {
    pendingG.current = 0;
    setSbOverride('');
  }, []);

  const onBareKey = useCallback(
    (key) => {
      if (key !== 'g' && pendingG.current) clearPendingG();
      if (/^[1-5]$/.test(key)) {
        runner.run(windowByN(key).cmd, { autotype: true });
        return true;
      }
      switch (key) {
        case 'j':
          scrollFocused(2);
          return true;
        case 'k':
          scrollFocused(-2);
          return true;
        case 'G':
          scrollFocused('bottom');
          return true;
        case 'g': {
          const now = Date.now();
          if (now - pendingG.current < 1200) {
            clearPendingG();
            scrollFocused('top');
          } else {
            pendingG.current = now;
            setSbOverride('g‥');
            setTimeout(() => {
              if (pendingG.current && Date.now() - pendingG.current >= 1150)
                clearPendingG();
            }, 1250);
          }
          return true;
        }
        case '?':
          openHelp();
          return true;
        default:
          return false;
      }
    },
    [runner, scrollFocused, openHelp, clearPendingG],
  );

  /* ---- THE ONE window keydown listener (P3), CAPTURE phase: prefix
     reducer first (§5), then ⌘K, then the Esc cascade tail. ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (isChromeMenuTarget(e.target)) return;
      if (isPaletteCombo(e)) {
        e.preventDefault();
        e.stopPropagation();
        setHelpOpen(false);
        setPaletteOpen((o) => {
          if (o) promptRef.current?.focus();
          return !o;
        });
        return;
      }
      if (!overlayRef.current) {
        const r = prefixStep(psRef.current.prefix, e);
        if (r.handled) {
          e.preventDefault();
          e.stopPropagation(); // an armed prefix owns the key — not the input
        }
        if (r.action?.type === 'help') {
          setPs((s) => ({ ...s, prefix: r.state }));
          openHelp();
          return;
        }
        if (r.action) {
          const dims = measureDims();
          const disabled = flatRef.current && r.action.type === 'split'; // P9
          setPs((s) => {
            let next = { ...s, prefix: r.state };
            if (!disabled) next = applyAction(next, r.action, next.focusedId, dims);
            return next;
          });
          return;
        }
        if (r.state !== psRef.current.prefix) {
          setPs((s) => ({ ...s, prefix: r.state }));
        }
        if (r.handled) return;
      }
      if (e.key === 'Escape') {
        // cascade: overlay → resize (prefixStep above) → zoom → clear prompt
        if (overlayRef.current) {
          e.preventDefault();
          closeOverlays();
          return;
        }
        if (psRef.current.zoomedId) {
          e.preventDefault();
          setPs((s) => ({ ...s, zoomedId: null }));
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [closeOverlays, openHelp, measureDims]);

  /* ---- pane mouse parity (Pane.jsx contract) ---- */
  const onPaneClick = useCallback(
    (id) =>
      setPs((s) =>
        s.focusedId === id ? s : { ...s, focusedId: id, lastErr: '' },
      ),
    [],
  );

  const onPaneAction = useCallback(
    (id, name) => {
      const action = BTN_ACTIONS[name];
      if (!action) return;
      if (flatRef.current && action.type === 'split') return; // P9
      const dims = measureDims();
      setPs((s) => applyAction({ ...s, focusedId: id }, action, id, dims));
    },
    [measureDims],
  );

  /* ---- printed [data-cmd]/[data-act] buttons (§3.1.2 affordances) ---- */
  const onMainClick = useCallback(
    (e) => {
      const cmdEl = e.target.closest('[data-cmd]');
      if (cmdEl) {
        runner.run(cmdEl.dataset.cmd, { autotype: true });
        return;
      }
      if (e.target.closest('[data-act="palette"]')) setPaletteOpen(true);
    },
    [runner],
  );

  const canRefocus = useCallback(() => !overlayRef.current, []);

  useEffect(() => {
    if (devHook) devHook({ api, bufferRef: ref, run: runner.run });
  }, [devHook, api, ref, runner]);

  const sb = paneStatus({ tree: ps.tree, zoomedId: ps.zoomedId, prefix: ps.prefix });

  return (
    <main className="sakura term-screen" data-testid="terminal-home">
      <a
        className="term-skip"
        href="#term-prompt-input"
        onClick={(e) => {
          e.preventDefault(); // deliver focus directly (fragment-focus varies)
          promptRef.current?.focus();
        }}
      >
        Skip to prompt
      </a>
      {/* click delegation over printed output — not a keyboard surface */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className="term-main" onClick={onMainClick} ref={termMainRef}>
        <PaneGrid
          tree={ps.tree}
          focusedId={ps.focusedId}
          zoomedId={ps.zoomedId}
          programs={{
            ...PROGRAMS,
            main: <BufferView api={api} label="Terminal scrollback" />,
            fallback: PROGRAMS.help, // manual splits open on the key table
          }}
          onPaneClick={onPaneClick}
          onPaneAction={onPaneAction}
          toast={ps.toast}
          flat={flat}
        />
      </div>
      <Prompt
        ref={promptRef}
        onSubmit={(v) => runner.run(v)}
        completer={complete}
        onAmbiguous={(v) => {
          const matches = completionMatches(v);
          if (matches.length > 1) {
            api.print(ln('mut', `matches: ${matches.join('  ')}`));
            return true;
          }
          return false;
        }}
        history={runner.history}
        onModeChange={setSbMode}
        onBareKey={onBareKey}
        canRefocus={canRefocus}
      />
      <StatusBar
        api={api}
        windows={WINDOWS}
        active={activeWindow}
        onWindow={(n) => runner.run(windowByN(n).cmd, { autotype: true })}
        onPalette={() => setPaletteOpen(true)}
        mode={sbOverride || sbMode}
        paneCount={sb.paneCount}
        zoomed={sb.zoomed}
        prefix={sb.prefix}
        err={ps.lastErr}
      />
      <Palette open={paletteOpen} onClose={closeOverlays} onRun={runIntent} />
      <HelpSheet open={helpOpen} onClose={closeOverlays} />
    </main>
  );
}
