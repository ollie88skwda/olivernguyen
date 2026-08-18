// Mode state for the two-mode site (plan §5 Mount API — the contract).
//
//   useMode() → { mode: 'graph' | 'terminal', setMode(m) }
//
// Resolution (plan P3 — interim default is graph for EVERYONE; 05 §6.2's OS
// heuristic activates only when terminal actually ships):
//   1. ?mode= URL param        (shareable links; also written back on toggle)
//   2. localStorage 'on.mode'  (returning visitors)
//   3. 'graph'
//
// Side effects: <html data-mode>, <meta name="theme-color">, localStorage,
// and history.replaceState URL sync on user toggles (no router navigation,
// no scroll reset — 05 §6.2).
//
// X-2 contract (exec-graph): the graph's ⌘K/prompt "switch to terminal"
// intent dispatches a cancelable CustomEvent 'on:set-mode' on window with
// detail 'terminal'|'graph'. We listen and preventDefault to signal the app
// handled it — uncaught, the graph falls back to a holding-screen toast.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const MODES = ["graph", "terminal"];
const STORAGE_KEY = "on.mode";
// theme-color follows the mode's --bg (04 §5).
const THEME_COLOR = { graph: "#faf1f5", terminal: "#180f14" };

const ModeContext = createContext(null);

const resolveInitialMode = () => {
  try {
    const param = new URLSearchParams(window.location.search).get("mode");
    if (MODES.includes(param)) return param;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (MODES.includes(stored)) return stored;
  } catch {
    /* storage blocked (private mode) — fall through */
  }
  return "graph";
};

export const ModeProvider = ({ children }) => {
  const [mode, setModeState] = useState(resolveInitialMode);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
    document.documentElement.setAttribute("data-mode", mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[mode]);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* non-fatal */
    }
  }, [mode]);

  const setMode = useCallback((next) => {
    if (!MODES.includes(next) || next === modeRef.current) return;
    setModeState(next);
    // URL sync — replaceState only; router v5 ignores query-only changes.
    const url = new URL(window.location.href);
    url.searchParams.set("mode", next);
    window.history.replaceState(window.history.state, "", url);
  }, []);

  useEffect(() => {
    const onSetMode = (event) => {
      if (!MODES.includes(event.detail)) return;
      event.preventDefault(); // tells the dispatcher the app handled it
      setMode(event.detail);
    };
    window.addEventListener("on:set-mode", onSetMode);
    return () => window.removeEventListener("on:set-mode", onSetMode);
  }, [setMode]);

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode() requires a <ModeProvider> ancestor");
  return ctx;
};
