// Mode-switched home (plan I-1.4). Phase-1 state:
//   graph    → placeholder inside .sakura (GraphHome lazy-mounts here at X-1)
//   terminal → dark-sakura holding screen (P4: real tokens, one line, no fake
//              content — terminal mode is a later build, L7)
// The old home (src/pages/home.js) stays mounted at "/" until integration X-1.
import React from "react";
import { useMode } from "../mode/ModeProvider";
import "../styles/sakura.css";
import "./home.css";

const GraphPlaceholder = () => (
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
  return mode === "terminal" ? <TerminalHolding /> : <GraphPlaceholder />;
};

export default Home;
