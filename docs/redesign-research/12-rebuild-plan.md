# 12 · Rebuild plan — home + chrome on the component library

Status owner: exec-chrome (lead). Branch: `feat/component-library` (do NOT merge).
Precondition: library audited complete + rulebook-matching (see COMPONENTS.md, BRAND.md).

## CURRENT STATUS / NEXT TASK  ← executors MUST keep this block updated

```
Last updated : exec-chrome, R-C1 + R-C2 done
exec-chrome     : R-C1 ✅ R-C2 ✅ · next = R-C3 (chrome rebuild)
exec-graph-home : R-G1 IN PROGRESS (graph.css + surface components → library/brand) · then R-G2
exec-terminal   : R-T1 IN PROGRESS (token/surface port + panes) · then R-T2
Integration     : blocked until chrome gate + both home gates pass
Blockers        : exec-terminal R-T3 and exec-graph-home R-G3 wait on GATE CHROME (R-C4) — not ticked yet
Notes for Oliver: —
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
- [ ] **R-C3** SiteChrome rebuilt on library; chrome.css replaced (D-26); theme control + TERM|GRAPH toggle + nav all from library pieces
- [ ] **R-C4** chrome gate: screenshots + theme-color + round-trip → **GATE CHROME ✅**
### exec-graph-home
- [ ] **R-G1** GraphHome surface ported to library/brand (node-card, dossier, prompt-bar, typography); graph.css → tokens
- [ ] **R-G2** all four themes render clean at 1440/375; reduced-motion OK
- [ ] **R-G3** mount through new chrome (post GATE CHROME) → **GATE GRAPH-HOME ✅**
### exec-terminal
- [ ] **R-T1** TerminalHome + panes/statusline ported to brand pieces (log, statusline, glyph, prompt-bar); terminal.css → tokens
- [ ] **R-T2** all four themes + keyboard/mobile story render clean at 1440/375
- [ ] **R-T3** mount through new chrome (post GATE CHROME) → **GATE TERMINAL ✅**
### Integration (exec-chrome leads)
- [ ] **R-I1** home + chrome together, four themes, full suite + ship-check → **REBUILD DONE ✅**
