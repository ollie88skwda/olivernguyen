# 15 · Restore the blurred top bar (X-1 reversal)

Owner: exec-chrome-blur. Branch: `feat/component-library` (do NOT merge).
Handed off 2026-08-26 by exec-chrome-restore, who had just ruled the blur OUT in D-29.

## CURRENT STATUS / NEXT TASK ← keep updated

```
Last updated : handoff, not started
next         : B-1 (reproduce the canvas-softening cost)
Blockers     : none
Notes for Oliver: —
```

## Objective

**Oliver reversed D-29's X-1 finding by name, 2026-08-26: "can we actually do the blurred top bar?
I do like that."** That is the explicit reversal `docs/DECISIONS.md` requires, so this is sanctioned
work, not a re-litigation. Ship the blur.

Ship it **without** the regression D-29 measured. If the two genuinely cannot coexist, ship the
blur where it is safe, render both ways, and put the A/B in front of him — do not silently pick the
version that damages the canvas, and do not silently ship the damage.

Read first, in this order:
1. `docs/redesign-research/14-chrome-restorations.md` — how X-1 was rejected and every measurement.
2. `docs/DECISIONS.md` D-29 — the entry you are partially reversing.
3. `docs/BRAND.md` §9 — the LOCKED rule that bans this.
4. `docs/COMPONENTS.md` §"Chrome — R-C3".

## The one hard problem: B-1

`backdrop-filter` on `.site-chrome-bar` promotes the fixed bar to its own composited layer, and
Chromium then **re-rasterises the whole graph canvas softer**. Node subtitles ~200px BELOW the bar
("the formal record", "PDF · one page") go visibly fuzzy. This is the same failure family as D-27's
implementation note in `docs/DECISIONS.md` — read that note, it is the closest prior art on this
codebase and it explains why layer promotion interacts badly with `.g-world`'s `scale(k)`.

**Reproduce it before you try to fix it.** Copy the harness from `e2e/integration-shots.spec.js`:

```js
const BLUR_CSS = `.site-chrome-bar{
  background: color-mix(in srgb, var(--bg) 82%, transparent) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  backdrop-filter: blur(8px) !important;
}`;
// /?mode=graph&theme=light, 1440x900, settle 2.5s, then screenshot
// clip { x: 400, y: 100, width: 400, height: 160 } before and after addStyleTag.
```

The two frames must differ in sharpness or you have not reproduced it. Do not proceed on the
assumption it is fixed until that pair is identical again.

Leads, in the order worth trying — none is prescribed, all need rendering:
- **Give the canvas its own correctly-scaled layer.** A `will-change` / `translateZ(0)` on the graph
  world so its raster scale is pinned. **These are `src/graph/**` files — exec-graph's. RAISE IT,
  DO NOT EDIT IT** (see Ownership).
- **Opt the blur out in graph mode.** `html[data-mode="graph"] .site-chrome-bar` keeps solid `--bg`.
  Defensible on its own terms: in graph mode nothing scrolls under the bar, so the blur buys nothing
  there anyway. Cheapest safe answer. Verify the bar still reads as one component across modes.
- **Smaller radius / different recipe.** 8px was the old value, not a chosen one. Try lower.
- **Coarse-pointer and low-power opt-out.** `src/styles/Top_Bar.css:139` already ships that pattern
  (`backdrop-filter: none` on mobile for GPU cost). Precedent exists; reuse the shape.

## The other thing 14 found: legacy routes go muddy

On `/college` scrolled, the blur smears the **navy legacy headline** up through the **pink sakura
bar**, behind the nav labels. Two palettes mixing. Shots:
`e2e/__shots__/x1-legacy-college-{A-solid,B-blur}.png`.

Legacy routes are the only place on the site where the window scrolls, so this is exactly where the
effect is most visible. Decide it on a render, state the call, and if you keep it there say why the
mud is acceptable. Opting legacy routes out is a legitimate answer.

## Terminal mode

The terminal screen is `100dvh` and never scrolls, so nothing passes under the bar and the blur is
**pixel-identical to solid** there. Confirm that yourself, then decide whether it ships in terminal
at all. Shipping an invisible effect is not free — it still costs a composited layer.

## Existing material you should not rebuild

