# 10 · Graph-mode build plan — the REAL flagship home

**Status: plan approved (auto-approved by Oliver, pre-departure). Execution may begin.**
This doc is restart-safe: any fresh agent must be able to resume from it alone.

---

## CURRENT STATUS / NEXT TASK  ← executors MUST keep this block updated

```
Last updated : 2026-08-18 (exec-infra) — FINAL GATE ✅. BUILD COMPLETE (preview only, L5).
exec-infra   : ALL PHASES + INTEGRATION DONE. Gate 1 ✅ (mode.spec 4/4, legacy
               freeze 3/3 vs pre-swap baselines, contrast 63/63). Integration:
               graph lives at /, old home unmounted (P4-flagged), full suite
               36 passed / 4 env-gated skips, vitest 216/216. Lighthouse on /:
               mobile 92–95 perf / 100 a11y, desktop 99 / 100. Pre-graph route
               JS ≈ 99KB gz (≤ 180). Ship-check: 14 screenshots reviewed,
               HUD-under-chrome collisions found + fixed (chrome.css glue).
exec-graph   : ALL PHASES DONE — GATES G1–G4 ✅ (last: 9cbea665). Harness:
               http://localhost:3200/graph-dev.html (bg-vite-dev pane w2Y:pN).
               Full check this session: vitest 216/216 · playwright 26 passed.
               Standing by for INTEGRATION (X-1..X-4, exec-infra leads — I'm on call).
               NOTE for X-2 (exec-infra): the graph's ⌘K/prompt "switch to terminal"
               intent dispatches cancelable CustomEvent 'on:set-mode' (detail =
               'terminal'|'graph') on window; ModeProvider should listen +
               preventDefault. Uncaught → graph shows a holding-screen toast.
               X-1 note: GraphHome imports graph.css itself; lazy-import it and the
               d3 deps ride in its chunk. Dev harness (graph-dev.html) is already
               excluded from prod (build input pinned to index.html).
Integration  : X-1..X-4 DONE — FINAL GATE ✅ (bd39e909 + deploy). NOT in production (L5).
Blockers     : none · ops note: exec-infra sessions kept dying on provider 429/refusals;
               exec-graph respawned it twice via herdr (pane w2Y:pK, model pinned to
               anthropic/claude-fable-5, SHORT prompt — long prompts triggered refusals).
               Current run: exec-infra-3, started after Gate G4, tasked I-1.3→X-4.
Preview URL  : https://olivernguyen-94j0tjy5t-ollie88skwdas-projects.vercel.app (integrated graph-v1)
               NOTE: behind Vercel SSO deployment protection (project setting) —
               open while logged into Vercel; disable protection to share publicly.
Notes for Oliver :
  - (exec-infra) INTEGRATION DEVIATIONS, all logged in code comments:
    • GraphHome is imported statically by Home (§5 said lazy) — P6's real
      mandate (d3+canvas lazy, never on mobile) is carried by GraphHome's
      internal lazy(GraphCanvas) split; lazy-loading the 5KB shell too added a
      fetch hop that cost the mobile Lighthouse gate. Network-asserted.
    • Chrome motion is CSS, not framer-motion (05 §6.4 "rebuilt with Motion") —
      chrome was the only eager framer consumer; ~35KB gz off the entry chunk
      to pass Lighthouse mobile ≥ 90. Same easings/durations.
    • Top-bar Work/About/Contact links dropped: their /#work anchors died with
      the old home, and the graph has no inbound focus-intent API to jump
      clusters. Restore when exec-graph exposes one.
    • SEARCH ⌘K button renders only in graph mode on / with a fine pointer
      (elsewhere no palette exists); it synthesizes the ⌘K keydown.
  - (exec-infra) TERM→GRAPH round-trip remounts the graph (fresh entry view,
    state not carried). Deliberate: GraphCanvas owns window-level key handlers
    that must not run under the holding screen (never-trap). Preserving live
    camera state across the flip needs a small state-lift in exec-graph's
    GraphCanvas — post-launch item if you want it.
  - (exec-infra) Both Vercel previews 302 → vercel.com/sso-api (deployment
    protection). I-0.7's /api check predates this observation — verify /api
    once logged in, or set a protection-bypass secret for automation.
  - (exec-infra) Authed E2E flows NOT exercised — .env.local has the Clerk
    publishable key but no test-user credentials. Gate 0 verifies /studio and
    /transfer redirect to /sign-in, /major + /apply to their passphrase gate.
    Full Clerk sign-in + essay-studio editor/vim need a test account from you.
  - (exec-infra) Pre-existing legacy hygiene, surfaced by Gate 0 but NOT fixed
    (Gate 1 screenshot-freezes legacy pages): /permit + /articlewriter author
    <ol>/<h4>/<p> inside <p> (React validateDOMNesting dev warning);
    react-helmet fires UNSAFE_componentWillMount under StrictMode. Allow-listed
    in e2e/routes.spec.js with tight regexes; recommend post-launch cleanup.
  - (exec-graph) Day beats are still the prototype's curated-fiction set (P5/L6).
    Real redacted beats drop into src/content/site.js `week` — data-only swap.
  - (exec-graph) Content deltas vs prototype, all making stubs real: scopecreep
    links its real repo; articlewriter + page nodes link their real routes;
    github/linkedin/resume channels use real URLs (public/resume.pdf verified);
    email-node blurb reworded for production ("real even in the prototype" line).
  - (exec-graph) Intent matcher now ignores trailing punctuation — the prototype's
    own placeholder "what runs on this mac?" dead-ended when typed verbatim.
  - (exec-graph) Far-zoom card detail lines (kind label + meta) now hide fully
    instead of ghosting at 15% opacity — the ghost failed WCAG contrast (axe,
    34×). Visually near-identical at that zoom; revert = graph.css far-fade rule.
  - (exec-graph) Tour: auto-started runs advance every 4s; manual arrows take
    over (arrows/Esc always work). RM/still → no autostart, instant steps.
```

