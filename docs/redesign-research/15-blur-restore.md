# 15 · Restore the blurred top bar (X-1 reversal)

Owner: exec-chrome-blur. Branch: `feat/component-library` (do NOT merge).
Handed off 2026-08-26 by exec-chrome-restore, who had just ruled the blur OUT in D-29.

## CURRENT STATUS / NEXT TASK ← keep updated

```
Last updated : 2026-08-26 — round 3 DONE. Option C shipped: bar labels are
               --text, nav hover is an underline, veil 74% -> 50% (D-32).
next         : nothing. Review http://100.69.165.32:14180/ab/ and say when to merge.
Blockers     : none
Notes for Oliver:
  -1. ROUND 3. You picked the bolder option, it is shipped. One thing changed
     that you did not ask for and could not have seen in the render: hovering
     a nav word used to turn it pink, and pink is not readable on a veil this
     thin. It measured 4.06-4.47:1 against a 4.5 minimum -- and it was ALREADY
     failing at round 2's setting, which my round-2 measurement missed on a
     lucky run. Hover is now an underline instead. Same signal, readable, and
     better for anyone who cannot pick the colour out.
     The terminal bar has no nav words, so nothing moved there.
  0. ROUND 2 (superseded by round 3, kept for the record). You said it wasn't blurred enough and you wanted to see more of
     what's behind it. The bar is now more see-through (74% instead of 82%).
     It cannot go much further as things stand, and the reason is NOT the blur
     — it is that the nav labels are quiet grey. Promote them to full-strength
     text and the bar can be about twice as see-through again. That is option
     C on the A/B and it needs your call, because it makes the nav louder.
     I did not take that decision for you.
     Also: turning the blur radius UP was tried and thrown away. It sounds
     like "more blur" but it smears everything behind the bar into a flat
     wash, which is the opposite of what you asked for. Radius stays 8px.
     Full numbers in DECISIONS.md D-31.
  1. B-1 did not exist. D-29's "the blur re-rasterises the graph canvas soft"
     was the graph's 6s guided-tour autostart moving the camera between the
     two screenshots. Injecting NOTHING produces the same 47% pixel change.
     Nothing was raised to exec-graph; no src/graph/** change is wanted.
  2. D-29's other two blur findings were re-rendered and HELD, so the blur is
     scoped to graph mode on the graph home at ≥768px / fine pointer. It is
     off in terminal, on every legacy route, and on phone.
  3. The 8px/82% recipe is not nostalgia — 82% is the lowest opacity that
     keeps the bar's nav labels above 4.5:1 over the worst backdrop. 78% fails
     in graph · dark at 3.99:1. If you want the effect STRONGER, the labels
     have to change colour first, and that is a palette decision.
  4. At the resting fit almost nothing is under the bar, so the effect only
     shows once the canvas moves — dragging it, zooming, or the guided tour.
     Worth knowing before you judge the static screenshots.
  5. The review link was dead after round 1 and I did not catch it: Tailscale
     was stopped on this Mac, so `tailnet-expose` could not bind and the URL
     silently 404'd from your side. Brought Tailscale back up and verified the
     page and its images over the tunnel this time. If a local link ever looks
     dead, check `tailscale status` first.
  6. Question, not blocking: the bar hides on scroll DOWN and returns on
     scroll UP. On legacy routes that is the only way content is ever under a
     visible bar. If the legacy pages get restyled onto the sakura palette,
     the mud reason disappears and the legacy opt-out could go. Flagged for
     the legacy restyle, not doing it now.
```

## ROUND 3 — option C shipped (D-32)

Oliver picked option C off the round-2 A/B: **"i like that much more."** Three changes.

| Change | Why |
|---|---|
| bar labels `--text-muted` → `--text` | what Oliver picked; it is also what pays for the veil |
| nav hover: `--accent-hi` → underline | `--accent-hi` on the veil measures 4.06–4.47:1 — **fails** |
| `--chrome-veil` 74% → 50% | with `--text` the only foreground on the veil, worst is 5.29:1 dark / 6.82:1 light |

