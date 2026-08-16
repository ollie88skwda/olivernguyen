# 07 · Terminal immersion — from "webpage with a terminal" to "terminal app"

**Problem:** the prototype (`prototype/terminal/`) scrolls like a document. `<main>` is a
880px column, sections sit at scroll offsets, `j/k` call `window.scrollBy`. That is a
website wearing a terminal costume. Real terminal apps **never scroll the window**.
This doc amends 05-v1-spec §3's "single scrolling column" assumption.

---

## 1 · The core inversion

Terminals have exactly two screen models, and we currently use neither:

1. **Primary screen (shell):** a fixed viewport pinned to the *bottom* of a scrollback
   buffer. Content **prints** and pushes upward. You scroll the buffer, not a document.
2. **Alternate screen (TUI — vim/htop/less):** no scrollback at all. The app owns a fixed
   cell grid and repaints it; chrome (statusline, panes, F-key bar) is part of the screen.

Every convincing browser terminal implements model 1 with three moves (verified in
[m4tt72/terminal](https://github.com/m4tt72/terminal) source):

- **Viewport = screen.** `<div id="app" class="h-screen">`, `body { overflow: hidden }`.
  The page has *no* scrollbar, ever. Only an inner buffer div has `overflow-y: auto`.
- **Content = scrollback.** History is an array of `{command, outputs}` blocks rendered
  top-down; after every append, `input.scrollIntoView({block:'end'})` re-pins to bottom.
- **One always-live prompt.** A real `<input>` at buffer bottom, focused on load; a
  document-level click listener refocuses it (m4tt72 and satnaing both do this). The app
  is keyboard-native by construction, not via a bolted-on key engine.

[xterm.js](https://xtermjs.org/) is the same shape formalized: fixed rows×cols grid, own
`.xterm-viewport` scroll region, scrollback as a buffer object — the DOM never scrolls.

**Chrome is fixed furniture inside the screen:** htop's F-key bar, vim's statusline,
tmux's window list. Our hint bar is already right; everything else floats in a document.

## 2 · Exemplars — what each one proves

| Source | Takeaway |
|---|---|
| [term.m4tt72.me](https://term.m4tt72.me) (1.5k★, Svelte) | The inversion above, ~3 components. Also its weakness: pure REPL = discoverability cliff. Our spec forbids that; keep visible affordances. |
| [satnaing/terminal-portfolio](https://github.com/satnaing/terminal-portfolio) (800★) | **Pre-seeds history with `welcome` on mount** — content exists before the visitor types anything. Commands render as components, not strings. Prevents ArrowUp page-scroll default. |
| [LiveTerm](https://github.com/Cveinnt/LiveTerm) / [term-website](https://github.com/micahkepe/term-website) | Config-driven command→output maps; term-website runs real xterm.js with a mock filetree (`ls`/`cd`/`cat`). `cat` is a natural content verb. |
| fkcodes.com | The famous tmux-pane portfolio — **since redesigned into an editorial site** (checked live). Lesson: pure-terminal UX decays unless content-first. Our hybrid (printed sections + commands) is the right bet. |
| [charm.sh](https://charm.sh) / Bubble Tea / Lip Gloss | The modern TUI aesthetic: padded color-block panels, bold accent borders, statuslines, styled *on a cell grid*. TUIs are art-directed, not green-on-black. Sakura-dark already matches this language. |
| MonkeyType | Focus = subtraction. While you type, all chrome fades; one focal element + smooth caret. Immersion comes from removing UI during activity, not adding effects. |
| htop / less / ranger | htop: persistent meters + bottom key-bar. less: pager — `j/k/d/u/g/G`, `/`, `:`, position `%` in the prompt line, `(END)` marker. ranger: panes with a right-hand preview column (= our artifact panel). Borrow all three literally. |
| Warp / Ghostty product pages | Both are *normal marketing pages* showing real terminal frames — they never fake a terminal document. Restraint cuts both ways: if we claim to be a terminal, we must be one fully. |

## 3 · Concrete techniques

**Virtual scrollback, not page scroll.** `html,body{height:100dvh;overflow:hidden}`.
One `#screen` CSS grid: `[buffer 1fr] [cmdline auto] [statusbar auto]`. Wheel and `j/k`
move `buffer.scrollTop`. Position shown as less-style `42%` in the statusbar; hide or
thin the buffer scrollbar.

**Sections PRINT into the buffer.** Navigation = running a command. Pressing `2` or
clicking `[2] agents` appends `$ cat tools.txt` + that section's block to the buffer,
then pins to bottom — it does not `scrollIntoView` a pre-laid-out document. History
accumulates like a real session; revisiting re-prints; `clear` works and means something.
Keep sections as `<template>`s cloned on print (plus a static no-JS render for crawlers).

**Boot = pre-seeded session.** On load the site "runs" its own first command (satnaing
pattern): types `operator --replay --day 3`, streams the transcript, prints name +
tagline + CTA row as that command's output. The operator conceit — the loop drives the
site — for free.

**Cell-grid discipline.** Size in `ch` and line-height multiples: panels padded whole
cells, rules on row boundaries, box-drawing chars (`─ │ ╭ ╮`) for frames. Block cursor =
full-cell background swap (`background: var(--term-cursor); color: var(--on-accent)`),
`steps(1)` blink. No half-cell borders, no 6px paddings.

**Output cadence.** Real shells don't type their output. Type only *commands*
(~30–60ms/char); print output line-at-a-time, whole lines, 30–120ms stagger, brief pause
before "tool result" lines. Current prototype types every output glyph at 5–14ms — that's
the tell. Keystrokes in the prompt echo instantly, zero latency.

**CRT: restraint or nothing.** The canonical recipe
([aleclownes.com](http://aleclownes.com/2017/02/01/crt-display.html)): 2px scanline
gradient + RGB split + flicker keyframes. Flicker and curvature are slop-list bait. Max
allowed: static scanline overlay ≤3% opacity + faint vignette, killed under
`prefers-reduced-motion`/`prefers-contrast`. Defensible to skip entirely — Ghostty and
charm.sh sell terminals with zero CRT kitsch.

**Avoid (per our slop list):** fake `sudo` jokes, `rm -rf` gags, typing paragraphs
char-by-char, macOS traffic-light window chrome around a fake window, REPL-only nav with
no visible affordances, and any command that doesn't do something real.

## 4 · The changes that flip the prototype (priority order)

1. **Kill document scroll.** `body{overflow:hidden}`; new `#screen` grid
   `[buffer][cmdline][statusbar]` at `100dvh`; move `<main>` content out; `j/k`/wheel →
   `buffer.scrollTop`. ~30 lines of CSS + swapping `window.scroll*` for buffer ops.
2. **Print-into-buffer navigation.** Sections → `<template>`s; `jump(n)` becomes
   `run('cat '+FILES[n])`: append prompt-echo line + cloned block, pin to bottom; keep
   IntersectionObserver on buffer children for the statusbar section readout.
3. **Persistent live prompt.** Real input docked under the buffer, focused on load,
   document-click refocus, Up/Down history, Tab completion over the intent registry;
   `:` becomes just a prefix in the same input — delete the separate cmdline overlay.
4. **Boot as command #1.** Reuse the existing typed transcript, but as the output of a
   visible auto-typed `operator --replay` in the prompt; name/tagline/CTAs print as
   output lines. Delete `.hero { min-height: 100vh }` — the buffer owns height now.
5. **tmux-ify the chrome.** Fold the floating left rail into the statusbar as window
   tabs — `[1:boot] [2:agents*] [3:robotics]…` (tmux window-list grammar), active in
   accent; right side keeps `%` + clock. One chrome element, all clickable.
6. **Cadence pass.** Split `typeTranscript` into `typeCommand` (per-char) and
   `printLines` (per-line stagger); apply everywhere content prints.
7. **Cell grid + cursor.** Set a `--cell: 1ch/--row: var(--lh)` rhythm, re-pad panels to
   whole cells, box-drawing frame on the transcript, block cursor with full-cell inverse.
8. **Optional texture.** Single `::after` scanline overlay ≤3% + vignette, motion/
   contrast-gated. Ship last; cut if it reads as costume.

**Spec fallout to flag upstream:** 05's week "scroll-scrub" assumed document scroll. In
this model day-stepping maps to buffer printing (`:day N`, `]`/`[` steps) or a less-style
pager takeover — not a pinned sticky section. Lenis becomes unnecessary in terminal mode.
Mobile: no forced keyboard; printed blocks + tappable tabs already carry navigation.
