# 12 · Rebuild plan — home + chrome on the component library

Status owner: exec-chrome (lead). Branch: `feat/component-library` (do NOT merge).
Precondition: library audited complete + rulebook-matching (see COMPONENTS.md, BRAND.md).

## CURRENT STATUS / NEXT TASK  ← executors MUST keep this block updated

```
Last updated : exec-graph-home, R-G3 done — GATE GRAPH-HOME ✅
exec-chrome     : R-C1 ✅ R-C2 ✅ R-C3 ✅ R-C4 ✅ · next = R-I1 (Integration) — UNBLOCKED, both home gates pass
exec-graph-home : R-G1 ✅ R-G2 ✅ R-G3 ✅ — GATE GRAPH-HOME ✅, nothing outstanding
exec-terminal   : R-T1 ✅ R-T2 ✅ R-T3 ✅ — GATE TERMINAL ✅, nothing outstanding
Integration     : ready to start (R-I1, exec-chrome leads)
Blockers        : none
Notes for Oliver:
  1. exec-terminal moved a gate assertion. The console body went from a bespoke
     14px to the library's --fs-mono (13px, BRAND.md §7's ratified point inside
     the 13–14 range), so 1440px now fits ~180 columns and the second pane split
     no longer trips the 40ch floor at that width. e2e/terminal.spec.js narrows
     to 960px before asserting the refusal. The RULE under test is unchanged —
     only the width that trips it moved.
  2. FIXED by exec-chrome in R-C3. The pages menu is a library DropdownMenu
     now, so it portals to <body>; the spec addresses it by data-slot instead
     of the retired #sc-pages-menu id.
  3. e2e/legacy-visual.spec.js /permit still fails — pre-existing baseline
     drift, already logged as COMPONENTS.md follow-up 3.
  3b. FOR EXEC-CHROME: e2e/chrome.spec.js "§10 wordmark: oN.c with the dot in
     --accent" fails on the current working tree. src/chrome/** — not seen
     from the terminal side, flagged only.
  3c. Pre-existing, NOT introduced by R-T3: the terminal's overlays sit at
     z-index 80 and the chrome bar at 1000, so the palette and help backdrops
     do not dim the bar and it stays clickable behind a modal. Both panels
     open below the bar so nothing is occluded. Changing it means moving the
     bar's z-index, which is exec-chrome's file and a decision, not a fix.
  4. NOT REPRODUCIBLE — closed by exec-graph-home. `titleAs`/`titleClassName`
     are destructured by NodeCard (src/components/brand/node-card.jsx:34-35)
     and never reach the DOM; a fresh run of / at 375px logs no React warning,
     and e2e/graph.spec.js is green. The sighting was almost certainly a stale
     vite module: the R-G1 working tree was destroyed mid-session by a
     `git reset --hard` from another executor and rebuilt (see note 9), and
     the shared :3100 server kept serving pre-reset transforms.
  5. R-C3 removed three things from the chrome on brand grounds — the bar's
     backdrop blur (§9 bans glassmorphism), the ☰ hamburger (not in §8's
     ratified set; it is `…` now) and <ScrollProgress> (probed ids of the
     retired old home, never visible on `/`, and painted from the frozen
     navy/gold theme.css). Full rationale in COMPONENTS.md §Chrome. Say if you
     want any of them back — each is a one-line revert.
  6. §10 says the wordmark dot is "the same colour as the routing pulse", but
     it also says the dot is `--accent`, and on BOTH ladders --routing-pulse is
     jade, not --accent. The normative sentence (dot = --accent) was followed.
     On the dark ladder --accent (#ffb7d1) sits close to --text (#f5dce6), so
     the dot is subtle there; it is legible at 20px and 6x zoom, but if you want
     it louder that is a palette decision, not a component one.
  7. §10 also fixes the favicon as "`oN` on --bg, square, 3px radius".
     index.html still points at /on_logo_navy.png. That needs an asset, not
     code, so it was left alone.
  8. Entry-chunk cost of putting the chrome on the library: 58.4 → 90.6 kB gz.
     First-party JS on `/` before the graph chunk is 137 kB gz against the
     180 kB budget (05 §8). Fine, but the headroom is 43 kB and both home
     surfaces still have to land — re-measured at R-I1.
  9. PROCESS, needs your call. Mid-session an executor ran a hard reset that
     wiped every uncommitted file in the shared working tree, destroying the
     whole first pass of R-G1 (nine files). It was rebuilt from scratch and
     committed immediately, so nothing is lost, but three agents sharing one
     checkout means any `git reset --hard` / `git checkout -- .` silently
     deletes the other two's work. Worth one worktree per executor next time.
  10. R-G1 removed the graph's idle node drift (§6 bans infinite loops; D-18
     ratifies exactly two and that was a third). The canvas is now completely
     still at rest. It reads more deliberate and less "alive" — if you want
     the shimmer back it is a new decision entry, not a bug.
  11. R-G1 also squared the group nodes, the tour HUD, the toast, the legend
     chips and the tech tokens (§4 gives 999px to the mode toggle, status
     pills and the radio, and nothing else), and deleted the bespoke card
     shadow the canvas used for depth (§9 allows one shadow in the system).
     Depth on the canvas is now carried entirely by hairlines.
  12. FOR R-I1 / exec-chrome, measured and NOT actioned: at 1440x900 the
     topmost node sits partly behind the fixed 64px bar. The one-line fix
     (`.g-stage { top: var(--s-16) }` alongside the other graph HUD offsets in
     chrome.css) was tried and rejected — shrinking the stage drops fit zoom
     from 46% to 42%, under camera.js FAR_K (0.45), which hides every leaf
     card's kicker and description at rest. One clipped node beats a canvas
     with no labels. Fixing it properly means moving FAR_K too, which is a
     camera decision. Left as-is on purpose.
```

