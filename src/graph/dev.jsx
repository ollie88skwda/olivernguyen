/**
 * src/graph/dev.jsx — standalone dev-harness entry (G-2.1, DEV ONLY).
 * Served via /graph-dev.html by the Vite dev server; never a build input
 * (vite.config pins build.rollupOptions.input to index.html).
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import GraphHome from './GraphHome.jsx';

createRoot(document.getElementById('root')).render(<GraphHome />);
