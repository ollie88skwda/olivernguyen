// Shared chrome rebuild (plan I-1.5, 05 §6.4). Replaces src/pages/top_bar.js
// on all chromed routes — top_bar.js stays in the tree, unmounted (P4 policy).
// Changes vs the old bar: sakura tokens (chrome only — page bodies keep their
// stylesheets), TERM|GRAPH mode toggle, Search ⌘K button, dead /debt link
// dropped, grain overlay retired, ScrollProgress kept terminal-mode only.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ScrollProgress from "../components/ScrollProgress";
import { useMode } from "../mode/ModeProvider";
import "../styles/sakura.css";
import "./chrome.css";

const SCROLL_TOP_THRESHOLD = 25;

// Pages menu: old sidebar content minus dead /debt (05 §6.4).
const MENU = [
  { label: "Home", href: "/" },
  { label: "PULL", href: "/pull" },
  { label: "Transfer", href: "/transfer" },
  { group: "College", items: [
    { label: "College", href: "/college" },
    { label: "Major", href: "/major" },
    { label: "Apply", href: "/apply" },
    { label: "Studio", href: "/studio" },
  ] },
  { group: "Driving", items: [
    { label: "Permit", href: "/permit" },
    { label: "License", href: "/license" },
  ] },
  { group: "SAT", items: [
    { label: "Resources", href: "/sat-resources" },
    { label: "Sign Up", href: "/sat-signup" },
  ] },
];

export const SiteChrome = () => {
  const { mode, setMode } = useMode();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);

  const onScroll = useCallback(() => {
    const y = window.pageYOffset || document.documentElement.scrollTop;
    setVisible(y <= SCROLL_TOP_THRESHOLD || y < lastY.current);
    lastY.current = y;
  }, []);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [onScroll]);

  return (
    <div className="site-chrome">
      {mode === "terminal" && <ScrollProgress />}
      <motion.header
        className="site-chrome-bar sakura"
        initial={{ y: -80 }}
        animate={{ y: visible ? 0 : -80 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <a href="/" className="sc-logo">oN.c</a>
        {/* X-1: the Work/About/Contact anchors died with the old home's
            sections (P4); the graph has no #hash targets and no inbound
            focus-intent API yet — dropped rather than left dead. Pages menu +
            the graph's own nav (⌘K, legend, prompt) cover navigation. */}
        <div className="sc-right">
          <div className="sc-mode-toggle" role="group" aria-label="Site mode">
            {["terminal", "graph"].map((m) => (
              <button
                key={m}
                type="button"
                className="sc-mode-btn"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {mode === m && (
                  <motion.span
                    layoutId="sc-mode-thumb"
                    className="sc-mode-thumb"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {m === "terminal" ? "TERM" : "GRAPH"}
                </span>
              </button>
            ))}
          </div>
          {/* X-2: the palette lives in GraphCanvas and opens on the one
              sanctioned chord (⌘K/Ctrl-K, lib/keys.js isPaletteCombo) — the
              button synthesizes that keydown. Rendered only where a palette
              exists: graph mode on "/". */}
          {mode === "graph" && pathname === "/" && (
            <button
              type="button"
              className="sc-cmdk"
              onClick={() =>
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                )
              }
              aria-label="Open command palette"
            >
              SEARCH ⌘K
            </button>
          )}
          <button
            type="button"
            className="sc-menu-btn"
            aria-label="Open pages menu"
            aria-expanded={menuOpen}
            aria-controls="sc-pages-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </motion.header>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="sc-pages-menu"
            className="sc-menu sakura"
            aria-label="Site pages"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <ul>
              {MENU.map((entry) =>
                entry.group ? (
                  <li key={entry.group}>
                    <div className="sc-menu-group">{entry.group}</div>
                    <ul className="sc-menu-sub">
                      {entry.items.map((it) => (
                        <li key={it.href}>
                          <a href={it.href}>{it.label}</a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={entry.href}>
                    <a href={entry.href}>{entry.label}</a>
                  </li>
                ),
              )}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SiteChrome;
