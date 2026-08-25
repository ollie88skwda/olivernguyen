# 04 · The SAKURA Web Palette

Official light + dark palette for the olivernguyen.com redesign, derived from the two
sakura themes the owner already lives in daily:

- `~/.pi/agent/themes/sakura.json` (Pi coding agent theme)
- `~/.config/ghostty/themes/sakura` (Ghostty terminal theme, with its color-theory header)

Per `03-concepts.md`, the site has two modes. **DARK SAKURA** styles the terminal-replay
mode (Direction 1, "Overnight"); **LIGHT SAKURA** styles the interactive-graph mode
(Direction 3, "Tool Router" — the prompt-bar/graph layer). Terminal-specific tokens live
in the dark set, graph-specific tokens in the light set.

All values below were computed, not eyeballed: hex → OKLCH via the standard sRGB→OKLab
transform, contrast via WCAG 2.x relative luminance.

---

## 1 · Color-theory analysis of the source palette

### 1.1 The harmony, stated objectively

The ghostty header describes the scheme in classical (HSL) wheel terms:
**monochromatic pink/magenta ~330° + one true complement, jade green ~155°**, with
**red ~6°** and **gold ~40°** sitting warm-adjacent for error/warning. Measured in OKLCH
(the perceptual space used for all engineering below), those same hues land at:

| Role | Classical hue | OKLCH hue | Anchor swatch |
|---|---|---|---|
| Pink family (brand) | ~330° | **345–356°** | blossom `#ffb7d1` H=355.7 |
| Jade (success/routing) | ~155° | **161–164°** | leaf `#46b989` H=162.4 |
| Red (error) | ~6° | **~29°** | petalRed `#e15647` H=29.1 |
| Gold (warning) | ~40° | **~75°** | gold `#e8a94a` H=74.6 |

(The numeric shift between the two columns is just the coordinate system — HSL and OKLCH
number the wheel differently. Same colors.)

Why this harmony works, in theory terms:

1. **Monochromatic core.** Every neutral, surface, and brand color shares one hue slice
   (OKLCH H ≈ 344–356°, a spread of only ~12°). Monochromatic schemes are the most
   cohesive harmony class; variety comes from the L/C ladder, not from hue.
2. **Single complement for signal.** Jade at H≈162° sits ~190° across the OKLCH wheel
   from the pink core — effectively the complement. Complements produce maximum hue
   contrast, so jade is *unmissable* against pink surroundings. That's exactly what you
   want for the one semantic meaning that must pop: success (dark) / active routing (light).
3. **Warm-analogous alarm colors.** Error (H≈29°) and warning (H≈75°) are adjacent to
   each other on the warm side, close enough to the pink core to feel family, far enough
   to read as distinct states. They form a loose split-complement against jade.
4. **Chroma discipline.** Backgrounds hold C ≤ 0.04 (near-neutral but never gray);
   text holds C ≈ 0.03–0.11; only accents and state colors exceed C 0.12. High chroma is
   *rationed to meaning* — the same discipline every concept doc demands of its accent.

### 1.2 The source dark ladder (measured)

The Pi/ghostty dark theme is already a clean lightness ladder on one hue:

| Token | Hex | OKLCH L | C | H |
|---|---|---|---|---|
| pageBg | `#180f14` | 0.183 | 0.018 | 344.6 |
| surface (cardBg) | `#1f1319` | 0.205 | 0.023 | 347.8 |
| surface-2 (infoBg) | `#2a1b22` | 0.244 | 0.027 | 349.7 |
| selection | `#3a2430` | 0.292 | 0.039 | 345.9 |
| deepRose | `#5c3a48` | 0.393 | 0.052 | 353.4 |
| roseDim | `#8f5b70` | 0.535 | 0.074 | 354.1 |
| rose | `#d888a8` | 0.719 | 0.105 | 354.5 |
| blossom | `#ffb7d1` | 0.854 | 0.089 | 355.7 |
| petalWhite | `#f5dce6` | 0.918 | 0.030 | 351.5 |

Note two systematic patterns the web palette must preserve:
- **L climbs in even steps** (~0.02 between surfaces, ~0.1–0.15 between text tiers).
- **C peaks in the middle of the ladder** (rose/blossom, C ≈ 0.09–0.11) and tapers at
  both ends — near-black and near-white are both nearly neutral. This "chroma arch" is
  what makes the theme feel dyed-through rather than tinted-on-top.