- `--overlay` in `src/styles/sakura.css` (~line 237) is already `color-mix(in srgb, var(--bg) 65%,
  transparent)` — the ratified translucency recipe. **Translucency is already in the system; only
  the blur is banned.** If the bar needs a token, derive it here rather than inlining a `color-mix`.
- The exact removed declaration is in `git show 23dac554^:src/chrome/chrome.css`.
- `src/chrome/chrome.css` currently carries a large comment telling you not to do this. Replace it
  with the new reasoning — do not leave a comment contradicting the shipped code.

## Brand paperwork — mandatory, this is a LOCKED rule

`BRAND.md` §9 bans "glassmorphism, blurred gradient backdrops" outright, and D-29 explicitly upheld
it against a render 2026-08-26. Shipping this means:

1. **Amend `docs/BRAND.md` §9.** Narrow it precisely — state what is now permitted (one blurred
   surface: the fixed chrome bar, at a named radius, under named conditions) and that everything
   else in the ban stands. Do not delete the ban. Update §12 quick reference too.
2. **Log `docs/DECISIONS.md` D-30.** Next free id — D-29 is taken. It must say plainly that it
   partially reverses D-29 at Oliver's explicit instruction, quote the instruction, record what the
   blur costs, and record what you did about the cost.
3. **Update `docs/COMPONENTS.md`** §"Chrome — R-C3" → the outcome table's X-1 row is now wrong.
4. **Update `docs/redesign-research/14-chrome-restorations.md`** — do not rewrite its findings, they
   were correct. Add a note at the X-1 section pointing at this file and D-30.

## Ownership

Yours: `src/chrome/**`, `src/styles/sakura.css` (token only, if you need one), `docs/BRAND.md`,
`docs/DECISIONS.md`, `docs/COMPONENTS.md`, `docs/redesign-research/14-*` and `15-*`, `e2e/chrome.spec.js`.

**Do not touch:** `src/graph/**`, `src/terminal/**` (shipped and gated), `src/styles/theme.css`
(frozen), `src/pages/**` (frozen). If the fix needs a graph-side change, write the exact requested
diff into this file under "Notes for Oliver" and ship the scoped version instead.

## Gates — all must pass before you finish

```bash
node scripts/contrast-check.mjs                   # exit 0, 183 pairs, 4 themes
npm run test:run                                  # 450 green (may grow, not shrink)
npx playwright test e2e/chrome.spec.js            # 9
npx playwright test e2e/integration-shots.spec.js # 11
npx playwright test                               # 147 passed / 1 failed / 4 skipped
```

- The one permitted failure is `e2e/legacy-visual.spec.js → /permit`. It predates this branch.
- **`e2e/integration-shots.spec.js` asserts the fixed bar occludes nothing, and you are changing the
  bar's BACKGROUND. Re-run it.** Bar HEIGHT must not change — `src/graph/graph.css:64`'s
  `--graph-chrome-inset` and `src/graph/lib/camera.js` are keyed off it (D-28) and are not yours.
- Keep the playwright count at 147: fold any new assertion into an existing test, as D-29 did.
- Add a regression assertion that the blur is actually applied, and that the graph canvas is still
  sharp if you solved B-1.

## Renders

Four `data-theme` × `data-mode` combinations at 1440 and 375, both ways, plus a scrolled legacy
route. Land shots in `e2e/__shots__/` (gitignored).

- 375 needs `isMobile: true, hasTouch: true` (or `devices["iPhone 13"]`) or controls render at
  desktop metrics (`BRAND.md` §1).
- Use `page.emulateMedia({ reducedMotion })`, **never** `test.use({ reducedMotion })`.
- Delete any scratch spec before the final full `npx playwright test`, or the 147 count moves.

## A/B page for Oliver

One already exists and is live — extend it, do not invent a second one.
Generator: `node e2e/__shots__/.ab-build.mjs` (gitignored, self-documenting).
Served at `/ab/` on the dist server `127.0.0.1:4180`, tunnelled at `http://100.69.165.32:14180/ab/`.

```bash
npm run build && node e2e/__shots__/.ab-build.mjs
```

The tunnel keeps serving the new dist. Add a section for the blur showing what shipped vs what was
rejected, and hand Oliver the tunnelled URL.

## Rules

- Commit to `feat/component-library`. Do **NOT** merge.
- Every change stays one line to undo. Say which line, in the commit.
- Never wait for Oliver. Log questions under "Notes for Oliver" in the status block and keep going.
