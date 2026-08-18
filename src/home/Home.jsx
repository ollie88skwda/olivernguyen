// Mode-switched home (I-1.4, integrated at X-1).
//   graph    → GraphHome. Imported STATICALLY (deviation from §5's "lazy-
//              imported by Home", logged in the plan status header): P6's
//              actual mandate — d3 + canvas code lazy-chunked, never fetched
//              on mobile — is carried by GraphHome's own internal
//              lazy(GraphCanvas) split. Lazy-loading the 5KB-gz shell too
//              only added a sequential fetch hop that pushed mobile LCP
//              past the §6 Lighthouse gate. Entry stays ≪ 180KB gz.
//   terminal → dark-sakura holding screen (P4: real tokens, one line, no fake
//              content — terminal mode is a later build, L7)
// The old home (src/pages/home.js) is unmounted as of X-1 — left in tree,
// flagged, per P4.
//
// Terminal UNMOUNTS the graph rather than hiding it: GraphCanvas owns
// window-level key handlers (Tab/arrows/'/'/Esc/f/⌘K) that must not act under
// the holding screen (never-trap, 05 §5.4.2). Cost: toggling back re-enters
// the graph at its default view — noted for Oliver in the plan status header.
import React from "react";
import { useMode } from "../mode/ModeProvider";
import GraphHome from "../graph/GraphHome.jsx";
import "../styles/sakura.css";
import "./home.css";

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
  return mode === "terminal" ? <TerminalHolding /> : <GraphHome />;
};

export default Home;