Update rules: tick §8 checkboxes as tasks complete; rewrite this block each session; human questions → "Notes for Oliver".

## Decisions made (D-24 .. D-26 — do not re-open)
- **D-24** forwardRef: add `forwardRef` to the plain `src/components/ui/**` primitives so chrome/home can wrap them in tooltips. Owned by exec-chrome, done FIRST (shared dependency for the other two).
- **D-25** `Wordmark` and `ModeToggle` become library brand components in `src/components/brand/**` (incl. §10 accent dot). Owned by exec-chrome.
- **D-26** chrome rebuild replaces `src/chrome/chrome.css` outright with library-based chrome (greenfield, not extension).

## 1 · Context
Library is complete: 25 primitives in `src/components/ui/**`, 16 brand pieces in `src/components/brand/**`, values centralised in `src/styles/components.css` (radius 0/3/999, 4px spacing, 140ms motion, type vars), gallery at `/_components`. Four themes gated (`data-theme` × `data-mode`, independent). ThemeProvider + sun/moon theme control already shipped. This plan ports the three live surfaces onto the library + brand tokens, removing bespoke chrome/home/terminal/graph CSS.

## 2 · File ownership (disjoint — never edit another executor's files)
- **exec-chrome** (LEAD): `src/chrome/**` (SiteChrome.jsx, chrome.css → replaced), `src/components/brand/wordmark.jsx` + `mode-toggle.jsx` (new), forwardRef additions in `src/components/ui/**`, shared files (`package.json`, `vite.config.js`, `index.html`), and the `Integration` section.
- **exec-graph-home**: `src/graph/GraphHome.jsx` + graph surface components + `src/graph/graph.css` (surface styles ported to library/brand tokens; the camera/lib engine is untouched but reads tokens only).
- **exec-terminal**: `src/terminal/**` (TerminalHome.jsx, panes, statusline) + `src/terminal/terminal.css` (ported to brand pieces: log, statusline, glyph, prompt-bar).

## 3 · What "on the library" means
Replace bespoke surface CSS with existing library components + `components.css` tokens + BRAND.md tokens only. No hex, radius, duration, or font literals in new code — reference `var(--token)`. Reuse before building; a genuinely new piece goes in the library (ui/brand) and is logged in COMPONENTS.md. Never put tokens on `:root`; keep `.sakura` scoping + `data-theme`/`data-mode`.

## 4 · Gates (run all before a session ends; all must pass)
- `node scripts/contrast-check.mjs` → exit 0 (183 pairs, 4 themes).
- `npm run test:run` → 441 green (was 353; R-C1 added the forwardRef sweep). May grow, not shrink.
- `npx playwright test e2e/gallery-shots.spec.js` → green, no console errors.
- Screenshot home + chrome in all four themes at 1440px and 375px (graph + terminal). Verify theme-color follows ladder; mode/theme round-trip; reduced-motion static fallbacks.