**Round 2 was wrong and this is how.** Promoting the labels alone did not work. Measuring option C
properly showed `--accent-hi` (the nav hover colour) failing at every veil tried — **including
D-31's shipped 74%**, where it reads 4.47:1. D-31 certified 74% off a run where `--text-muted`
happened to be the minimum of the three foregrounds; the hover colour was always the real cap and
the run-to-run noise hid it. This is exactly the failure mode D-31's own warning describes, and it
caught D-31.

Measured at the shipped 50%, two runs each, `--workers=4`:

```
graph · dark   --text 5.29  PASS (both runs)
graph · light  --text 6.82 / 6.96  PASS
```

Other foregrounds checked and cleared:
- ghost buttons paint an opaque `--surface-2` on hover, so `--accent-hi` there never touches the veil
- the mode toggle carries its own fill
- the wordmark dot (`--accent`) measured **in its own region** — it sits at x≈49, so the bar-wide
  worst pixel is not its worst pixel — reads 8.41:1 dark / 4.21:1 light, against §1.4.11's 3:1 for
  graphical objects, and it is part of a logotype which §1.4.3 exempts anyway

The louder labels apply in **both modes and on legacy routes**, not only where the bar is blurred:
scoping them to the blur would make the labels change weight on the mode toggle. Off the blur it
only raises contrast. Rendered — the terminal bar has no muted labels visible, so nothing moved.

## ROUND 2 — how transparent the bar is allowed to be (D-31, superseded by D-32)

D-30 set the veil at 82% from an ANALYTIC worst case (bar over a solid slab of `--text`) that the
canvas cannot produce. Round 2 measured the real thing: bar contents hidden, real `backdrop-filter`
running, worst single pixel in the bar band, 60 canvas states (zoom × pan) × both graph themes.

| veil, blur 8px | graph · dark | graph · light | verdict |
|---|---|---|---|
| 82% | 6.10 | 6.11 | D-30, over-cautious |
| **74%** | **5.01** | **5.64** | **ships** |
| 70% | 4.55 / 4.60 / 4.89 | 5.19 | passes, but that spread IS the noise |
| 64% | 3.85 | 5.12 | fails |
| 50% | 2.77 | 4.59 | fails badly |

Binding case, every time: a **zoomed-in node card's own text** passing under the bar. In dark that
turns the backdrop pale and the bar's light `--text-muted` labels sink into it.

Radius: 12 / 14 / 16 / 20px all buy headroom (70%·16px = 4.82 vs 70%·8px = 4.60) because a wider
average pulls extremes toward `--bg`. **Rejected on a render** — at 14px+ the backdrop is a flat wash
and you cannot tell what is behind the bar, which is the whole point. 8px stays.

The real cap is the label colour. Re-measured with the bar's labels promoted to `--text`: dark passes
at 50% (7.15:1) and fails at 40% (4.44). **~74% → ~50%, about twice as see-through, in exchange for
louder nav labels.** That is a hierarchy decision, so it is rendered as option C on the A/B and NOT
taken here.

**Measurement warning:** the numbers move by up to 1.4 contrast points with Playwright worker count,
because wheel-zoom lands the camera differently. Run at `--workers=4` and take the worst across runs.
A single lucky run certifies values that actually fail — 70%, 66% and 60% all did that at least once.
An analytic model of the composite (`veil×bg + (1−veil)×backdrop`) under-estimates the extremes and
is not a substitute for measuring.

## OUTCOME — shipped, scoped

| Surface | Blur | Why |
|---|---|---|
| graph home, ≥768px, fine pointer | **on**, `blur(8px)` over `--chrome-veil` (50%, D-32) | the only place canvas content passes under the bar |
| terminal, either theme | off | `100dvh`, never scrolls — measured 2/255, invisible, still costs a layer |
| legacy routes | off | navy legacy text smears through the pink bar — D-29 was right |
| 375 / coarse pointer | off | nothing passes under the bar; `Top_Bar.css:139` GPU precedent |

One line to undo: delete the `@supports` block at the bottom of `src/chrome/chrome.css`
(and `--chrome-veil` in `src/styles/sakura.css`, which nothing else reads).

Decision: `docs/DECISIONS.md` **D-30**. Brand: `docs/BRAND.md` §9 + §12.
Regression: `e2e/chrome.spec.js` — folded into the nav test, so the file is still 9.

