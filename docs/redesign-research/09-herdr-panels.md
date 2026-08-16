# 09 · Herdr-style panels for terminal mode

Builds on `07-terminal-immersion.md` (fixed screen, scrollback buffer, statusbar). New
requirement: terminal mode should feel like **Herdr** — Oliver's terminal workspace
manager — including opening multiple panes to view several things at once. Research
only; `prototype/` untouched.

---

## A · What makes Herdr feel like Herdr (hands-on findings)

Studied live: `herdr --help`, `pane --help`, `agent --help`, `status`, `pane list`,
`pane layout`, `--default-config`, Oliver's `~/.config/herdr/config.toml`.

**1. The layout model is a binary split tree.** `herdr pane layout` returns exactly:
splits with `direction: "right" | "down"` + `ratio: float`, leaves with computed rects,
one `focused_pane_id`, one tab-level `zoomed` boolean. Observed live: root split right
at ratio 0.448 (main pane left), right column split down 0.5, then down 0.5 again —
the AGENTS.md "main panel LEFT, agents stacked RIGHT" rule expressed as a tree.

**2. Everything is prefix-key driven** (Oliver's prefix: `Ctrl+G`). Prefix enters a
one-shot mode, then single letters: `v` split right · `-` split down · `x` close ·
`z` zoom · `h/j/k/l` directional focus · `Tab` cycle · `r` enters **resize mode**
(sticky: hjkl/arrows adjust until Esc) · `Shift+P` rename pane · `1..9` switch tab ·
`b` sidebar · `?` help. Two modal depths: one-shot prefix, sticky resize/navigate.

**3. Panes are named, living things.** Created focused or `--no-focus`; renameable;
agents live *inside* panes and report lifecycle state (`working`/`idle`) surfaced in a
sidebar attention queue (`agent_panel_sort = "priority"`); pane titles + optional agent
labels render in the borders; each pane keeps its own scrollback position
(`offset_from_bottom` in the API).

**4. Chrome grammar:** panes are separated cards, not shared hairlines — `pane_gaps =
true` + `pane_borders = true`; accent border marks focus; collapsible sidebar; tab row
top; per-pane scrollbars; toasts bottom-right; confirm-on-close.

**5. Mobile precedent from Herdr itself:** `mobile_width_threshold = 64` columns → it
abandons splits for a single-column layout. Stacking below a width is *authentic*.

**6. The theme is already ours.** Oliver's config overrides Herdr's theme with the
sakura tokens verbatim: `accent #ffb7d1`, `panel_bg #180f14`, `surface0 #1f1319`,
`text #f5dce6`, jade green, petal red. Terminal mode using 04's tokens doesn't imitate
Herdr — it *is* his Herdr. Feel-parity is mostly free.

## B · Web multi-pane tech (online findings)

**Libraries** — all real, none right for a no-build prototype:

| Lib | Verdict |
|---|---|
| [golden-layout](https://github.com/golden-layout/golden-layout) 6.7k★ | Full docking (tabs, popouts, drag-dock). Massive overkill; wrong aesthetic (IDE, not tmux). |
| [dockview](https://github.com/dockview/dockview) 3.4k★ | Zero-dep docking, serializable layouts. Still docking-IDE grammar + build tooling. |
| [react-mosaic](https://github.com/nomcopter/react-mosaic) 4.8k★ | The tmux-like tiler; its classic model is literally Herdr's: binary tree `{direction, first, second, splitPercentage}`. React-only — but validates the data structure. |
| [Split.js](https://github.com/nathancahill/split) 6.3k★ | 2KB, plain-JS drag gutters. Usable, but only solves drag-resize — not tree management. |

Hand-rolling wins: the tree is ~150 LOC, and keyboard-only resize (Herdr's `r` mode)
lets us skip drag gutters entirely in v1.

**Render approach:** recursive **nested flex** beats CSS grid — each split node renders
`display:flex; flex-direction:row|column`, children get `flex: ratio` / `flex: 1-ratio`;
the DOM mirrors the tree 1:1 and ratio changes animate via CSS transition. Flat grid
requires deriving `grid-template` from an arbitrary tree (pain, no benefit). Herdr
itself computes absolute rects — unnecessary in a browser.

**Focus + borders:** tmux/Herdr grammar — focused pane border in `--accent`, unfocused
panes slightly dimmed (tmux `window-style` dim; ~85% opacity on content). Use CSS 1px
borders with Herdr-style gaps, *not* box-drawing borders (box glyphs can't span
flex-pane edges reliably); box-drawing stays inside pane title rows.

**Prefix key on the web:** `Ctrl+G`/`Cmd+G` is browser find-next but is
`preventDefault`-able (unlike reserved `Cmd+W/T/N` — which is why pane-close must not
be `prefix` colliding with those). Show prefix state in the statusbar (`^G‥` pending
indicator), auto-expire 1.2s — same never-trap rules as 05 §5.4.2.

**Mobile:** no terminal-portfolio exemplar does panes on phones; Herdr's own stacking
threshold settles it — below breakpoint, flatten to a vertical stack, disable splits.

## C · Recommended pane design for terminal mode

**Pane = a "program" running a buffer.** Contents (each independently scrollable, own
title row): `main` — the session scrollback from 07 (always exists, always leftmost);
`replay` — the operator week log, follows `:day N`; any **section as pager** (`tools`,
`whoami`, `contact`); **artifact view** — a project's detail panel (mac-agent MCP list,
articlewriter output.png as the ranger-style preview pane); `help`. Graph-mode minimap:
**park it** — cross-mode leakage muddies the two-interfaces concept for one gimmick.

**Defaults:** boot opens **1 pane** (full-screen main buffer) — visitors never need
splits. Commands opportunistically split: opening a project artifact auto-splits right
(main stays LEFT — the layout rule) with a toast `opened in pane 2 · ^G x closes`.
Power users split manually. **Limits:** max 4 panes desktop, split depth 2 per axis,
min pane ~40ch × 12 rows — violations refuse with a statusbar `E-style` error. Below
~880px / coarse pointer: single pane only, auto-splits become in-buffer prints.

**The 8 bindings that matter** (all prefix `Ctrl+G`, mirroring Oliver's muscle memory):

| Keys | Action |
|---|---|
| `^G v` | split focused pane right (ratio .5) |
| `^G -` | split focused pane down |
| `^G h/j/k/l` | directional focus move |
| `^G z` | zoom focused pane (toggle; `[Z]` flag in statusbar, tmux-style) |
| `^G x` | close focused pane (main pane refuses) |
| `^G r` | resize mode — hjkl nudge ratio ±5%, Esc exits |
| `^G Tab` | cycle focus |
| `^G ?` | help sheet (adds pane keys to 07's table) |

Unprefixed `1–5`/`j k`/`:` keep acting on the **focused** pane. Mouse parity
(discoverability requirement): click focuses; pane title row gets `[|] [–] [z] [×]`
buttons; toasts advertise the keys.

**Implementation sketch (plain JS, later build):**

```js
// tree — exactly Herdr's model
{ type:'split', dir:'right', ratio:0.45, a:<node>, b:<node> }
{ type:'leaf', id:'p2', program:'replay', title:'operator · day 3' }
```

- `render(tree)`: recursive flex divs; leaf → `<section class="pane" role="region">`
  with title row + buffer div (each pane reuses 07's buffer/print machinery).
- `split(id, dir)`: replace leaf with split node (old leaf → `a`, new → `b`, .5).
- `close(id)`: replace parent split with the sibling node.
- `focus`: one focused id; CSS `.pane.focused { border-color: var(--accent) }`,
  unfocused content at ~.85 opacity.
- `zoom`: CSS only — zoomed leaf `position:absolute; inset:0` within the screen grid
  row, siblings `visibility:hidden`; tree untouched (Herdr's zoom is a boolean too).
- `resize`: ratio ±0.05 clamped [0.2, 0.8]; `transition: flex-basis 120ms` (off under
  reduced-motion). No drag gutters in v1.
- Statusbar: 07's window tabs stay; add `2 panes` + `[Z]` + prefix-pending indicator.
- ~180–220 LOC total. No persistence in v1 (session layout dies on reload, like a real
  terminal session — defensible and simpler).

**A11y:** each pane `role="region"` + `aria-label` from title; focus move also moves
DOM focus for AT; Esc order: overlay → resize mode → zoom → nothing. All motion gated.
