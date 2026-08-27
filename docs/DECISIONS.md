# DECISIONS.md — olivernguyen.com

Append-only log of decisions that outlive a single task. Newest block on top.
Each entry: what was decided, what was rejected and why, and where the detail lives.
If you want to reverse one of these, say so explicitly — do not quietly re-open it.

---

## 2026-08-26 · The bar's labels get louder so the glass can get stronger

### D-32 · Bar labels are `--text`, nav hover is an UNDERLINE, and the veil opens to 50%
Oliver picked this against the D-31 render (option C): **"i like that much more."** He was choosing
the trade the A/B put to him — louder nav labels in exchange for a much more see-through bar — so
this supersedes D-31's 74% and §7's muted label tone *for the chrome bar only*.

**Three changes, and the second one is the one nobody asked for but the maths demands.**

1. **Labels.** `.sakura.site-chrome-bar .on-label[data-tone="muted"]` → `--text`. Applied in BOTH
   modes and on legacy routes, not just where the bar is blurred: scoping it to the blur would make
   the labels change weight as you flip TERM/GRAPH, on a bar D-26 deliberately made one component.
   Off the blur it only raises contrast (`--text` on `--bg` is 13.5:1 vs `--text-muted`'s 7.16:1).
2. **Nav hover is an underline, not `--accent-hi`.** Promoting the labels alone did *not* work, and
   finding out why corrected D-31: measured over the real blurred backdrop, `--accent-hi` reads
   **4.06–4.47:1 in graph · dark and 4.32:1 in graph · light** — it fails §2.3, and **it fails at
   D-31's 74% too**. D-31 certified 74% off a run where `--text-muted` happened to be the minimum;
   the hover colour was always the real cap and the run-to-run noise hid it. Hover now keeps the
   label at `--text` and fades in an underline, which also stops it being colour-alone signalling.
   `.on-btn[data-variant="link"]` in `components.css` already ships that treatment.
3. **`--chrome-veil` 74% → 50%.** With `--text` the only foreground sitting directly on the veil,
   the measured worst composite over 60 canvas states is **5.29:1 in graph · dark and 6.82–6.96:1 in
   graph · light**, stable across repeat runs. 40% fails at 4.44:1.

The ghost buttons and the mode toggle were checked and needed nothing: ghost hover paints an opaque
`--surface-2` behind itself and the toggle carries its own fill, so neither sits on the veil.

The wordmark dot (`--accent`) is the one thing on the veil that is not `--text`. Measured **in its
own region** (it lives at x≈49, so the bar-wide worst pixel is not its worst pixel) it reads 8.41:1
in dark and 4.21:1 in light, against §1.4.11's 3:1 for graphical objects — and it is part of a
logotype, which §1.4.3 exempts anyway. It stays `--accent`.

*Rejected:* promoting the labels but leaving hover on `--accent-hi` (what option C was rendered as —
it fails on hover, which the render could not show); scoping the louder labels to graph mode only
(the labels would visibly change weight on the mode toggle); darkening `--accent-hi` instead of
dropping it (a palette change to serve one hover state, when an underline is both cheaper and more
accessible); keeping 74% (it was never actually passing).

*Consequence for §7:* the muted label tone is still the default everywhere else. The chrome bar is
now a named exception, because it is the only surface whose background is not opaque.

---

## 2026-08-26 · How see-through the bar is allowed to be

### D-31 · `--chrome-veil` opens up 82% → 74%, and the cap is the LABEL colour, not the blur
> **SUPERSEDED by D-32 the same day.** The veil is 50%, and 74% was not actually a passing value:
> this entry's own measurement missed that `--accent-hi` (nav hover) fails on the veil at 74%. The
> method and the warning below are right; the conclusion was one lucky run.

Oliver, on the D-30 render: **"Currently the bar isn't blurred enough for me. If we could blur it
more honestly, uh like meaning so we can see the stuff behind it more, that'd be cool."** So: more
transparent, not a wider radius. Working file: `docs/redesign-research/15-blur-restore.md`.

**D-30's 82% was derived from a worst case the canvas cannot actually produce.** It assumed the bar
sitting on a solid slab of `--text`. D-31 measured the real composite instead: bar contents hidden,
real `backdrop-filter` running, worst single pixel anywhere in the bar band, across 60 canvas states
(zoom × pan × both graph themes). The true binding case is **a zoomed-in node card's own text passing
under the bar** — in dark that turns the backdrop *light*, and the bar's light labels vanish into it.

| veil, 8px | graph · dark | graph · light | |
|---|---|---|---|
| 82% | 6.10 | 6.11 | D-30, over-cautious |
| **74%** | **5.01** | **5.64** | **ships** |
| 70% | 4.55 / 4.60 / 4.89 | 5.19 | passes, but the spread is the run-to-run noise |
| 64% | 3.85 | 5.12 | fails |
| 50% | 2.77 | 4.59 | fails badly |

Dark is always the binding theme and `--text-muted` is always the binding foreground.

**Radius stays 8px.** 12, 14, 16 and 20px were measured and they *do* buy contrast headroom — a wider
average pulls the backdrop's extremes toward `--bg`, so 70%·16px measures 4.82 where 70%·8px measures
4.60. It was rejected anyway, on a render: at 14px+ the backdrop is a flat wash and you can no longer
tell what is behind the bar, which is the entire point of the effect. Wider blur is the opposite of
what Oliver asked for even though it sounds like it.

**What actually caps this is the bar's muted label colour.** Re-running the same measurement with the
bar's labels promoted to `--text` moves the floor from ~74% to ~50% (dark at 50% measures 7.15:1;
40% fails at 4.44). That is roughly twice as see-through. It is a hierarchy change — the nav labels
stop being quiet — so it is **not** taken here. Rendered as option C on the A/B for Oliver to call.