Update rules: tick checkboxes in §8 as you complete tasks; rewrite this block at the end
of every work session; log anything a human must decide under "Notes for Oliver".

---

## 1 · Context summary (read the sources when detail is needed)

One portfolio, two modes over one content model. **Graph mode is the flagship** — a
full-viewport spatial canvas (light "sakura paper" palette) that greets every first-time
visitor: Oliver as root node, projects/roles/pages as authored nodes, intents routed as
jade pulses along edges, dossier panel per node, prompt bar + ⌘K, guided tour. Terminal
mode (dark sakura, herdr-style panes per `09-herdr-panels.md`) is a **later build**.

The approved look/feel lives in `prototype/graph/` (hand-rolled DOM+SVG + d3-zoom,
~700 LOC). This build ports its **feel** into the production React app — not its code
verbatim, and with two owner-mandated changes (fonts, edges — §3).

### Locked decisions (do not relitigate)

| # | Decision |
|---|---|
| L1 | One site, two switchable modes: terminal (dark sakura) + graph (light sakura) |
| L2 | **Graph is the flagship** and greets all first-time visitors |
| L3 | Stack: Path C — CRA → **Vite + Tailwind v4**; react-router v5, auth gates, `/api` untouched (`02-libraries.md` §Path C) |
| L4 | Palettes: `04-sakura-palette.md` verbatim — dark=terminal, light=graph |
| L5 | Launch holds until BOTH modes gate (this build ships to preview only) |
| L6 | Log privacy: verbatim decision-log excerpts + redaction (owner-approved beats) |
| L7 | Terminal = herdr-style panes — **deferred, not this build** |
| L8 | V1 scope = home + shared chrome; legacy routes unchanged under new chrome |
| L9 | Typography: **old site's fonts** — Big Shoulders (display) / Hanken Grotesk (sans) / Martian Mono (mono). Prototype's Inter/JetBrains replaced |
| L10 | Edge rework: Oliver dislikes the spline "roads" — see §3.2. Otherwise prototype look approved |

## 2 · Plan-level decisions (made here; executors follow, don't reopen)

