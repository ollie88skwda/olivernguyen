# BRAND.md — olivernguyen.com master design system

**Status: LOCKED (2026-08-24, amended 2026-08-25 and 2026-08-26).** This file is the single source of
truth for how the site looks and moves. Every component, page, and restyle must come from here.

The 2026-08-25 amendments (D-12 … D-18) add values; they reverse nothing. The 2026-08-26 amendment
(D-29, §8) adds one name to the icon allow-list and one test for telling a glyph from an icon; §9's
blur ban was re-tested against a render in the same pass and is **upheld unchanged**.

Use these tokens. Do not invent new values. If something you need is not defined here, stop and
ask — adding a token is a decision, not an implementation detail.

- Decision history and rationale: `docs/DECISIONS.md`.
- Still open, not decided: `docs/OPEN-DECISIONS.md`. Rules for it are in `AGENTS.md` §0.
- Theme scheme — the four combinations, switching, scoping, verification: `docs/THEMES.md`.
- Colour science, contrast tables, derivations: `docs/redesign-research/04-sakura-palette.md`.
- Component inventory and token-to-file index: `docs/COMPONENTS.md`.

---

## 0. The one-line design read

> Personal site for an agent-builder. Audience: recruiters, founders, robotics and engineering people.
> Language: **operator-editorial** — terminal honesty, magazine spacing, one dyed-through palette.

**It is not:** an agency template, a SaaS landing page, a dashboard, or anything with an
AI-purple gradient.

Two interfaces over one content model:
- **TERMINAL** — the operator replay console. Mono-heavy, log-driven, vim-navigable.
- **GRAPH** — the tool-router canvas. Spatial, prompt-driven, whiteboard-warm.

---

## 1. Build targets

| Target | What ships |
|---|---|
| Phone (`< 768px` or coarse pointer) | Terminal mode scrolls natively. Graph mode renders as a **grouped list** — the React Flow chunk is never fetched. |
| Desktop (`≥ 768px` + fine pointer) | Full canvas, full terminal, keyboard model active. |

Every rule in this doc must hold in **three renders**: phone terminal, desktop terminal, desktop graph.

Hard requirements: tap targets ≥ 44px; log lines readable at 12px on a 375px screen; nothing
depends on hover alone.

---

## 2. Colour — SAKURA

One pink hue slice carries every neutral. One jade complement is rationed to "it's working".
Red and gold are the pink's warm cousins, reserved for genuine states.

**Rationing rule (60/30/10):** 60% background family · 30% text and surfaces · 10% accent.
Jade **only** for success or an actively routing edge. Gold and red **only** for real states,
never decoration. One loudest element per view, maximum.

### 2.1 Dark — "Night Plum" (terminal default)

```css
--bg:#180f14;  --surface:#1f1319;  --surface-2:#2a1b22;
--border:#3a2430;  --border-strong:#5c3a48;
--text:#f5dce6;  --text-muted:#d888a8;  --text-faint:#b0788f;
--accent:#ffb7d1;  --accent-hi:#ff6fb0;  --on-accent:#1f1319;
--success:#46b989;  --warning:#e8a94a;  --error:#e15647;  --error-hi:#ea897e;
--selection:#3a2430;
/* terminal-only */
--term-log:#d888a8;  --term-log-dim:#b0788f;  --term-prompt:#ff6fb0;
--term-active-line:#31202a;  --term-cursor:#ff6fb0;
--term-success-line:#182520;  --term-error-line:#2b1917;
```

### 2.2 Light — "Sakura Paper" (graph default)

```css
--bg:#faf1f5;  --surface:#fdf8fa;  --surface-2:#f2e2ea;  --border:#e2c9d4;
--text:#3a1e2b;  --text-muted:#6f4459;  --text-faint:#84536a;
--accent:#a83a68;  --accent-hi:#93275a;  --on-accent:#fdf8fa;
--success:#15734f;  --warning:#835b10;  --error:#b93a2c;  --selection:#f7cede;
/* graph-only */
--node-fill:#fdf8fa;  --node-border:#a97188;  --node-border-active:#a83a68;
--edge:#d9b6c4;  --routing-pulse:#15734f;  --dot-grid:#e8d3dc;
```

### 2.3 Contrast rules

Every text token clears **4.5:1** on every surface it can sit on; large display clears 3:1;
non-text UI (node borders) clears 3:1. Two known exceptions, already handled:
`--error` on `--surface-2` fails → use `--error-hi` there; dark `#8f5b70` is decorative only,
never for glyphs. Full tables in `04-sakura-palette.md` §2.3 / §3.4.
`scripts/contrast-check.mjs` is the gate — it must pass before any palette change lands.

### 2.4 Rejected