*Rejected:* 70% (passes, but 4.55–4.89 across runs is inside the measurement noise — shipping a
value whose margin is smaller than the error bar is not shipping a passing value); 64% and below
(measurably fail in dark); any radius above 8px (the render above); modelling the composite
analytically as `veil×bg + (1−veil)×backdrop` instead of measuring it — tried, and it
under-estimates the extremes by enough to certify values that actually fail.

*Note for anyone re-measuring:* results move by up to 1.4 contrast points depending on Playwright
worker count, because wheel-zoom lands the camera differently. Run it at `--workers=4` and take the
worst across runs; a single lucky run will certify a value that fails.

---

## 2026-08-26 · The bar blur comes back, scoped

### D-30 · §9 is narrowed to permit ONE blurred surface — partially reversing D-29
Oliver, 2026-08-26, by name: **"can we actually do the blurred top bar? I do like that."** That is the
explicit reversal the top of this file asks for, so this entry reverses the blur half of D-29. D-29's
other half (the hamburger, `<Icon name="menu" />`) is untouched and still stands.

`.site-chrome-bar` gets `backdrop-filter: blur(8px)` over a new `--chrome-veil` token, **only** under
`html[data-mode="graph"] body:has(.graph-root)` at `min-width: 768px` and `pointer: fine`. Solid
`--bg` everywhere else. Working file: `docs/redesign-research/15-blur-restore.md`.