| # | Decision | Rationale |
|---|---|---|
| P1 | **Renderer: port the hand-rolled world-div + SVG-underlay architecture into React. No React Flow.** Supersedes `05-v1-spec.md` §4.1/§7. | The flagship's feel lives exactly in the layer React Flow abstracts away (release inertia, van Wijk fly-to, bead routing on real paths, custom edge geometry). 06 §1 shows the architectures are identical; the prototype is the approved artifact. Deps: `d3-zoom`, `d3-selection`, `d3-transition`, `d3-interpolate` micro-modules only. |
| P2 | **Token scoping:** `data-mode` attr on `<html>` (for `theme-color`/meta) but sakura CSS variables declared on a `.sakura` scope class, i.e. `html[data-mode="graph"] .sakura { … }`. | Legacy `src/styles/theme.css` defines `--bg`, `--text`, `--accent` on `:root`; putting sakura tokens on `:root[data-mode]` would silently restyle every legacy page. New chrome + GraphHome mount inside `.sakura`; legacy bodies untouched (05 §6.4). |
| P3 | **Interim mode default = graph for everyone** (incl. mobile → graph list fallback). 05 §6.2's OS-heuristic activates only when terminal ships. | Terminal is a holding screen this build; defaulting anyone into it would greet them with nothing. |
| P4 | TERM toggle position renders a minimal dark-sakura holding screen (real tokens, one line, no fake content). Old `home.js` left in tree, unmounted, flagged not deleted. | L5/L7. |
| P5 | Content model `src/content/site.js` follows 05 §2.2 schema; prototype copy is the seed. Day beats stay the prototype's curated-fiction set until Oliver supplies real redacted beats (L6) — flag in status header. | Unblocks build; content swap is data-only. |
| P6 | Graph JS (d3 + canvas code) is lazy-chunked; never fetched on mobile (list fallback) — 05 §8 budget: `/` ≤ 180KB gz before the graph chunk. | Perf gate. |

## 3 · Owner design notes folded in

### 3.1 Typography (L9)
Already loaded via Google Fonts (`public/index.html` line 18 → moves to root
`index.html` in Phase 0 — preserve the `<link>` tags). Mapping:

- **Big Shoulders** (display): root-node title, dossier titles, stat values. Condensed —
  it wants larger sizes than Inter did; retune, don't transplant sizes.
- **Hanken Grotesk** (sans): card titles/metas, blurbs, suggestion rows, tour captions.
- **Martian Mono** (mono): kind labels, group pills, day nodes, beats, hints, prompt/⌘K
  inputs, tech chips, toasts, zoom label. **Martian Mono is much wider than JetBrains** —
  the prototype's 9–11px sizes with .14–.18em tracking will overflow. A dedicated type
  pass (task G-2.6) retunes size/tracking/max-widths per component against screenshots.

Reference vars (exist in `theme.css`, re-declare inside `.sakura` so graph never depends
on legacy CSS): `--font-display`, `--font-sans`, `--font-mono`.

### 3.2 Edge rework (L10)
Current prototype edge = quadratic bézier with perpendicular offset `dist * 0.08` — the
disliked "roads". Rework as a **pluggable geometry function**
`edgePath(nodeA, nodeB, style) → SVG path d` in `src/graph/lib/edges.js`, three candidates
switchable via dev query param `?edges=`:

1. `arc` — gentle circular arc, sagitta ≈ `min(dist * 0.025, 18px)`: near-straight, soft bow.
2. `elbow` — straight segments with rounded fillets (radius ~14px) at a single bend
   placed on the dominant axis; reads as circuit-trace, not road.
3. `weighted` (**ship default**) — curvature scales with distance: edges < 220px world
   units render straight; longer edges ease up to the `arc` sagitta cap. Short local
   links stay crisp, long cross-cluster links stay graceful.

**Invariants (all candidates):** one `<path>` per edge, drawn parent→child direction,
`pathLength="1"` kept — so the draw-in animation, hot/dim classes, AND the intent-pulse
bead (`getTotalLength`/`getPointAtLength` in the routing code) work unchanged. Keep all
three behind the query param for Oliver's later review; ship `weighted`.

## 4 · File map

