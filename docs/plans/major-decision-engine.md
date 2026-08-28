# `/major` — Major Decision Engine

Status: approved, executing. Supersedes `~/.claude/plans/i-want-to-make-twinkling-sundae.md`.

## Context

Ollie is choosing between **Industrial**, **Systems**, and **Mechanical** engineering and wants a page on his personal site to run that decision. From the interview:

- **No school picked yet** — mid-application-cycle. Major choice is partly downstream of admissions.
- **He says he lacks enough info on all three to decide.** Load-bearing fact — the page's job is a research agenda first, a verdict second.
- Gut prior: IE or SE over ME, because "mechanical is too saturated" — a belief, not a verified fact.
- Wants less math grind, wants college to be fun; likes making money, building things, mediating problems.
- Coursework appeal: optimization/probability (IE) and requirements/architecture (SE) both land; ME third.
- Deadline: **college app deadlines this cycle**.
- **From the mockup review round:** the writing read as AI-generated (fixed via humanizer pass, zero em dashes), and Ollie does not know the math/stats vocabulary being used (AHP, Monte Carlo, consistency ratio, flip-distance, VOI) — every technical term needs an inline tooltip, every section needs a "plain English" explainer, and there must be a glossary. This is now a hard product requirement, not polish.

**Correction from the original plan draft:** that draft flagged a suspected env-var bug in `pull.js` (`REACT_APP_SUPABASE_*` vs `.env.local`'s `NEXT_PUBLIC_SUPABASE_*`). Re-checked during Phase 0: there is a separate `.env` file (not `.env.local`) that already defines `REACT_APP_SUPABASE_URL`/`REACT_APP_SUPABASE_ANON_KEY` correctly, and `pull.js` reads those fine. No bug, no fix needed. `.env.local`'s `NEXT_PUBLIC_*` pair is unused by this client and harmless.

Because he lacks information, a page that just declares a winner would be theater. The page's primary output is a **ranked research agenda** (what to go find out, ordered by how much resolving it would change the answer) with an honest confidence verdict underneath, and it must be understandable to someone who does not already know what a Monte Carlo simulation is.

Design follows the Sakura system: scoped paper/plum ladders, Familjen Grotesk / Hanken Grotesk / JetBrains Mono / Martian Mono, hairlines, and restrained data graphics.

**Locked decisions:** live-editable + Supabase-persisted + Claude-editable (CLI) · private route, not a primary nav link · full method stack · verdict with confidence · research-agenda-first · majors-only board with school availability cards · external data seeding deferred to v2 · **plain-English layer (tooltips + per-section explainer + glossary) is v1, not deferred** · copy voice is plain and direct, no AI-sounding filler, zero em dashes.

---

## Architecture

```
src/pages/major/
  index.js            page shell, sheet sections S0–S9 (S9 = glossary)
  seed.js             canonical starting doc (bootstrap + offline fallback)
  store.js            zustand store + Supabase load/save/realtime
  model.js            ALL math, pure functions, zero React
  model.test.js       Vitest tests for the math
  glossary.js         term -> plain-English definition map, shared by Tooltip + S9
  sections/           Status, Board, Duel, Ridges, Tornado, SwitchYard,
                      PreMortem, Assumptions, EvidenceLog, Glossary
src/components/Tooltip.js  shared <Tip> component: dotted underline, hover/tap bubble
src/pages/major/major.css   route-scoped Sakura stylesheet
scripts/decision.mjs       node CLI so Claude edits the same Supabase doc
```

Route added to `src/Routes.js` as `/major`, lazy-loaded via `Suspense`, and listed in the central pages menu from `src/chrome/SiteChrome.jsx`. It is not a primary nav link.

### Persistence: two writers, one document

Supabase table `major_decision` on the existing **`pull`** project (`lhiwhmcdqqwwurectxos`, already wired via `.env`) — reused rather than a new project, since it's already provisioned and already the pattern `pull.js` uses. Schema: `id text primary key`, `doc jsonb`, `updated_at timestamptz`. One row, `id = 'v1'`.

- **Browser** reads on mount, writes debounced (800ms) on edit, subscribes to realtime — same shape as `src/pages/pull.js:236-273`.
- **Claude** uses `node scripts/decision.mjs <get|set|patch|add-criterion|add-evidence|add-unknown> …`.
- `seed.js` is the bootstrap and the offline fallback.

**Privacy, stated plainly:** the route is gated behind the shared server-verified passphrase. UI access is gated, but the Supabase anon key ships in the bundle and the decision row needs its own data policy. Real row-level protection needs Supabase Auth or database rules, out of scope for v1.

`/major` reuses the same `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` already defined in `.env` and already working for `pull.js`. No env changes needed.

---

## Data model (`seed.js`)

```js
{
  version: 1, updatedAt, deadline: "<app deadline>",
  gutPrior:     { ie, se, me },                    // recorded 2026-07-27, never overwritten
  criteria:     [{ id, label, blurb, direction, weight, weightMode: "ahp"|"manual", confidence }],
  pairwise:     { "earnings|fun": 3, ... },        // Saaty 1–9, drives AHP weights
  alternatives: [{ id, label, tagline, scores: { [criterionId]: { lo, mid, hi } }, notes }],
  schools:      [{ name, offers: ["ie","se"], switchPolicy, deadline }],
  unknowns:     [{ id, question, criteria: [], effort, answer }],
  assumptions:  [{ id, claim, status: "untested"|"supported"|"refuted", test }],
  premortem:    [{ id, alternative, failureMode, likelihood, mitigation }],
  evidence:     [{ date, source, url, criterion, alternative, delta, note }],
}
```

Scores are **triangular `{lo, mid, hi}`, not points**. This is what makes the honesty layers (Monte Carlo, flip-distance, VOI) possible. Adding a column = push a criterion; adding a row = push an alternative.

Seed content follows the *no-ghostwriting* rule: structure and the interview facts above get seeded; anything that is Ollie's opinion he hasn't stated is left as an explicit `TODO — Ollie` placeholder. His stated beliefs are seeded into `assumptions` as `untested`, e.g. `"ME is saturated"` → test: *NY Fed unemployment-by-major*.

---

## The math (`model.js`, pure + unit tested)

1. **AHP weights** — geometric-mean row normalization of the Saaty pairwise matrix. Compute λmax → `CI = (λmax − n)/(n−1)` → `CR = CI / RI[n]`. `CR > 0.10` surfaces the most inconsistent triad in plain English.
2. **Normalize** each criterion min–max across alternatives, honoring `direction`.
3. **WSM** — `total = Σ wᵢ · norm(scoreᵢ)`. Per-cell contribution `wᵢ · normᵢ` is what the mosaic renders as ink area.
4. **Monte Carlo, N = 10,000** — sample each score from `triangular(lo, mid, hi)`; jitter weights via Dirichlet centered on the AHP weights, concentration tied to CR. Outputs `P(win)` per major, score distributions, pairwise `P(A > B)`. Seeded RNG (mulberry32) keyed off the doc hash → deterministic renders.
5. **Flip-distance / sensitivity** — per criterion, smallest absolute Δweight (renormalizing the rest) that changes the top rank. No solution ⇒ `ROBUST`.
6. **Value of information — the headline feature.** Each unknown maps to the criteria it would resolve. Compute `EVPI` by re-running MC with that criterion's uncertainty collapsed, plus the plainer sibling metric: *"resolving this changes the answer in X% of runs."* Rank by `VOI ÷ effort`.
7. **Confidence** — normalized entropy of the `P(win)` vector → 0–100, labeled `COIN FLIP` / `LEAN` / `CLEAR`.

---

## Plain-English layer (new requirement, v1)

Every section that surfaces a statistical concept ships with:
- **`<Tip term="...">`** — dotted-underline inline component (see mockup `.tt`/`.bub` pattern in `.lavish/major-decision-engine.html`) wrapping any AHP/Monte Carlo/consistency/flip-distance/VOI reference, hoverable on desktop, tap-to-toggle on touch (`:focus` fallback, not just `:hover`).
- **A "Plain English" `<details>` disclosure** at the bottom of each section, closed by default, explaining what the section shows in one to three short paragraphs without jargon.
- **S9 · Glossary** — every term used anywhere on the page, defined once, in plain language. `Tooltip.js` and `Glossary.js` both read from the single `glossary.js` map so definitions never drift between the inline tooltip and the glossary entry.

Copy throughout (labels, tooltip text, plain-English boxes) follows the humanized voice validated in the mockup: no em dashes, no AI-vocabulary padding, short declarative sentences, concrete numbers over abstractions.

---

## Section prop contract (binding for Phase 3A/3B/3C/4)

The page shell (Phase 4) computes every `model.js` output **once per doc change** and passes it down, so no section independently re-runs a 10,000-run Monte Carlo. Every section component receives exactly these props:

```js
{
  doc,        // the live Supabase doc as-is (criteria, alternatives, unknowns, schools, ...)
  derived: {
    ahp,          // computeAHP(doc.criteria, doc.pairwise) -> { weights, consistencyRatio, worstTriad }
    normalized,   // normalizeScores(doc.alternatives, doc.criteria) -> { [critId]: { [altId]: 0..1 } }
    wsm,          // computeWSM(doc.alternatives, doc.criteria, ahp.weights) -> { [altId]: { total, contributions } }
    monteCarlo,   // runMonteCarlo(doc.alternatives, doc.criteria, ahp.weights, ahp.consistencyRatio) -> { winRate, distributions, pairwiseBeats }
    flip,         // flipDistance(doc.alternatives, doc.criteria, ahp.weights) -> { [critId]: { delta, direction } }
    voi,          // computeVOI(doc.unknowns, doc.alternatives, doc.criteria, ahp.weights, ahp.consistencyRatio) -> { [unknownId]: { flipFraction, evpi } }
    confidence,   // computeConfidence(monteCarlo.winRate) -> { score, label }
  },
  editing,      // bool, EDIT mode on/off
  updateDoc,    // from store.js: (patcherFnOrPartial) => void, for inline edits
}
```

`Tooltip.js` exports a `<Tip term="ahp">AHP</Tip>` component: `term` keys into `glossary.js`'s map, `children` is the visible dotted-underline text, the bubble content comes from the glossary entry so the inline tooltip and the S9 glossary never drift apart. Bubble markup must default to `display:none` and switch to `display:block` only on `:hover`/`:focus` (not just `opacity:0`/`visibility:hidden`) — an earlier visual review of the mockup caught the hidden-but-visible-to-layout version clipping its parent by up to 134px, since a hidden element with `visibility:hidden` still occupies layout space and gets measured.

Section components live in `src/pages/major/sections/` and are otherwise self-contained (each imports its own icons/sub-pieces, no cross-section imports except `Tooltip.js` and `glossary.js`).

## UI — sheet set, spatial by construction

Section kickers continue the site's `S0 / Status`, `S1 / The Board`, … convention via `SectionHead` from `@/components/brand`. The restyle uses the approved Card, Badge, Button, Input, Select, Textarea, Checkbox, Progress, Log, Statusline, and Glyph primitives. Page-local motion is limited to sanctioned state changes and has a reduced-motion fallback.

- **S0 · Status** — confidence dial (SVG arc + mono readout); mono countdown to app deadline; the **three top-VOI "GO FIND OUT" cards** with effort chips and a tooltip explaining the "flips answer X%" stat.
- **S1 · The Board** *(centerpiece)* — mosaic. Column width ∝ criterion weight; each cell ink ∝ weighted contribution. Hover or focus a cell → `lo/mid/hi` + note. EDIT exposes score inputs in a local horizontal scroll region; rows re-sort by total.
- **S2 · Weights (duel)** — one AHP pairwise comparison at a time in a card; the consistency readout names the contradicting triad when it crosses the threshold.
- **S3 · Uncertainty (ridges)** — overlapping distribution ridges from the MC histogram; mono readout `P(IE) 41% · P(SE) 38% · P(ME) 21%`.
- **S4 · Fragility (tornado)** — bars sorted by flip-distance; click one → S1 previews that flipped world.
- **S5 · Switchyard** — token-mapped rail diagram with switches at Yr1/Yr2/Yr3, followed by school cards showing availability and switch policy.
- **S6 · Pre-mortem** — "it's 2032 and this was the wrong call" notes in plain surface cards with warning rails.
- **S7 · Assumptions ledger** — beliefs as testable line items (`ME is saturated` → `UNTESTED` → test).
- **S8 · Evidence log** — dated table, what moved, and by how much.
- **S9 · Glossary** — see Plain-English layer above.

An `EDIT` toggle exposes board score inputs and add-entry forms; duel comparisons stay click-based. Changes save with a debounce, show a mono `SAVED 14:22` stamp, and sync across devices.

---

## Verification

1. `yarn test` — `model.test.js`: AHP against Saaty's published matrix, CR threshold behavior, MC determinism under a fixed seed, flip-distance monotonicity, VOI ranking sanity, triangular sampler bounds.
2. Repro the `pull.js` env bug on the real dev server before touching it; confirm fixed after.
3. Playwright E2E against `yarn start`: load `/major` → passphrase gate → board renders → edit a score → rows re-sort → reload → **value persisted** → open a second context → realtime propagates → hover a tooltip → glossary opens.
4. `node scripts/decision.mjs add-criterion …` then reload the browser and confirm the new column appears.
5. Pixel pass at 390 / 768 / 1440px, plus `prefers-reduced-motion` on. Keep horizontal scrolling local to wide data graphics and the edit board.

## Out of scope for v1

- External data seeding (BLS / NACE / NY Fed / ABET) — deferred; `assumptions`/`evidence` structures are built now so it drops in later.
- Supabase Auth. Any public/portfolio-facing version of the page.

---

## Execution phases (subagent-driven)

- **Phase 0** (this session, direct): Supabase table on the `pull` project, repo scaffolding (empty directories/files), task breakdown. (Env bug suspected in the original draft did not reproduce, see correction above; no fix needed.)
- **Phase 1** (subagent): `model.js` + `model.test.js`. Pure math, no React, fully spec'd above.
- **Phase 2** (subagent): `seed.js`, `store.js`, `scripts/decision.mjs`. Depends on Phase 1's data shape.
- **Phase 3** (parallel subagents, 3-way split): `glossary.js` + `Tooltip.js` shared first, then section components: (A) Status + Board, (B) Duel + Ridges + Tornado, (C) SwitchYard + PreMortem + Assumptions + EvidenceLog + Glossary.
- **Phase 4** (subagent): page shell `index.js`, `major.css`, route wiring, passphrase gate, EDIT toggle wiring.
- **Phase 5** (direct, this session): verification — tests, Playwright E2E, pixel pass, and Sakura coverage review.

## Brand coverage — /major

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | Full-page legacy paper surface | `BRAND.md §2` / `sakura.css --bg` | `.sakura.mj-page` |
| Surfaces/cards/panels | Rounded legacy cards and panels | `BRAND.md §4/§9` / `Card` | `.mj-card`, `.mjc-form`, `.mjc-notes`, `.plain` |
| Text and type roles | Big Shoulders, legacy mono, mixed local sizes | `BRAND.md §7` / `Display` / `MonoLabel` | `major.css` `--font-*`, `--fs-*`; brand components |
| Spacing and layout | Page-local gaps and section rhythm | `BRAND.md §5` / `--s-*` | `.mj-shell`, `.mj-sec`, page layout selectors |
| Evidence table geometry | Fixed date/source columns (`108px` / `26%`) | `BRAND.md §5` / tabular data geometry | `.mjc-col-date`, `.mjc-col-src`; explicitly flagged as mapped data geometry |
| Controls and inputs | Bespoke buttons, fields, and selectors | `BRAND.md §4/§8` / UI primitives | `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Progress` |
| Links and states | Legacy warning/good colours and hover states | `BRAND.md §2/§6` / state tokens | `--warning`, `--success`, `--error`, focus rings, 140ms transitions |
| Warning rails | Repeated 3px warning rails | `BRAND.md §2/§9` / `--warning` + 1px hairline | `.mj-tie`, `.mjb-empty`, `.mjb-triad`, `.mjc-note`; 3px replaced by the sanctioned 1px rail |
| Icons and marks | Inline legacy marks | `BRAND.md §8` / `Glyph` | `Status` uses `Glyph name="sep"`; no decorative SVG icons |
| Glossary tooltips | Inherited legacy marker and bubble geometry | `BRAND.md §4/§7/§9` / Sakura tokens | `.sakura .tt::after`, `.sakura .tt .bub`; marker gap, bubble offset, and width limits use `--s-1`, `--s-2`, and `--s-8` |
| Images/data graphics | Dial, board heatmap, ridges, tornado, and switchyard SVG | `BRAND.md §2/§8/§9` / token palette | `Status`, `Board`, `Ridges`, `Tornado`, `SwitchYard`; geometry remains a flagged data encoding, strokes/fills use Sakura tokens |
| Motion | Reveal and bespoke transitions | `BRAND.md §6` / `--dur-state` | `major.css`; page-local state motion uses sanctioned tokens and the reduced-motion block disables it |
| Responsive behavior | Desktop-first legacy layout | `BRAND.md §1/§5` | `@media` rules at 820/760/640px and coarse-pointer controls; Playwright 1440/375 |
| Loading/error/empty states | Plain loading text and local empty states | `Skeleton`, `Badge`, state tokens | `.mj-loading`, `.mjb-empty`, offline/saved badge in `index.js`; Playwright gate |

**Unmapped aspects:** none. The dial, board, ridges, tornado, and switchyard geometry are flagged as data encodings; the evidence-table columns are flagged as tabular data geometry; all visible colour, type, stroke, fill, spacing, radius, and motion values map to the sources above.

**Hard-coded visual values:** fixed chart, diagram, board, and table geometry is recorded above as data-display geometry. Hairlines and state rails are sanctioned brand rules. All remaining UI values use Sakura tokens or library component rules.