**D-29's third and decisive objection was wrong, and it was a measurement error.** It claimed a
`backdrop-filter` on the bar promotes it to its own composited layer and makes Chromium re-rasterise
the whole graph canvas soft. Reproduced exactly — 47% of canvas pixels change — and then killed by
control: injecting an **inert** stylesheet changes 47.2%, and injecting **nothing at all** changes
48.3%. The cause is `TOUR_IDLE_AUTOSTART_MS = 6000` (`src/graph/lib/tour.js:19`): the guided tour
autostarts 6s after mount and flies the camera, and D-29's harness took frame A at 2.5s and frame B
after the 6s mark. `.tourhud` is in frame B whenever the effect appears and absent whenever it does
not. With the tour cancelled the same blur injection moves 1.89% (that residue is D-27's shimmer).
With `?still`, blur vs solid is **0 pixels different** at `deviceScaleFactor` 1 and 2. Fully settled
with the shimmer running, node-subtitle sharpness is 2524.4 solid vs 2529.4 blurred. D-29's own
evidence shot measures against it: `x1-raster-B-blur.png` is the *sharper* of its pair.
**Any future graph A/B must pass `?still` or cancel the tour, or it is measuring the camera.**

**D-29's other two objections held on re-render, and they are why this is scoped rather than global.**
Measured as the largest single-channel delta inside the bar, solid vs blurred, 1440×900:

| Where | Delta | Call |
|---|---|---|
| graph canvas, world panned so nodes pass under the bar | 4–7/255 | **ships** |
| graph canvas at its resting fit (dot grid only) | 1–2/255 | ships — same surface |
| terminal, either theme | 2/255 | opt out |
| 375 / coarse pointer | 1–2/255 | opt out |
| legacy `/permit`, scrolled then scrolled back up | 10/255 | opt out |

Terminal is `100dvh` and never scrolls, so 2/255 is rounding, not an effect — and an invisible
effect still costs a composited layer. On phone nothing passes under the bar either (the graph list
scrolls inside itself), and `src/styles/Top_Bar.css:139` already ships a coarse-pointer
`backdrop-filter: none` opt-out for GPU cost. Legacy routes are the only place on the site where the
WINDOW scrolls: on `/permit` the navy legacy body text smears up through the pink sakura bar, which
is exactly the two-palette mud §9 was written against. The bar auto-hides on scroll DOWN, so this is
only reachable by scrolling back UP — reachable is still shipped.

`:has(.graph-root)` is load-bearing, not decoration: legacy routes carry `data-mode="graph"` too, so
the attribute alone would blur the bar on precisely the routes rejected above. Verified
— `/permit?mode=graph` computes `backdrop-filter: none`.

**The 82% veil is a contrast floor, not a taste value.** *(Superseded by D-31: the floor was measured
rather than derived, and it is 74%. The reasoning below is right; the number was over-cautious.)* The bar's nav labels are `--text-muted`, and
a translucent bar composites with whatever is under it. Worst case (bar over `--text`): 5.04:1 in
graph · light, 4.52:1 in graph · dark — both clear §2.3's 4.5. At 78% graph · dark drops to 3.99:1
and fails. So the removed declaration's 8px/82%, which D-29's brief called "the old value, not a
chosen one", turns out to be the only value the palette permits.

*Rejected:* `--overlay` (65%) as the veil — it is the modal scrim, whose job is to dim what is behind
it, and it fails contrast on the bar at 2.60:1; radius 12px and 16px (16 smears the backdrop into a
flat wash, so the depth cue it exists for disappears — 8px keeps node-card edges legible as ghosts);
radius 4px at 88% (below the threshold of visibility, 5/255); blurring in terminal for consistency
across modes (an invisible effect that still costs a layer); blurring legacy routes (the render
above); a `will-change`/`translateZ(0)` pin on `.g-world` — unnecessary once B-1 turned out not to
exist, and it is `src/graph/**`, which is exec-graph's.

*Bar height is unchanged at 64px*, so `--graph-chrome-inset` and `src/graph/lib/camera.js` (D-28)
need nothing. Nothing was raised to exec-graph.

---

## 2026-08-26 · The three things the chrome rebuild removed

R-C3 dropped three pieces of chrome on brand grounds without rendering any of them (`docs/COMPONENTS.md`
§"Chrome — R-C3"). Oliver asked for all three to be tried BOTH ways and the stronger one kept.
All three were rendered on the real site; **one is restored, two are confirmed removed.**
Working file and the full A/B: `docs/redesign-research/14-chrome-restorations.md`.

### D-29 · The pages menu is a hamburger, and it is an ICON — not a glyph
The pages-menu trigger goes back to `☰`, drawn as `<Icon name="menu" />` (lucide `Menu`, 1.5 stroke,
18px grid), not as `<Glyph name="more" />` (`…`, ratified D-13).

**Two separate findings, and the second is the one that decides the form.**

1. *`…` promises the wrong thing.* §8's ellipsis means "more of the list you are already looking at".
   This control opens site navigation, which is a different promise. Rendered at 375 and 1440 in all
   four `data-theme` × `data-mode` combinations, at control size and next to the moon/sun button, the
   ellipsis sits on the baseline as three small dots and reads as truncation or a loading placeholder.
   The hamburger reads as "site menu" with no thought at all and matches the theme button's weight.
2. *`☰` cannot be a glyph.* U+2630 is **not in JetBrains Mono**. Measured in the real page at the real
   size: the mono advance is 7.81px (`M`, `…`, and even the .notdef box all measure 7.81px) while `☰`
   measures 11.44px — it is being served by a system fallback face. A `<Glyph>` is a typographic mark
   in a face we ship; a character resolved by whatever the OS happens to have is a per-platform
   lottery, tofu included. §8's own test is "a glyph genuinely cannot work", and here it measurably
   cannot.

So this **does not narrow §8** — it lands in the existing carve-out, on exactly the D-23 precedent
(`☀`/`☾` were rejected as glyphs and drawn as lucide `Sun`/`Moon` for the same class of reason).
`icon.jsx`'s allow-list goes from three names to four: `check`, `sun`, `moon`, `menu`. That list stays
closed; a fifth needs its own decision.

*Rejected:* keeping `…` (loses the "site menu" read — this was rendered and compared, not argued);
`☰` as a `<Glyph>` (the fallback-font measurement above); keeping `…` and adding a visible `PAGES`
text label (unambiguous, but at 375 it takes the last spare width in the bar and squeezes the mode
toggle — and the trailing ellipsis next to the word is then pure decoration, which §8 bans).

### The bar's backdrop blur stays REMOVED — §9 is not narrowed
> **PARTIALLY REVERSED by D-30, 2026-08-26, at Oliver's explicit instruction.** The blur ships in
> graph mode on the graph home at ≥768px / fine pointer. The terminal and legacy-route findings below
> were re-rendered and held, and are why it is scoped; the canvas-softening finding was a measurement
> artefact (the 6s guided-tour autostart). Read D-30 before acting on this section.

R-C3 dropped `backdrop-filter: blur(8px)` under §9's ban on blurred backdrops. Restoring it was
rendered anyway. It loses on its own merits, so §9 is untouched and there is no amendment here.

- **Terminal mode is pixel-identical.** The screen is `100dvh` and never scrolls; nothing passes under
  the bar, so the effect does not exist there.
- **On a legacy route it is the cheap version of itself.** `/college` scrolled: the navy legacy
  headline smears up through the pink sakura bar and sits behind the nav labels. Two palettes mixing
  into mud is exactly the look §9 was written against.
- **It damages the graph canvas from a distance.** Turning the blur on promotes the fixed bar to its
  own composited layer, and Chromium then re-rasterises the whole canvas: node subtitles 200px BELOW
  the bar ("the formal record", "PDF · one page") go visibly soft. Same failure family as D-27's
  implementation note. A decorative effect on the chrome is not worth softening the content.

### `ScrollProgress` stays REMOVED — measured, not assumed
No brand rule is involved; R-C3's claim was that it is dead. Verified, and it is worse than dead.

- On `/`, `scrollHeight === innerHeight` in all four combinations at 1440 **and** 375. Mounted, it
  renders at `opacity: 0` reading `00%` — an always-on scroll listener that can never be seen.
- Its four probe ids (`#about #work #skills #contact`) exist on **no route on the site**, so the
  section designator that is the whole point of the instrument can never appear. It degrades to a
  bare percent readout duplicating the native scrollbar it was built to replace.
- Of the ten legacy routes, **nine scroll ≤216px** at 1440 (four of them 56px, three 0px). Only
  `/permit` genuinely scrolls.
- Restoring it as-is drags in `.scroll-station` from the **frozen** `src/styles/theme.css`, which is
  `backdrop-filter: blur(6px)` over a hardcoded cream — the same §9 violation rejected above — with
  legacy accent cells and no label. At 375 on `/permit` the chip overlaps the numbered list under it.

*Rejected:* restore as-is (the render above); rebuilding it on `Progress` from the library (§4 radius
0, 4px, 140ms). The rebuild is the only honest version, but it would serve **one** page and still have
no section ids to read — those live in frozen `src/pages/**`. Revisit **if and when** the legacy pages
are restyled; the component stays in the tree unmounted for `src/pages/top_bar.js` under P4 either way.

---

## 2026-08-25 · The graph canvas at rest

Both taken by Oliver after reviewing the ported graph home on `/`. They are the two things the
library port got visibly wrong once it was mounted under the real chrome.

### D-27 · The idle shimmer is the THIRD permitted infinite loop
`BRAND.md` §6 bans infinite loops and D-18 ratified exactly two (the terminal cursor blink and the
1800ms skeleton pulse). The graph's ±2.5px idle node drift was removed under R-G1 as an unratified
third. **Reinstated deliberately: the canvas is a living field of nodes, and dead still it reads as
a screenshot of a diagram rather than a running system.** It is bound by the same rules as the
other two — transform only, no opacity flicker, no sweep, no spring, 6–9.5s per cycle, each node on
its own phase, and nothing starts under `prefers-reduced-motion` or `?still`.
**A fourth loop still needs a decision.**

*Rejected:* leaving it out (what §6 says, but the still canvas was the thing Oliver called out
first); running it only on hover (the point is the field breathing at rest, and it does not exist
on touch); a slower/larger drift (at the resting zoom ±2.5 world px is already under one screen
pixel — bigger reads as drifting layout, not life).

*Implementation note, and the reason this entry names a file:* it CANNOT be a CSS animation.
A running transform animation makes Chromium promote each node to its own composited layer, and
the layer is rasterised in its own space **before** `.g-world`'s `scale(k)`. At the resting fit
(k ≈ 0.42) every card's text is rasterised then squashed and the glyphs are dropped — the whole
canvas renders as empty boxes. Confirmed by A/B screenshot of one frame. `src/graph/drift.js`
drives it from a single throttled rAF loop instead; discrete style writes repaint without promoting
a layer. Do not "simplify" it back into `@keyframes` — `e2e/graph-home-shots.spec.js` asserts both
that the shimmer moves and that the card text still renders while it does.

### D-28 · The camera frames clear of the chrome, and semantic zoom follows the fit
Two linked changes in `src/graph/lib/camera.js`, made because the top node sat behind the fixed
64px site bar on `/`, and because Oliver plans to keep adding nodes.

1. **`topInset`.** `boundsTransform` already framed clear of the bottom chrome (`bottomInset: 120`,
   the prompt bar); it now does the same at the top. The value is not hardcoded in JS — `graph.css`
   declares `--graph-chrome-inset` (0, or the bar height when `body:has(.site-chrome-bar)`) and
   `useCamera` reads it, so the dev harness stays correct at 0 with no special case and the number
   lives with the rest of the chrome offsets.
2. **`farThreshold(fitK)`.** Semantic zoom used a fixed `FAR_K = 0.45`. The resting fit at
   1440×900 is ≈ 0.42, so the moment the inset landed, the canvas was in "far" mode **at rest** and
   every card lost its kicker and description. The threshold is now
   `min(FAR_K, fitK × 0.85)` — "far" means *zoomed out past where you started*, which is what it
   always meant, and it stays true at any graph size.
3. **Zoom floor `0.35 → 0.25`.** `fitTransform` clamps to `SCALE_EXTENT[0]`, so a graph that needs
   less than the floor to fit **silently stops fitting** — nodes fall off the edge at rest. The old
   floor left room for barely half again as many nodes. This only ever permits more zoom-out.

*Rejected:* insetting the stage element instead (`.g-stage { top: 64px }`) — one line and no camera
change, but shrinking the stage drops the fit to 0.42 → and under the old fixed `FAR_K` that hid
every label at rest, which is how the interaction between the two was found. Also rejected: nudging
the authored layout in `lib/layout.js` to move the top node down (fixes one node at one viewport,
and breaks again on the next node added).

---

## 2026-08-26 · The other two themes

> **The theme scheme lives in `docs/THEMES.md`.** That file is the reference for how the four
> themes are switched, scoped and verified. This block is the *why*; go there for the *what*.
> Colour philosophy stays in `docs/BRAND.md`; the derivation maths stays in
> `docs/redesign-research/04-sakura-palette.md` §6.

Derived by the theme pass on `feat/component-library`, under the rule `BRAND.md` §3 had already
ratified ("hold the hue slice, move only the ladder position"). No new hue, no rejected direction
re-opened. **Reviewed by Oliver on the live `/_components` gallery in all four combinations and
accepted (D-22).**

### D-19 · Theme and mode are two attributes, not one
`<html data-theme="light|dark">` picks the ladder; `<html data-mode="graph|terminal">` picks the
interface. `.sakura` with no `data-theme` stays the light ladder, so sakura UI is never token-less
before hydration. `--node-*`/`--edge`/`--dot-grid` ship with the **ladder** and are read only under
`data-mode="graph"`; `--term-*` ships per ladder under `data-mode="terminal"`.
*Rejected:* a `data-theme` value duplicated onto a wrapper class in the gallery (two copies of the
palette, one of them ungated); making dark the base and light the override (the un-themed default
would then be a dark page inside a light legacy site).
*Closed 2026-08-26:* `src/theme/ThemeProvider.jsx` shipped and the interim back-compat clause
`html:not([data-theme])[data-mode="terminal"]` was deleted with it. Terminal no longer implies dark.
Plumbing ledger: `docs/THEMES.md` §6.

### D-20 · Light terminal marks the active row with a hairline, not a wash
The binding constraint is measured, not stylistic: a wash matching dark's step (1.23:1) drops
`--error` to 4.16:1 and `--success` to 4.29:1 on top of it. Holding every state colour at 4.5:1
caps the wash at roughly `--surface-2` luminance, so the executing row is carried by a 1px
`--border-strong` rule plus the mono's ratified 500 weight — exactly what §3 predicted this theme
would need. One theme-scoped rule in `components.css`; no other theme changes.
*Rejected:* a louder wash with `--error`/`--success` swapped for deeper variants (invents colour to
solve a lightness problem); marking the row with `--accent` text (breaks the log's colour grammar).

### D-21 · Light `--border-strong` and `--error-hi` stay scoped to the terminal
Both exist on the light ladder, but **only** under `data-mode="terminal"`. Promoting them to the
light core would restyle shipped graph · light controls — `components.css` reads
`var(--border-strong, var(--text-faint))` for control hairlines, so the checkbox, switch and
field-hover borders would go 5.53:1 → 3.51:1 for no reason anyone asked for.
*Decided:* leave them scoped. Consumers keep their `var(--token, fallback)` chains, which are all
contrast-clean today. Reversing this is a one-line move if a light surface ever needs the strong
hairline outside the console. Closes the `COMPONENTS.md` "still open" item.

### D-23 · The theme control — sun/moon, top-right, square
Decided by Oliver 2026-08-26; the placement was left to the agent and taken from convention.

**Shape.** A sun and a moon, `lucide-react`, joining `check` on `src/components/brand/icon.jsx`'s
allow-list — the third and fourth names ever added (§8 requires a decision for each). Same terms as
D-13/D-17: stroke locked to 1.5, drawn at the full 18px `--icon` grid, `currentColor`. No mono glyph
was tried: ☀ and ☾ are outside §8's ratified set and fail at control size the way the tick did.

**Geometry.** An icon button on §4's ordinary control rules — 40px square, `3px` radius, 44px on a
coarse pointer. **Not** 999px. §4's round exception list (mode toggle, status pills, radio) stays
closed; a second round control next to the mode toggle would read as part of it.

**Placement.** Top-right header cluster, immediately after the TERM|GRAPH toggle and before the
conditional `SEARCH ⌘K` button, inside `.sc-right`. That is where the convention puts it — header
far-right, beside the other global controls, never in the page body or the footer (Tailwind, Vercel,
shadcn and Next docs all sit it in the top-right nav cluster; MDN's footer placement is the outlier
and is routinely missed). The one local refinement: it goes *before* `SEARCH ⌘K` rather than after,
because that button only exists in graph mode on `/` — placing the theme control after it would move
the control whenever the mode changed.
*Rejected:* inside the pages menu (a preference people expect to see, not hunt for); merged into the
mode toggle as a four-way control (conflates two independent axes — the whole point of D-19).

**Behaviour.** Shows the icon of the **current** theme, per the dominant convention; the action goes
in the accessible name (`aria-label="Switch to dark theme"`), which flips with state. Crossfade on
§6's 140ms state change — no rotate-and-spin, no morph.

### D-22 · All four themes shipped
Reviewed by Oliver in the gallery, all four combinations, and accepted without changes — including
D-20's hairline marker on the light log. `BRAND.md` §3's status table reads *shipped* on all four
rows. The scheme is frozen in `docs/THEMES.md`; the remaining work is plumbing, not design, and is
listed in that file's §6.
*Also closed here:* the log timestamp steps from `--text-faint` to `--term-log` on the executing
row. Faint measured **4.33:1** on Night Plum's active wash — the only pair in the log under 4.5 —
and the log tier clears it on both ladders (5.84 dark, 6.47 light). One rule in `components.css`,
no palette change, now gated. §2's locked values were not touched.
*Rejected:* lifting Night Plum's active wash to fix it (changes a locked §2 value to solve a
problem one selector solves); leaving it as documented decorative (a timestamp is text).

---

## 2026-08-25 · Component library review

Decided by Oliver in a Lavish review of the `/_components` gallery, over three rounds. Every
option was rendered live in the real palette and faces, or screenshotted from the running site —
nothing was chosen from a description. Twelve gaps went in, sixteen decisions came out.

Spec updated: **`docs/BRAND.md`** §4, §6, §7, §8, §9. Inventory: `docs/COMPONENTS.md`.

### D-12 · Control geometry — the values §4/§7 never gave
Control heights `40 / 32 / 44-on-coarse`. Mid-tier type `24px` card, dialog and node titles,
`32px` dossier titles. Radio buttons stay **round** as a third named exception to §4.
*Rejected:* 32px default (too dense against 16px body); 48px (fewer things fit on a phone);
square radios (read as checkboxes and get misclicked).

### D-13 · The tick is an icon; six more glyphs are ratified
`▾ ▴ ▸ ◂ ▪ …` join the §8 set. The **tick does not** — no mono face draws a usable one at
control size; the U+2713 character read thin and lopsided. Checkbox, menu and toast ticks use
`lucide-react` through `src/components/brand/icon.jsx`, which is now the single place §8's
"one family, 1.5 stroke, 18px grid, currentColor" constraints are applied.
*Rejected:* heavier U+2714; the tick from Martian Mono; a filled square instead of a tick.

### D-14 · The tick splits by context
Controls get the drawn icon (D-13). **Flowing console text keeps the character** — a log line is
a monospace grid where every mark owns one column, and an SVG has no column width. The live site
already did this (`src/terminal/sections.jsx`, `copied … ✓`). Named `checkText` in the glyph set
so a control cannot reach for it by accident.
*Rejected:* one tick sitewide (breaks log alignment); no mark in the log (colour alone is quieter
than the log deserves).

### D-15 · The dossier shadow — sideways in light, absent in dark
§9 named the one permitted shadow but never valued it. Light casts **sideways**, matching the
direction the panel slides in from, reusing the tint `src/graph/graph.css` already ships. Dark
gets **no shadow**: a shadow reads by being darker than its background and `--bg` is near-black,
so five candidates were indistinguishable when rendered side by side. Dark separates the dossier
by stepping `--dossier-border` up to `--border-strong`.
*Rejected:* a `--text`-tinted shadow in dark (it renders as a pink halo, which §9 bans); one
rule across both modes (pretends at depth that does not exist); dropping shadows entirely.

### D-16 · Terminal texture reinstated at 3%
§9/D-10 asks for one material layer per mode; terminal's had been removed under P8. Reinstated as
a scanline on `.term-screen::after` at **3%**, not §9's 6% ceiling — compared at four strengths on
the live page. **This overrules the earlier P8 removal deliberately.** Do not strip it again
without reversing this entry.
*Rejected:* 6% (visible banding on OLED, and the scanline is the fastest way this aesthetic tips
into costume); fractal grain (reads as paper, fights the CRT metaphor); staying untextured.

### D-17 · Icon weight is fixed; size is the lever
Asked whether the tick could be thicker. `strokeWidth` stays locked at 1.5 — that lock is what
keeps the icon set one family. Because the stroke is defined in the icon's own coordinate space,
apparent thickness scales with size: the tick had been drawn at 12px and moved to the full §8
**18px grid** (`--icon`), which renders ~50% thicker while being *more* compliant, not less.
Checkbox and switch grew to `24px` to hold it.
*Rejected:* raising `strokeWidth` to 2.75 (every future icon then matches and looks heavy, or
does not and the set stops reading as one family — the exact failure §8 exists to prevent).

### D-18 · Skeleton pulse — the second permitted loop
§6 banned infinite loops with the cursor blink as the only exception. A **1800ms opacity pulse**
on loading placeholders is now the second. Opacity only: no shimmer sweep, no transform. Off
entirely under `prefers-reduced-motion`, where `aria-busy` carries the state.
*Rejected:* fully static blocks (read as broken rather than loading); dropping skeletons for a
text line.

### Not decided here
- The **light-terminal and dark-graph themes** remain to derive, and are now the next job
  (follow-on 1 below). `--border-strong` and `--error-hi` gain light-mode values with them.
  *→ Done 2026-08-26, D-19 … D-22. Scheme: `docs/THEMES.md`.*
- `src/graph/graph.css` still sizes its display type for the condensed face Big Shoulders.

---

## 2026-08-24 · Brand system lock

Decided in an interactive review session (Lavish artifact `.lavish/brand-system.html`, now closed).
Every option was rendered as a live CSS mock or screenshotted on the running site at
`localhost:3000` — nothing was chosen from a swatch or a description.

Canonical spec: **`docs/BRAND.md`**. That file, not this log, is what you build from.

### D-01 · Build target — BOTH
Phone and desktop are both first-class. Terminal mode scrolls natively on a phone; graph mode
degrades to a grouped list below 768px or on a coarse pointer, and the React Flow chunk is never
fetched there. Every design rule must hold in three renders (phone terminal, desktop terminal,
desktop graph).
*Rejected:* desktop-first with a stripped phone fallback; phone-first with the canvas as enhancement.

### D-02 · Colour — SAKURA
Night Plum (dark) + Sakura Paper (light), verbatim from `docs/redesign-research/04-sakura-palette.md`.
One pink hue slice carries all neutrals; jade is rationed to success / active routing; gold and red
only for genuine states. 60/30/10.
*Rejected — **Ink & Blossom***: warm-grey neutrals with pink as a strict 10% accent. It was fully
built and rendered on four real screens (boot, agents, contact, graph) in both modes and compared
side by side against sakura. Sakura won: the site should read as dyed-through, not grey with a
pink sticker. **Do not re-propose neutral-base palettes.**
*Rejected — **Night-only***: dropping the paper theme entirely.

### D-03 · Themes — FOUR, independent of mode
Mode (`terminal | graph`) and theme (`light | dark`) are two separate switches. A light terminal
and a dark graph both exist. This reverses the earlier "theme follows mode" position in
`05-v1-spec.md` §6.3 — **that section is superseded.**
Cost accepted: two new themes to design and contrast-check (light terminal is the risky one, since
a terminal on paper cannot lean on glow), and four combinations to test instead of two.
Scope: **all four before v1 ships**, not after launch.

### D-04 · Radius — mixed, by one rule
`0` for surfaces (panes, code, log, node cards) · `3px` for controls · `999px` for the mode toggle
and status pills only.
*Rejected:* all-sharp (severe on phones); soft 10–14px throughout (reads as a template and fights
the terminal metaphor).

### D-05 · Spacing — generous editorial on a 4px ladder
Allowed steps only: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 144. Card 28, row gap 24,
section gap 144 (96 on phone). Density is permitted only inside the log and statusline.
*Rejected:* tight editorial everywhere; a split rhythm with different scales per mode (two systems
to maintain, and the modes stop reading as one brand).

### D-06 · Motion — signature-only
Two signature moves carry the whole budget: terminal typing cadence (~28ms/char) and the graph
camera (640ms `cubic-bezier(.16,1,.3,1)`). Everything else is 140ms `ease-out` on state change.
Scroll animates opacity only. All of it behind `prefers-reduced-motion`.
*Rejected:* expressive (springs, staggered scroll reveals, magnetic CTAs); near-static (throws away
the one thing that makes terminal mode feel live).

### D-07 · Display + sans type — Familjen Grotesk 700 / Hanken Grotesk
Took four rounds. Big Shoulders was dropped: condensed against a normal-width sans and wide mono,
it read narrow rather than confident at hero size. Round 2 offered seven faces on the live hero;
round 3 explored Fraunces at 400/700/600/900 plus five relatives; Fraunces led until it failed the
16px favicon test. Round 4 was a 37-face wall showing the full name plus the mark at 44/24/16px in
both themes — **Familjen Grotesk 700** was picked there and verified in place on the real site.
*Rejected along the way:* Big Shoulders, Fraunces (all weights), Young Serif, Instrument Serif,
Gloock, Bodoni Moda, Playfair, Prata, Abril Fatface, Newsreader, Literata, Petrona, Zilla Slab,
Archivo Black, Bricolage Grotesque, Syne, Chivo, Anton and ~18 others.
**Before re-opening type, read this entry.**

### D-08 · Mono — split
JetBrains Mono for log and code bodies (narrow, built for reading 40 lines at once); Martian Mono
for labels, chips, statusline and key hints, where its width is a feature.
*Rejected:* Martian everywhere (tiring in long log bodies, wraps early on a phone); JetBrains
everywhere (zero ownability on the labels).

### D-09 · Icons — glyphs first
Typographic marks in the mono (`◆ → ✉ ▸ ✕ ⌘ ┌ │ └`) do ~90% of the work. Real icons only where a
glyph cannot work; when needed, one family only (`lucide-react`, already a dependency), locked to
1.5px stroke on an 18px grid, `currentColor`. Never hand-roll SVG paths.
*Rejected:* installing a full line library as the default; hand-building a 12-glyph set (real hours,
and incomplete the moment a thirteenth glyph is needed).

### D-10 · Surface — hairlines plus one texture per mode
1px borders as the primary separation. Exactly one material layer per mode — dot grid on the graph
canvas, fine grain/scanline in terminal — at ≤ 6% opacity. Shadows only on the open dossier.
*Rejected:* hairline-only (flat and slightly cheap on light backgrounds); elevation shadows
(library default, invisible in dark mode, fights both metaphors).

### D-11 · Wordmark — `oN.c`
Kept, with the dot in `--accent`, now set in Familjen Grotesk 700. Favicon and avatar use `oN`.
Must stay legible at 12px and in monochrome.
*Rejected:* the prompt sigil `on.c:~$` (great favicon, but punctuation soup to a non-technical
reader); a stacked `OLIVER NGUYEN` block (needs a second asset for small sizes).

### Follow-on work created by this lock
1. Derive, document and contrast-check the **light terminal** and **dark graph** themes; add them
   as a new section of `04-sakura-palette.md` and to `BRAND.md` §3.
2. Swap the font loading: drop Big Shoulders, add Familjen Grotesk; repoint `--font-display`,
   and add JetBrains Mono alongside Martian Mono with the split rule from D-08.
3. Update `05-v1-spec.md` §6.3 to point at D-03 (theme no longer follows mode).
4. Build the component library against these tokens (done 2026-08-25 — `docs/COMPONENTS.md`).
