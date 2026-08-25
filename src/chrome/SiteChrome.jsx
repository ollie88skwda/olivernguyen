// Shared chrome — rebuilt on the component library (plan R-C3, D-26).
//
// D-26 is greenfield, not an extension: every control in this bar is now a
// library piece, and chrome.css is down to bar LAYOUT plus the one thing no
// component owns (the theme control's icon crossfade). What each control comes
// from and why it changed:
//
//   wordmark   → <Wordmark as="a">              (D-25; was a hand-set .sc-logo
//                                                that could lose the §10 dot)
//   mode       → <ModeToggle>                   (D-25; the §4 999px exception,
//                                                now owned in one place)
//   theme      → <Button size="icon" ghost>     (D-23 says the theme control is
//                                                an ORDINARY 3px icon button —
//                                                that is exactly this variant)
//   nav        → <a> + <MonoLabel>              (§7's label role; a nav link is
//                                                a link, not a boxed button)
//   ⌘K         → <Button ghost sm> + <Glyph key>(§8's ⌘ is a glyph)
//   pages menu → <DropdownMenu>                 (was ~70 lines of bespoke panel
//                                                CSS with its own shadow and
//                                                12px radius, both off-brand)
//
// Three things the rebuild removes on brand grounds, all flagged in the plan:
//   1. The bar's backdrop-filter blur. §9 bans glassmorphism and blurred
//      backdrops outright; the bar is now solid --bg on a hairline.
//   2. The ☰ hamburger. §8's ratified set has no hamburger; `…` (Glyph "more",
//      ratified D-13) is the mark for "there is more here".
//   3. <ScrollProgress>. It reads #about/#work/#skills/#contact — ids of the
//      retired old home — so on "/" it can only ever read "U0 / Hero", and the
//      terminal screen is 100dvh and never scrolls, so it never even becomes
//      visible. Where it did show (legacy routes) it was painted by the frozen
//      navy/gold theme.css inside a sakura bar. The component stays in the tree
//      for src/pages/top_bar.js (P4 policy), just unmounted from here.
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Glyph, Icon, ModeToggle, MonoLabel, Wordmark } from "@/components/brand";

import { useMode } from "../mode/ModeProvider";
import { useTheme } from "../theme/ThemeProvider";
import { FOCUS_PARAM, dispatchGraphIntent } from "../graph/lib/focusIntent.js";
import "../styles/sakura.css";
import "./chrome.css";

// F-C.3: the Work/About/Contact links are wired to the graph's inbound intent
// surface, not to dead /#work anchors. On "/" in graph mode the click
// dispatches 'on:graph-intent' (canvas pulses + focuses the node); anywhere the
// dispatch goes unhandled (legacy routes, mobile list) the href navigates to
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

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <TooltipProvider>
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

            {/* D-23: the theme control is an ordinary 3px icon button, sized
                40px (44 on a coarse pointer) — deliberately NOT a pill, so it
                does not read as a second half of the round mode toggle beside
                it. It shows the icon of the CURRENT theme and names the ACTION
                in its accessible name. Placed before ⌘K because that button
                only exists in graph mode on "/", and this control must not move
                when the mode does.

                The tooltip repeats the aria-label, it does not replace it —
                §1 forbids anything depending on hover alone. This is the one
                icon-only control in the bar, which is why it gets one. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Switch to ${nextTheme} theme`}
                  onClick={() => setTheme(nextTheme)}
                >
                  <span className="sc-theme-icons" aria-hidden="true">
                    <Icon name="sun" className="sc-theme-icon" data-on={theme === "light"} />
                    <Icon name="moon" className="sc-theme-icon" data-on={theme === "dark"} />
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{`Switch to ${nextTheme} theme`}</TooltipContent>
            </Tooltip>

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
                <Button variant="ghost" size="icon" aria-label="Open pages menu">
                  <Glyph name="more" />
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
    </TooltipProvider>
  );
};

export default SiteChrome;
