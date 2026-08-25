# DECISIONS.md — olivernguyen.com

Append-only log of decisions that outlive a single task. Newest block on top.
Each entry: what was decided, what was rejected and why, and where the detail lives.
If you want to reverse one of these, say so explicitly — do not quietly re-open it.

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
