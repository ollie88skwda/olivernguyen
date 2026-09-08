/**
 * src/graph/GraphHome.jsx — graph mode entry (§5 mount contract).
 *
 * Props: none. Renders full-viewport inside its own `.sakura` wrapper.
 * Desktop (≥768px + fine pointer) → canvas (lazy chunk: d3 + canvas code are
 * NEVER fetched otherwise — P6); else → dossier-list fallback (G-4.1).
 * Runs standalone in the graph-dev harness.
 */
import React, { lazy, Suspense, useEffect, useState } from 'react';
import GraphList from './components/GraphList.jsx';
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
    <main className={`sakura graph-root${desktop ? '' : ' listing'}`}>
      {desktop ? (
        <>
          <Suspense fallback={null}>
            <GraphCanvas />
          </Suspense>
          {/* SR parity: same entity list, visually hidden (05 §8, G-4.3) */}
          <GraphList srOnly />
        </>
      ) : (
        /* coarse pointer / small viewport: canvas + d3 never load (P6) */
        <GraphList />
      )}
    </main>
  );
}