**Ink & Blossom** (warm-grey neutrals, pink as a strict 10% accent) was fully built and rendered
across four real screens in both modes, compared side by side, and **declined**. Do not
re-propose neutral-base palettes. **Night-only** (dropping the paper theme) was also declined.

---

## 3. Themes — four, not two

Mode and theme are **independent switches**. Theme does not follow mode.

**The scheme — switching, scoping, per-theme tokens, verification — lives in `docs/THEMES.md`.**
This section stays the brand statement; that file is the reference.

| Combination | Status |
|---|---|
| terminal · dark (Night Plum) | shipped |
| graph · light (Sakura Paper) | shipped |
| terminal · **light** | **shipped** 2026-08-26 (D-22) — `04-sakura-palette.md` §6.1/§6.2 |
| graph · **dark** | **shipped** 2026-08-26 (D-22) — `04-sakura-palette.md` §6.3/§6.4 |

**Derivation rule for the two new themes:** hold the hue slice, move only the ladder position.
Light terminal = plum ink on sakura paper; because it cannot lean on glow, the log leans on
hairlines and weight instead. Dark graph = the existing dark ladder with node, edge, dot-grid
and pulse values placed on it. Both carry their own contrast pass in `04-sakura-palette.md` §6 and
all four combinations are enforced by `scripts/contrast-check.mjs`.

**Switching:** the ladder is keyed off `<html data-theme="light|dark">`, the interface off
`<html data-mode="graph|terminal">` — two attributes, never one implying the other. `.sakura` with
no `data-theme` is the light ladder, so sakura UI is never token-less. Full contract and the
remaining plumbing: `docs/THEMES.md` §2 and §6.

First-visit default: follow the OS `prefers-color-scheme`; mode defaults per `05-v1-spec.md` §6.2.
An explicit user choice always wins and persists.

---

## 4. Radius

One rule, three values. Nothing else exists.

| Value | Applies to |
|---|---|
| `0` | Anything representing a **surface**: terminal panes, code blocks, log frames, node cards, dossier panels, media frames. |
| `3px` | **Controls**: buttons, inputs, chips, tokens, menu items, focus rings. |
| `999px` | **Only** the mode toggle, status pills, and the radio button (D-12). The theme toggle is **not** on this list — it is an ordinary 3px icon button (D-23). |

Mnemonic: *surfaces square, controls 3, only toggles round.* A rounded log pane is a contradiction.

**Radio buttons are the one round control (D-12).** A 3px radio reads as a checkbox and is
misclicked. Nothing else joins this exception without a decision.

**Control heights are not radius, but they are fixed here (D-12):** `40px` default, `32px` small.
On a coarse pointer **both** become `44px` per §1. Checkbox and switch are `24px` tall so an §8
icon fits inside (D-17). All are 4px-ladder rungs.

---

## 5. Spacing

