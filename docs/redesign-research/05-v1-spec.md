# 05 · V1 Spec — olivernguyen.com redesign

**Status: implementation-ready.** Build from this doc alone.
**Decided upstream (do not relitigate):** CRA → Vite + Tailwind v4 (02-libraries Path C).
V1 scope = home page + shared chrome. Theme = Sakura, light + dark variants
(tokens in `04-sakura-palette.md`; implementation uses the four independent theme × mode combinations).
Direction = hybrid of Overnight + Tool Router (03-concepts): **one site, two switchable modes**.

---

## 1. Concept summary

One portfolio, two renderings of the same content:

- **TERMINAL MODE (dark sakura)** — the Overnight replay console. The site presents as an
  operator session: typed transcripts, streaming log lines, the scroll-scrubbed replay of the
  week the Claude loop ran a project alone. Mono-heavy, honest (all log content is real),
  vim-navigable.
- **GRAPH MODE (light sakura)** — the Tool Router canvas. The same content as a spatial node
  graph: Oliver as the root node, projects/roles/credentials as nodes, invocations routed as
  pulses along edges. Prompt-bar driven, whiteboard-warm.

The two modes are not skins; they are two *interfaces* over one content model (§2). The pitch
is the medium: an agent builder whose site you can either **watch run** (terminal) or
**operate yourself** (graph). The mode toggle and Account → Appearance menu are persistent chrome.
Mode and theme are independent persistent controls; the four combinations and their defaults live in
`docs/THEMES.md`.

Discoverability is a first-class requirement (owner feedback): every capability reachable by
search (⌘K / `:`) is also reachable by visible, clickable UI, and vice versa. No content is
locked behind knowing what to type.

Hard bans carried from 03-concepts: no purple gradients, no glassmorphism grids, no particle
spam, no fake terminals typing canned jokes with no substance — every interactive element
does something real. Motion always gated behind `prefers-reduced-motion`.

---

## 2. Information architecture + shared content model

### 2.1 Route-level IA (v1)

```
/                → Home (mode-aware: renders TerminalHome or GraphHome)
/?mode=terminal  → forces terminal mode (and persists it)
/?mode=graph     → forces graph mode (and persists it)
all other routes → existing pages wrapped in new shared chrome (§6.4); approved restyle lanes may
  move individual pages onto sakura without changing route behavior
```

No new user-facing routes are required by the home redesign. React Router v5 stays untouched.
`Routes.js` keeps its `Switch`; the shared `SiteChrome` and `Home` change, while explicit restyle
lanes may update individual page surfaces. The restored `/mom` and `/mum` aliases remain legacy
chrome opt-outs; dev-only `/_components` is registered separately.

### 2.2 Single source of truth: `src/content/site.js`

Both modes render from **one content module**. Nothing in either mode hardcodes project
copy, stats, or intents. Plain JS module (not fetched JSON — no loading state, tree-shakes,
allows JSX-free rich fields as strings). Schema:

```js
export const site = {
  meta: {
    name: "Oliver Nguyen",
    email: "oliverdnguyen@gmail.com",
    tagline: "I build LLM agents. One ran a project alone for a week.",
    location: "California",
    links: { github, linkedin, resume },        // urls
  },

  // Every content unit is an entity. Both modes iterate this array.
  entities: [
    {
      id: "operator",                            // stable slug, used by intents & URLs
      kind: "project",                           // project | role | credential | page
      title: "Voice / Operator",
      type: "Autonomous Claude Code loop",       // the wh-type line
      status: "Ran 7 days",
      blurb: "...",                              // 2-3 sentences, from current home.js
      tech: ["Claude Code", "Python", "LaunchAgent"],
      stats: [{ label: "decision entries", value: 257 }, ...],
      link: null,                                // or { href, label }
      media: null,                               // or { kind: "img"|"video", src, alt, poster }
      terminal: {                                // terminal-mode rendering hints
        section: 2,                              // which numbered section owns it
        artifactHead: "decisions.html · operator log",
        artifactLines: ["257 decision entries", ...],
      },
      graph: {                                   // graph-mode rendering hints
        group: "agents",                         // agents | robotics | leadership | pages | contact
        edges: ["mac-agent"],                    // extra edges beyond root→node
        cluster: "week-ring",                    // optional special renderer (operator only)
        position: { x, y },                      // hand-tuned layout seed (§4.2)
      },
    },
    // ...mac-agent, scopecreep, articlewriter, robotics (kind: role),
    //    virtual-enterprise (role), eagle-scout (credential), timeline nodes, etc.
  ],

  // The operator week, curated into replayable beats. Powers the terminal
  // scrub section AND the graph week-ring cluster.
  week: [
    { day: 1, date: "2026-05-21",
      beats: [
        { t: "06:12", kind: "decision", n: 141, text: "..." },   // kind: decision | tool | email
        ...
      ],
      morningEmail: { subject: "...", excerpt: "..." },          // day-boundary email
    },
    // days 2..7 — target ~30 beats total across the week (03-concepts §1.8)
  ],

  // The intent registry. ONE list powers ⌘K, the `:` command line, the graph
  // prompt bar, and proactive suggestion chips. (§5.3)
  intents: [
    {
      id: "show-operator",
      label: "Replay the week-long loop",         // ⌘K row text
      phrases: ["week", "loop", "operator", "what ran for a week", "day"],
      ex: ["week", "day"],                        // `:week`, `:day 4` (args allowed)
      run: { type: "goto", target: "operator" },  // goto | mode | day | external | copy-email
      suggest: true,                              // eligible for proactive suggestion chips
    },
    // ~15 total: one per entity group, contact, resume, mode switches,
    //   "day N" jumps, "toggle hints", "guided tour" (graph)
  ],
};
```