---

## 2 · DARK SAKURA — "Night Plum" (terminal-replay mode)

Inherits the Pi/ghostty palette almost verbatim; web-specific tokens are derived on the
same ladder. Two adjustments were required to hit WCAG (flagged ⚠, explained in §4).

### 2.1 Core tokens

| Token | Hex | OKLCH (L / C / H) | Source / derivation |
|---|---|---|---|
| `--bg` | `#180f14` | 0.183 / 0.018 / 344.6 | pi `export.pageBg`, ghostty `background` |
| `--surface` | `#1f1319` | 0.205 / 0.023 / 347.8 | pi `export.cardBg`, ghostty palette 0 |
| `--surface-2` | `#2a1b22` | 0.244 / 0.027 / 349.7 | pi `userMsgBg` / `export.infoBg` |
| `--border` | `#3a2430` | 0.292 / 0.039 / 345.9 | pi `selectedBg` (hairline weight on dark) |
| `--border-strong` | `#5c3a48` | 0.393 / 0.052 / 353.4 | pi `deepRose` (hover/active borders) |
| `--text` | `#f5dce6` | 0.918 / 0.030 / 351.5 | petalWhite |
| `--text-muted` | `#d888a8` | 0.719 / 0.105 / 354.5 | rose |
| `--text-faint` | `#b0788f` | 0.637 / 0.076 / 353.2 | ⚠ roseDim lifted (see §4) |
| `--accent` | `#ffb7d1` | 0.854 / 0.089 / 355.7 | blossom |
| `--accent-hi` | `#ff6fb0` | 0.734 / 0.187 / 354.5 | blossomBright |
| `--on-accent` | `#1f1319` | 0.205 / 0.023 / 347.8 | surface reused as ink on pink fills |
| `--success` | `#46b989` | 0.708 / 0.126 / 162.4 | leaf |
| `--warning` | `#e8a94a` | 0.777 / 0.132 / 74.6 | gold |
| `--error` | `#e15647` | 0.634 / 0.176 / 29.1 | petalRed |
| `--error-hi` | `#ea897e` | ~0.72 / 0.11 / ~27 | ⚠ ghostty bright-red slot 9 (see §4) |
| `--selection` | `#3a2430` | 0.292 / 0.039 / 345.9 | ghostty `selection-background` |

### 2.2 Terminal-specific tokens (the replay console)

| Token | Hex | Role |
|---|---|---|
| `--term-log` | `#d888a8` | log body lines (rose — matches pi `toolOutput`) |
| `--term-log-dim` | `#b0788f` | timestamps, decision numbers, tree pipes |
| `--term-prompt` | `#ff6fb0` | prompt sigil + typed commands (ghostty `cursor-color`) |
| `--term-active-line` | `#31202a` | bg of the line currently "executing" in the replay |
| `--term-cursor` | `#ff6fb0` | block cursor, blinking |
| `--term-success-line` | `#182520` | bg tint for completed tool calls (pi `toolSuccessBg`) |
| `--term-error-line` | `#2b1917` | bg tint for failed calls (pi `toolErrorBg`) |

The replay console is literally the pi TUI aesthetic on the web: rose logs, hot-pink
prompt, plum panels. Anyone who has seen the owner's actual terminal will recognize it.

### 2.3 Dark contrast table (WCAG 2.x ratios, computed)

Requirement: body + small mono ≥ 4.5:1, large display ≥ 3:1.

| Foreground | on `--bg` #180f14 | on `--surface` #1f1319 | on `--surface-2` #2a1b22 | Verdict |
|---|---|---|---|---|
| `--text` #f5dce6 | **14.56** | **13.95** | **12.72** | AAA everywhere |
| `--text-muted` #d888a8 | **7.17** | **6.87** | **6.26** | AA+ everywhere |
| `--text-faint` #b0788f | **5.31** | **5.09** | **4.64** | AA everywhere |
| `--accent` #ffb7d1 | **11.59** | **11.11** | **10.13** | AAA everywhere |
| `--accent-hi` #ff6fb0 | **7.30** | **7.00** | **6.38** | AA+ everywhere |
| `--success` #46b989 | **7.66** | **7.35** | **6.70** | AA+ everywhere |
| `--warning` #e8a94a | **9.13** | **8.76** | **7.98** | AAA everywhere |
| `--error` #e15647 | **5.03** | **4.83** | 4.40 ✗ | use `--error-hi` on surface-2 |
| `--error-hi` #ea897e | **7.50** | **7.19** | **6.55** | AA+ everywhere |

