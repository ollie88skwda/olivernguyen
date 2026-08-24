// Shared chrome rebuild (plan I-1.5, 05 §6.4). Replaces src/pages/top_bar.js
// on all chromed routes — top_bar.js stays in the tree, unmounted (P4 policy).
// Changes vs the old bar: sakura tokens (chrome only — page bodies keep their
// stylesheets), TERM|GRAPH mode toggle, Search ⌘K button, dead /debt link
// dropped, grain overlay retired, ScrollProgress kept terminal-mode only.
//
// X-3 deviation from 05 §6.4 ("rebuilt with Motion"): chrome motion is CSS
// (transform transitions), not framer-motion — the chrome is the only EAGER
// framer consumer post-X-1, and its ~35KB gz in the entry chunk cost the
// mobile Lighthouse ≥ 90 perf gate (10-doc §6 wins on conflict). Same
// easing/durations; legacy pages still lazy-load framer for themselves.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ScrollProgress from "../components/ScrollProgress";
import { useMode } from "../mode/ModeProvider";
import {
  FOCUS_PARAM,
  dispatchGraphIntent,
} from "../graph/lib/focusIntent.js";
import "../styles/sakura.css";
import "./chrome.css";

// F-C.3: the Work/About/Contact links return — wired to the graph's inbound
// intent surface instead of the old home's dead /#work anchors. On "/" in
// graph mode the click dispatches 'on:graph-intent' (canvas pulses + focuses
// the node); anywhere the dispatch goes unhandled (legacy routes, mobile
// list) the href navigates to /?focus=<id> and the mounted graph surface
// consumes it. Terminal mode hides them — the terminal carries its own nav
// (statusbar tabs), and a link that yanks you out of the mode is a trap.
const NAV_LINKS = [
  { label: "Work", detail: "agents" },
  { label: "About", detail: "oliver" },
  { label: "Contact", detail: "contact" },
];

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
      <header
        className={`site-chrome-bar sakura${visible ? "" : " sc-hidden"}`}
      >
        <a href="/" className="sc-logo">oN.c</a>
        {mode === "graph" && (
          <nav className="sc-nav" aria-label="Site sections">
            {NAV_LINKS.map(({ label, detail }) => (
              <a
                key={detail}
                href={`/?${FOCUS_PARAM}=${detail}`}
                onClick={(e) => {
                  if (pathname === "/" && dispatchGraphIntent(detail))
                    e.preventDefault();
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
        <div className="sc-right">
          <div
            className={`sc-mode-toggle mode-${mode}`}
            role="group"
            aria-label="Site mode"
          >
            <span className="sc-mode-thumb" aria-hidden="true" />
            {["terminal", "graph"].map((m) => (
              <button
                key={m}
                type="button"
                className="sc-mode-btn"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {m === "terminal" ? "TERM" : "GRAPH"}
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
      </header>
      {menuOpen && (
          <nav
            id="sc-pages-menu"
            className="sc-menu sakura"
            aria-label="Site pages"
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
          </nav>
      )}
    </div>
  );
};

export default SiteChrome;
