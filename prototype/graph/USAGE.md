# prototype/graph — graph mode (FLAGSHIP prototype)

The main experience of the olivernguyen.com redesign (05-v1-spec §4), built per
`docs/redesign-research/06-graph-research.md` §4. No-build static: hand-rolled DOM+SVG
world, d3 UMD from CDN (network needed once), light sakura "sakura paper" palette
verbatim from `04-sakura-palette.md`. The eventual production build uses React Flow;
this prototype is where layout, camera feel, and interactions get tuned.

## Run

Open `index.html` directly in a browser, or:

```
cd prototype/graph && python3 -m http.server 8080   # http://localhost:8080
```

Desktop only. Append `?still` to skip the entry animation (headless screenshots
freeze CSS animations).

## The graph

30 authored nodes, hand-tuned positions: root, 5 group clusters, 4 agent projects
+ the MCP toolbelt satellite, the **operator week ring** (7 day nodes with real-style
log beats), robotics (TechX, Worlds), leadership, pages, and a contact arc
(email/GitHub/LinkedIn/resume). Authored cross-edges: operator↔mac-agent,
permit↔license. Every dossier carries 2–3 **linked** chips that fly the camera to
related nodes.

## Controls

| Input | Action |
|---|---|
| drag / scroll / pinch | pan (inertia) / zoom |
| double-click background | fit view |
| click node | focus: camera eases node left-of-center, dossier slides in |
| hover node | instant 1-hop highlight, rest dims |
| **prompt bar** (bottom) | type an intent — “replay the week-long loop”, “day 4”, “copy email”… fuzzy-matched; a jade pulse routes root→target along the edges, then the dossier opens |
| `⌘K` / `Ctrl+K` | command palette over the same intent registry |
| ▸ guided tour (legend) | 8 saved stops through the fly-to machinery; `←`/`→` step, `Esc` ends |
| `/` | filter — live dimming; `↵` flies to top match |
| `Tab` / `⇧Tab` / arrows | cycle nodes (arrows step the tour while it runs) |
| `Esc` | palette → filter → tour → dossier (flies back) → fit view |
| `f` | fit view |
| legend chips | fly to cluster |
| TERM \| GRAPH (top right) | mode toggle — TERM shows a toast (`prototype/terminal` not wired yet) |

## Entry + feel

- On load nodes assemble outward from the root (~1.3s stagger) while edges draw in;
  fully skipped under `prefers-reduced-motion` (and `?still`).
- Camera: d3-zoom + hand-rolled release inertia (`exp(-dt/240)` decay) and van Wijk
  fly-to via `d3.interpolateZoom` (380–1050ms, distance-scaled). Idle drift ±2–3px.
- Jade (`--routing-pulse`) is reserved for routing: the pulse bead, passing edges,
  and the arrival flash — per the palette's rationing rules.

## Stub honesty

Dossier copy is real-sounding but placeholder; day beats are curated fiction in the
real log's format; only the email link is live. No minimap, no mobile fallback —
out of prototype scope by design (06 §4, 05 §4.5).