Other measured pairs:

| Pair | Ratio | Requirement | Verdict |
|---|---|---|---|
| `--on-accent` #1f1319 on `--accent` #ffb7d1 | **11.11** | 4.5 (button label) | ✓ |
| `--on-accent` #1f1319 on `--accent-hi` #ff6fb0 | **7.00** | 4.5 | ✓ |
| `--text` on `--selection` #3a2430 | **11.03** | 4.5 | ✓ |
| `--term-log` #d888a8 on `--term-active-line` #31202a | **5.84** | 4.5 (small mono) | ✓ |
| `--term-prompt` #ff6fb0 on `--term-active-line` #31202a | **5.95** | 4.5 (small mono) | ✓ |
| `--text` #f5dce6 on `--term-active-line` #31202a | **11.86** | 4.5 | ✓ |

Every text tier clears 4.5:1 on every surface it may sit on; display type clears 3:1 by
miles. The single exception (petalRed on surface-2) has a designated brighter variant
that is *already in the brand* (ghostty ANSI bright red).

---

## 3 · LIGHT SAKURA — "Sakura Paper" (interactive-graph mode)

### 3.1 Derivation principle: same dye, opposite bath

The light variant is **not** white-with-pink-buttons. The rule used to build it:

> Take the dark ladder, mirror it around mid-lightness, and keep the chroma arch.

Concretely: the dark page is *plum with the lights off* — L 0.18, C 0.018, H 345. The
light page is the same cloth with the lights on — **L 0.966, C 0.011, H 348.4**
(`#faf1f5`). It carries a measurable blossom tint (C > 0, hue locked to the family), the
way `#180f14` carries a measurable plum tint. Set next to a true white, the page reads
warm and faintly pink — like washi paper that had petals pressed in it. Ink, borders,
and every neutral also stay on the 345–356° hue slice, so nothing on the page is ever a
dead gray.

Because light backgrounds have high luminance, every colored *text* token must drop L and
often C to keep contrast — so light-mode accents are deeper, inkier versions of the same
hues (rosewood rather than candy pink, forest-jade rather than mint). Hue is held
constant; only the ladder position moves. That's what keeps the two modes feeling like
one brand at two times of day.

### 3.2 Core tokens

| Token | Hex | OKLCH (L / C / H) | Derivation |
|---|---|---|---|
| `--bg` | `#faf1f5` | 0.966 / 0.011 / 348.4 | dark bg mirrored: near-white, blossom-tinted, hue-locked |
| `--surface` | `#fdf8fa` | 0.984 / 0.006 / 350.8 | cards/panels: half-step *lighter* than page (light-mode elevation inverts) |
| `--surface-2` | `#f2e2ea` | 0.928 / 0.020 / 345.7 | inset petal wash: code blocks, dossier sidebars |
| `--border` | `#e2c9d4` | 0.860 / 0.032 / 349.3 | hairlines; petalWhite pushed one step deeper |
| `--text` | `#3a1e2b` | 0.278 / 0.048 / 351.4 | "ink plum" — the dark bg family raised to reading weight |
| `--text-muted` | `#6f4459` | 0.444 / 0.066 / 349.4 | deepRose family, darkened for light bg |
| `--text-faint` | `#84536a` | 0.504 / 0.072 / 350.4 | roseDim family, tuned to pass on all surfaces |
| `--accent` | `#a83a68` | 0.518 / 0.150 / 357.9 | blossom pulled down the ladder to link-weight "rosewood" |
| `--accent-hi` | `#93275a` | 0.458 / 0.150 / 356.0 | blossomBright equivalent: hover/active, deeper not louder |
| `--on-accent` | `#fdf8fa` | 0.984 / 0.006 / 350.8 | paper-white on rosewood fills |
| `--success` | `#15734f` | 0.494 / 0.102 / 161.7 | leaf darkened, hue held at jade |
| `--warning` | `#835b10` | 0.502 / 0.099 / 76.9 | gold darkened to ochre, hue held |
| `--error` | `#b93a2c` | 0.533 / 0.166 / 29.8 | petalRed darkened, hue held |
| `--selection` | `#f7cede` | 0.891 / 0.050 / 352.7 | blossom at wash strength |

