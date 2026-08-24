# 11 · Terminal-mode build plan — the second interface

**Status: plan approved (auto-approved by Oliver, pre-departure). Execution may begin.**
This doc is restart-safe: any fresh agent must be able to resume from it alone.

---

## CURRENT STATUS / NEXT TASK  ← executors MUST keep this block updated

```
Last updated   : exec-term-core — FINAL GATE ✅ (X-1..X-4 done). TERMINAL BUILD COMPLETE
                 (preview only). Doc-10 L5 launch-hold is LIFTED — both modes gated;
                 the production flip stays Oliver's call.
                 Evidence: 341 vitest + 80 e2e green (×3 runs); Lighthouse — graph /
                 91-93 perf / 100 a11y mobile · 100/100 desktop (baseline-matched via
                 graph-v1 worktree bench), terminal /?mode=terminal 95/100 mobile ·
                 97/100 desktop; entry 105.2KB gz ≤ 180 (terminal = lazy 12.6KB gz
                 chunk, fetch-on-flip network-asserted); ship-check 11 screenshots
                 reviewed both viewports (fixes: pane buttons hidden + splits gated on
                 flat layouts).
Preview URL    : https://olivernguyen-1onf5yepe-ollie88skwdas-projects.vercel.app
                 (redesign/terminal-v1 tip incl. F-C.2/3, both modes at one URL) —
                 behind Vercel SSO deployment protection; open logged into Vercel.
                 /api VERIFIED on the preview via a Protection-Bypass-for-Automation
                 secret (created via the project API; value in Vercel dashboard →
                 Deployment Protection, not committed here): GET /api/auth/session →
                 401 JSON, POST → 405, /api/exemplars/list → 401 — real function
                 responses, not SSO redirects; both mode URLs serve 200.
FOLLOW-UP ROUND: F-C.1..F-C.3 ALL DONE ✅ (round 2).
                 F-C.2: src/graph/lib/focusIntent.js — cancelable 'on:graph-intent'
                 CustomEvent (detail = registry id | entity id | free text; mirrors the
                 'on:set-mode' shape) + ?focus= deep-link param, consumed once by the
                 first mounted surface. PromptBar binds it beside the canvas's runIntent
                 (StrictMode-safe deferred consumption — the fake mount otherwise ate
                 the deep-link); GraphList (mobile, non-srOnly) consumes by scrolling to
                 gl-h-<group>/gl-<id>. OWNERSHIP: PromptBar.jsx + GraphList.jsx edits
                 claimed under the exec-graph retirement (neither is on panes' list —
                 they own ONLY GraphCanvas.jsx + GraphHome.jsx; untouched by core).
                 F-C.3: chrome Work→agents / About→oliver / Contact→contact links,
                 graph mode only (terminal keeps its own nav — a mode-yanking link is a
                 trap); on / they dispatch in-page, elsewhere they navigate /?focus=.
                 Suites: 353 vitest + 88 e2e green; entry 106.6KB gz ≤ 180 (registry now
                 eager via chrome, +1.4KB); P6 mobile network assert still green;
                 graph-focus-intents.spec.js 5/5; ship-check shots reviewed.
OWNERSHIP GRANT (round 2, logged here + doc 10): exec-graph is RETIRED.
                 exec-term-core now owns src/graph/lib/**, the intent-registry
                 surface (src/intents/registry.js) and chrome files (F-C.2/3).
                 exec-term-panes simultaneously owns
                 src/graph/components/GraphCanvas.jsx + src/graph/GraphHome.jsx
                 (camera state-lift) — core will NOT touch those two files;
                 coordination via this header. Never-trap and the cancelable
                 'on:set-mode' contract stay inviolate.
exec-term-panes (round 2): F-P.1 + F-P.2 DONE ✅. State-lift = module-level SAVED
                 store in GraphCanvas.jsx: saves camera/focusId/dossierOpen/preFocus
                 on unmount ONLY if the session diverged from entry (untouched graph
                 round-trips to a fresh mount — StrictMode fake-remounts + existing
                 fresh-entry specs unaffected); consume-on-mount restore via
                 camera.setInstant, entry anims skipped (.ready withheld; nodes mount
                 still → released next frame so drift resumes), 6s tour autostart
                 suppressed, Esc fly-back preserved. Never-trap mechanism byte-identical
                 (same unmount detach; core's key-deadness specs green). New spec:
                 e2e/graph-state-lift.spec.js (motion + reduced-motion + fresh-entry
                 guard; 9/9 under repeat×3/4 workers). Full suites 341 vitest + 83 e2e.
                 GraphHome.jsx: granted, zero edits needed. lib/camera.js consumed
                 import-only (fitTransform). FYI core: F-P landed AFTER your F-C.1
                 deploy — next preview re-deploy picks up the state-lift.
Blockers       : none.
Notes for Oliver :
  - Production flip (both modes → olivernguyen.com) is YOURS to call — L5 hold
    lifted, previews only so far.
  - Previews sit behind Vercel SSO deployment protection; disable it or add a
    protection-bypass secret to share the URL publicly.
  - Terminal ⌘K drops the graph-only tour/fit intents (L7: every palette row must
    do something real). Flag if you want terminal equivalents.
  - Touch devices boot INSTANTLY (typed boot pushed mobile LCP to 5.0s → gate
    fail); desktop keeps the full typing theater. Flag if you want typing on touch.
  - day N / open <entity> auto-split panes on wide screens; when the 40ch×12 pane
    floor refuses (narrow windows), content prints in-buffer + an E96 statusbar
    error — intended degradation.
```

