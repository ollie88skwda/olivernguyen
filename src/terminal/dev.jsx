/**
 * src/terminal/dev.jsx — standalone dev-harness entry (C-0.1, DEV ONLY).
 * Served via /terminal-dev.html by the Vite dev server; never a build input
 * (vite.config pins build.rollupOptions.input to index.html — same rule as
 * graph-dev). window.__term is the Playwright gate hook; it exists ONLY here.
 *
 * R-T2: `?theme=light|dark` writes <html data-theme>, the same attribute
 * ThemeProvider owns in production (docs/THEMES.md §2). Without it the harness
 * had NO ladder attribute at all, so sakura.css's `html[data-theme=…]
 * [data-mode="terminal"]` blocks never matched and every `--term-*` token was
 * undefined. Default is dark — the harness page already declares
 * color-scheme dark and Night Plum is terminal mode's shipped default.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import TerminalHome from './TerminalHome.jsx';

const params = new URLSearchParams(window.location.search);

// ?noboot: engine-level specs (Gate T0) want a deterministic EMPTY buffer;
// boot-on-mount stays the production default.
const noboot = params.has('noboot');

const theme = params.get('theme') === 'light' ? 'light' : 'dark';
document.documentElement.setAttribute('data-theme', theme);

createRoot(document.getElementById('root')).render(
  <TerminalHome
    autoboot={!noboot}
    devHook={(hook) => {
      window.__term = hook;
    }}
  />,
);