Note the ladder discipline: light-mode `--accent`, `--success`, `--warning`, `--error`
all sit at **L ≈ 0.49–0.53** — one shared "signal row" — just as their dark counterparts
all sit at L ≈ 0.63–0.78. States differ by hue, never by weight, in both modes.

### 3.3 Graph-specific tokens (the tool-router canvas)

| Token | Hex | Role |
|---|---|---|
| `--node-fill` | `#fdf8fa` | node card fill (surface white, floats above paper) |
| `--node-border` | `#a97188` | idle node outline — 3.51:1 vs canvas, passes non-text UI (≥3:1) |
| `--node-border-active` | `#a83a68` | selected/invoked node outline (accent, 5.47:1) |
| `--edge` | `#d9b6c4` | idle edges — deliberately quiet; decorative, exempt from 3:1 |
| `--routing-pulse` | `#15734f` | the bead-pulse traveling an invoked route (jade = "currently routing") |
| `--dot-grid` | `#e8d3dc` | canvas dot-grid texture — decorative, kept faint on purpose |

This matches Direction 3's own spec ("one signal-green accent strictly reserved for
currently-routing state") while replacing its generic off-white/ink/green with the sakura
family: the whiteboard is blossom paper, the ink is plum, and the routing green is the
brand's existing jade complement rather than an arbitrary `#0faa5f`.

### 3.4 Light contrast table (WCAG 2.x ratios, computed)

| Foreground | on `--bg` #faf1f5 | on `--surface` #fdf8fa | on `--surface-2` #f2e2ea | Verdict |
|---|---|---|---|---|
| `--text` #3a1e2b | **13.54** | **14.27** | **12.03** | AAA everywhere |
| `--text-muted` #6f4459 | **7.16** | **7.55** | **6.36** | AA+ everywhere |
| `--text-faint` #84536a | **5.53** | **5.83** | **4.92** | AA everywhere |
| `--accent` #a83a68 | **5.47** | **5.76** | **4.85** | AA everywhere |
| `--accent-hi` #93275a | **7.08** | **7.46** | **6.29** | AA+ everywhere |
| `--success` #15734f | **5.27** | **5.56** | **4.68** | AA everywhere |
| `--warning` #835b10 | **5.47** | **5.76** | **4.86** | AA everywhere |
| `--error` #b93a2c | **5.12** | **5.39** | **4.55** | AA everywhere |

Other measured pairs:

| Pair | Ratio | Requirement | Verdict |
|---|---|---|---|
| `--on-accent` #fdf8fa on `--accent` #a83a68 | **5.76** | 4.5 (button label) | ✓ |
| `--on-accent` #fdf8fa on `--accent-hi` #93275a | **7.46** | 4.5 | ✓ |
| `--text` on `--selection` #f7cede | **10.59** | 4.5 | ✓ |
| `--node-border` #a97188 vs canvas #faf1f5 | **3.51** | 3.0 (non-text UI) | ✓ |
| `--node-border-active` #a83a68 vs canvas | **5.47** | 3.0 | ✓ |
| `--routing-pulse` #15734f vs canvas | **5.27** | 3.0 (and 4.5 if used as label text) | ✓ |

Every text token ≥ 4.5:1 on every surface it can appear on, including small mono node
labels (`--text-muted` in Geist Mono at 4.5+ on all three surfaces). Large display type
(name-as-root-node, section heads) can additionally use `--accent` at 5.47:1 — nearly
double the 3:1 floor.

---

## 4 · Adjustments made to pass WCAG (the honest ledger)

1. **Dark `--text-faint`: `#8f5b70` → `#b0788f`.** Pi's roseDim measures **3.49:1** on
   the page — fine for TUI decoration (tree pipes, hrs), a failure for readable web text.
   Lifted L 0.535 → 0.637 along the same hue/chroma track (H 354→353, C 0.074→0.076).
   Now 5.31 / 5.09 / 4.64 across the three surfaces. `#8f5b70` is retained for purely
   decorative strokes (borders inside the console chrome), never for glyphs.
2. **Dark `--error` gains `--error-hi` `#ea897e`.** petalRed measures 5.03 on the page
   and 4.83 on surface but **4.40** on surface-2. Rather than bend the brand red, error
   *text* on raised surfaces uses ghostty's existing ANSI bright-red slot 9 (`#ea897e`,
   7.50 on bg). petalRed remains the fill/icon/border error color everywhere.
