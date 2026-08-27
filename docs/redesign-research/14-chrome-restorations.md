# 14 · Chrome restorations — the three things R-C3 removed

Owner: exec-chrome-restore. Branch: `feat/component-library` (do NOT merge).
Handed off 2026-08-26 by the exec-chrome that shipped the rebuild (`docs/redesign-research/12-rebuild-plan.md`, complete).

## CURRENT STATUS / NEXT TASK ← keep updated

```
Last updated : handoff, not started
next         : X-1 (backdrop blur)
Blockers     : none
Notes for Oliver: —
```

## Objective

Oliver's instruction, 2026-08-26: **try each of the three both ways, pick the stronger one, show him an A/B.**

- Do NOT blanket-restore. Do NOT blanket-keep.
- Every change must stay one line to undo. Say which line, in the commit.
- Never wait for Oliver. Log questions under "Notes for Oliver" and keep going.

## Why these three exist

R-C3 rebuilt `src/chrome/SiteChrome.jsx` + `src/chrome/chrome.css` on the component library (D-26).
Three things were dropped on brand grounds. Each is defensible; none was reviewed against a render.
Full rationale: `docs/COMPONENTS.md` §"Chrome — R-C3".

**Two of the three are in direct tension with a LOCKED `BRAND.md` rule.** Restoring those is not a
code change — it is a `BRAND.md` amendment plus a `docs/DECISIONS.md` entry. Next free id is **D-29**
(D-27/D-28 are taken). `BRAND.md` §11.4: a value the doc does not define is a decision, not an
implementation detail.

## X-1 · Backdrop blur on the bar

Removed under `BRAND.md` §9: *"Banned: glassmorphism, blurred gradient backdrops…"*.

- Now: `src/chrome/chrome.css` `.site-chrome-bar` → `background: var(--bg)` + the §9 hairline.
- Was (`git show 23dac554^:src/chrome/chrome.css`):
  ```css
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  ```
- Render it over the graph canvas specifically. The bar sits on the dot grid, so blur smears
  `--dot-grid` and node edges — that is where it either earns its place or looks cheap.
- Terminal mode on `/` never scrolls, so there is nothing to pass under the bar. Check whether the
  effect is visible there at all before arguing to keep it.
- Restoring = amend `BRAND.md` §9 + log D-29. State plainly that §9 is being narrowed, not ignored.

## X-2 · The pages-menu icon: `…` vs `☰`

Removed under `BRAND.md` §8 — the ratified glyph set has no hamburger. `…` is `Glyph name="more"`, ratified D-13.

- Now: `src/chrome/SiteChrome.jsx`, the `DropdownMenuTrigger` → `<Glyph name="more" />`.
- **This is the strongest restore candidate.** §8's own test is whether a glyph "genuinely cannot
  work". `…` means "more of the same list"; `☰` means "site menu". They are not synonyms, and the
  control opens site navigation.
- Judge it on recognition, not purity: screenshot the bar at 375px in all four themes and ask what
  the icon promises.
- Adding `☰` = a new entry in `GLYPHS` in `src/components/brand/glyph.jsx` + D-29. Precedent: D-13
  added six glyphs at once.
- Alternative worth rendering before deciding: keep `…` but give the trigger a visible text label.

## X-3 · `ScrollProgress`

Removed because it was dead on `/`, not because of a brand rule. Verify the evidence yourself.

- Component: `src/components/ScrollProgress.js`. Unmounted from the chrome; still used by
  `src/pages/top_bar.js` (legacy, itself unmounted — P4 policy).
- It probes `#about #work #skills #contact` — ids of the **retired** old home. On `/` it can only
  ever read `U0 / Hero`.
- It only adds `.visible` when scroll > 1%. The terminal screen is `100dvh` and never scrolls, so on
  `/` it was invisible in both modes.
- Where it did render (legacy routes in terminal mode) it was painted by `.scroll-station` in
  `src/styles/theme.css` — the **frozen** navy/gold legacy stack — inside a sakura bar.
- **`src/styles/theme.css` is frozen. Do not edit it** (`AGENTS.md` §2).
- Three options, in increasing cost: leave out · restore as-is (accept legacy paint) · rebuild on the
  library. Legacy pages genuinely do scroll, so it has a real job there — a rebuild would use
  `Progress` from `src/components/ui/progress.jsx` (§4 radius 0, 4px, 140ms) and point at real
  section ids.

## Ownership

Yours: `src/chrome/**`, `src/components/brand/glyph.jsx`, `src/components/ScrollProgress.js`,
`docs/BRAND.md`, `docs/DECISIONS.md`, `docs/COMPONENTS.md`, `docs/redesign-research/14-*`.

Do not touch: `src/graph/**`, `src/terminal/**` (both shipped and gated), `src/styles/theme.css` (frozen).

## Gates — all must pass before you finish

```bash
node scripts/contrast-check.mjs                  # exit 0, 183 pairs, 4 themes
npm run test:run                                 # 450 green (may grow, not shrink)
npx playwright test e2e/chrome.spec.js           # 9
npx playwright test e2e/integration-shots.spec.js # 11 — occlusion + 4 combinations
npx playwright test                              # 147 passed / 1 failed / 4 skipped
```

The one permitted failure is `e2e/legacy-visual.spec.js` → `/permit`. It predates this branch,
verified by stashing. `docs/COMPONENTS.md` follow-up 3.

`e2e/integration-shots.spec.js` asserts the fixed bar occludes nothing. **Anything that changes the
bar's height or background must be re-run against it.**

## A/B renders — how

Render `/` in all four `data-theme` × `data-mode` combinations at 1440 and 375, both ways, per item.
Copy the harness from `e2e/integration-shots.spec.js`. Land shots in `e2e/__shots__/` (gitignored).

Coarse pointer changes control sizes to 44px (`BRAND.md` §1), so pass `isMobile: true, hasTouch: true`
at 375 or the bar renders at desktop metrics.

Use `page.emulateMedia({ reducedMotion })`, **never** `test.use({ reducedMotion })` — under this
config's Desktop Chrome device the latter leaves `matchMedia()` false and the assertion passes for
the wrong reason.

## Cross-file coupling

`src/graph/graph.css:64` declares `--graph-chrome-inset: var(--s-16)` keyed off
`body:has(.site-chrome-bar)`, and `src/graph/lib/camera.js` reads it to frame clear of the bar (D-28).
**Changing the bar height means changing that too** — and it is in exec-graph's files, so raise it
rather than editing it.
