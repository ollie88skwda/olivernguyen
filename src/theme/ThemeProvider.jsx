// Theme state — which PALETTE LADDER the page sits on (docs/THEMES.md §2).
//
//   useTheme() → { theme: 'light' | 'dark', setTheme(t) }
//
// This mirrors the shape of src/mode/ModeProvider.jsx on purpose, and shares
// no state with it on purpose. D-19: theme and mode are two independent
// attributes — `data-theme` picks the ladder, `data-mode` picks the interface.
// Neither may ever be derived from the other, so this is a second provider,
// not a second field on the first one.
//
// Resolution (THEMES.md §6.1):
//   1. ?theme= URL param        (shareable links; also written back on toggle)
//   2. localStorage 'on.theme'  (returning visitors)
//   3. prefers-color-scheme     (first visit only — see below)
//   4. 'light'                  (matches `.sakura`, the un-themed default)
//
// An explicit choice WINS AND PERSISTS. The OS preference is followed live
// (the media query is watched) only until the visitor picks a side; from then
// on the stored choice is the answer and the OS is ignored.
//
// Side effects: <html data-theme>, <meta name="theme-color">, localStorage,
// and history.replaceState URL sync on user toggles (no router navigation, no
// scroll reset — same contract ModeProvider follows).
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const THEMES = ["light", "dark"];
const STORAGE_KEY = "on.theme";
const DARK_MQ = "(prefers-color-scheme: dark)";
// theme-color follows the LADDER's --bg (THEMES.md §6.2). It used to follow
// mode in ModeProvider, back when terminal implied dark.
const THEME_COLOR = { light: "#faf1f5", dark: "#180f14" };

const ThemeContext = createContext(null);

// { theme, explicit } — `explicit` is false only for an OS-derived first visit,
// which is the one state where the OS is still allowed to change our mind.
const resolveInitialTheme = () => {
  try {
    const param = new URLSearchParams(window.location.search).get("theme");
    if (THEMES.includes(param)) return { theme: param, explicit: true };
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (THEMES.includes(stored)) return { theme: stored, explicit: true };
  } catch {
    /* storage blocked (private mode) — fall through */
  }
  try {
    if (window.matchMedia(DARK_MQ).matches)
      return { theme: "dark", explicit: false };
  } catch {
    /* no matchMedia — fall through */
  }
  return { theme: "light", explicit: false };
};

export const ThemeProvider = ({ children }) => {
  const [{ theme, explicit }, setState] = useState(resolveInitialTheme);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
    if (!explicit) return; // never persist a preference the user did not make
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* non-fatal */
    }
  }, [theme, explicit]);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next) || next === themeRef.current) return;
    setState({ theme: next, explicit: true });
    // URL sync — replaceState only; router v5 ignores query-only changes.
    const url = new URL(window.location.href);
    url.searchParams.set("theme", next);
    window.history.replaceState(window.history.state, "", url);
  }, []);

  // Follow the OS until the visitor chooses. After that this listener is inert.
  useEffect(() => {
    if (explicit) return undefined;
    let mq;
    try {
      mq = window.matchMedia(DARK_MQ);
    } catch {
      return undefined;
    }
    const onChange = (e) =>
      setState((prev) =>
        prev.explicit ? prev : { theme: e.matches ? "dark" : "light", explicit: false },
      );
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [explicit]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() requires a <ThemeProvider> ancestor");
  return ctx;
};