3. **Light `--text-faint` tuned `#8a5a70` → `#84536a`.** First candidate hit 4.46 on
   surface-2 (a hair under). Darkened L 0.527 → 0.504; now 4.92 there.
4. **Light `--success` tuned `#1d8a63` → `#15734f`.** First candidate hit 3.90 on the
   page. Darkened L 0.565 → 0.494 with hue held at jade (H 163.5→161.7); now 5.27 / 4.68.
5. **Light `--warning` tuned twice → `#835b10`.** Gold is the hardest hue to make
   accessible on warm paper (yellow luminance). Landed at L 0.502, C 0.099, H 76.9 —
   an ochre that still reads gold; 5.47 / 4.86.
6. **Light `--node-border` tuned `#cfa9ba` → `#a97188`.** First candidate hit 2.61
   against the canvas, under the 3:1 non-text UI floor. Darkened to 3.51.

Everything else is either taken verbatim from the two source themes or derived on their
measured ladder without needing correction.

---

## 5 · Implementation notes

Shipped scoping (see `src/styles/sakura.css` — tokens live under `.sakura`, never `:root`).
**Theme and mode are independent axes**, so the ladder is keyed off `data-theme` and the
interface-specific tokens off `data-mode`:

```css
.sakura {                              /* LIGHT LADDER — sakura paper (default) */
  --bg: #faf1f5;        --surface: #fdf8fa;    --surface-2: #f2e2ea;
  --border: #e2c9d4;
  --text: #3a1e2b;      --text-muted: #6f4459; --text-faint: #84536a;
  --accent: #a83a68;    --accent-hi: #93275a;  --on-accent: #fdf8fa;
  --success: #15734f;   --warning: #835b10;    --error: #b93a2c;
  --selection: #f7cede;
  --node-fill: #fdf8fa; --node-border: #a97188; --node-border-active: #a83a68;
  --edge: #d9b6c4;      --routing-pulse: #15734f; --dot-grid: #e8d3dc;
}
html[data-theme="dark"] .sakura {       /* DARK LADDER — night plum */
  --bg: #180f14;        --surface: #1f1319;    --surface-2: #2a1b22;
  --border: #3a2430;    --border-strong: #5c3a48;
  --text: #f5dce6;      --text-muted: #d888a8; --text-faint: #b0788f;
  --accent: #ffb7d1;    --accent-hi: #ff6fb0;  --on-accent: #1f1319;
  --success: #46b989;   --warning: #e8a94a;    --error: #e15647; --error-hi: #ea897e;
  --selection: #3a2430;
  --node-fill: #1f1319; --node-border: #8f5b70; --node-border-active: #ffb7d1;
  --edge: #4f323e;      --routing-pulse: #46b989; --dot-grid: #34242b;   /* §6.3 */
}
html[data-theme="dark"][data-mode="terminal"] .sakura {     /* console · dark, §2.2 */
  --term-log: #d888a8;  --term-log-dim: #b0788f; --term-prompt: #ff6fb0;
  --term-active-line: #31202a; --term-cursor: #ff6fb0;
  --term-success-line: #182520; --term-error-line: #2b1917;
}
html[data-theme="light"][data-mode="terminal"] .sakura {    /* console · light, §6.1 */
  --border-strong: #a97188; --error-hi: #95241a;
  --term-log: #6f4459;  --term-log-dim: #84536a; --term-prompt: #93275a;
  --term-active-line: #f9e2ed; --term-cursor: #93275a;
  --term-success-line: #daece3; --term-error-line: #fae3de;
}
```

The `--node-*` / `--edge` / `--dot-grid` set ships with the **ladder** (each ladder declares its
own) and is read only under `html[data-mode="graph"]` — they describe the canvas, so a node card
rendered inside the terminal takes the shared surface ladder instead.

Until a theme switch is wired, `src/styles/sakura.css` carries one back-compat selector clause,
`html:not([data-theme])[data-mode="terminal"]`, so the shipped terminal keeps rendering dark while
`ModeProvider` is the only thing setting an attribute. Delete that clause when a `ThemeProvider`
lands.

Rationing rules carried over from the concept docs: jade appears **only** on
success/routing; `--accent-hi` is for the single loudest element per view (prompt, active
node, primary CTA); gold and red only for genuine states, never decoration. `::selection`
uses `--selection` in both modes.

---

## 6 · The two derived themes (2026-08-26)