Update rules: tick checkboxes in §8 as you complete tasks; rewrite this block at the end
of every work session; log anything a human must decide under "Notes for Oliver".

---

## 1 · Context summary (read the sources when detail is needed)

Doc 10's build is DONE (preview only, L5): the graph lives at `/`, and the TERM toggle
shows a one-line dark holding screen. **This build replaces that holding screen with the
real terminal mode.** Infra that already exists and must be reused, not rebuilt:

- Vite (8) + Tailwind v4, Vitest (216 tests) + Playwright (`e2e/`), `yarn contrast`.
- `src/styles/sakura.css` — BOTH token sets under `.sakura` (dark keys off
  `html[data-mode="terminal"]`), incl. `--term-*` tokens + font vars. Contrast-gated.
- Fonts loaded: Big Shoulders / Hanken Grotesk / **Martian Mono** (mono — wide; §3.3).
- `src/mode/ModeProvider.jsx` — `useMode()`, persistence, URL sync, and the
  **cancelable `'on:set-mode'` CustomEvent contract** (detail `'terminal'|'graph'`,
  listener preventDefaults = handled).
- `src/chrome/` — top bar with TERM|GRAPH toggle on all chromed routes.
- `src/content/site.js` (30 entities + `week`) and `src/intents/registry.js`
  (INTENTS + `matchIntents`) — exec-graph built both; **read-only here** (P4).

