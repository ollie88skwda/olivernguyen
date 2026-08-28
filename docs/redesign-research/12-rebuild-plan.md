# 12 · Rebuild plan — home + chrome on the component library

Status owner: exec-chrome (lead). Branch: `feat/component-library` (do NOT merge).
Precondition: library audited complete + rulebook-matching (see COMPONENTS.md, BRAND.md).

## CURRENT STATUS / NEXT TASK  ← executors MUST keep this block updated

```
Last updated : exec-graph-home, closing out — **REBUILD DONE ✅ + D-27/D-28 landed**
exec-chrome     : R-C1 ✅ R-C2 ✅ R-C3 ✅ R-C4 ✅ R-I1 ✅ — nothing outstanding
exec-graph-home : R-G1 ✅ R-G2 ✅ R-G3 ✅ — GATE GRAPH-HOME ✅, nothing outstanding.
                  Post-gate, on Oliver's review: D-27 (idle shimmer reinstated as §6's
                  third permitted loop) and D-28 (camera frames clear of the chrome bar;
                  semantic zoom follows the fit; zoom floor 0.35 → 0.25 for headroom as
                  nodes are added). Both ratified in DECISIONS.md, BRAND.md §6 amended.
exec-terminal   : R-T1 ✅ R-T2 ✅ R-T3 ✅ — GATE TERMINAL ✅, nothing outstanding
Integration     : R-I1 ✅ — the plan is complete. Branch `feat/component-library`, NOT merged.
Blockers        : none. Every checklist box in §8 is ticked; the only open items are
                  Oliver's calls in notes 7 and 9 below.

All three executors are closed out. Known-failing, both pre-existing and documented:
  - e2e/legacy-visual.spec.js → /permit (baseline drift, COMPONENTS.md follow-up 3)
  - e2e/terminal-panes.spec.js + terminal-shots.spec.js time out under `--workers=3`
    and pass with `--workers=1`. Load contention, not a regression.
NEXT HUMAN STEP: review `/`, then decide whether to merge `feat/component-library`.
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
     navy/gold theme.css). Full rationale in COMPONENTS.md §Chrome.
     HANDED OFF 2026-08-26 to exec-chrome-restore — you asked for each to be
     tried both ways and shown to you, rather than blanket-restored or
     blanket-kept. Brief: `docs/redesign-research/14-chrome-restorations.md`.
     Two of the three need a BRAND.md amendment + a D-29 entry to restore, not
     just a revert; that doc says which.
  6. RESOLVED — D-33. The shipped `--accent` dot stays subtle; `BRAND.md` §10 is the authority.
  7. §10 also fixes the favicon as "`oN` on --bg, square, 3px radius".
     index.html still points at /on_logo_navy.png. That needs an asset, not
     code, so it was left alone.
  8. RE-MEASURED at R-I1, closed. First-party JS on `/` before the graph chunk
     is 137.9 kB gz in graph mode and 150.8 kB gz in terminal mode, against the
     180 kB budget (05 §8). The lazy graph chunk is 24.8 kB gz and is still
     never fetched on a phone. No action needed.
  9. PROCESS, needs your call. Mid-session an executor ran a hard reset that
     wiped every uncommitted file in the shared working tree, destroying the
     whole first pass of R-G1 (nine files). It was rebuilt from scratch and
     committed immediately, so nothing is lost, but three agents sharing one
     checkout means any `git reset --hard` / `git checkout -- .` silently
     deletes the other two's work. Worth one worktree per executor next time.
  10. RESOLVED — you asked for the shimmer back, so it is back and ratified as
     D-27 (§6's third permitted infinite loop; BRAND.md §6 updated). It is
     driven from src/graph/drift.js rather than CSS, because a CSS animation
     here promotes each node to a composited layer that is rasterised before
     the canvas zoom is applied — which blanked the text on every card. Off
     under reduced motion and ?still.
  11. R-G1 also squared the group nodes, the tour HUD, the toast, the legend
     chips and the tech tokens (§4 gives 999px to the mode toggle, status
     pills and the radio, and nothing else), and deleted the bespoke card
     shadow the canvas used for depth (§9 allows one shadow in the system).
     Depth on the canvas is now carried entirely by hairlines.
  12. RESOLVED — D-28. The camera now frames clear of the bar (a `topInset`
     fed from `--graph-chrome-inset`, which graph.css sets only when the chrome
     is actually mounted, so the dev harness is unaffected). Two follow-ons
     came with it, both aimed at you adding nodes later: the semantic-zoom
     threshold now follows the resting zoom instead of a fixed number, so
     labels can never vanish at rest however big the graph gets; and the
     zoom-out floor moved 0.35 → 0.25, because the old floor would have made
     the graph silently stop fitting after roughly half again as many nodes.
     R-I1 re-checked and agrees: nothing in chrome.css can move the camera, so
     the real fix is graph-side (fit padding + FAR_K together) and it is your
     call, not a bug to squash. Every OTHER top-anchored element on both
     surfaces clears the bar exactly — now asserted, see R-I1.
  13. THE REBUILD IS DONE, on `feat/component-library`, unmerged as instructed.
     All three surfaces — chrome, graph home, terminal home — are on the
     component library and the brand tokens, in all four theme × mode
     combinations. No executor has work outstanding.

     WHAT WAITS ON YOU HAS MOVED. This block went stale (it still called note 5
     "in flight" after that work shipped as D-29 … D-32), so the open items now
     live in ONE place: `docs/OPEN-DECISIONS.md`. Add and close them there.

     Closed since this plan: note 5 — D-29 (chrome removals: ☰ restored,
     ScrollProgress out) and D-30 … D-32 (bar blur restored, scoped to the
     graph home, veil at 50%). note 6 — D-33 (`--accent` wordmark dot stays
     subtle). note 10 — D-27. note 12 — D-28. note 11 — group
     nodes, tour HUD, toast, legend chips and tech tokens are square, and the
     canvas's bespoke card shadow is gone (§4 / §9). note 8 — re-measured at
     R-I1, inside budget.
     Still open, carried into OPEN-DECISIONS.md: note 7 (§10 favicon asset),
     note 9 (one worktree per executor).
     The one red test, `/permit`, predates this branch entirely (note 3) and is
     item 1 there. Merging is your call — nobody merged anything.
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
- [x] **R-I1** home + chrome together, four themes, full suite + ship-check → **REBUILD DONE ✅**
      — `e2e/integration-shots.spec.js` (11 tests) is the standing gate: four theme × mode
      combinations on `/` at 1440 and 375, both axes round-tripping without dragging each other
      (D-19), and the reduced-motion fallback for both homes plus the chrome. It asserts the thing
      only integration can see — that the fixed bar occludes nothing — and that assertion caught a
      real bug: at 375px the graph's mobile list rendered its whole `oN.c GRAPH MODE` brand line
      behind the bar, invisibly, because a page that starts at its headline looks fine in a
      screenshot. Fixed in `chrome.css` by adding the bar height to the list's own top padding.
      Gates: contrast 183/183 · 441 unit · gallery-shots 11/11 · full suite 145 passed, 1 failed
      (`/permit`, pre-existing drift — note 3). Ship-check: 10 renders across `/` (both modes), two
      legacy chromed routes and the gallery at 1440×900 and 390×844, plus the ⌘K palette and the
      pages menu open over the canvas in both ladders — zero console errors anywhere.
      Budget: see note 8.