`BRAND.md` §3 makes theme and mode independent, which means four combinations, not two.
§2 and §3 above ship the diagonal (terminal · dark, graph · light). This section derives the
other two under the same rule that built §3 from §2:

> **Hold the hue slice. Move only the ladder position.**

No new hue is introduced here. Every value below is either an existing token reused in a new
role, or a point placed on a ladder that already exists, at a hue inside the 344–356° pink slice
(or the ratified jade / red / gold satellites).

### 6.1 TERMINAL · LIGHT — plum ink on sakura paper

Core ladder is §3.2 unchanged. The console roles keep their §2.2 job descriptions and take the
light ladder's rung for each: log = `--text-muted`, dim = `--text-faint`, prompt and cursor =
`--accent-hi`.

| Token | Hex | OKLCH (L / C / H) | Derivation |
|---|---|---|---|
| `--term-log` | `#6f4459` | 0.444 / 0.066 / 349.4 | `--text-muted` — the log body is the reading tier, exactly as rose is in dark |
| `--term-log-dim` | `#84536a` | 0.504 / 0.072 / 350.4 | `--text-faint` — timestamps, decision numbers, tree pipes |
| `--term-prompt` | `#93275a` | 0.458 / 0.150 / 356.0 | `--accent-hi` — the one loudest element, deeper not brighter |
| `--term-cursor` | `#93275a` | 0.458 / 0.150 / 356.0 | same as the prompt, per §2.2 |
| `--term-active-line` | `#f9e2ed` | 0.934 / 0.029 / 347.1 | blossom wash at `--surface-2` quietness (1.11:1 on the page) |
| `--term-success-line` | `#daece3` | 0.927 / 0.023 / 164.5 | same rung, hue held at jade |
| `--term-error-line` | `#fae3de` | 0.933 / 0.026 / 32.2 | same rung, hue held at petalRed |
| `--border-strong` | `#a97188` | 0.614 / 0.077 / 353.3 | the light ladder's ratified non-text stroke (= `--node-border`) |
| `--error-hi` | `#95241a` | 0.444 / 0.151 / 29.5 | `--error` pushed one rung deeper; the console's `.err` class needs it |

**Why the washes are quiet, and what carries emphasis instead.** Dark can afford a loud active-row
wash because everything around it is near-black — `#31202a` is 1.23:1 on the page and still leaves
`--text` at 11.86:1. Paper cannot: a wash dark enough to read at a glance drops `--error` to 4.16
and `--success` to 4.29 on top of it. The binding constraint is the lightest state colour
(`--error` `#b93a2c`), and holding it at 4.5:1 caps every wash at roughly `--surface-2` luminance.
That is the mechanical reason `BRAND.md` §3 says light terminal **leans on hairlines and weight**:
the active row is marked by a `--border-strong` rule plus 500 weight, and the wash only tints.

### 6.2 Terminal · light contrast table

Requirement, as §2.3: body + small mono ≥ 4.5:1, large display ≥ 3:1, non-text UI ≥ 3:1.
The core tiers are §3.4 and unchanged; this table covers what the theme adds.

| Foreground | on `--bg` #faf1f5 | on `--surface` #fdf8fa | on `--surface-2` #f2e2ea | Verdict |
|---|---|---|---|---|
| `--term-log` #6f4459 | **7.16** | **7.55** | **6.36** | AA+ everywhere |
| `--term-log-dim` #84536a | **5.53** | **5.83** | **4.92** | AA everywhere |
| `--term-prompt` #93275a | **7.08** | **7.46** | **6.29** | AA+ everywhere |
| `--error-hi` #95241a | **7.45** | **7.85** | **6.62** | AA+ everywhere |

Every text tier and every state colour on all three line washes — the bar dark does not clear:

| Foreground | on `--term-active-line` #f9e2ed | on `--term-success-line` #daece3 | on `--term-error-line` #fae3de | Verdict |
|---|---|---|---|---|
| `--text` #3a1e2b | **12.23** | **12.20** | **12.22** | AAA everywhere |
| `--term-log` #6f4459 | **6.47** | **6.46** | **6.46** | AA+ everywhere |
| `--term-log-dim` #84536a | **5.00** | **4.99** | **4.99** | AA everywhere |
| `--term-prompt` #93275a | **6.40** | **6.38** | **6.39** | AA+ everywhere |
| `--accent` #a83a68 | **4.94** | **4.92** | **4.93** | AA everywhere |
| `--success` #15734f | **4.76** | **4.75** | **4.76** | AA everywhere |
| `--warning` #835b10 | **4.94** | **4.93** | **4.93** | AA everywhere |
| `--error` #b93a2c | **4.62** | **4.61** | **4.62** | AA everywhere |
| `--error-hi` #95241a | **6.73** | **6.71** | **6.72** | AA+ everywhere |

