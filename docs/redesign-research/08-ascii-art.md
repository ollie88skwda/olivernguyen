# 08 · ASCII art for terminal mode — research (no implementation yet)

Companion to `07-terminal-immersion.md`. Everything here is **for later**; nothing in
`prototype/` changes. Goal: art that reads as *native TUI output*, not clip-art pasted
into a fake terminal.

---

## 1 · How good ASCII art is actually made

**Hand-drawn (highest quality ceiling).** The scene draws on cell grids in dedicated
editors: [REXPaint](https://www.gridsagegames.com/rexpaint/) (free, layers, the
roguelike-dev standard), Moebius / PabloDraw (classic ANSI scene tools), durdraw.
Reference archives: [16colo.rs](https://16colo.rs) (ANSI/textmode scene),
[asciiart.eu](https://www.asciiart.eu) (line-art clichés — study, don't copy). Small
bespoke pieces (a blossom branch, a card frame) are hand-drawn, not converted.

**Text banners: figlet.** The FIGfont ecosystem is the standard — 328 fonts ship with
[figlet.js](https://github.com/patorjk/figlet.js) (powers [patorjk.com/software/taag](http://patorjk.com/software/taag/),
the browser previewer — fastest way to audition fonts). `figlet -f <font> -k` (kerning)
/ smushing flags control tightness. `toilet` adds ANSI/HTML color export. Confirmed-good
font names in §4.

**Image → ASCII converters, ranked:**

| Tool | Why |
|---|---|
| [chafa](https://hpjansson.org/chafa/) | Best-in-class: Unicode symbol classes (blocks/box/braille), Floyd–Steinberg dithering, color modes from 2-color to truecolor, animated GIF input. |
| [ascii-image-converter](https://github.com/TheZoraiz/ascii-image-converter) (3.5k★) | `--braille` art, custom `--map` charset ramp, `--dither`, `--negative`, `--save-txt/--save-html`, exact `--dimensions` in columns. |
| [vietnh1009/ASCII-generator](https://github.com/vietnh1009/ASCII-generator) (8.3k★) | Python, multiple artistic styles, video input. Batch experiments. |
| [jp2a](https://github.com/cslarsen/jp2a) (1k★) | Classic, simple, `--invert` + width control. |

**Settings that decide quality** (canonical ref: [Paul Bourke, 1997](https://paulbourke.net/dataformats/asciiart/)):

- **Charset ramp:** 10-level `" .:-=+*#%@"` beats the 70-level ramp for small art
  (apparent-density variance between glyphs muddies long ramps).
- **Invert for dark bg:** ramps assume black-on-white. Anything destined for night-plum
  must be generated light-on-dark (`--negative` / `--invert`) or it renders as a smudge.
- **Aspect correction:** character cells are ~1:2 (w:h) — sample vertically at ~half
  rate, or trust the tool's cell-aspect handling; uncorrected art looks stretched.
- **Width in columns first:** decide the `ch` budget (e.g. 60ch desktop / 36ch mobile)
  and generate at that width. Never scale after the fact.
- **Dithering** for photo gradients; **braille (⣿, 2×4 dots/cell)** for the highest
  effective resolution in monochrome — best mode for portraits/detailed line art.

## 2 · Styles and when each works

- **figlet logotype** — names, section banners. Works everywhere; the anchor style.
- **Box-drawing + shade blocks (`░▒▓█ ▀▄ ╭─╮`)** — frames, cards, chunky color art.
  Needs `line-height: 1` and a font whose box glyphs fill the cell (JetBrains Mono ✓)
  or verticals show gaps.
- **Braille art** — subtle grey high-res pieces; reads as texture from afar. Portraits.
- **Small inline glyph art (neofetch/htop idiom)** — 5–15 line motif beside a key-value
  block; meters as `▰▰▰▱`. The most "native TUI" register of all; low slop risk.
- **Large hero pieces** — highest wow, highest risk: mobile width, AT noise, slop
  association. Only with a responsive small variant.
- **Color:** neofetch stores logos as text with color-token placeholders (`${c1}`) — the
  right model. For us: tint monochrome art through the sakura ladder
  (`--term-log-dim → --text-muted → --accent → --accent-hi` as the brightness ramp),
  jade reserved for success states as usual. Single-hue tinting keeps palette
  discipline; full-RGB converted art would break it.

## 3 · Where it earns its place here — ranked (payoff ÷ effort)

1. **Boot banner logotype** — `oliver nguyen` or `oN.c` figlet as the printed output of
   the boot command. Trivial effort, sets the register instantly. Needs a ≤36ch variant.
2. **`whoami` neofetch card** — hand-drawn sakura branch (~12 lines) left, real stats
   key-value right, meters as block glyphs. Signature piece; medium effort.
3. **404 / empty states** — tiny wilted flower + `E404: page not found`. Low effort,
   makes failure states feel authored.
4. **`:sakura` easter egg** — falling petals (`✿ ❀ · .`) drifting down the buffer,
   ~40 lines of rAF (prior art: cbonsai's falling leaves). Motion-gated. Medium/medium.
5. **cowsay-variant command** — custom sakura creature that speech-bubbles *user input*
   (`say hello`). Low effort; passes the "every command does something real" bar.
6. **ASCII/braille portrait of Oliver** — do only if a braille conversion of
   `oliver.jpg` genuinely lands; uncanny-valley and mobile-hostile otherwise. Park last.

## 4 · Pipeline recommendation (for the later implementation pass)

**Generate offline, ship strings. Never convert at runtime.**

- **Tools:** `brew install figlet chafa`; `ascii-image-converter` for braille +
  custom-ramp runs; TAAG in the browser for font audition; REXPaint if we hand-draw the
  branch/frames.
- **Fonts to audition for the name** (all confirmed in the figlet.js set): `ANSI Shadow`
  (the modern-terminal default), `DOS Rebel`, `Sub-Zero`, `Big`, `Slant`/`Small Slant`;
  compact fallbacks: `Calvin S` (box-drawing, 3 rows), `Small`, `Mini`, `Pagga`
  (block). Skip grunge fonts (`Bloody`) — off-palette-mood. Render a sample sheet of
  ~10 and pick two: display + compact.
- **Conversion settings:** `chafa --symbols` block/braille experiments; `ascii-image-converter
  -b --dither --negative --dimensions <cols>,<rows>` for the portrait test; custom
  `--map " .:-=+*#%@"` when converting the blossom.
- **Storage:** one `ascii.js` module of `String.raw` template literals keyed by name +
  variant (`banner.wide`, `banner.narrow`, `branch`, `petals`) — figlet output is full
  of backslashes, so `String.raw` or escaping is mandatory; a stray `\b` corrupts art
  silently. Fetched `.txt` only if any piece exceeds ~10KB (none should).
- **Rendering:** `<pre>` with `line-height: 1`, `font-variant-ligatures: none`,
  `text-rendering: optimizeSpeed`. Tinting: cheapest two-tone = `background-clip: text`
  gradient over the `<pre>`; per-band `<span>`s (neofetch-style) only where semantics
  want it (meters, status glyphs).
- **Animation:** reuse the print cadence from 07 (per-line reveal, 30–120ms stagger);
  frame-array loops in a fixed-size `<pre>` for petals;
  [ascii-morph](https://github.com/tholman/ascii-morph) (651★) if we ever morph
  logotype ↔ glyph art. All of it behind `prefers-reduced-motion` (static final frame).
- **Accessibility:** every art `<pre>` is `aria-hidden="true"`; adjacent visually-hidden
  text (or `role="img"` + `aria-label` on a wrapper) carries the meaning; no information
  may exist *only* in art. Screen readers otherwise read punctuation soup.
- **Mobile:** budget in `ch`, swap `wide → narrow` variant below ~40ch, hide purely
  decorative pieces below ~32ch (plain-text line instead). The buffer never scrolls
  horizontally — art width must submit to that rule.
