# 14 · Chrome restorations — the three things R-C3 removed

Owner: exec-chrome-restore. Branch: `feat/component-library` (do NOT merge).
Handed off 2026-08-26 by the exec-chrome that shipped the rebuild (`docs/redesign-research/12-rebuild-plan.md`, complete).

## CURRENT STATUS / NEXT TASK ← keep updated

```
Last updated : 2026-08-26 — DONE, all three settled as D-29
next         : nothing. Oliver reviews the A/B; see "A/B for Oliver" below.
Blockers     : none
Notes for Oliver:
  1. X-2 came back as an ICON, not a glyph. ☰ is not in JetBrains Mono — measured
     11.44px advance against the mono's 7.81px, so a system font was drawing it.
     That satisfies §8's own carve-out instead of narrowing it, so §8 gained one
     allow-list name (`menu`) rather than a new glyph.
  2. §9 was NOT narrowed. The blur was rendered and lost on merit — including a
     cost nobody had spotted: it re-rasterises the whole graph canvas soft.
  3. X-3's rebuild-on-`Progress` option is DEFERRED, not rejected. It needs real
     section ids, and those live in un-restyled `src/pages/**`. Revisit at the legacy
     restyle. Say the word if you want it built for `/permit` alone anyway.
  4. Bar height and background are unchanged, so `--graph-chrome-inset` (D-28,
     exec-graph's files) needed nothing. Nothing was raised to exec-graph.
```

## OUTCOME — 1 restored, 2 confirmed removed

All three rendered both ways on the real site before choosing: four `data-theme` × `data-mode`
combinations at 1440 and 375 (coarse pointer via `devices["iPhone 13"]`), plus legacy routes.
Decision logged as **D-29** in `docs/DECISIONS.md`. Component notes: `docs/COMPONENTS.md`
§"Chrome — R-C3" → "The three removals, settled 2026-08-26".

| Item | Verdict | One line to undo |
|---|---|---|
| X-1 backdrop blur | **stays out** — §9 upheld, not narrowed | n/a, no code change |
| X-2 pages-menu icon | **restored** as `<Icon name="menu" />` | `src/chrome/SiteChrome.jsx` — swap that one element back to `<Glyph name="more" />` |
| X-3 `ScrollProgress` | **stays out** | n/a, no code change |

### X-1 — rejected on three counts, only one of which was the brand rule

> **SUPERSEDED 2026-08-26 by `docs/redesign-research/15-blur-restore.md` and `DECISIONS.md` D-30.**
> Oliver reversed this by name and the blur now ships in graph mode on the graph home at ≥768px /
> fine pointer. Findings 1 and 2 below were re-rendered and **held** — they are exactly why it is
> scoped that narrowly. Finding 3 was a **measurement artefact**: the graph's 6s guided-tour
> autostart (`TOUR_IDLE_AUTOSTART_MS`) moved the camera between the harness's two frames. An inert
> stylesheet, and injecting nothing at all, produce the same 47% pixel change. The rest of this file
> is unchanged and still correct.
1. **Terminal is pixel-identical.** `100dvh`, never scrolls, nothing passes under the bar.
2. **The pre-restyle `/college` route went muddy.** It scrolled: the navy legacy headline smeared up
   through the pink sakura bar and sat behind the nav labels. Two palettes mixing is what §9 was written against.
3. **It softens the graph canvas.** New finding. `backdrop-filter` promotes the fixed bar to its own
   composited layer; Chromium then re-rasterises the whole canvas, and node subtitles 200px BELOW the
   bar ("the formal record", "PDF · one page") go visibly fuzzy. Same failure family as D-27's note.
   Shots: `e2e/__shots__/x1-raster-{A-solid,B-blur}.png`.

### X-2 — restored, but as an icon
- `…` promises "more of this list"; the control opens site navigation. At control size beside the
  moon button it reads as truncation or a loading placeholder.
- **`☰` cannot be a `<Glyph>`.** Measured in the live bar: mono advance 7.81px (`M`, `…`, and the
  .notdef box all 7.81px) vs `☰` at 11.44px — a system fallback face is drawing it. Tofu risk on any
  machine without one. §8's "a glyph genuinely cannot work" test is met, on the D-23 sun/moon precedent.
- Variant C (`…` plus a visible `PAGES` label) was rendered too: unambiguous, but at 375 it takes the
  last spare width and squeezes the mode toggle, and the trailing `…` next to the word is decoration.
- Changed: `src/components/brand/icon.jsx` (allow-list `check` · `sun` · `moon` · **`menu`**),
  `src/chrome/SiteChrome.jsx` (the trigger), `docs/BRAND.md` §8 + §12, `e2e/chrome.spec.js` (folded
  into the existing §4 radius test, so the count stays 9).

### X-3 — measured, and it is worse than dead
| Evidence | Result |
|---|---|
| `/` scrollability, 4 combos × {1440, 375} | `scrollHeight === innerHeight` every time |
| mounted on `/` | renders `opacity: 0`, text `00%` |
| probe ids `#about #work #skills #contact` | present on **no route on the site** — the section designator can never appear |
| pre-restyle legacy scroll range @1440 | `/permit` 3020 · `/college` 216 · `/transfer /major /apply /studio` 56 · `/pull` 40 · `/license /sat-resources /sat-signup` 0 |
| restore-as-is paint | `.scroll-station` in **frozen** `src/styles/theme.css` = `backdrop-filter: blur(6px)` over hardcoded cream — the same §9 violation rejected in X-1 |
| restore-as-is @375 on `/permit` | the chip overlaps the numbered list under it |

At the time, nine of ten routes did not scroll enough to justify an instrument. A rebuild on `Progress`
would serve one page and still have no ids to read. Deferred to the legacy restyle.

## A/B for Oliver

Side-by-side page at **`/ab/`** on the dist server (`127.0.0.1:4180`), tunnelled at
`http://100.69.165.32:14180/ab/`.

Both the page and its shots are gitignored review artefacts, and `npm run build` wipes `dist/`.
Regenerate after any rebuild:

```bash
npm run build && node e2e/__shots__/.ab-build.mjs
```

The shots themselves come from a scratch Playwright harness that was deleted after use, so it does not
move the committed 147/1/4 count. To re-shoot them, copy the harness from `e2e/integration-shots.spec.js`
and apply each variant to the live page (`page.addStyleTag` for the blur, `page.evaluate` for the
trigger contents) — that way both sides of a pair come from one build and one run.

## Gate results, 2026-08-26

```
node scripts/contrast-check.mjs                   183 pairs, 4 themes · pass
npm run test:run                                  450 passed (unchanged)
npx playwright test e2e/chrome.spec.js            9 passed (count held; D-29 folded into the §4 test)
npx playwright test e2e/integration-shots.spec.js 11 passed — bar height and background unchanged
npx playwright test                               147 passed / 1 failed / 4 skipped
```

The one failure is the permitted `e2e/legacy-visual.spec.js → /permit`, unchanged from the branch
baseline.

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
  `src/styles/theme.css` — the **frozen** navy/gold stack for un-restyled legacy pages — inside a sakura bar.
- **`src/styles/theme.css` is frozen. Do not edit it** (`AGENTS.md` §2).
- Three options, in increasing cost: leave out · restore as-is (accept legacy paint) · rebuild on the
  library. Legacy pages genuinely do scroll, so it has a real job there — a rebuild would use
  `Progress` from `src/components/ui/progress.jsx` (§4 radius 0, 4px, 140ms) and point at real
  section ids.

## Ownership

Yours: `src/chrome/**`, `src/components/brand/glyph.jsx`, `src/components/ScrollProgress.js`,
`docs/BRAND.md`, `docs/DECISIONS.md`, `docs/COMPONENTS.md`, `docs/redesign-research/14-*`.

Do not touch: `src/graph/**`, `src/terminal/**` (both shipped and gated), `src/styles/theme.css` (frozen), or un-restyled `src/pages/**`.

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
