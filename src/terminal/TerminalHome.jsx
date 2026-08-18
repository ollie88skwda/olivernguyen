/**
 * src/terminal/TerminalHome.jsx — terminal-mode mount root (C-0.2 shell,
 * C-1.x wiring: runner ctx, boot-as-command-#1, tabs, buffer click delegation).
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
 * devHook: DEV-harness-only escape hatch (dev.jsx exposes window.__term for
 * the Playwright gates). Production passes nothing.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles/sakura.css';
import './terminal.css';
import { useBuffer, BufferView, ln } from './Buffer.jsx';
import Prompt from './Prompt.jsx';
import StatusBar from './StatusBar.jsx';
import { complete, createRunner } from './lib/commands.js';
import { EMAIL, FILES, WINDOWS, windowByN } from './lib/terminalModel.js';
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

export default function TerminalHome({ devHook, autoboot = true }) {
  const { ref, api } = useBuffer();
  const promptRef = useRef(null);
  const bootedRef = useRef(false);
  const [activeWindow, setActiveWindow] = useState(1);
  const [sbMode, setSbMode] = useState('-- NORMAL --');

  // §3.1.1 — the page NEVER scrolls while the terminal is mounted; only the
  // buffer does. Restored on unmount so graph mode is untouched (P3).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = [html.style.overflow, body.style.overflow];
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev[0];
      body.style.overflow = prev[1];
    };
  }, []);

  /* ---- command runner: ctx wires the pure table to buffer + sections ---- */
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
      printDay: (n) => api.print(dayLines(n)),
      // X-1 swaps this for panes.open('artifact', { entity, split: 'right' })
      openArtifact: (id) => api.print(artifactLines(id)),
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
      quitLine: () => api.print(ln('mut', quitText)),
    };
    return createRunner(ctx);
  }, [api]);

  /* ---- boot = the site runs its own first command (§3.1.4) ---- */
  useEffect(() => {
    if (!autoboot || bootedRef.current) return; // StrictMode double-effect guard
    bootedRef.current = true;
    api.print(motdLines(), { stagger: 0 });
    runner.run(windowByN(1).cmd, { autotype: true });
  }, [api, runner, autoboot]);

  /* ---- empty-prompt keys (digits now; vim motions land at C-2.1) ---- */
  const onBareKey = useCallback(
    (key) => {
      if (/^[1-5]$/.test(key)) {
        runner.run(windowByN(key).cmd, { autotype: true });
        return true;
      }
      return false;
    },
    [runner],
  );

  /* ---- printed [data-cmd] buttons run commands (§3.1.2 affordances) ---- */
  const onMainClick = useCallback(
    (e) => {
      const cmdEl = e.target.closest('[data-cmd]');
      if (cmdEl) {
        runner.run(cmdEl.dataset.cmd, { autotype: true });
        return;
      }
      // [data-act="palette"] → ⌘K palette (C-2.2)
    },
    [runner],
  );

  useEffect(() => {
    if (devHook) devHook({ api, bufferRef: ref, run: runner.run });
  }, [devHook, api, ref, runner]);

  return (
    <main className="sakura term-screen" data-testid="terminal-home">
      {/* click delegation over printed output — not a keyboard surface */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className="term-main" onClick={onMainClick}>
        <BufferView api={api} label="Terminal scrollback" />
      </div>
      <Prompt
        ref={promptRef}
        onSubmit={(v) => runner.run(v)}
        completer={complete}
        history={runner.history}
        onModeChange={setSbMode}
        onBareKey={onBareKey}
        canRefocus={() => true /* C-2.2: overlays veto */}
      />
      <StatusBar
        api={api}
        windows={WINDOWS}
        active={activeWindow}
        onWindow={(n) => runner.run(windowByN(n).cmd, { autotype: true })}
        mode={sbMode}
      />
    </main>
  );
}
