/**
 * src/terminal/dev.jsx — standalone dev-harness entry (C-0.1, DEV ONLY).
 * Served via /terminal-dev.html by the Vite dev server; never a build input
 * (vite.config pins build.rollupOptions.input to index.html — same rule as
 * graph-dev). window.__term is the Playwright gate hook; it exists ONLY here.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import TerminalHome from './TerminalHome.jsx';

createRoot(document.getElementById('root')).render(
  <TerminalHome
    devHook={(hook) => {
      window.__term = hook;
    }}
  />,
);
