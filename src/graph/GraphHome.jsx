/**
 * src/graph/GraphHome.jsx — graph mode entry (§5 mount contract).
 *
 * Props: none. Renders full-viewport inside its own `.sakura` wrapper.
 * Desktop (≥768px + fine pointer) → canvas (lazy chunk: d3 + canvas code are
 * NEVER fetched otherwise — P6); else → dossier-list fallback (G-4.1).
 * Runs standalone in the graph-dev harness.
 */
import React, { lazy, Suspense, useEffect, useState } from 'react';
import './graph.css';

const GraphCanvas = lazy(() => import('./components/GraphCanvas.jsx'));

const DESKTOP_MQ = '(min-width: 768px) and (pointer: fine)';

function useDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const fn = (e) => setDesktop(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return desktop;
}

export default function GraphHome() {
  const desktop = useDesktop();
  return (
    <div className="sakura graph-root">
      {desktop ? (
        <Suspense fallback={null}>
          <GraphCanvas />
        </Suspense>
      ) : (
        /* real dossier-list fallback lands in G-4.1 */
        <GraphListFallback />
      )}
    </div>
  );
}

function GraphListFallback() {
  return (
    <div style={{ padding: '24px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px' }}>
      graph list fallback — built in G-4.1
    </div>
  );
}