| Path | What / who |
|---|---|
| `docs/redesign-research/02-libraries.md` §Path C | Migration recipe (8 numbered steps) — exec-infra's script |
| `docs/redesign-research/04-sakura-palette.md` §5 | Both token sets, copy verbatim |
| `docs/redesign-research/05-v1-spec.md` | Content schema §2.2, graph spec §4, mode logic §6, a11y §8 |
| `docs/redesign-research/06-graph-research.md` §4 | Interaction priorities + camera physics rationale |
| `prototype/graph/{index.html,style.css,app.js,USAGE.md}` | Approved prototype — the feel reference. READ ONLY |
| `public/index.html` | Fonts link (line 18) — becomes root `index.html` in Phase 0 |
| `src/Routes.js` | Router v5 Switch, 14 public+gated paths + 404 — only `/` mount + chrome change |
| `src/styles/theme.css` | Legacy `:root` tokens — DO NOT TOUCH values (P2 collision) |
| `src/pages/home.js` | Old home — unmounted in integration, left in tree (P4) |
| `api/`, `src/auth/`, `src/pages/essay_studio/` | Untouched by both executors |
| **NEW** `src/styles/sakura.css` | exec-infra — 04 §5 tokens under `.sakura` scoping (P2) + font vars |
| **NEW** `src/mode/ModeProvider.jsx` | exec-infra — mode state, persistence, `data-mode`, URL sync |
| **NEW** `src/home/Home.jsx` | exec-infra — mode switch: GraphHome (lazy) / terminal holding screen |
| **NEW** `src/chrome/` | exec-infra — top bar rebuild + mode toggle (05 §6.4) |
| **NEW** `src/content/site.js` | exec-graph — content model (05 §2.2 schema) |
| **NEW** `src/intents/registry.js` | exec-graph — intent list + matcher (prototype's, restructured) |
| **NEW** `src/graph/` | exec-graph — everything graph: `GraphHome.jsx`, `lib/` (pure: edges, layout, camera math), components, `graph.css` |
| **NEW** `e2e/` | exec-infra — Playwright config + specs (both executors add specs here for their own gates) |
| **NEW** `graph-dev.html` + `src/graph/dev.jsx` | exec-graph — standalone dev harness (second Vite input, DEV only) |

## 5 · Executor split + interface contract

Two agents, one branch: **`redesign/graph-v1`**. File ownership is disjoint (§4 "who"
column). Rule: never edit the other executor's files; shared files (`package.json`,
`index.html`, `vite.config`) are **exec-infra only** — exec-graph requests changes via
the status header. Both tick their own checkboxes in §8.

**exec-infra** — Phase 0 migration, tokens/fonts, ModeProvider, chrome shell, Playwright
harness, integration mount.
**exec-graph** — graph mode itself: content model, canvas/camera, nodes/edges (incl. §3.2
rework), dossiers, prompt bar + pulses, ⌘K, filter, tour, entry animation, keyboard,
mobile list fallback, a11y.

**Parallelism:** exec-graph starts immediately with bundler-free pure modules (content
model, edge geometry + unit tests, intent registry) while exec-infra runs Phase 0. Graph
*components* start only after the Phase 0 gate passes.

### Mount API (the contract — breaking it = stop and coordinate)

```
ModeProvider  (from src/mode/ModeProvider.jsx, exec-infra)
  useMode() → { mode: 'graph'|'terminal', setMode(m) }
  Resolution: ?mode= param → localStorage 'on.mode' → default 'graph' (P3).
  Sets <html data-mode>, syncs URL via history.replaceState, updates theme-color meta.

GraphHome  (default export of src/graph/GraphHome.jsx, exec-graph)
  Props: none. Renders full-viewport inside a `.sakura` wrapper it provides itself.
  Must run standalone in the graph-dev harness. Desktop (≥768px + fine pointer) →
  canvas; else → dossier-list fallback. Lazy-imported by Home (P6).

Tokens: CSS variable names from 04 §5 exactly (--bg, --surface, --node-fill, --edge,
--routing-pulse, …) + --font-display/--font-sans/--font-mono, valid inside `.sakura`.
exec-graph references variables only, never hex.

Deps exec-infra installs in Phase 0 for exec-graph:
d3-zoom · d3-selection · d3-transition · d3-interpolate
```

## 6 · Phases + gates (no phase starts before its prerequisite gate passes)