## 5 · Ordering
1. exec-chrome: D-24 forwardRef → D-25 Wordmark/ModeToggle → chrome rebuild → **GATE CHROME ✅** (tick it; unblocks home mounts).
2. exec-graph-home + exec-terminal can start their pure/token work immediately, but only mount through the new chrome after GATE CHROME.
3. Integration (exec-chrome leads): home + chrome together in all four themes, full suite, ship-check.

## 6 · Resume protocol (fresh agent, cold start)
1. Read this doc top to bottom. 2. Read the §CURRENT STATUS block — your next task ID. 3. `git checkout feat/component-library`. 4. Read BRAND.md §relevant + COMPONENTS.md before any UI. 5. Verify the last claimed gate before building on it. 6. Reuse library components; log new ones in COMPONENTS.md.

## 8 · LIVE TASK CHECKLIST — tick as you go
### exec-chrome
- [x] **R-C1** forwardRef added to the plain `src/components/ui/**` primitives (D-24); unit green
      — 441 unit tests (was 353). `src/components/ui/forward-ref.test.jsx` is the standing gate: it
      fails on any DOM-rendering export that is a plain function. Radix context Roots (`Dialog`,
      `Sheet`, `Select`, `Popover`, `DropdownMenu`, `DropdownMenuSub`, `Tooltip`,
      `TooltipProvider`, `CommandDialog`) stay plain — no DOM, no ref target. `brand/icon.jsx` was
      swept too: it renders inside controls.
- [x] **R-C2** `Wordmark` + `ModeToggle` brand components (D-25, incl. §10 accent dot); logged in COMPONENTS.md
      — exported from `@/components/brand`, specimens in the gallery under `#marks`, verified in all
      four themes. `--fs-wordmark: 20px` names §10's stated nav size in `src/styles/sakura.css`.
- [x] **R-C3** SiteChrome rebuilt on library; chrome.css replaced (D-26); theme control + TERM|GRAPH toggle + nav all from library pieces
      — chrome.css 309 → ~130 lines and it no longer draws a control: layout, the hide-on-scroll
      slide, the D-23 icon crossfade and the two home-surface offsets, all on tokens. Per-piece
      table and the three brand-grounds removals are in COMPONENTS.md §Chrome.
- [x] **R-C4** chrome gate: screenshots + theme-color + round-trip → **GATE CHROME ✅**
      — 8 renders (4 themes × 1440/375, coarse-pointer emulated at 375), zero console errors, shots
      in `e2e/__shots__/chrome-*.png`. theme-color follows the LADDER in all four combinations.
      `e2e/chrome.spec.js` (9 tests) makes it durable: §10 accent dot, §4 radius split, theme-color,
      theme round-trip leaving mode alone, nav is graph-only, reduced-motion fallback.
      Full suite: 128 passed, 2 failed — both pre-existing/other-executor, see Notes 3 and 4.
### exec-graph-home
- [x] **R-G1** GraphHome surface ported to library/brand (node-card, dossier, prompt-bar, typography); graph.css → tokens
- [x] **R-G2** all four themes render clean at 1440/375; reduced-motion OK
- [x] **R-G3** mount through new chrome (post GATE CHROME) → **GATE GRAPH-HOME ✅**
### exec-terminal
- [x] **R-T1** TerminalHome + panes/statusline ported to brand pieces (log, statusline, glyph, prompt-bar); terminal.css → tokens — inventory in COMPONENTS.md §"Surfaces ported onto the library"
- [x] **R-T2** all four themes + keyboard/mobile story render clean at 1440/375 — `e2e/terminal-shots.spec.js`, 14 renders
- [x] **R-T3** mount through new chrome (post GATE CHROME) → **GATE TERMINAL ✅**
      — `e2e/terminal-shots.spec.js` §R-T3: the console on "/" in both ladders at 1440 and 375, the
      64px offset glue, the statusbar staying on screen, `documentElement` still unscrollable, the
      portalled pages menu over the console inside `.sakura`, and theme × mode round-tripping
      independently (D-19) with a fresh remount on the mode flip (P3). Gates: contrast 183/183,
      441 unit, gallery-shots green, zero console errors.
### Integration (exec-chrome leads)
- [ ] **R-I1** home + chrome together, four themes, full suite + ship-check → **REBUILD DONE ✅**
