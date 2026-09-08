// Mode-switched home (I-1.4, graph integrated at X-1, terminal at X-2).
//   graph    → GraphHome. Imported STATICALLY (deviation from §5's "lazy-
//              imported by Home", logged in the plan status header): P6's
//              actual mandate — d3 + canvas code lazy-chunked, never fetched
//              on mobile — is carried by GraphHome's own internal
//              lazy(GraphCanvas) split. Lazy-loading the 5KB-gz shell too
//              only added a sequential fetch hop that pushed mobile LCP
//              past the §6 Lighthouse gate. Entry stays ≪ 180KB gz.
//   terminal → lazy(TerminalHome) (P6: terminal is never the first paint —
//              the chunk loads only when the mode flips; network-asserted in
//              e2e/mode-roundtrip.spec.js). The doc-10 holding screen is gone
//              (X-2), and src/home/home.css went with it (orphan).
//
// P3 never-trap by unmount, both directions: exactly ONE of GraphHome /
// TerminalHome is mounted. GraphCanvas owns window-level key handlers
// (Tab/arrows/'/'/Esc/f/⌘K) and TerminalHome owns its own window keydown —
// neither may exist while the other mode is on screen. Round-trip remounts
// terminal fresh (scrollback + pane layout die, like a real session).
import React, { lazy, Suspense } from "react";
import { useMode } from "../mode/ModeProvider";
import GraphHome from "../graph/GraphHome.jsx";
import "../styles/sakura.css";

const TerminalHome = lazy(() => import("../terminal/TerminalHome.jsx"));

// While the terminal chunk loads: a bare Night Plum screen, tokens only.
const TerminalLoading = () => (
  <main
    className="sakura"
    style={{ minHeight: "100dvh", background: "var(--bg)" }}
    aria-busy="true"
  />
);

export const Home = () => {
  const { mode } = useMode();
  return mode === "terminal" ? (
    <Suspense fallback={<TerminalLoading />}>
      <TerminalHome />
    </Suspense>
  ) : (
    <GraphHome />
  );
};

export default Home;
