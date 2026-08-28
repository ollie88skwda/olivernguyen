# OPEN-DECISIONS.md — what still waits on Oliver

The counterpart to `docs/DECISIONS.md`: that file is what was decided, this is what is not.
**One list. If a design call is open, it is here or it does not exist.**

Created 2026-08-27 because the open items were scattered across five docs and one of them
(`docs/redesign-research/12-rebuild-plan.md` note 13) had gone stale.

Rules:
- Add an item the moment you defer something. Do not leave it in a plan doc's status block.
- Close an item by logging it in `docs/DECISIONS.md` and deleting it here. Do not tick it in place.
- Ranked by how much it unblocks, not by effort.

---

## 1 · Restyle the legacy pages — the big one

**State:** open. Ten routes under `src/pages/` are still the frozen navy/gold stack
(`src/styles/theme.css`). `BRAND.md` §11.2 and `05-v1-spec.md` §2.3 freeze them until a restyle is
explicitly scheduled. Nobody has scheduled it.

**Decided when:** Oliver says go, and a plan doc exists with an owner.

**It is the sole blocker on four other things.** All four close for free the day it lands:
- The bar blur is **opted out on every legacy route** (D-30) because the sakura bar over a navy
  legacy headline turns to mud. Same palette on both sides removes the reason.
- `ScrollProgress` cannot be rebuilt (D-29). It needs real section ids, and those live in frozen
  pages. Nine of ten legacy routes also barely scroll — fix the pages and re-measure before
  building anything.
- `index.html:29` still downloads **Big Shoulders** purely because frozen `theme.css` points
  `--font-display` at it. Drop it from the font URL. It is a retired face (D-07).
- `e2e/legacy-visual.spec.js → /permit` is the suite's one permitted red test. It is pre-existing
  baseline drift on the legacy body (`COMPONENTS.md` follow-up 3), not a bug on this branch.

**Detail:** `docs/COMPONENTS.md` follow-up 2 · `docs/redesign-research/14-chrome-restorations.md`
X-3 · `docs/redesign-research/15-blur-restore.md` note 6.

---

## 2 · The favicon asset

**State:** open, and it is an **asset, not code**. `BRAND.md` §10 fixes the favicon as **`oN` on
`--bg`, square, 3px radius**. `index.html:5` and `:16` still point at `/on_logo_navy.png` — the
retired legacy navy mark.

**Decided when:** the PNG/SVG exists in `public/`. Then repoint both lines.

**Constraint from §10:** it must survive monochrome and 16px. Test both before shipping — a 16px
render is what killed Fraunces in D-07.

**Detail:** `docs/redesign-research/12-rebuild-plan.md` note 7.

---

## 3 · The focus ring's colour and width

**State:** open, and **the weakest-tracked item here** — it was never actually written down.
`src/styles/sakura.css:268` carries a comment saying it is "flagged in docs/COMPONENTS.md". It is
not. COMPONENTS.md only lists `--focus-ring` / `--focus-ring-w` in its derived-token table. That
comment was pointing at a flag nobody ever added; this entry is the flag.

`BRAND.md` §4 fixes the focus ring's **radius** (3px) and nothing else. The shipped values were
picked, not decided:

```css
--focus-ring: var(--accent-hi);
--focus-ring-w: 2px;
```

**Decided when:** the two values are ratified into `BRAND.md` §4 (or changed), logged in
`DECISIONS.md`, and the stale sakura.css comment is corrected.

**Do not skip on size.** Every keyboard user sees it on every control in the library, and it is the
one visual token in the system with no brand authority behind it.

---

## 4 · Merge `feat/component-library`

**State:** open. Not a design call, but it gates everything above shipping.

The rebuild is complete and unmerged as instructed — chrome, graph home and terminal home all on the
component library and brand tokens, in all four theme × mode combinations, plus D-29 … D-32.

**Gate before merging** (`docs/redesign-research/15-blur-restore.md` has the same list):

```bash
node scripts/contrast-check.mjs   # 183 pairs, 4 themes
npm run test:run                  # 450
npx playwright test               # 147 passed / 1 failed / 4 skipped
```

The one permitted failure is item 1's `/permit`. Anything else red is a real regression.

---

## 5 · Process — one worktree per executor

**State:** open, applies to the next multi-agent build, not to anything shipped.

Mid-rebuild an executor ran a hard reset that wiped every uncommitted file in the shared checkout and
destroyed the first pass of R-G1 (nine files). It was rebuilt and nothing was lost. Three agents in
one checkout means any `git reset --hard` or `git checkout -- .` silently deletes the other two's
work.

**Decided when:** the next build plan grants one worktree per executor, or explicitly accepts the
risk.

**Detail:** `docs/redesign-research/12-rebuild-plan.md` note 9.

---

## Recently closed — do not re-open without saying so

`D-27` idle shimmer · `D-28` camera frames clear of the bar · `D-29` the three R-C3 chrome removals
(1 restored, 2 confirmed) · `D-30` bar blur restored, scoped to the graph home · `D-31` veil 82→74% ·
`D-32` bar labels full strength, nav hover underline, veil 74→50% · `D-33` wordmark dot stays subtle.

**D-29's third X-1 finding ("the blur re-rasterises the graph canvas soft") was WRONG** — it was the
graph's 6s guided-tour autostart moving the camera between two screenshots. Independently
re-verified 2026-08-27: two screenshots with nothing injected at all show the same change. D-30 and
`BRAND.md` §9 carry the correction. Do not cite that finding.