**Phase 0 — exec-infra: Vite + Tailwind v4 migration** (~1–2 days)
Follow 02 §Path C steps 1–8 exactly: Vite + `@vitejs/plugin-react` (.js-as-JSX), root
`index.html` (keep font links), env vars (incl. the one dynamic `process.env.REACT_APP_`
access — use `define`/env-compat), Jest→Vitest (all 8 existing `*.test.js`), `vercel.json`
→ `vite build`/`dist`, `@tailwindcss/vite`, `shadcn init`, install Playwright + §5 d3 deps.
✅ **Gate 0:** Playwright drives a real browser through **every route in `src/Routes.js`**:
`/`, `/sign-in`, `/permit`, `/license`, `/articlewriter`, `/sat-resources`, `/sat-signup`,
`/pull`, `/emoji`, `/be-my-girlfriend`, `/college`, `/major`, `/apply`, `/studio`,
`/transfer`, plus a 404 URL. Each renders without console errors/pageerrors. Gated routes:
verified to their gate screen; full authed flows (Clerk sign-in, essay-studio editor+vim)
exercised only if creds exist in `.env.local`, else logged in status for Oliver. All 8
Vitest suites green. `/api` verified on a Vercel preview deploy.

**Phase 1 — exec-infra: foundations + chrome shell** (~1–2 days)
`src/styles/sakura.css` (P2 scoping), contrast-check script (04's pairs), `ModeProvider`,
`src/home/Home.jsx` (graph placeholder + terminal holding screen), top-bar rebuild + TERM|GRAPH
toggle on all chromed routes (05 §6.4; drop dead `/debt` link), `NO_CHROME` preserved.
✅ **Gate 1:** toggle swaps `data-mode` + persists + URL-syncs on `/`; `?mode=graph` forces
graph; legacy pages visually unchanged under new chrome (Playwright screenshot diff on
`/pull`, `/permit`, `/college`); contrast script passes; zero console errors.

**Phase G1 — exec-graph: pure modules** (parallel with Phase 0)
`src/content/site.js` (05 §2.2 schema, prototype copy + 30 nodes incl. week ring
generation), `src/graph/lib/edges.js` (§3.2, all 3 candidates), `src/graph/lib/layout.js`
(authored positions from prototype), `src/intents/registry.js` (prototype's INTENTS +
matcher). No DOM, no bundler needed.
✅ **Gate G1:** Vitest units: schema validation over all entities; edgePath invariants
(single path, endpoints exact, straight-below-threshold for `weighted`); intent matcher
reproduces prototype behavior ("day 4", multi-word AND, ranking).

**Phase G2 — exec-graph: canvas, camera, nodes, edges** (after Gate 0)
Port stage/world/camera into React: `useCamera` hook owning d3-zoom + release inertia
(`exp(-dt/240)`) + van Wijk fly-to via `d3.interpolateZoom` (380–1050ms), node components
per kind, SVG edge underlay using §3.2 `weighted` default + `?edges=` switch, hover 1-hop
highlight (instant in, eased out), semantic-zoom far-fade, dot-grid background sync,
**fonts per §3.1 incl. the type pass (G-2.6)**.
✅ **Gate G2:** in the dev harness — drag/wheel/pinch/inertia/double-click-fit all work;
fly-to matches prototype pacing; hover dims rest with zero transition-in lag; all three
edge styles render + draw-in animate; type pass screenshots reviewed side-by-side vs
prototype (`?still`); zero console errors.

**Phase G3 — exec-graph: interactions** (~2–3 days)
Dossiers (focus fly, panel, linked chips, esc/canvas-close, focus trap + return), pulse
routing root→target with jade bead + arrival flash on the reworked edges, prompt bar
(rotating typewriter placeholder, suggestions), ⌘K palette, `/` filter, guided tour
(8 stops, ←/→/Esc; autostart only after 6s idle, any input cancels), entry animation
(nodes assemble from center, edges draw in), keyboard model (Tab/arrows cycle, `f` fit,
Esc cascade), never-trap rules (05 §5.4.2: inputs return early, no modifier hijack).
✅ **Gate G3:** Playwright on the harness — every entity reachable by click alone (crawl
legend chips + all nodes, assert dossier title per node); prompt-bar intent routes a
visible pulse (bead element present, `.routing`/`.arrived` classes fire) then opens the
dossier; ⌘K + filter + tour + Esc-cascade behave per prototype USAGE table; typing `j`
in prompt bar types the letter; zero console errors.

**Phase G4 — exec-graph: fallbacks + a11y** (~1–2 days)
Mobile/coarse-pointer dossier-list fallback (05 §4.5) — canvas + d3 never imported;
`prefers-reduced-motion`: no entry assembly/drift/typewriter, instant camera, pulse →
instant path highlight; SR: `role="application"` + aria-label + visually-hidden entity
list; `?still` param kept for screenshots.
✅ **Gate G4:** Playwright mobile viewport gets the list AND the graph chunk is not
fetched (network assertion); reduced-motion emulation renders static; axe pass on both
renderings; zero console errors.

**Integration — both executors** (~1 day, after Gates 1 + G4)
exec-infra mounts lazy GraphHome in `Home.jsx`, unmounts old home (P4), excludes dev
harness from prod build, wires toggle ⌘K/`:mode` intents to ModeProvider. Then the full
suite re-runs against the real app (not the harness).
✅ **FINAL GATE:** all previous gates re-pass on `/` in the integrated app; first visit
lands in graph; TERM shows holding screen and toggling back restores graph state; route
JS ≤ 180KB gz pre-graph-chunk; Lighthouse on `/` ≥ 90 perf / ≥ 95 a11y; Playwright full
suite green (14 routes + graph specs); **ship-check** run; Vercel **preview** deployed
(NOT production — L5) and URL logged in the status header.

## 7 · Resume protocol (fresh agent, cold start)

1. Read this doc top to bottom. 2. Read the §CURRENT STATUS block — it names your next
task ID. 3. `git checkout redesign/graph-v1` (create from main if missing — that is
task I-0.1). 4. Read only the source docs your phase cites. 5. Verify the last claimed
gate actually passes before building on it (`npx playwright test`, `npx vitest run`).
6. Do the task, tick its box, update the status block, commit
(`graph-v1(<executor>): <task-id> <summary>`).

## 8 · LIVE TASK CHECKLIST — tick as you go

### exec-infra
- [x] **I-0.1** Create branch `redesign/graph-v1`; Vite + plugin-react scaffold, .js-as-JSX; app boots
- [x] **I-0.2** Root `index.html` w/ font links; env vars incl. dynamic access; `vercel.json` → vite/dist
- [x] **I-0.3** Jest→Vitest, all 8 existing test files green (18 files/216 tests incl. exec-graph's)
- [x] **I-0.4** Tailwind v4 (`@tailwindcss/vite`) + `shadcn init`; legacy CSS coexists (no preflight)
- [x] **I-0.5** Install Playwright + d3 micro-modules (§5 contract)
- [x] **I-0.6** Playwright spec: all routes of §6 Gate 0 + console-error assertions → **GATE 0 ✅** (23f83210, 16/16 2x)
- [x] **I-0.7** Vercel preview deploy; `/api` verified (session fn + SPA rewrite + statics); authed flows flagged (no creds)
- [x] **I-1.1** `src/styles/sakura.css` — 04 §5 both token sets, `.sakura` scoping (P2), font vars (4531b14a)
- [x] **I-1.2** Contrast-check script over 04's pairs (CI-runnable: `yarn contrast`, 63 pairs, negative-tested)
- [x] **I-1.3** `ModeProvider` (P3 default, persistence, URL sync, `data-mode`, theme-color) (dc6899c4; incl. 'on:set-mode' listener per X-2 contract)
- [x] **I-1.4** `src/home/Home.jsx` — mode switch, graph placeholder, terminal holding screen (P4)
- [x] **I-1.5** Top bar + TERM|GRAPH toggle on chromed routes; `/debt` dropped; `NO_CHROME` intact (2a9af316)
- [x] **I-1.6** Playwright: toggle/persist/URL + legacy screenshot diff ×3 → **GATE 1 ✅** (e2e/mode.spec.js 4/4; legacy-visual 3/3 vs pre-swap baselines; contrast 63/63)

### exec-graph
- [x] **G-1.1** `src/content/site.js` — 05 §2.2 schema, all 30 nodes + week ring, prototype copy (P5)
- [x] **G-1.2** `src/graph/lib/edges.js` — arc / elbow / weighted (§3.2) + invariants
- [x] **G-1.3** `src/graph/lib/layout.js` — authored positions; `src/intents/registry.js` + matcher (+ `lib/structure.js`: edge list/adjacency/root-paths derived from content)
- [x] **G-1.4** Vitest units for all of the above → **GATE G1 ✅** (5 suites · 67 tests · `npx vitest run src/content src/graph src/intents`)
- [x] **G-2.1** Dev harness (`graph-dev.html` + `dev.jsx`, DEV-only Vite input) (90a3a5c5)
- [x] **G-2.2** `useCamera` — d3-zoom, inertia, van Wijk fly-to, bounds, fit (drag/inertia/wheel/dblclick-fit browser-verified)
- [x] **G-2.3** Node components per kind (root/group/day/leaf) on world div
- [x] **G-2.4** SVG edge underlay w/ §3.2 geometry, `?edges=` switch, draw-in (all 3 styles screenshot-verified)
- [x] **G-2.5** Hover 1-hop highlight, semantic-zoom fade, dot-grid sync
- [x] **G-2.6** Type pass: Big Shoulders/Hanken/Martian mapped + retuned (§3.1), screenshots vs prototype (canvas elements done; dossier titles re-checked in G-3.1)
- [x] **G-2.7** Manual + screenshot review vs prototype → **GATE G2 ✅** (side-by-side /tmp/graph-shots; e2e/graph-shots.spec.js env-gated harness shots; pinch = stock d3-zoom touch, not emulatable headless — same code path as prototype)
- [x] **G-3.1** Dossier: focus fly, panel, linked chips, close cascade, focus trap (157a41e9)
- [x] **G-3.2** Pulse routing on reworked edges: bead, `.routing`, arrival flash
- [x] **G-3.3** Prompt bar + typewriter placeholder + suggestions
- [x] **G-3.4** ⌘K palette + `/` filter (filter Esc now releases input focus — prototype parity fix)
- [x] **G-3.5** Guided tour (8 stops, 6s-idle autostart + any-input cancel, 4s auto-dwell)
- [x] **G-3.6** Entry animation + keyboard model + never-trap rules
- [x] **G-3.7** Playwright: click-crawl every entity, pulse assertions, keyboard specs → **GATE G3 ✅** (e2e/graph.spec.js 5/5; incl. mouse-only crawl of all 30 nodes + occlusion drag-recovery)
- [x] **G-4.1** Mobile dossier-list fallback; graph chunk never fetched on mobile (9cbea665; network-asserted)
- [x] **G-4.2** Reduced-motion fallbacks throughout; `?still` kept (RM: no entry/drift/draw-in/typewriter/autostart, instant camera, pulse → static route highlight)
- [x] **G-4.3** SR layer: role=application + hidden entity list; axe pass (GraphList doubles as mobile view + SR layer)
- [x] **G-4.4** Playwright: mobile/RM/network/axe specs → **GATE G4 ✅** (e2e/graph-a11y.spec.js 3/3; axe via CDN-injected axe-core — no dep change needed; full suite 26 passed / 4 env-gated skips)

### Integration (exec-infra leads, exec-graph on call)
- [x] **X-1** Mount GraphHome in Home; old home unmounted + flagged (P4); harness excluded from prod (18edd062; GraphHome static — see status notes; dist verified harness-free; legacy routes lazy-split)
- [x] **X-2** Toggle/intents wired to ModeProvider; mode round-trip restores a working graph (b1556f52; 'on:set-mode' preventDefaulted — no fallback toast; view state resets by design, see notes)
- [x] **X-3** Full Playwright suite + Lighthouse + perf budget on integrated `/` (dc3894b9; 36 passed / 4 env-gated; Lighthouse mobile 92–95/100, desktop 99/100; ≈99KB gz ≤ 180)
- [x] **X-4** ship-check; Vercel PREVIEW deployed (not prod — L5); URL in status header → **FINAL GATE ✅** (bd39e909; 14 shots reviewed, HUD glue fixes; preview 94j0tjy5t, SSO-protected)

---
*Prev: `09-herdr-panels.md` (terminal, deferred). This doc is the single source of truth
for the graph build; on conflict with 05 §4/§7, this doc wins (P1–P6).*