4px base ladder. **Allowed steps only:** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 144`.
A 23px gap is a bug.

| Context | Value |
|---|---|
| Card / panel padding | 28 (20 on phone) |
| Row gap inside a group | 24 |
| Section gap | 144 (96 on phone) |
| Inline chip / token gap | 8 |
| Label → content | 12 |

Generous editorial by default. Density is allowed **only inside** the log and the statusline —
that contrast is what makes the density read as deliberate. Body measure caps at ~70ch;
log content column caps at ~880px.

---

## 6. Motion

Motion budget is zero-sum. Two signature moves get it; everything else is nearly instant.

| Move | Spec |
|---|---|
| **Signature 1 — terminal typing** | ~28ms/char, longer pause on punctuation and line ends. Real transcript content only. |
| **Signature 2 — graph camera** | 640ms `cubic-bezier(.16, 1, .3, 1)` on viewport moves and dossier open. |
| Everything else | 140ms `ease-out` on state change (hover, focus, active, toggle). |
| Scroll | Opacity only. No translate-up reveals, no stagger, no parallax. |

Bans: infinite loops (except the cursor blink), particles, scroll-hijack outside the one pinned
week-replay section, spring physics on ordinary UI, "premium" 400ms+ hovers.

**Every animated element sits behind `prefers-reduced-motion`**, with a static fallback carrying
the same DOM content. There is no shared hook. CSS motion is killed in one `@media` block at the
bottom of `src/styles/components.css`; JS-driven motion queries the media query itself
(`src/graph/components/GraphCanvas.jsx`).

**Infinite loops — exactly three are permitted (D-18, D-27):**
1. the terminal cursor blink;
2. the skeleton/loading pulse — **opacity only**, `1800ms`, no shimmer sweep, no transform;
3. the graph canvas's idle node shimmer — **transform only**, ±2.5 world px, 6–9.5s per cycle,
   each node on its own phase (D-27). Not a CSS animation: see `src/graph/drift.js`.

A fourth requires a decision. Shimmer sweeps stay banned.

---

## 7. Type

| Role | Face | Usage |
|---|---|---|
| **Display** | **Familjen Grotesk 700**, tracking `-0.02em` | Hero name, section heads, node titles, dossier titles, wordmark. |
| **Sans** | **Hanken Grotesk** 400/500/600 | Body copy, dossier prose, anything longer than a label. |
| **Mono — bodies** | **JetBrains Mono** 400/500 | Log lines, code blocks, transcripts, anything you read many lines of. |
| **Mono — labels** | **Martian Mono** 400/500/700, tracking `0.08–0.16em` | Labels, chips, statusline, key hints, kickers, captions. Uppercase, small. |

Familjen Grotesk replaces Big Shoulders (condensed, fought the wide mono underneath it).
Fraunces was tested and led for a round but failed the 16px favicon test. Instrument Serif,
Bodoni, Newsreader, Archivo Black, Syne, Bricolage and 30 others were reviewed on the live hero
and rejected — see `docs/DECISIONS.md` before re-opening type.

Scale: display `clamp(40px, 5.5vw, 64px)` for the hero name; section heads ~32–40px;
**dossier titles 32px, card / dialog / node titles 24px (D-12)**; body 16px/1.6;
mono bodies 13–14px/1.7; mono labels 10–11px uppercase.

---

## 8. Icons

**Glyphs, not icons.** Typographic marks set in the mono carry ~90% of the work:

```
◆ decision   → tool call   ✉ email   ▸ prompt   ✕ close   ⌘ key   ↓ scroll   · separator
┌ │ └ tree/frame
▾ down   ▴ up   ▸ right   ◂ left   ▪ bullet   … more            (added D-13)
✓ ok — TEXT AND LOG LINES ONLY, never inside a control        (added D-14)
```

The `✓` split is deliberate (D-14). In a log line or transcript every mark occupies one column of
a monospace grid, and an SVG has no column width — so text uses the character. Controls use the
icon below. `src/components/brand/glyph.jsx` names it `checkText` so a control cannot reach for it.

Real icons only where a glyph genuinely cannot work: external link, download, GitHub / LinkedIn
marks, **the checkbox / menu tick (D-13)**, **the theme toggle's sun / moon (D-23)**, and **the
pages-menu hamburger (D-29)**. `src/components/brand/icon.jsx` allow-lists `check`, `sun`, `moon`
and `menu`. Adding a name is a decision — those four are the only ones taken.

**The hamburger is an icon, not a glyph, and the reason generalises (D-29).** `☰` (U+2630) is not in
JetBrains Mono: measured in the live bar, the mono advance is 7.81px — `M`, `…` and even the .notdef
box all measure 7.81px — while `☰` measures 11.44px, i.e. a system fallback face is drawing it. A
glyph is a mark in a face we ship. **Before adding a character to `glyph.jsx`, measure its advance
against the mono's; if it does not match, it is not a glyph and it belongs in `icon.jsx`.**
When an icon is needed: **one family only** — the
project already depends on `lucide-react`; keep it, lock `strokeWidth` to `1.5`, size on an
**18px grid (`--icon`)**, `currentColor` only. Never hand-roll SVG paths. Never a decorative icon
next to a label that already says the word.

**The 1.5 stroke is not negotiable (D-17).** It is defined in the icon's own coordinate space, so
apparent thickness scales with icon size: draw an icon at the full 18px grid rather than raising
`strokeWidth`.

---

## 9. Surface and depth

- **1px hairlines** are the primary separation mechanism, in `--border`.
- **Exactly one texture layer per mode**: dot grid on the graph canvas (`--dot-grid`),
  scanline in terminal at **3%** (`.term-screen::after`, D-16). Ceiling is 6% (D-10); 3% was
  chosen on the live page — the scanline is the fastest way this aesthetic tips into costume, and
  6% bands visibly on OLED.
- **Shadows**: one exception only — the open graph dossier, and **only in light** (D-15).
  `--shadow-dossier` casts **sideways**, matching the direction the panel slides in from.
  In dark it is `none`: a shadow reads by being darker than its background, and `--bg` is already
  near-black, so five candidates were indistinguishable side by side. Dark separates the dossier
  with `--dossier-border` stepping up to `--border-strong` instead. Nothing else lifts, in
  either theme.
- Banned: glassmorphism, blurred gradient backdrops, border + shadow + glow on the same element,
  borderless floating cards.
- **Exactly one blurred surface, and this is it (D-30):** the fixed chrome bar, `blur(8px)` over
  `--chrome-veil`, **only** where `html[data-mode="graph"]` and the graph home is mounted
  (`body:has(.graph-root)`), at `min-width: 768px` and `pointer: fine`. Solid `--bg` everywhere else
  — terminal, remaining legacy routes, phone. Nothing else on the site may blur a backdrop; the rest of the ban
  above stands unchanged.
  - `--chrome-veil` is **50%** (D-32) and that is a *measured* §2.3 floor, not a taste value: over 60
    canvas states the worst composite gives `--text` 5.29:1 in graph · dark and 6.82:1 in
    graph · light. 40% fails at 4.44:1.
    **Do not make it more transparent without re-running that measurement.**
  - **Nothing muted and nothing in `--accent-hi` may sit directly on the veil.** That is what pays
    for 50%. On the veil `--accent-hi` measures 4.06–4.47:1 in graph · dark — it fails. The bar's
    labels are therefore `--text`, and nav hover is an underline rather than a colour swap (D-32).
    Adding a muted or accent label to the bar silently breaks the veil.
  - Radius stays **8px**. 12–20px measurably buy contrast headroom (a wider average pulls the
    backdrop's extremes toward `--bg`) but smear the backdrop into a flat wash, which destroys the
    only thing the effect is for.
  - Wrap any use in `@supports (backdrop-filter: …)`. A translucent bar with no blur is worse than a
    solid one.
  - D-29 rejected this on three counts and D-30 re-measured all three. Two held (invisible in
    terminal, muddy on legacy) and are the reason for the scope. The third — "it re-rasterises the
    graph canvas soft" — **did not exist**: it was the graph's 6s guided-tour autostart moving the
    camera between the two screenshots. Detail: `docs/redesign-research/15-blur-restore.md`.

---

## 10. Wordmark

`oN.c` — set in Familjen Grotesk 700, with the dot in `--accent`. Reads as a domain and as
initials at once; the dot is the same colour as the routing pulse.

- Nav: ~20px. Minimum legible size: 12px.
- Favicon / avatar: **`oN`** on `--bg`, square, 3px radius.
- Must survive monochrome and 16px. Test both before changing anything about it.

---

## 11. Working rules for agents

1. **Reference tokens, never hex.** All values live in `src/styles/sakura.css` under the
   `.sakura` scope, keyed off `<html data-theme>` (ladder) and `<html data-mode>` (interface).
   Components read `var(--token)`.
2. **Un-restyled legacy pages are frozen.** Files under `src/pages/` keep their own stylesheets
   until a restyle is explicitly scheduled (see `05-v1-spec.md` §2.3). `/college`, `/emoji`, and
   `/license` are the explicit sakura-restyle exceptions; do not bleed sakura into the rest.
3. **New surfaces mount inside `.sakura`.** Never put these tokens on `:root`.
4. **No new tokens without a decision.** If a component needs a value this doc does not define,
   raise it — then it gets added here and to `DECISIONS.md`.
5. **Verify in a real browser.** Screenshot both modes and a 375px viewport before calling any
   visual work done.
6. **Contrast gate.** `node scripts/contrast-check.mjs` must pass.

---

## 12. Quick reference

```
targets   phone: terminal + graph-as-list · desktop ≥768 fine-pointer: full canvas
colour    sakura · 60/30/10 · jade = "it worked" only
themes    4 independent combinations, all shipped · scheme in docs/THEMES.md
          data-theme = ladder · data-mode = interface