Other measured pairs:

| Pair | Ratio | Requirement | Verdict |
|---|---|---|---|
| `--border-strong` #a97188 vs `--bg` | **3.51** | 3.0 (non-text UI) | ✓ |
| `--border-strong` #a97188 vs `--surface` | **3.70** | 3.0 | ✓ |
| `--border-strong` #a97188 vs `--surface-2` | **3.12** | 3.0 | ✓ |
| `--term-active-line` vs `--bg` | 1.11 | — (surface step, not a signal) | ✓ |
| `--term-success-line` vs `--bg` | 1.11 | — | ✓ |
| `--term-error-line` vs `--bg` | 1.11 | — | ✓ |

### 6.3 GRAPH · DARK — the canvas at night

Core ladder is §2.1 unchanged; only the §3.3 canvas set is re-placed on it.

| Token | Hex | OKLCH (L / C / H) | Derivation |
|---|---|---|---|
| `--node-fill` | `#1f1319` | 0.205 / 0.023 / 347.8 | `--surface` — elevation goes *lighter* on both ladders |
| `--node-border` | `#8f5b70` | 0.535 / 0.074 / 354.1 | pi roseDim — the value §4.1 retains for decorative strokes, never glyphs. 3.49:1 on the canvas mirrors light's 3.51 |
| `--node-border-active` | `#ffb7d1` | 0.854 / 0.089 / 355.7 | `--accent`, as light uses its own `--accent` |
| `--edge` | `#4f323e` | 0.356 / 0.046 / 353.2 | new rung, sat midway between `--border` (L 0.292) and `--border-strong` (L 0.393); 1.66:1 on the canvas, the exact ratio light's `#d9b6c4` holds |
| `--routing-pulse` | `#46b989` | 0.708 / 0.126 / 162.4 | `--success` — jade still means "currently routing" |
| `--dot-grid` | `#34242b` | 0.282 / 0.027 / 351.0 | new rung just under `--border`; 1.28:1, the exact ratio light's `#e8d3dc` holds |

Both new rungs (`--edge`, `--dot-grid`) were solved for their light counterpart's **canvas ratio**
rather than eyeballed, so the texture is measurably as quiet at night as it is on paper, and both
sit inside the ladder's chroma arch (C 0.046 and 0.027 at L 0.36 and 0.28).

### 6.4 Graph · dark contrast table

| Foreground | on `--bg` #180f14 (canvas) | on `--node-fill` #1f1319 | on `--surface-2` #2a1b22 | Verdict |
|---|---|---|---|---|
| `--text` #f5dce6 | **14.56** | **13.95** | **12.72** | AAA everywhere |
| `--text-muted` #d888a8 | **7.17** | **6.87** | **6.26** | AA+ everywhere — the node-label tier |
| `--text-faint` #b0788f | **5.31** | **5.09** | **4.64** | AA everywhere |
| `--accent` #ffb7d1 | **11.59** | **11.11** | **10.13** | AAA everywhere |

Non-text UI and signal pairs:

| Pair | Ratio | Requirement | Verdict |
|---|---|---|---|
| `--node-border` #8f5b70 vs canvas #180f14 | **3.49** | 3.0 (non-text UI) | ✓ |
| `--node-border` #8f5b70 vs `--node-fill` #1f1319 | **3.34** | 3.0 | ✓ |
| `--node-border-active` #ffb7d1 vs canvas | **11.59** | 3.0 | ✓ |
| `--routing-pulse` #46b989 vs canvas | **7.66** | 3.0 (and 4.5 if used as label text) | ✓ |
| `--routing-pulse` #46b989 vs `--node-fill` | **7.35** | 4.5 | ✓ |
| `--edge` #4f323e vs canvas | 1.66 | — decorative, exempt (§3.3) | ✓ |
| `--dot-grid` #34242b vs canvas | 1.28 | — decorative, exempt (§3.3) | ✓ |

### 6.5 Adjustments and open items (the honest ledger, continued from §4)