Terminal mode = the immersion model of `07-terminal-immersion.md` (**already implemented
and approved in `prototype/terminal/` v2** — viewport-is-the-screen, print-into-buffer,
one live prompt, tmux statusbar) **plus** Herdr-style panes per `09-herdr-panels.md`
(Oliver's locked decision: openable panes/splits to view several things at once).

### Locked decisions (do not relitigate)

| # | Decision |
|---|---|
| L1 | Terminal = dark sakura ("Night Plum" tokens, 04 §2.2/§5 — already in sakura.css) |
| L2 | Graph stays the flagship + default; terminal lives behind the TERM toggle (doc 10 L2/P3) |
| L3 | Immersion model per 07: page NEVER scrolls; sections PRINT into a scrollback buffer; one always-live prompt; boot = the site runs its own first command. Feel reference = `prototype/terminal/` v2 |
| L4 | Herdr panes per 09 §C: binary split tree, prefix-key grammar, named panes, max 4 |
| L5 | Launch (doc 10 L5) holds until BOTH modes gate — this build's FINAL GATE is what lifts it; production flip stays Oliver's call |
| L6 | Fonts L9 (doc 10): Martian Mono for all terminal text; Big Shoulders for the printed name only |
| L7 | Content honesty: no fake commands, no sudo/rm jokes (one `E492`-class joke allowed — the command line is real); `quit` easter-egg line from the prototype stays |

## 2 · Plan-level decisions (made here; executors follow, don't reopen — doc 10's P1–P6 remain in force)

| # | Decision | Rationale |
|---|---|---|
| P1 | **Port `prototype/terminal/` v2 architecture into React. No xterm.js, no terminal libs, no Lenis, no new deps at all.** | The approved feel is ~650 LOC of DOM we already own; xterm solves emulation we don't need. 07 declared Lenis unnecessary in this model. |
| P2 | **Default mode stays graph for everyone.** 05 §6.2's OS heuristic is NOT activated. Terminal reached via toggle / `?mode=terminal` / intents. | Doc 10 L2 locked "graph greets all first-time visitors". Flag in status notes if Oliver wants the heuristic — one-line change in ModeProvider (exec-infra territory, not ours). |
| P3 | **Never-trap by unmount, mirroring graph:** `Home.jsx` renders exactly ONE of GraphHome/TerminalHome. TerminalHome binds its single window keydown listener in an effect with cleanup — zero terminal handlers exist while graph is mounted, and vice versa. Round-trip remounts terminal fresh (scrollback + pane layout die, like a real session — 09's no-persistence call). | Graph's window handlers already work this way (doc 10 status notes); symmetry is the safety property the round-trip E2E asserts. |
| P4 | **Read-only dependencies:** `src/content/site.js`, `src/intents/registry.js`, everything under `src/graph/**`, and graph-era e2e specs — DO NOT EDIT. Terminal derives its view via `src/terminal/lib/terminalModel.js` (sections from entity kind/group; no `terminal:{}` hints added to site.js) and wraps intents in `src/terminal/lib/intents.js` (imports INTENTS + matchIntents; swaps `mode-terminal` → a mode-graph intent; appends terminal-only entries: clear, help, day jumps ride the matcher's built-in `day N`). | Graph must not change behavior (its ⌘K must not grow terminal rows). Graph focus-intent API + top-bar link restore = separate follow-up, OUT of scope. |
| P5 | **05 §3 (scrolling column, scroll-scrub, Magic UI components) is superseded by 07** — 07 explicitly amends it. Week replay = `day N` printing that day's beats + the `replay` pane program. No pinned scrub, no FlickeringGrid/Terminal components. | 07 §4 "spec fallout" paragraph. |
| P6 | **TerminalHome is lazy-imported by Home** — terminal is never the first paint (P2), so the chunk loads only when mode flips. Network-asserted like graph's mobile rule. `/` entry budget ≤ 180KB gz unchanged. | Perf gate parity. Terminal has no heavy deps; the lazy split is cheap insurance. |
| P7 | **Pane grammar = 09 §C verbatim:** prefix `Ctrl+G` (Cmd+G also accepted), the 8 bindings, one-shot prefix + sticky resize mode, 1.2s pending expiry shown in statusbar; limits ≤4 panes / split depth 2 per axis / min ~40ch×12 rows (violations → statusbar E-error); boot opens 1 pane; artifact commands auto-split RIGHT (main stays LEFT) with a toast advertising `^G x`; nested-flex render; zoom = CSS visibility, tree untouched; no layout persistence. | Researched + decided in 09; Herdr is Oliver's own muscle memory. |
| P8 | **CRT texture: cut entirely.** No scanlines, no vignette. | 07 calls skipping defensible; slop-list bait; one less RM/contrast knob. |
| P9 | **Mobile = single pane + touch-first (07/09):** coarse pointer → input NOT auto-focused (software keyboard never pops uninvited), document-click refocus disabled (tap the prompt line to type), statusbar tabs + printed `[ … ]` buttons (≥44px) carry all navigation, palette opens from a tappable statusbar chip, buffer scrolls by touch natively, splits disabled — auto-splits print in-buffer instead. Below ~880px OR coarse pointer. | 07: "no forced keyboard; printed blocks + tappable tabs already carry navigation." 09: Herdr itself stacks below a width threshold. |

## 3 · Design model folded in

### 3.1 Immersion invariants (07 §4 — the prototype already does all of these; keep them true in the port)
1. `#screen` grid `[buffer 1fr][promptline][statusbar]` at 100dvh; body never scrolls.
2. Navigation = running a command: tabs/keys call `run('cat tools.txt')` → echo line +
   section block appended, pinned to bottom. History accumulates; `clear` is real.
3. One live prompt: focused on load (fine pointers), doc-click refocus, ↑/↓ history,
   Tab completion, `:` is just a prefix in the same input, block cursor = full-cell
   inverse, NORMAL/INSERT/COMMAND indicator in the statusbar.
4. Boot = motd + auto-typed `operator --replay --day 3` whose output is the hero
   (log frame, scramble-reveal name, tagline, CTA row).
5. Cadence: commands TYPE (~26–52ms/char); output PRINTS line-at-a-time (34–74ms
   stagger). Keystrokes echo instantly. Reduced-motion: everything instant.
6. Statusbar = tmux grammar: `[oN.c]` + window tabs `1:boot…5:contact` (click = run) +
   mode indicator + `%` position + clock. This build adds: pane count, `[Z]`, `^G‥`.
7. Cell-grid discipline: sizes in ch/row multiples, box-drawing frames, whole-cell padding.

### 3.2 Pane programs (09 §C) — what a pane can contain
`main` (the session scrollback — always exists, always leftmost, refuses close/split-off),
`replay` (operator week log, follows the last `day N`), section pagers (`tools`,
`whoami`, `robotics`, `contact` as independently scrollable prints), `artifact`
(a project's dossier-style detail: mac-agent MCP tool list, articlewriter output image —
the ranger preview pane), `help`. No graph minimap (09 parked it).

### 3.3 Type pass (mirror of doc 10 G-2.6)
The prototype used the system mono stack; production uses **Martian Mono, which is much
wider**. `--cell`/`--row` rhythm, statusbar density, side-frame widths (`SP_COLS`-style
constants) and font sizes must be retuned against prototype screenshots — a dedicated
task (C-3.4), not ad-hoc tweaks. Big Shoulders only on the printed name + contact line.

### 3.4 What changes vs the prototype
Content comes from `site.js` via terminalModel (zero hardcoded copy — the prototype's
`<template>`s become React renderers fed by selectors); `mode graph` actually dispatches
`'on:set-mode'`; the context side-pane becomes a real pane (program `main` boots alone;
the old `#sidepane` is dropped — panes replace it); intents come from the shared registry.

## 4 · File map

| Path | What / who |
|---|---|
| `docs/redesign-research/07-terminal-immersion.md` | Immersion model — §3 techniques, §4 checklist |
| `docs/redesign-research/09-herdr-panels.md` | Pane grammar §A/§C, tree sketch, a11y |
| `prototype/terminal/{index.html,app.js,styles.css,USAGE.md}` | Approved feel reference. READ ONLY |
| `src/content/site.js` · `src/intents/registry.js` · `src/graph/**` | READ ONLY (P4) |
| `src/home/Home.jsx` | exec-term-core — Integration only: TerminalHolding → lazy TerminalHome |
| `src/mode/ModeProvider.jsx` · `src/chrome/**` | Untouched (contract consumers only) |
| **NEW** `src/terminal/TerminalHome.jsx` | core — mount root, screen grid, THE window key listener, composes PaneGrid |
| **NEW** `src/terminal/terminal.css` | core — screen/buffer/prompt/statusbar/cell-grid styles |
| **NEW** `src/terminal/Buffer.jsx` | core — `useBuffer()` engine + `<BufferView>` (§5 contract) |
| **NEW** `src/terminal/Prompt.jsx` · `StatusBar.jsx` · `Palette.jsx` · `HelpSheet.jsx` | core |
| **NEW** `src/terminal/sections.jsx` | core — printable section blocks (boot/tools/whoami/robotics/contact/ls/help) |
| **NEW** `src/terminal/lib/{commands.js,terminalModel.js,intents.js,cadence.js}` (+tests) | core — pure |
| **NEW** `src/terminal/panes/{tree.js,prefix.js}` (+tests) | panes — pure split tree + prefix state machine |
| **NEW** `src/terminal/panes/{PaneGrid.jsx,Pane.jsx,programs.jsx,panes.css}` | panes |
| **NEW** `terminal-dev.html` + `src/terminal/dev.jsx` | core — DEV-only harness (like graph-dev) |
| **NEW** `terminal-panes-dev.html` + `src/terminal/panes/dev.jsx` | panes — DEV-only harness (vite input added by core on request) |
| **NEW** `e2e/terminal.spec.js` · `e2e/terminal-a11y.spec.js` · `e2e/mode-roundtrip.spec.js` | core |
| **NEW** `e2e/terminal-panes.spec.js` | panes |

## 5 · Executor split + interface contract

Two agents, one branch: **`redesign/terminal-v1`** (created FROM `redesign/graph-v1`).
File ownership is disjoint (§4 "who"). Never edit the other executor's files; shared
files (`package.json`, `vite.config`, `index.html`, `Home.jsx`) are **exec-term-core
only** — exec-term-panes requests changes via the status header.

**exec-term-core (LEAD)** — buffer engine, prompt, commands, vim keys, content wiring,
statusbar, overlays, mobile/RM/a11y, and all Integration.
**exec-term-panes** — split-tree state, pane render grid, prefix keybindings, pane
content adapters (programs).

**Parallelism:** exec-term-panes starts immediately with pure modules (tree, prefix —
no DOM). Pane *components* start only after core's **GATE T0** (the buffer engine +
screen shell they build on).

### The contract (breaking it = stop and coordinate via the status header)

```
Buffer engine  (core, src/terminal/Buffer.jsx — panes imports it, never reimplements)
  useBuffer() → { ref, api }  api = {
    echo(cmdText)                       // prompt-echo line
    print(lines|node, {stagger})        // async, queued, cadence per §3.1.5, pins
    printErr(text) · clear() · scrollRows(n) · scrollEnd(top|bottom)
    pos() → 0..100 · onPos(cb)          // statusbar % feed
  }
  <BufferView api={api} label="…"/>     // role="log", own overflow-y, never the page
  All prints per buffer go through one promise queue (commands never interleave).

Pane tree  (panes, src/terminal/panes/tree.js — PURE)
  createTree() → root leaf {id:'main', program:'main'}
  split(tree,id,dir) · close(tree,id) · focusDir(tree,id,'h|j|k|l') · cycle ·
  zoom(toggle) · resizeStep(tree,id,axis,±0.05 clamped [.2,.8])
  Limits (P7) enforced HERE; violating ops return {ok:false, err:'E…'} which core
  prints in the statusbar. 'main' refuses close.

PaneGrid  (panes)
  <PaneGrid tree focusedId zoomedId programs onPaneClick/> — recursive nested flex
  mirroring the tree; leaf = <section class="pane" role="region" aria-label>, title
  row with [|] [–] [z] [×] buttons, focused border --accent, unfocused content .85.
  programs = { main: <slot from core/>, replay, tools, whoami, robotics, contact,
  artifact, help } — each program component gets { entity?, day?, api } and renders
  its own BufferView or static pager (independently scrollable).

Key routing  (core owns THE ONE window keydown listener — P3)
  Before core's own handling (⌘K, vim-in-empty-prompt), it calls panes' pure reducer
  prefixStep(state, event) → { state', action? }   (action ∈ split/close/focus/zoom/
  resize/cycle/help, or null). Core executes actions via tree ops + setState, and
  renders prefix state ('^G‥', '-- RESIZE --') in StatusBar. Panes NEVER binds
  window listeners.

Commands → panes: the command executor's ctx exposes
  panes.open(program, {entity, split:'right'|'down'|false})   // false on mobile → in-buffer print
  implemented in TerminalHome (core) on top of tree ops. This is the ONLY surface
  commands use to touch panes.

StatusBar data: core renders; panes state arrives as props {paneCount, zoomed, prefix}.
```

## 6 · Phases + gates (no phase starts before its prerequisite gate passes)

**Phase C0 — exec-term-core: screen shell + buffer engine** (~1–2 days)
Branch off graph-v1. Dev harness (`terminal-dev.html`, data-mode=terminal, DEV-only vite
input; add panes' harness input while in the file). Screen grid at 100dvh inside
`.sakura` (dark tokens light up via the harness's data-mode), buffer engine + cadence
module + print queue + pin + pos%, `clear`, RM-instant path. Vitest on cadence/queue.
✅ **GATE T0:** in the harness — the page itself never scrolls (assert body scrollHeight
== clientHeight), blocks print line-at-a-time and pin to bottom, echo lines render,
`clear` empties, pos% updates on buffer scroll, reduced-motion prints instantly; zero
console errors. Playwright: `e2e/terminal.spec.js` first cases. **Unblocks N-2.**

**Phase C1 — exec-term-core: prompt, commands, sections, statusbar** (~2 days)
Prompt (echo + block cursor + NORMAL/INSERT/COMMAND, history, Tab completion over
files + terminal intents, doc-click refocus fine-pointer-only), command executor
(`ls`, `cat FILE`, `day N` → prints that day's real beats from `site.week`, `open <entity>`
→ artifact via `panes.open` (in-buffer until panes lands), `mode graph|term`, `email`
copy + printed confirm, `help`, `clear`, `1–5`, `quit` line), terminalModel selectors
(ALL copy from site.js — zero hardcoded content), section renderers, boot sequence as
command #1 (motd → auto-typed `operator --replay --day 3` → log frame + scramble name +
tagline + CTA row), statusbar tabs + % + clock.
✅ **GATE C1:** Playwright: boot autoruns and prints the hero; every tab + `1–5` prints
its section; `cat nosuch.txt` errors properly; history/Tab work; content assertions match
site.js values (spot-check 3 entities + day-3 beats); zero console errors.

**Phase C2 — exec-term-core: vim keys, palette, mode dispatch, never-trap** (~1–2 days)
Empty-prompt motions (`j/k` rows, `gg`/`G` with `g‥` pending + 1.2s expiry, `?` help
sheet), ⌘K palette over `lib/intents.js` (fuzzy via `matchIntents`, suggestions on empty
query), `:` prefix parity, `mode graph` → dispatch cancelable `'on:set-mode'` (uncaught
→ printErr fallback), Esc cascade (overlay → resize → zoom → clear prompt).
✅ **GATE C2:** Playwright: typing `j` mid-command inserts the letter (never-trap); ⌘K
input swallows nothing; modifiers pass through; `gg`/`G`/`1–5`/`?` behave; palette runs
intents incl. `day 4`; `mode graph` dispatches the event (harness listener asserts
detail + cancelable); zero console errors.

**Phase C3 — exec-term-core: mobile, RM, a11y, type pass** (~1–2 days)
P9 touch story end-to-end; full reduced-motion pass; SR layer (`role="log"` aria-label
buffer, finished text as real DOM, overlays with dialog semantics + focus return, skip
link); `?still` param (instant prints, for screenshots); **type pass C-3.4** per §3.3.
✅ **GATE C3:** Playwright mobile viewport: no autofocus (keyboard never pops), tabs +
printed buttons navigate everything mouse/touch-only, single pane enforced; RM emulation
fully static; axe passes; type-pass screenshots reviewed vs prototype; zero console errors.

**Phase N1 — exec-term-panes: pure modules** (parallel with C0)
`tree.js` (ops + limits + focusDir geometry from computed rects) and `prefix.js`
(one-shot prefix, sticky resize, expiry) + exhaustive Vitest.
✅ **GATE N1:** Vitest: split/close/zoom/resize/cycle invariants; limit refusals return
errors; close(main) refused; prefix machine table-tested incl. expiry + Esc.

**Phase N2 — exec-term-panes: pane components** (after GATE T0)
PaneGrid recursive flex, Pane chrome (title row + buttons, focus border, dim, gaps),
zoom CSS, resize transition (motion-gated), own dev harness.
✅ **GATE N2:** in the panes harness — build a 3-pane layout by simulated actions; focus
follows clicks + `^G h/j/k/l` (actions injected — no window listeners); zoom hides
siblings; resize clamps; DOM mirrors tree 1:1; zero console errors.

**Phase N3 — exec-term-panes: programs + behaviors** (~1–2 days)
Program adapters per §3.2 (replay follows `day` prop; artifact renders entity dossier
lines + media; pagers reuse BufferView), auto-split toast copy, statusbar props feed,
mobile flatten (grid renders root leaf only below breakpoint).
✅ **GATE N3:** Playwright (`e2e/terminal-panes.spec.js`, panes harness): open artifact
→ auto-split right with main LEFT + toast; `^G`-grammar drives split/close/zoom/resize
via the injected reducer; 5th pane refused with statusbar error; region roles + labels
present; zero console errors.

**Integration — exec-term-core leads, exec-term-panes on call** (~1–2 days, after C3+N3)
Wire PaneGrid into TerminalHome (main program = session buffer slot), commands'
`panes.open` goes live, prefix reducer wired into the window listener, statusbar shows
pane state. Then swap `Home.jsx`: TerminalHolding → `lazy(TerminalHome)` (holding-screen
JSX + its home.css rules removed — orphans of this change). Harnesses excluded from prod.
✅ **FINAL GATE:** on the integrated `/` — C1–C3 + N3 specs re-pass against
`/?mode=terminal`; `e2e/mode-roundtrip.spec.js`: GRAPH→TERM→GRAPH via toggle AND via
intents both ways, graph unaffected after round-trip (its own specs re-pass), terminal
keys (`j`, `1`, `^G v`) dead while graph mounted and graph keys dead while terminal
mounted (P3 both directions); terminal chunk not fetched until mode flips (network
assertion); `/` entry ≤ 180KB gz; Lighthouse `/` (graph) does not regress ≥ 90/95 and
`/?mode=terminal` ≥ 90 perf / ≥ 95 a11y; full Playwright + Vitest suites green;
**ship-check** run; Vercel **preview** deployed + URL logged. Passing = both modes
gated → doc-10 L5 launch-hold LIFTS; production flip remains Oliver's decision.

## 7 · Resume protocol (fresh agent, cold start)

1. Read this doc top to bottom. 2. Read the §CURRENT STATUS block — it names your next
task ID. 3. `git checkout redesign/terminal-v1` (create from `redesign/graph-v1` if
missing — that is task C-0.1). 4. Read only the source docs your phase cites + the
prototype files. 5. Verify the last claimed gate actually passes before building on it
(`npx playwright test`, `npx vitest run`). 6. Do the task, tick its box, update the
status block, commit (`terminal-v1(<executor>): <task-id> <summary>`).

## 8 · LIVE TASK CHECKLIST — tick as you go

### exec-term-core
- [x] **C-0.1** Branch `redesign/terminal-v1` from graph-v1; `terminal-dev.html` + `dev.jsx` harness (DEV-only vite inputs, incl. panes' harness)
- [x] **C-0.2** Screen shell: `#screen` grid 100dvh in `.sakura` dark; body never scrolls; cell-grid vars
- [x] **C-0.3** `Buffer.jsx` — `useBuffer()` + `<BufferView>` per §5; print queue; pin; pos%
- [x] **C-0.4** `lib/cadence.js` (type/print timings, RM-instant) + Vitest on cadence/queue
- [x] **C-0.5** Playwright: no-page-scroll, print/pin/clear/pos, RM-instant → **GATE T0 ✅**
- [x] **C-1.1** `Prompt.jsx` — echo + block cursor, mode indicator, history, Tab completion, refocus rules
- [x] **C-1.2** `lib/terminalModel.js` — section/artifact/beat selectors over site.js (+tests, zero hardcoded copy)
- [x] **C-1.3** `lib/commands.js` + `sections.jsx` — full command set + section renderers
- [x] **C-1.4** Boot sequence as command #1 (motd, auto-type, log frame, scramble name, CTAs)
- [x] **C-1.5** `StatusBar.jsx` — tabs, mode, %, clock (pane props stubbed)
- [x] **C-1.6** Playwright: boot/tabs/commands/content assertions → **GATE C1 ✅**
- [x] **C-2.1** Vim motions in empty prompt (`j/k`, `gg/G` + `g‥`, `1–5`, `?`), Esc cascade
- [x] **C-2.2** `lib/intents.js` wrapper (P4) + `Palette.jsx` (⌘K, suggestions) + `HelpSheet.jsx`
- [x] **C-2.3** `mode graph|term` → cancelable `'on:set-mode'` dispatch + printErr fallback
- [x] **C-2.4** Playwright: never-trap, palette, mode-dispatch, key table → **GATE C2 ✅**
- [x] **C-3.1** P9 mobile touch story (no autofocus, tap targets, palette chip, single-pane ctx)
- [x] **C-3.2** Reduced-motion full pass + `?still` param
- [x] **C-3.3** SR layer: role=log, dialog semantics, skip link; axe
- [x] **C-3.4** Type pass: Martian Mono cell-grid retune vs prototype screenshots (§3.3)
- [x] **C-3.5** Playwright: mobile/RM/axe/screenshots → **GATE C3 ✅**
- [x] **F-C.1** Vercel preview deploy of redesign/terminal-v1 (both modes at one URL); verify /api; record URL in the status header
- [x] **F-C.2** Graph focus-intent API — inbound intent surface (registry-driven) so chrome can deep-link into clusters (doc-10 Notes deviation)
- [x] **F-C.3** Top-bar Work/About/Contact links wired to that API; E2E the three links in graph mode

### exec-term-panes
- [x] **N-1.1** `panes/tree.js` — split tree ops, limits, focusDir geometry (pure)
- [x] **N-1.2** `panes/prefix.js` — prefix/resize state machine (pure)
- [x] **N-1.3** Vitest: tree + prefix exhaustive → **GATE N1 ✅**
- [x] **N-2.1** `PaneGrid.jsx`/`Pane.jsx` — nested flex, pane chrome, focus/dim, gaps (after GATE T0)
- [x] **N-2.2** Zoom (CSS), resize transition (motion-gated), panes dev harness
- [x] **N-2.3** Harness verification: 3-pane build, focus, zoom, clamps → **GATE N2 ✅**
- [x] **N-3.1** `programs.jsx` — replay / section pagers / artifact / help adapters (§3.2)
- [x] **N-3.2** Auto-split rules + toast; statusbar props ({paneCount, zoomed, prefix}); mobile flatten
- [x] **N-3.3** Playwright `terminal-panes.spec.js`: grammar, limits, a11y roles → **GATE N3 ✅**
- [x] **F-P.1** TERM↔GRAPH camera state-lift — lift live camera/focus/dossier state (module-level store) so returning to GRAPH restores where you were; never-trap detach mechanism must NOT regress (its E2E stays green). Owned files this round: `src/graph/components/GraphCanvas.jsx` + `src/graph/GraphHome.jsx` ONLY
- [x] **F-P.2** Round-trip E2E: graph → focus node + move camera → TERM → interact → GRAPH → camera/focus restored; plus reduced-motion variant

### Integration (exec-term-core leads, exec-term-panes on call)
- [x] **X-1** PaneGrid into TerminalHome: main slot, `panes.open`, prefix reducer wired, statusbar live
- [x] **X-2** `Home.jsx` swap → lazy TerminalHome; holding screen removed; harnesses out of prod build
- [x] **X-3** `e2e/mode-roundtrip.spec.js` + full suites + budgets + Lighthouse both modes
- [x] **X-4** ship-check; Vercel PREVIEW deploy; URL in status header → **FINAL GATE ✅** (lifts L5 hold)

---
*Prev: `10-graph-build-plan.md` (graph, DONE to preview). This doc is the single source
of truth for the terminal build; on conflict with 05 §3, 07, or 09, this doc wins (P1–P9).*