### Gate results, 2026-08-26

```
node scripts/contrast-check.mjs                   183 pairs, 4 themes · pass
npm run test:run                                  450 passed (unchanged)
npx playwright test e2e/chrome.spec.js            9 passed (count held)
npx playwright test e2e/integration-shots.spec.js 11 passed — bar height still 64px
npx playwright test                               147 passed / 1 failed / 4 skipped
```

The one failure is the permitted `e2e/legacy-visual.spec.js → /permit`. Re-verified by stashing:
it fails identically without any of this branch's changes.

### Re-shooting the A/B shots

The `x1-d30-*` shots came from a scratch Playwright spec that was deleted after use, so it does not
move the 147 count. To re-shoot: copy the harness from `e2e/integration-shots.spec.js`, shoot the
SHIPPED build, and get side A by injecting
`.site-chrome-bar{background:var(--bg)!important;backdrop-filter:none!important}` — that way both
sides of every pair come from one build and one run. **Cancel the tour first**
(`window.dispatchEvent(new KeyboardEvent("keydown",{key:"Shift"}))`) or pass `?still`, or you are
measuring the camera. Then:

```bash
npm run build && node e2e/__shots__/.ab-build.mjs
```

### B-1 RESULT — the canvas softening does not exist

Reproduced D-29's observation exactly, then killed it with a control.

| Run | Pixels changed | Sharpness (var-of-Laplacian) |
|---|---|---|
| D-29's harness, blur injected | 47.1–47.5% | 980 → 1194 / 1384 / 1438 (wanders) |
| Same harness, **inert** stylesheet injected | 47.2% | 986 → 1473 |
| Same harness, **nothing injected at all** | 48.3% | 979 → 1664 |
| Same harness, blur, tour autostart cancelled | 1.89% | 975 → 1002 |

**Root cause: `TOUR_IDLE_AUTOSTART_MS = 6000` (`src/graph/lib/tour.js:19`).** The guided tour
autostarts 6s after mount and flies the camera. D-29's harness settled 2.5s, took frame A, injected
the blur, waited, took frame B — and the 6s mark fell between the two frames. Frame B is the canvas
at a different camera transform, which is why 47% of pixels move and why the sharpness number wanders
run to run. Confirmed directly: `.tourhud` is present in frame B when the effect appears and absent
when it does not.

Controls that show the blur itself costs nothing:

- `?still` (shimmer + tour off), fresh load both sides, 1440×900: **0 pixels differ**, sharpness
  1000.0 vs 1000.0. Same at `deviceScaleFactor: 2` — 0 pixels.
- Shimmer running, both sides fresh-loaded and settled past the tour, 6 samples each: node-subtitle
  sharpness median **2524.4 solid vs 2529.4 blur** (+0.2%); whole canvas 1487.5 vs 1491.8.
- D-29's own committed evidence measures against it: `x1-raster-A-solid.png` = 1632.5,
  `x1-raster-B-blur.png` = **1681.3**. The "blurred" frame is the sharper one.

Harness kept as `e2e/lib/png-sharpness.mjs` (not a spec, does not move the e2e count).
**Any future graph A/B must pass `?still` or cancel the tour, or it is measuring the camera.**

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

In the pre-restyle `/college` experiment, scrolling made the blur smear the **navy legacy headline**
through the **pink sakura bar**, behind the nav labels. Two palettes mixing. Shots:
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

**Two gotchas, both hit on 2026-08-26:**
- `npm run build` wipes `dist/`, which kills whatever was serving it. Restart the static server with
  `npx serve dist -l 4180` — **not** `serve -s`, whose SPA fallback serves the app's `index.html`
  for `/ab/` and hides the review page behind a 200.
- `tailnet-expose` fails silently when Tailscale is stopped (`listen EADDRNOTAVAIL`, logged to
  `/tmp/tailnet-expose/<port>.log`). Check `tailscale status` and curl the tunnelled URL before
  handing it over.

## Rules

- Commit to `feat/component-library`. Do **NOT** merge.
- Every change stays one line to undo. Say which line, in the commit.
- Never wait for Oliver. Log questions under "Notes for Oliver" in the status block and keep going.