7. **Light `--term-active-line` deliberately quieter than its dark twin** (1.11 vs 1.23 on the
   page). Mirroring dark's step exactly gave `#edd7e2`, on which `--error` measured **4.16** and
   `--success` **4.29**. Rather than bend a state colour, the wash was lifted until the lightest
   state colour cleared 4.5. Emphasis moves to the hairline + weight, which is what `BRAND.md` §3
   already specifies for this theme.
8. **Light `--border-strong` takes the 3:1 rung, not dark's 1.93 rung.** Dark's `#5c3a48` is
   1.93:1 on its page — fine there, because dark's emphasis comes from the wash and the glow.
   Light terminal has neither, so its strong hairline is the value the light ladder already
   ratified for non-text UI (`--node-border` `#a97188`, 3.51:1). Same value, second role.
9. **The log timestamp steps up a tier on the executing row (D-22).** `--text-faint` measures
   **4.33:1** on Night Plum's `--term-active-line` — the one pair in the log under 4.5, and a real
   one, because the timestamp does render there. Fixed in `components.css`, not in the palette: the
   active row's timestamp uses `--term-log`, which clears on both ladders (5.84 dark, 6.47 light)
   and is now gated. §2's locked values were not touched. `--error` on that same wash measures 4.10
   and is left alone — log states are mutually exclusive, so error text never lands on the active
   row.
10. **Light `--border-strong` and `--error-hi` stay scoped to terminal · light (D-21).**
    `src/styles/components.css` reads `var(--border-strong, var(--text-faint))` for control
    hairlines, so declaring `--border-strong` on the light core would change *shipped* graph · light
    rendering (checkbox / switch / field-hover borders 5.53:1 → 3.51:1) for no reason anyone asked
    for. Decided: leave scoped, keep the fallback chains.

---

## WHY THESE COLORS MATCH

*(For the owner. Plain language; each technical word gets a one-line gloss.)*

**Your terminal and your website are now the same dye lot.** Both palettes are built
from one pink — the blossom pink in your Pi and Ghostty themes — plus the small
supporting cast those themes already use. The website didn't get a "matching" palette;
it got *the same* palette, stretched to cover paper as well as night.

**The pinks are all literally one color at different depths.** Measured in OKLCH — a way
of describing color by how light it is, how vivid it is, and where it sits on the color
wheel — every pink, plum, and rose in both modes sits inside one narrow 12-degree slice
of the wheel. Your dark background isn't black, it's blossom pink with almost all the
light removed. The new light background isn't white, it's blossom pink with almost all
the light added. Text, borders, buttons: same slice, different depth. That's why nothing
ever clashes — there's only one hue to clash *with*.

**Green earns its loudness by being the opposite.** Jade sits directly across the color
wheel from your pink — its complement (the color that contrasts with it most strongly).
Surrounded by pink-family everything, one jade element is impossible to miss. So jade is
reserved for exactly one meaning: *it's working* — success checkmarks in the terminal,
the pulse traveling the graph when a request routes. When you see green, something ran.

**Red and gold are the pink's warm cousins.** Error red and warning gold sit just around
the corner from pink on the warm side of the wheel — close enough to feel related, far
enough to read instantly as "problem" and "caution." They're the petals' red and the
autumn gold to the palette's blossom and leaf: same garden.

**Light mode is sakura paper, not white with pink buttons.** The page carries a real,
measurable blossom tint — hold it next to true white and it looks faintly warm and
petal-washed, the way the dark mode looks like night plum rather than plain black. The
ink you read is dark plum, not black; the hairlines are rose-tinted, not gray. Nothing
on either page is ever colorless, which is exactly why both feel dyed-through instead of
decorated.

**Everything sits on ladders, and the ladders are disciplined.** Each mode has an even
staircase of lightness: three background steps, three text steps, and one "signal row"
where accent, green, gold, and red all sit at the same visual weight — they differ by
hue (position on the wheel), never by loudness. Vividness follows a rule too: strongest
in the middle of each staircase, gentle at both ends. That middle-heavy vividness is what
makes the theme feel like colored cloth instead of gray cloth with stickers. And every
single text-on-background pair was measured for legibility and passes the accessibility
standard (WCAG, the web's minimum-readability rule) with room to spare — the few colors
that fell short were nudged along their own ladder, never off it, and each nudge is
logged in section 4.

**Bottom line:** dark mode is your terminal at 2am; light mode is the same room at 10am
with paper on the desk. One pink, one opposite green, two warm cousins, honest ladders.
That's the whole system.
