// Shared chrome — rebuilt on the component library (plan R-C3, D-26).
//
// D-26 is greenfield, not an extension: every control in this bar is now a
// library piece, and chrome.css is down to bar LAYOUT. What each control comes
// from and why it changed:
//
//   wordmark   → <Wordmark as="a">              (D-25; was a hand-set .sc-logo
//                                                that could lose the §10 dot)
//   mode       → <ModeToggle>                   (D-25; the §4 999px exception,
//                                                now owned in one place)
//   account    → <Button size="sm" ghost> +     (D-36: account-shaped shell for
//                <DropdownMenu>                  future Clerk actions; Appearance
//                                                owns the Light/Dark choices)
//   nav        → <a> + <MonoLabel>              (§7's label role; a nav link is
//                                                a link, not a boxed button)
//   ⌘K         → <Button ghost sm> + <Glyph key>(§8's ⌘ is a glyph)
//   pages menu → <DropdownMenu>                 (was ~70 lines of bespoke panel
//                                                CSS with its own shadow and
//                                                12px radius, both off-brand)
//   menu icon  → <Icon name="menu">             (D-29; see below)
//
// R-C3 removed three things on brand grounds WITHOUT rendering any of them.
// The A/B was then settled by D-29 and D-30
// (docs/redesign-research/14-chrome-restorations.md).
//
//   1. The bar's backdrop-filter blur — restored only for the desktop graph home
//      under §9. It stays out of terminal, phone and legacy routes: terminal is
//      100dvh, while legacy pages mix navy bodies with the pink bar. The graph
//      rasterisation concern was a tour-timing artefact, not a blur regression.
//   2. The ☰ hamburger — RESTORED, as an ICON (D-29). `…` means "more of this
//      list"; this control opens site navigation. And ☰ is not in JetBrains
//      Mono (11.44px advance against the mono's 7.81px — a system fallback is
//      drawing it), so it cannot be a <Glyph> at all. That is §8's own
//      "a glyph genuinely cannot work" test, on the D-23 sun/moon precedent.
//   3. <ScrollProgress> — STAYS OUT. Measured: on "/" scrollHeight ===
//      innerHeight in all four combinations at 1440 and 375, and mounted it
//      renders at opacity 0 reading "00%". Its four probe ids exist on NO route
//      on the site, so the section designator can never appear. Seven of the eight
//      remaining legacy routes scroll <=216px; only /permit really scrolls. Restoring it
//      as-is also drags in .scroll-station from the frozen theme.css, which is
//      backdrop-filter: blur(6px) over hardcoded cream — the same §9 violation
//      rejected in (1). The component stays in the tree for
//      src/pages/top_bar.js (P4 policy), just unmounted from here.
//
// X-3 still holds: chrome motion is CSS, never framer-motion — the chrome is
// eager on every route and framer's ~35KB gz in the entry chunk cost the mobile
// Lighthouse perf gate. The hide-on-scroll slide now runs at §6's 140ms state
// duration instead of the old bespoke 350ms curve.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Glyph, Icon, ModeToggle, MonoLabel, Wordmark } from "@/components/brand";

import { useMode } from "../mode/ModeProvider";
import { useTheme } from "../theme/ThemeProvider";
import { FOCUS_PARAM, dispatchGraphIntent } from "../graph/lib/focusIntent.js";
import "../styles/sakura.css";
import "./chrome.css";

// F-C.3: the Work/About/Contact links are wired to the graph's inbound intent
// surface, not to dead /#work anchors. On "/" in graph mode the click
// dispatches 'on:graph-intent' (canvas pulses + focuses the node); anywhere the
// dispatch goes unhandled (non-graph routes, mobile list) the href navigates to
// /?focus=<id> and the mounted graph surface consumes it. Terminal mode hides
// them — the terminal carries its own nav, and a link that yanks you out of the
// mode is a trap.
const NAV_LINKS = [
  { label: "Work", detail: "agents" },
  { label: "About", detail: "oliver" },
  { label: "Contact", detail: "contact" },
];

const SCROLL_TOP_THRESHOLD = 25;

// Pages menu: the old sidebar content minus dead /debt (05 §6.4).
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
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);
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
        <header className={`site-chrome-bar sakura${visible ? "" : " sc-hidden"}`}>
          <Wordmark as="a" href="/" />

          {mode === "graph" && (
            <nav className="sc-nav" aria-label="Site sections">
              {NAV_LINKS.map(({ label, detail }) => (
                <a
                  key={detail}
                  className="sc-nav-link"
                  href={`/?${FOCUS_PARAM}=${detail}`}
                  onClick={(e) => {
                    if (pathname === "/" && dispatchGraphIntent(detail)) e.preventDefault();
                  }}
                >
                  <MonoLabel tone="muted">{label}</MonoLabel>
                </a>
              ))}
            </nav>
          )}

          <div className="sc-right">
            <ModeToggle mode={mode} onModeChange={setMode} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Open account menu">
                  Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="sc-menu sc-account-menu">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light"><Icon name="sun" /> Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark"><Icon name="moon" /> Dark</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* X-2: the palette lives in GraphCanvas and opens on the one
                sanctioned chord (⌘K/Ctrl-K, lib/keys.js isPaletteCombo) — this
                button synthesizes that keydown rather than owning a second
                path in. Rendered only where a palette exists: graph mode on
                "/". */}
            {mode === "graph" && pathname === "/" && (
              <Button
                className="sc-cmdk"
                variant="ghost"
                size="sm"
                aria-label="Open command palette"
                onClick={() =>
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
                }
              >
                Search
                {/* one flex item, or .on-btn's 8px gap lands between ⌘ and K */}
                <span className="sc-cmdk-chord">
                  <Glyph name="key" />K
                </span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* X-2 / D-29: ONE LINE TO UNDO — swap the <Icon name="menu" />
                    below back to <Glyph name="more" /> and the R-C3 state
                    returns. … is §8's mark for "more of this list"; this control
                    opens site navigation, which is not the same promise, and at
                    control size the ellipsis reads as truncation or a loading
                    placeholder next to the moon beside it. Rendered both ways at
                    375 and 1440 in all four combinations before choosing. */}
                <Button variant="ghost" size="icon" aria-label="Open pages menu">
                  <Icon name="menu" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="sc-menu">
                {MENU.map((entry, i) =>
                  entry.group ? (
                    <React.Fragment key={entry.group}>
                      {i > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel>{entry.group}</DropdownMenuLabel>
                      {entry.items.map((it) => (
                        <DropdownMenuItem key={it.href} asChild>
                          <a href={it.href}>{it.label}</a>
                        </DropdownMenuItem>
                      ))}
                    </React.Fragment>
                  ) : (
                    <DropdownMenuItem key={entry.href} asChild>
                      <a href={entry.href}>{entry.label}</a>
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      </div>
  );
};

export default SiteChrome;
