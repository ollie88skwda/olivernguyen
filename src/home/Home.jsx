// Mode-switched home (I-1.4, integrated at X-1).
//   graph    → lazy GraphHome (P6: the canvas + d3 live in their own lazy
//              chunks inside GraphHome; the mobile list never fetches them)
//   terminal → dark-sakura holding screen (P4: real tokens, one line, no fake
//              content — terminal mode is a later build, L7)
// The old home (src/pages/home.js) is unmounted as of X-1 — left in tree,
// flagged, per P4.
//
// Terminal UNMOUNTS the graph rather than hiding it: GraphCanvas owns
// window-level key handlers (Tab/arrows/'/'/Esc/f/⌘K) that must not act under
// the holding screen (never-trap, 05 §5.4.2). Cost: toggling back re-enters
// the graph at its default view — noted for Oliver in the plan status header.
import React, { lazy, Suspense } from "react";
import { useMode } from "../mode/ModeProvider";
import "../styles/sakura.css";
import "./home.css";

const GraphHome = lazy(() => import("../graph/GraphHome.jsx"));

const GraphLoading = () => (
  <main className="sakura home-screen" data-testid="graph-placeholder">
    <p className="home-line">
      <span className="home-sigil">◍</span> graph mode — coming online
    </p>
  </main>
);

const TerminalHolding = () => (
  <main className="sakura home-screen" data-testid="terminal-holding">
    <p className="home-line">
      <span className="home-sigil">❯</span> terminal mode is being built — flip
      to GRAPH for the live site<span className="home-cursor" aria-hidden="true" />
    </p>
  </main>
);

export const Home = () => {
  const { mode } = useMode();
  if (mode === "terminal") return <TerminalHolding />;
  return (
    <Suspense fallback={<GraphLoading />}>
      <GraphHome />
    </Suspense>
  );
};

export default Home;