radius    0 surfaces · 3 controls · 999 toggles, pills and the radio only
controls  40 default · 32 small · both 44 on coarse pointer · 24 checkbox + switch
spacing   4px ladder · card 28 · row 24 · section 144
motion    140ms ease-out · typing 28ms/char · camera 640ms (.16,1,.3,1)
          three loops only: cursor blink + 1800ms skeleton pulse + graph shimmer
type      Familjen Grotesk 700 / Hanken Grotesk / JetBrains Mono + Martian Mono
          hero clamp(40,5.5vw,64) · section 32-40 · dossier 32 · card 24 · body 16
icons     mono glyphs first · lucide 1.5 stroke on the 18px grid when unavoidable
          ✓ is an icon in controls, a character in log text
          icon.jsx allow-list: check · sun · moon · menu (D-29) — closed
          a character not in the mono is not a glyph: measure the advance first
surface   hairlines · terminal scanline 3% · graph dot grid
          dossier shadow: sideways in light, none in dark (strong hairline instead)
          ONE blurred surface: the chrome bar, blur(8px) over --chrome-veil 50%,
          graph mode + graph home + ≥768px + fine pointer only (D-30/31/32)
          50% and 8px are both measured floors — re-measure before changing
          the bar's labels are --text, not muted, and nav hover is an underline:
          both are load-bearing for the veil's contrast (D-32)
mark      oN.c with the accent dot · favicon "oN"
```
