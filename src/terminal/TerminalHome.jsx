/**
 * src/terminal/TerminalHome.jsx — terminal-mode mount root (C-0.2).
 *
 * The screen grid ([main 1fr][promptline][statusbar], 100dvh) lives inside
 * `.sakura` — Night Plum tokens light up via html[data-mode="terminal"]
 * (ModeProvider in prod, hardcoded attribute in the dev harness).
 *
 * P3 never-trap: everything is bound in effects with cleanup — zero terminal
 * handlers or page-scroll locks survive unmount. This component deliberately
 * does NOT use useMode(): mode switches go out through the cancelable
 * 'on:set-mode' CustomEvent (C-2.3), so the harness mounts it standalone.
 *
 * devHook: DEV-harness-only escape hatch (dev.jsx exposes window.__term for
 * the Playwright gates). Production passes nothing.
 */
import React, { useEffect } from 'react';
import '../styles/sakura.css';
import './terminal.css';
import { useBuffer, BufferView } from './Buffer.jsx';
import Prompt from './Prompt.jsx';
import StatusBar from './StatusBar.jsx';

export default function TerminalHome({ devHook }) {
  const { ref, api } = useBuffer();

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

  useEffect(() => {
    if (devHook) devHook({ api, bufferRef: ref });
  }, [devHook, api, ref]);

  return (
    <main className="sakura term-screen" data-testid="terminal-home">
      <div className="term-main">
        <BufferView api={api} label="Terminal scrollback" />
      </div>
      <Prompt />
      <StatusBar api={api} />
    </main>
  );
}