**Adapter rule:** each mode has a thin selector file (`terminalModel.js`, `graphModel.js`)
that derives its view-model from `site` — modes never import each other, never duplicate copy.
Adding a project = adding one entity object; both modes pick it up.

### 2.3 Future public-page mapping (owner requirement c)

How the currently-text-only public pages will be represented **later** in each mode. V1 ships
them under the new chrome; route-specific restyles are recorded in their coverage documents.
`/sat-resources` now uses its intentional Sakura empty state. The table remains the committed
direction for later page content; pages represented in v1 get an `entities[]` stub with
`kind: "page"` so both modes can link to them.

| Route | Content today | Terminal treatment (later) | Graph treatment (later) | Phase |
|---|---|---|---|---|
| `/pull` | AU tournament scheduler with Supabase-backed weekend commitments | `man pull` — man-page layout: NAME/SYNOPSIS/DESCRIPTION headers in mono, sakura-dark | node in a `utilities` cluster; dossier opens the page inline | v1: link stub · Sakura surface shipped in its explicit restyle lane |
| `/permit` | driving-permit notes | `man permit` man page; checklist items as numbered log lines | node under `guides` cluster, edge to `/license` | v1: stub · v1.2; Sakura surface shipped in its explicit restyle lane |
| `/license` | driver's-license notes | `man license`, cross-linked in SEE ALSO ↔ permit | node under `guides`, edge to `/permit` | v1: stub · v1.2 |
| `/sat-resources` | intentional empty state (`Coming soon`) | `ls sat/` directory listing; each resource a file row with description | `guides` cluster node; resources as leaf sub-nodes | v1: stub · v1.2 |
| `/sat-signup` | informational placeholder; signup form planned | future form kept as-is inside terminal chrome (forms never fake-terminalized) | leaf node linking out | v1: placeholder · form later, low priority |
| `/articlewriter` | project archive page | `man articlewriter` + real pipeline output image | already a project node in v1 graph; dossier links here | v1: linked from entity · sakura restyle shipped in its explicit lane |
| `/emoji` | toy page | standalone fishbowl toy on the Sakura ladder | not represented | restyled in the emoji lane |
| `/college` (+ gated children) | hub for private tools | sakura hub with placeholder copy, gate badges, and links; auth flows unchanged | same page in both modes; theme and mode remain independent | shipped in the `/college` restyle lane |
| `/sign-in`, `/studio`, `/transfer`, `/major`, `/apply` | private/gated | not represented (never in public index) | not represented | never |
| `/be-my-girlfriend` | full-bleed, own art | opts out of chrome (today's `NO_CHROME` behavior preserved) | not represented | never |
| `/mom`, `/mum` | personal mobile page; `/mom` is canonical | opts out of chrome; aliases share the restored page | not represented | never |

Note: the current sidebar links to `/debt`, which has no route in `Routes.js` (404s). Drop it
from the new chrome nav; flag to owner rather than silently re-adding.

---

## 3. Terminal mode — section-by-section spec

Layout: single scrolling column, max-width ~880px for log content, full-bleed dark
(`sakura.dark.bg`). Persistent **status bar** pinned to viewport bottom (§5.5). All body/log
text in mono (JetBrains Mono; Berkeley Mono if licensed later); display headlines use Familjen
Grotesk per `BRAND.md` §7. Accent = `sakura.dark.accent` (the pink/blossom accent from 04 replaces
03's amber — sakura discipline: accent only on live/active states).

Sections are numbered `[1]`..`[5]` in the UI; numbers are the vim jump targets (§5.4) and
appear in a persistent **index rail** (§3.7) — the browse path.

### 3.1 `[1]` Boot / hero (viewport-height)

- Session header line, real data: `oliver@on.c · session start · <live local time PT>`.
- Magic UI `Terminal` types a curated real transcript (~6 lines, ~3.5s total):
  `operator loop · day 3 · 06:12 — decision #141 logged`, one tool-call line, one
  morning-email line. Content pulled from `site.week`, not hand-typed strings.
- Then the name renders huge — React Bits `DecryptedText` (scramble → "Oliver Nguyen")
  in display type, followed by static subline: `site.meta.tagline`.
- Behind: `FlickeringGrid` texture at opacity ≤ 0.06, sakura-dark tinted. No particles.
- One visible CTA row: `[ replay the week ↓ ]` (scrolls to §3.3) · `[ ⌘K ]` chip ·
  `[ switch to graph mode ]` text link. All three are the discoverability surface —
  a visitor who never types sees exactly where to go.
- `prefers-reduced-motion`: transcript renders fully pre-typed, name renders without
  scramble, grid static.
- Skip-links: first focusable element is `Skip to index`.

### 3.2 First-visit hint toast (once per browser)

- 4s after load, a Sonner toast bottom-right: “Browse with the index, search with ⌘K,
  or use vim keys — hints in the bar below.” Dismiss stores `on.hintToast=1` in
  localStorage. Never shown again. This is the guided-entry moment for people who
  “don’t know what to search” (owner concern a).

### 3.3 `[2]` The Week — replay scrub (signature section)

- The pinned scroll-scrub from 03-concepts Direction 1, built with Motion
  `useScroll` + `useTransform` on a sticky container (no GSAP needed):
  - Section pins at `top top`. Scroll progress 0→1 maps to day 1→7.
  - Left rail: day ticker (`DAY 3 / 7`, Magic UI `NumberTicker` on the digit) +
    date + a 7-segment progress spine.
  - Main panel: beats for the active day stream in (staggered opacity/translate,
    ≤ 8 beats visible; older lines dim). Beat kinds get glyphs: `◆ decision`,
    `→ tool`, `✉ email`.
  - Day boundaries: the morning email composes as a small framed block
    (`TypingAnimation` on subject line only).
- Data: entirely from `site.week`. Zero hardcoded log lines in components.
- **Mobile / reduced-motion fallback (load-bearing, not optional):** section unpins
  and renders as a plain vertical day-by-day list of the same beats. Breakpoint
  < 768px OR `prefers-reduced-motion` OR pointer: coarse → fallback. Same DOM
  content both ways (SEO/AT parity).
- Scrub interop with vim keys: `:day 4` and the ⌘K “jump to day” intent scroll the
  container to the mapped progress offset.

### 3.4 `[3]` Toolbox — the other three projects

Rendered as a **tool registry listing**, header `tools/ · 4 registered`:

- One row per project entity (mac-agent, scopecreep, articlewriter — operator gets a
  one-line row here too, linking back up to `[2]`).
- Row anatomy: index (`01`), title, type, status chip, blurb (2 lines), tech tokens,
  link. Hover/focus: `BorderBeam` glow (sakura accent) + the entity's
  `terminal.artifactLines` slide out as a right-hand “sample invocation” panel — on
  mac-agent this is the real MCP tool list; an `AnimatedBeam` fires from row to panel.
- Articlewriter row includes its real composited image (`media`), framed as
  `output.png` with a mono caption.
- All rows are plain DOM lists (`<article>`), keyboard-focusable, screen-reader
  complete without hover.

### 3.5 `[4]` Operator — the human

Header: `$ whoami`. Content from role/credential entities:

- Short bio paragraph (current about-lead copy, trimmed).
- The chronology (2020 → 2027) as a compact log: `2023 · TechX Robotics — mentor & coach
  · 15+ students · Worlds-qualified team`. Reuses the existing signal-path content,
  restyled as log lines with the accent on `Now`.
- Stats strip: the real numbers (15+ students, 17 awards, 4× states, Eagle Scout,
  1540 SAT, 4.0 UW) as mono tokens, `NumberTicker` on view, one row, no bars.
- Photo: `oliver.jpg` framed as `fig01.jpg` with mono caption. Static.

### 3.6 `[5]` Contact — open channel

- Header: `$ contact --open`.
- Big display-type line (“LET'S BUILD SOMETHING.” equivalent, re-copywritten in 04's
  type system), then the email as the primary CTA — existing `MagneticButton` behavior
  replaced by Motion Primitives `Magnetic` + copy-to-clipboard with Sonner confirm.
- Secondary: GitHub / LinkedIn / Resume as plain links.
- Footer: `session end · © 2026 Oliver Nguyen · oN.c REV 2027` + mode toggle repeat.

### 3.7 Index rail (browse path, terminal)

- Desktop ≥ 1100px: a fixed left rail listing `[1] boot · [2] the week · [3] tools ·
  [4] whoami · [5] contact`, active section highlighted (IntersectionObserver).
  Every entry clickable. This is the visible TOC that makes terminal mode navigable
  with zero keyboard knowledge.
- < 1100px: rail collapses into the top-bar menu (§6.4).

---

## 4. Graph mode — section-by-section spec

Graph mode is one full-viewport canvas, not a scrolling page. Light sakura
(`sakura.light.bg`), fine `DotGrid` background, ink-dark nodes, accent reserved for
“currently routing” pulses.

### 4.1 Stage and chrome

- **React Flow (`@xyflow/react`)** owns the canvas: pan (drag), zoom (wheel/pinch),
  `fitView` on load. Nodes NOT user-draggable in v1 (layout is authored); canvas pan
  only. `panOnScroll` enabled so wheel = pan (no page scroll exists in graph mode).
- **Prompt bar** docked bottom-center: cmdk instance (same intent registry, §5.3),
  rotating typewriter placeholder (`try: "replay the week-long loop"` → `try: "show
  robotics"` → …). Always visible — it is the hero CTA of this mode.
- **Legend / mini-index** top-left card: the five groups (Agents · Robotics ·
  Leadership · Pages · Contact) as clickable chips → camera flies to that cluster.
  Plus `Reset view` and `Guided tour` buttons. This card is graph mode's browse path
  and is never hidden on desktop.
- **Guided tour**: a `Motion.animate()`-sequenced camera path (root → operator ring →
  projects → robotics → contact), ~35s, each stop opening the dossier for 4s.
  Autostarts ONLY if the visitor hasn't interacted within 6s of load (any pointer/key
  cancels). Also triggerable via button / `:tour`. Reduced-motion: tour button opens
  a plain ordered list overlay of the same stops instead of animating.

### 4.2 Graph structure

- **Root node**: “Oliver Nguyen” in display type, center. Sub-line: tagline.
- **First-level group nodes** (5): agents, robotics, leadership, pages, contact.
  Edges root→group draw in on load via SVG `pathLength` animation, group nodes bloom
  with springs (Motion), 100ms stagger.
- **Leaf nodes** per entity (`graph.group` decides parent). Node card: title +
  kind glyph + 1-line meta. Custom React Flow node components (this is expected
  React Flow usage, not a fork).
- **Operator = the week-ring cluster**: 7 day-nodes in a ring around the operator
  node. Invoking it (click or intent) routes a pulse through all seven in sequence,
  each flashing its top beat (`week[n].beats[0]`).
- Layout: hand-authored positions in `graph.position` (deterministic, tuned once in
  dev with React Flow's dev tools). No auto-layout lib in v1 — 15-ish nodes don't
  need dagre/elk.

### 4.3 Dossiers (node detail)

- Click node (or intent) → camera eases node toward center-left, node morphs via
  Motion `layoutId` into a dossier panel (right third of viewport on desktop):
  title, blurb, stats (`NumberTicker`), tech tokens, media, link, and — where the
  entity has one — a **live micro-invocation**:
  - scopecreep: its lexicon run on one sample sentence, highlighting matched phrases
    (pure JS port of the real categories, ~40 lines, honest “0 LLM calls” caption).
  - mac-agent: MCP tool names as sub-rows lighting in sequence.
  - operator: “replay day N” buttons that fire the ring pulse.
- Close: `Esc`, ✕ button, or clicking canvas. Focus is trapped inside the open
  dossier (it's a dialog — shadcn `Dialog` semantics with custom presentation)
  and returned to the node on close.

### 4.4 Pulses and edges

- Invoking any intent that targets a node animates a bead-pulse routed along the
  edge path root→group→node (React Flow animated-edge with a custom sakura-accent
  bead; visual language borrowed from Magic UI `AnimatedBeam`). `ClickSpark` confirms
  arrival. Reduced-motion: pulse replaced by an instant highlight of the path.

### 4.5 Graph mode on mobile (< 768px or coarse pointer)

Spatial canvas is not shipped to phones (03-concepts risk note). Graph mode on mobile
renders the **dossier list fallback**: the same entities grouped under the five group
headers as a clean vertical list, light sakura theme, prompt bar becomes the standard
⌘K trigger button. The mode toggle still works — mobile users get terminal (scrolling,
excellent on phones) or graph-as-list. The canvas mounts only at ≥ 768px + fine pointer.

---

## 5. Navigation, search, and keyboard model

The three paths — **browse** (visible UI), **search** (⌘K), **keyboard** (vim) — are
peers. One intent registry (§2.2 `site.intents`) powers all three; adding an intent
automatically surfaces it in ⌘K rows, `:` completions, and suggestion chips.

### 5.1 Browse path (no knowledge required)

- Top bar (§6.4): logo, plain links (Work · About · Contact — scroll/fly to the
  matching section/cluster in the active mode), mode toggle, Account → Appearance menu (Light /
  Dark), and the ⌘K button (labeled “Search ⌘K”, not icon-only).
- Terminal: index rail (§3.7) + in-page CTAs. Graph: legend card + guided tour +
  every node clickable. Everything reachable by mouse alone — acceptance test in §9.

### 5.2 ⌘K palette (search path)

- **cmdk** via shadcn `Command` + `Dialog`. Open: `⌘K` / `Ctrl+K`, the top-bar
  button, or `/` shortcut… no — `/` is vim search (§5.4); ⌘K keeps `⌘K` and button only.
- Rows = intents, grouped: **Jump** (sections/nodes), **Replay** (day 1–7), **Mode**
  (terminal/graph, hints on/off, tour), **Contact** (email copy, resume, GitHub).
- Fuzzy matching over `label + phrases` (cmdk built-in scorer is sufficient; no fuse.js).
- **Proactive suggestions (owner concern a):** when opened with an empty query, the
  palette shows a “Try” group of 4 `suggest: true` intents, rotated per open. The
  closed-state affordances (terminal hero `[ ⌘K ]` chip, graph prompt-bar rotating
  placeholder) advertise concrete example queries so nobody faces a blank box.
- Executing an intent closes the palette, runs the action, and — in graph mode —
  routes the visible pulse (§4.4) so search *demonstrates* the site's metaphor.

### 5.3 Intent actions (exhaustive v1 list)

| Intent | ⌘K label | `:` alias | Action |
|---|---|---|---|
| goto section/cluster ×5 | “Go to Work” etc. | `:work` `:about` `:contact` `:boot` `:tools` | scroll (terminal) / camera fly + dossier (graph) |
| project jump ×4 | “Open ScopeCreep Notary” etc. | `:scopecreep` etc. | as above, opens dossier in graph |
| replay day N | “Replay day 4” | `:day 4` | scrub to day (terminal) / ring pulse (graph) |
| week replay | “Replay the week” | `:week` | goto operator section/cluster |
| mode switch | “Switch to graph/terminal mode” | `:mode graph` `:mode term` | §6 toggle |
| theme note | — | — | (theme is an independent Account → Appearance control; see `docs/THEMES.md`) |
| guided tour | “Start the guided tour” | `:tour` | graph tour; in terminal, switches to graph then tours |
| copy email | “Copy my email” | `:email` | clipboard + Sonner toast |
| resume / github / linkedin | “Open resume” | `:resume` | external |
| hints toggle | “Hide/show key hints” | `:hints` | §5.5 |
| help | “Keyboard help” | `:help` | opens shortcut sheet dialog |

### 5.4 Vim keybindings (owner requirement b)

**Not** `@replit/codemirror-vim` — that is an editor-buffer engine (see
`src/pages/essay_studio/room/vimCommands.js`; its display-line remapping problem
doesn't exist here because we scroll a page, not a buffer). The site gets a small
custom key state machine, `src/keyboard/vimEngine.js` (~180 LOC), that reproduces the
*feel*. The essay studio's engine stays untouched.

Bindings (both modes unless noted):

| Keys | Terminal mode | Graph mode |
|---|---|---|
| `j` / `k` | smooth scroll ±120px (via Lenis `scrollTo`) | pan canvas ±120px vertically |
| `d` / `u` | half-page down/up | pan half-viewport |
| `gg` / `G` | jump to top / to contact | fit-view root / fly to contact node |
| `1`–`5` | jump to section [n] | fly to group cluster n (legend order) |
| `/` | open in-page search: filters visible log lines/rows, `n`/`N` cycle matches | opens node filter: matching nodes highlight, others dim; `n`/`N` cycle |
| `:` | command line (§5.4.1) | same |
| `Esc` | close search/command line/dialog | close dossier/search/command line |
| `?` | shortcut help sheet | same |

**5.4.1 The `:` command line** — a single-line input sliding up from the status bar
(mirrors CodeMirror's vim panel styling from `ProseEditor.js` for cross-site
consistency). It resolves against intent `ex` aliases with prefix completion and an
inline ghost suggestion; `Enter` runs, `Esc` cancels. Unknown command → shake + `E492:
not a command` in the status bar (the one joke we allow, because the command line is real).

**5.4.2 Never-trap rules (hard requirements):**

- Engine binds ONE `keydown` listener on `window`. It returns immediately (no
  `preventDefault`) when: `e.target` is input/textarea/contenteditable/`[role=dialog]`
  form fields; any of `metaKey/ctrlKey/altKey` is held (except the ⌘K combo, handled
  separately); or the key isn't in the binding table.
- Native scrolling is never removed: space, arrows, PageUp/Down, Home/End, scrollbar,
  and wheel all keep default behavior. Vim keys are additive.
- Multi-key states (`g` pending, count pending, `/` and `:` modes) auto-expire after
  1200ms and are shown in the status bar (`g‥`), so a half-typed chord never eats
  future keys silently.
- Focus is never programmatically moved by motions; `/` and `:` focus their input and
  restore focus on close. Tab order is untouched.
- The engine unmounts entirely on remaining legacy routes and inside `/studio` (which has its
  own vim).

### 5.5 Status/hint bar (non-vim visitors are never lost)

- Terminal mode: a one-line bar fixed to viewport bottom, styled like a vim statusline:
  left `-- NORMAL --`-style mode indicator (search/command states change it), center
  contextual hints — default: `j/k scroll · 1-5 jump · / search · : commands · ⌘K
  everything · ? help`, right: active section + local time.
- Graph mode: same bar, hints adapted (`click any node · j/k pan · / filter · ⌘K`),
  sits above the prompt bar (prompt bar docks bottom-center, hint bar full-width
  beneath — 8px stack).
- Dismissible (`:hints` / ⌘K “Hide key hints” / an ✕ at the bar's right); state in
  localStorage `on.hints`. When hidden, a small `?` pill remains bottom-right.
- On mobile: replaced by a static one-liner in the footer (no key hints — no keyboard).

---

## 6. Mode toggle + theming

### 6.1 Toggle placement

Top bar, right side, always visible in both modes: a two-position switch labeled `TERM | GRAPH`
(text, not icons — discoverability). Its thumb uses the 140ms state transition and jumps under
reduced motion. The top-bar control is the visible mode switch; keyboard intents provide the other
path.

### 6.2 Resolution order + persistence

```
1. URL param  ?mode=terminal|graph   → wins, and writes localStorage (shareable links)
2. localStorage on.mode              → returning visitors
3. Fallback                          → graph
```

Toggling writes `on.mode` and updates the URL param via `history.replaceState` (no
router navigation, no scroll reset). The selected interface remounts and owns its own view state;
theme state remains independent.

### 6.3 Theming mechanics

The implemented theme and mode contract is owned by `docs/THEMES.md`: `data-theme` selects the
palette ladder, `data-mode` selects the interface, and the two providers never derive one from the
other. Sakura tokens live under `.sakura`; components reference token variables rather than hexes.

### 6.4 Shared chrome (v1 scope)

Replaces `top_bar.js` on all chromed routes:

- **Top bar**: logo `oN.c` · links Work/About/Contact (on `/`, mode-aware jumps; on
  remaining legacy routes, plain links to `/#work` etc.) · mode toggle · Account → Appearance
  menu (Light / Dark) · `Search ⌘K` button · hamburger for the pages menu (Pull, College, Driving,
  SAT — current sidebar content minus dead `/debt`). Hide-on-scroll-down behavior kept, rebuilt with
  Motion.
- **Remaining legacy routes** render inside the chrome with sakura tokens applied to chrome only;
  page bodies keep their existing stylesheets. Explicit restyle lanes are the exception; their
  current list and status live in `docs/redesign-research/16-legacy-restyle.md`. Grain overlay
  retired; `ScrollProgress` remains unmounted.
- `NO_CHROME` list behavior is preserved, including the restored `/mom` and `/mum` aliases.

---

## 7. Component sourcing map

Registries assume Vite + Tailwind v4 + shadcn CLI initialized (02-libraries Path C).
“Custom” = code we own; LOC are rough targets, not padding allowances.

| Element | Source — exact component | Custom? |
|---|---|---|
| Structural UI: Dialog, Tooltip, Toast, Badge, Separator | **shadcn/ui**: `dialog`, `tooltip`, `sonner`, `badge`, `separator` | no |
| ⌘K palette | **cmdk** via shadcn `command` + `dialog` | wire-up ~40 LOC |
| Smooth scroll (terminal) | **Lenis** `lenis/react`, `<ReactLenis root>`; `data-lenis-prevent` on legacy + studio routes | no |
| Icons | **lucide-react** | no |
| Hero typed transcript | **Magic UI `Terminal`** | no |
| Name scramble reveal | **React Bits `DecryptedText`** (Tailwind variant) | no |
| Hero dim texture | **Magic UI `FlickeringGrid`** (opacity ≤ 0.06) | no |
| Week scrub pin | **Motion** `useScroll` + `useTransform` + sticky container | scrub wiring ~150 LOC |
| Day/stat counters | **Magic UI `NumberTicker`** | no |
| Morning-email typing | **Magic UI `TypingAnimation`** (subject line only) | no |
| Tool-row hover glow | **Magic UI `BorderBeam`** | no |
| Row→panel invocation beam | **Magic UI `AnimatedBeam`** | no |
| Reveals on view | **Motion Primitives `In View`** (replaces hand-rolled `Reveal`/`WordReveal`) | no |
| Magnetic contact CTA | **Motion Primitives `Magnetic`** (replaces `MagneticButton`) | no |
| Scroll progress (terminal) | **Motion Primitives `Scroll Progress`** (replaces `ScrollProgress`) | no |
| Graph canvas, nodes, edges, viewport | **React Flow `@xyflow/react`** | custom node/edge components ~200 LOC |
| Edge bead-pulse | React Flow animated edge, custom bead styled after **Magic UI `AnimatedBeam`** | ~60 LOC |
| Dossier morph | **Motion `layoutId`** shared layout | dossier panel ~150 LOC |
| Dot-grid canvas bg | **React Bits `DotGrid`** | no |
| Node hover spring | **React Bits `Magnet`** (subtle) + Motion springs | no |
| Invocation spark | **React Bits `ClickSpark`** | no |
| Prompt bar (graph) | **cmdk** (same instance, inline render) + **Magic UI `TypingAnimation`** placeholder | ~60 LOC |
| Guided tour | **Motion `animate()`** sequencing React Flow's `setViewport` | ~120 LOC |
| Vim engine + status bar | — | **custom ~180 + ~80 LOC** (`src/keyboard/vimEngine.js`, `HintBar`) |
| `:` command line | — | **custom ~90 LOC** (resolves intent registry) |
| Intent registry + router | — | **custom ~120 LOC** (`src/intents/`) |
| Mode manager (resolution, persistence, URL sync, data-mode) | — | **custom ~80 LOC** (`src/mode/ModeProvider.js`) |
| Content model + adapters | — | **custom ~250 LOC** (mostly data, §2.2) |
| ScopeCreep live lexicon demo | — | **custom ~40 LOC** |
| Top bar rebuild | shadcn primitives + Motion | ~120 LOC |

Custom total: ≈ 1,550 LOC owned code (plus content). Everything else is registry-sourced.
Explicitly **not** used in v1: GSAP (Motion covers the one pinned section), three.js/R3F,
tsParticles, Spline/Rive/Lottie, fuse.js, auto-layout libs.

---

## 8. Mobile + accessibility strategy

### Mobile (< 768px or coarse pointer)

- Terminal mode is the mobile-primary experience: single column, week section unpinned
  to a static day list (§3.3), index rail → top-bar menu, hint bar → footer line,
  tap targets ≥ 44px.
- Graph mode = dossier list fallback (§4.5); no canvas is mounted, no React Flow JS
  executed (lazy `import()` gated on viewport + pointer media queries).
- ⌘K palette renders as a bottom sheet (shadcn `Drawer`/Vaul) with the same intents;
  the top-bar Search button is the trigger.
- Performance budget: route JS for `/` ≤ 180KB gz in terminal mode; React Flow chunk
  loads only when graph mode actually mounts. Test on a mid-range Android
  (01-landscape §5), not just desktop Safari.

### Accessibility

- **Reduced motion**: every animated element in §3/§4 lists its fallback; CI check =
  grep that every Motion component in `src/home/` sits behind the shared
  `useMotionSafe()` hook (wraps `useReducedMotion`).
- **Keyboard**: full site operable with Tab/Enter/Esc alone — vim keys are additive
  (§5.4.2). Focus rings on all interactive elements (Tailwind `focus-visible` tokens
  from 04). Dossier/⌘K trap focus correctly (Radix handles it); nothing else traps.
- **Screen readers**: graph canvas gets `role="application"` with an `aria-label`
  summary AND an off-screen DOM list of all entities/links (the same fallback list
  the mobile view uses, rendered visually-hidden on desktop — canvas content is
  invisible to AT, 01-landscape §5). Terminal typed content: the finished transcript
  exists as real DOM text; the typing animation is `aria-hidden` with the full text in
  an adjacent visually-hidden block until typing completes. Scrambled/split text uses
  container `aria-label` + `aria-hidden` spans.
- **Live regions**: log-stream beats in the week scrub are `aria-live="off"` (scrub is
  visual; the full week is readable in document order). Sonner toasts announce politely.
- **Contrast**: all sakura token pairs must pass WCAG AA (4.5:1 body, 3:1 large) — this
  is an acceptance gate on 04's palette, checked with a script in Phase 1.
- **Landmarks**: `<header> <nav> <main> <footer>`, one `<h1>` per mode, sections as
  `<section aria-labelledby>`.

---

## 9. Phased build plan with done-gates

Each phase ends at a verifiable gate. No phase starts before the previous gate passes.
Run `ship-check` at every UI-facing gate.

**Phase 0 — Vite + Tailwind v4 migration (~1–2 days)**
Per 02-libraries Path C: Vite + `@vitejs/plugin-react` (.js-as-JSX config), root
`index.html`, env vars (incl. the dynamic `process.env.REACT_APP_` access), Jest→Vitest
(3 test files), `vercel.json` build/output, `@tailwindcss/vite`, `shadcn init`.
✅ **Gate:** all routes in `src/Routes.js` are E2E-clicked in a real browser (Playwright) —
sign-in flow, passphrase gates, essay studio editor + vim, `/api` functions on a Vercel preview.
Existing tests green under Vitest. No visual regressions on remaining legacy pages.

**Phase 1 — Foundations: tokens, content model, chrome (~2 days)**
Sakura tokens from 04 as CSS variables under `.sakura`, keyed by `data-theme` and `data-mode`;
contrast-check script; content model `src/content/site.js` fully populated (pending §10 content);
`ModeProvider` (resolution order §6.2); new top bar + mode toggle mounted on all chromed routes;
remaining legacy pages verified under new chrome.
✅ **Gate:** toggling mode swaps `data-mode` + persists + syncs URL param on `/`;
`?mode=graph` link opens graph placeholder; contrast script passes; Playwright chrome
test covers `/pull`, `/permit`, and `/college`; `/articlewriter` has its own lane gate.

**Phase 2 — Terminal mode (~3–4 days)**
Sections [1]–[5] per §3, mobile fallbacks included. Registry components installed via
shadcn CLI. `Reveal`/`WordReveal`/`TiltCard`/`MagneticButton`/`Marquee`/`ScrollProgress`
usages on home replaced (components left in place for remaining legacy pages — flag, don't delete).
✅ **Gate:** Playwright: scrub maps scroll→day 1..7 correctly; mobile viewport renders
unpinned list; reduced-motion emulation renders all static fallbacks; Lighthouse on `/`
≥ 90 perf / ≥ 95 a11y (mobile emulation); mouse-only walkthrough reaches every section
and CTA.

**Phase 3 — Intents, ⌘K, vim engine, hint bar (~2–3 days)**
Intent registry + all §5.3 intents; ⌘K palette + proactive suggestions; vim engine +
`/` search + `:` command line + status bar; first-visit toast.
✅ **Gate:** Playwright: every intent runs from both ⌘K and `:`; typing `j` inside the
⌘K input types the letter (no motion — the never-trap test); space/arrows/PageDown
still natively scroll; `gg`/`G`/`1-5`/`/`+`n` behave per table; engine absent on
`/studio` and remaining legacy routes; `?` opens help sheet.

**Phase 4 — Graph mode (~3–4 days)**
React Flow stage, authored layout, custom nodes/edges, dossiers with layoutId morph,
week-ring pulse, prompt bar, legend, guided tour, mobile list fallback, lazy chunking.
✅ **Gate:** Playwright: every entity reachable by click alone (crawl the legend +
nodes); intent from prompt bar routes a visible pulse and opens the dossier; tour
autostarts at 6s idle and cancels on input; mobile viewport gets the list, and the
React Flow chunk is NOT fetched (network assertion); mode switch preserves active
entity both directions.

**Phase 5 — Polish + ship (~2 days)**
Cross-mode QA, AT pass (VoiceOver walkthrough of both modes), perf budget check on
throttled mobile, copy pass, `resume.pdf` freshness, OG/meta per mode-agnostic
description, 404 page chrome.
✅ **Gate:** full `ship-check`; Lighthouse both modes ≥ 90/95; a human who has never
seen the site completes “find what ran for a week, then contact Oliver” in both modes,
mouse-only and keyboard-only, without help.

Total: ~13–17 working days.

---

## 10. Content-gathering checklist (owner tasks, needed by Phase 1–2)

- [ ] **Operator week curation (blocking, biggest item):** select ~30 publishable beats
      from the 257-entry decisions log across all 7 days (4–5/day), each ≤ 140 chars;
      redact anything private; pick 2 morning-email subject+excerpt pairs. Owner must
      approve every excerpt that ships (it's real log data).
- [ ] Hero transcript: choose the ~6 lines for the boot sequence (subset of the above).
- [ ] Confirm public stats: 257 decisions, 7 days, dates 2026-05-21→27; 15+ students,
      17 awards, 4× states, Worlds qualification wording; 1540 SAT / 4.0 UW staying public.
- [ ] Mac-Agent: confirm the 8 MCP tool names currently on the site are OK to keep public.
- [ ] ScopeCreep: one sample client sentence + which lexicon categories it trips (for
      the live demo), confirmed against the real extension.
- [ ] Articlewriter composited image: keep current, or supply a higher-res export.
- [ ] Blurb copy review for all four projects + bio (reuse current home.js copy as base).
- [ ] Resume PDF current? GitHub/LinkedIn URLs current?
- [ ] Decide the `/debt` sidebar dead link (drop, or build the page later).
- [ ] 04 palette sign-off (both variants) before Phase 1 ends.
- [ ] Optional, later phases: screen-capture videos of ScopeCreep + Mac-Agent for
      dossier media (v1 ships without video; slots exist in `media`).

---

## 11. Open questions (max 3 — everything else in this doc is decided or stated as a recommendation)

1. **Log privacy line:** the week replay only works with real excerpts. Is the owner
   comfortable publishing verbatim decision-log lines (with redaction), or must they be
   paraphrased? Paraphrase weakens the “only he has the log” claim — owner's call, not ours.
2. **First-visit default when the OS gives no signal** (§6.2 recommends
   prefers-color-scheme steering; some browsers report light for everyone): if the owner
   wants ONE canonical first impression regardless of OS — terminal or graph? Recommendation
   on file is “follow OS, mobile→terminal,” but a single-default policy is equally defensible
   and only he can weigh which mode is the flagship.
3. **v1 launch bar if the schedule slips:** ship terminal-only (graph behind the toggle as
   “coming soon”) or hold launch until both modes pass Phase 4? This trades launch date
   against the two-mode concept being the announcement — owner's priority call.

---

*Prev: `04-sakura-palette.md` (tokens, in progress). Build starts at Phase 0 upon owner
sign-off on §10 blocking items and §11.*
