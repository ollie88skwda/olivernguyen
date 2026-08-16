# 06 · Graph-mode research — how the best node-graph experiences are built

Feeds `prototype/graph/` (throwaway, no-build plain JS): light sakura (04), ~15–30 authored
nodes (05 §4), must feel like an app you're inside, never a webpage. Researched online
2026-02; sources linked inline.

---

## 1 · Approaches + libraries (for a small AUTHORED graph, no build step)

| Option | Verdict for us | Why |
|---|---|---|
| **Hand-rolled DOM+SVG + d3 micro-modules** | ✅ **use this** | HTML divs = real styled node cards (sakura tokens, live text, focus rings); SVG underlay for edges. Memgraph's benchmark note: "SVG excels at drawing a small number of large elements, where it performs even better than Canvas or WebGL" — exactly our case ([memgraph](https://memgraph.com/blog/you-want-a-fast-easy-to-use-and-popular-graph-visualization-tool)). d3-zoom/-interpolate/-force load off CDN, no build. |
| d3-force alone | ✅ as garnish only | Physics engine, renderer-agnostic. Use `forceX/forceY` anchored to authored coords + `forceCollide`, low alpha — jiggle, not layout. |
| sigma.js (WebGL) | ❌ | Built for thousands of nodes; its own FAQ: small graphs + custom rendering → use d3 instead ([sigmajs.org](https://www.sigmajs.org/)). Custom card rendering in WebGL is the hard path. |
| cytoscape.js | ❌ | Analysis toolkit (algorithms, centrality); canvas-drawn shape nodes, HTML cards need popper hacks. Reads "network diagram," not app UI ([pkgpulse comparison](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026)). |
| vis-network | ❌ | Fast start but deprecated ancestry (Vis abandoned 2019, community fork), canvas styling ceiling, default physics is the "boingy soup" we're avoiding ([memgraph](https://memgraph.com/blog/you-want-a-fast-easy-to-use-and-popular-graph-visualization-tool)). |
| force-graph (vasturiano) | ⚠️ fallback | One CDN script, d3-force + canvas, `zoomToFit`/`centerAt` animated. Fastest to "something moving," but nodes are canvas-painted — card-style nodes mean hand-painting text. |
| @xyflow/react-flow | ❌ prototype / ✅ v1 | React-only; CDN-React for a throwaway is overhead. BUT React Flow is architecturally *identical* to hand-rolled DOM: HTML nodes absolutely positioned inside a CSS-transformed pane. Prototype learnings transfer 1:1 to the v1 build (05 §4.1). |

**Key transfer property:** hand-rolled world-div (`translate(x,y) scale(k)`) + DOM nodes is a
faithful React Flow simulator. Whatever camera/interaction feel we tune in the prototype
ports directly.

## 2 · Interaction patterns that create app-feel

- **Camera physics is the foundation.** The canonical feel-checklist is pixi-viewport's
  plugin list: drag, pinch, wheel, **decelerate (inertia)**, snap, follow, animate, clamp,
  bounce-at-edges ([pixi-viewport](https://github.com/pixijs-userland/pixi-viewport)).
  d3-zoom gives drag/wheel/pinch but NO inertia — add release-velocity decay (~30 LOC rAF)
  or it feels like a document, not a camera.
- **Fly-to-node = van Wijk & Nuij.** `d3.interpolateZoom` implements "Smooth and efficient
  zooming and panning" — zooms out over long distances, back in on arrival. d3-zoom docs
  explicitly bless it for "staged animated tours through your data"
  ([d3-zoom](https://d3js.org/d3-zoom), [d3-interpolate/zoom](https://d3js.org/d3-interpolate/zoom)).
  This one curve is most of the "expensive app" smell.
- **Hover = neighborhood highlight + dim rest.** Universal in Obsidian, Quartz, ReGraph.
  Cambridge Intelligence: hover/selection cues are the primary discoverability mechanism;
  styling the *neighbors* of a selection "surfaces analytical capability," not just polish
  ([CI, interactive graph viz](https://cambridge-intelligence.com/blog/interactive-graph-visualizations/)).
  Must be instant (no transition-in delay); ease only on release.
- **Focus with degrees, keyboard-first (Kumu).** Kumu Focus: select → k-degree focus,
  `+`/`-` expand/contract degree, number keys set exact degree, `Esc` restores full map
  ([Kumu focus](https://docs.kumu.io/guides/focus.html)). Cleanest keyboard model found;
  steal `Esc`-always-restores.
- **Guided tour = saved view states, not a video.** Kumu Presentations: each slide is a
  (view + focus + filter) state, "unfold a map step-by-step"
  ([Kumu presentations](https://docs.kumu.io/guides/presentations.html)). So a tour is just
  an array of `{camera, focusedNode, dossierOpen}` played through interpolateZoom — and the
  same machinery gives keyboard node-nav for free (arrow/Tab → fly to next node).
- **Semantic zoom.** Obsidian's "text fade threshold" fades labels by zoom level
  ([Obsidian graph docs](https://help.obsidian.md/plugins/graph)). Tiered node detail
  (glyph → title → meta) by scale makes zoom feel meaningful, not just bigger.
- **Search-as-filter.** Obsidian filters the graph live from a search field; Kumu "prompted
  mode" goes further — start from a search prompt, build the visible map from matches. Match
  = highlight, non-match = dim, Enter = fly to top hit.
- **Keyboard shortcuts advertised in-UI.** GitHub's network graph ships arrow-key nav plus a
  visible "keyboard shortcuts available" popup
  ([GitHub docs](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/understanding-connections-between-repositories));
  Obsidian: arrows pan, `+`/`-` zoom, Shift speeds up. Matches our hint-bar plan (05 §5.5).
- **App-not-webpage hygiene:** viewport fixed (`overflow hidden`, `overscroll-behavior:
  none` — no rubber-band page scroll), `grab/grabbing` cursors, floating chrome (legend,
  prompt bar) above the canvas, zoom-reset / fit-view control always visible, double-click
  background = fit view.

## 3 · Exemplars — immersive vs gimmicky

- **Obsidian graph view** — WebGL (pixi) canvas; hover highlights connections, click opens
  note, live search filters, color groups, force sliders, text-fade, time-lapse animation
  ([docs](https://help.obsidian.md/plugins/graph)). *Immersive because:* instant hover
  dimming + smooth camera + physics that responds to you. *Gimmick lesson:* the unfiltered
  global hairball is eye candy — position encodes nothing; the useful artifact is the
  **local (1-hop) graph**. Our authored layout dodges this entirely.
- **TheBrain ("plex")** — 28 years old; clicking any thought animates it to center and
  re-arranges relatives around it ([thebrain.com](https://www.thebrain.com/)). *The* model
  for click-to-focus: navigation IS camera animation, context never breaks. Feels like a
  place you move through.
- **GitHub network graph** — not force-directed at all: a structured commit timeline with
  drag-pan + full keyboard nav. Lesson: **authored/structured layout + keyboard beats
  physics soup for comprehension**.
- **Kumu** — focus degrees + presentations (§2). The storytelling benchmark: a graph you can
  *present*, not just poke.
- **Quartz digital gardens (jzhao.xyz)** — small local graph as secondary nav; nodes you've
  visited render a different color ([quartz docs](https://quartz.jzhao.xyz/features/graph-view)).
  Visited-state coloring = cheap, delightful "I've been here" wayfinding; steal it.
- **nodes.io** — canvas IDE: "zoom in and out of problems… programming feels like sketching
  on a canvas" ([nodes.io](https://nodes.io/)). Inside-an-app feel = infinite canvas where
  zoom is structure, plus real work happening on the canvas. Our dossiers/micro-invocations
  (05 §4.3) are the equivalent "real work."
- **Gimmick pattern to avoid** (Roam/Obsidian global views, most "3D knowledge graph"
  portfolios): free physics + no authored meaning + nothing happens on click → screensaver.
  Every node must open something real.

## 4 · Recommendation for `prototype/graph/`

**Rendering:** hand-rolled. One world `<div>` (CSS `translate+scale`), HTML node cards,
single full-size SVG underlay for edges (recomputed only on layout change, not per frame).
d3-zoom + d3-interpolate via CDN (`d3` UMD bundle is fine for a throwaway). GPU-cheap:
transform-only animation, `will-change: transform` on the world div.

**Layout:** 100% authored positions (05 §2.2 `graph.position`), tuned by hand in the
prototype and exported back into the spec. Physics only as garnish: (a) ±2–3px idle drift
via CSS animation with per-node phase offsets, (b) optional drag-a-node spring-back using
d3-force anchored to authored coords. Never let layout emerge from forces — position must
stay meaningful (GitHub/Kumu lesson).

**The 5 interactions, priority order:**

1. **Camera feel** — drag-pan + wheel/pinch zoom with release inertia; fly-to via
   `interpolateZoom`; double-click bg = fit view. Without this nothing else reads as an app.
2. **Hover neighborhood highlight** — instant 1-hop highlight, dim rest (nodes AND edges);
   this is the moment the graph feels alive under the cursor.
3. **Click-to-focus + dossier** — TheBrain re-center: camera eases node to focal point,
   dossier panel slides in (right third), `Esc`/canvas-click restores. Every node opens
   real content — the anti-gimmick guarantee.
4. **`/` filter** — live dim non-matches, Enter flies to top match, `Esc` clears. (Obsidian
   filter + Kumu prompted mode.)
5. **Guided tour + keyboard nav** — array of saved (camera, focus, dossier) states stepped
   with the same fly-to; arrows/Tab cycle nodes through the identical machinery.

**Explicitly skipped:** minimap (15–30 nodes ≈ 1.5 screens; legend chips + fit-view do the
wayfinding — revisit only if the canvas grows), WebGL anything, auto-layout libs, free
physics. **Cheap adds if time:** semantic-zoom label tiers, visited-node tint (Quartz).

---

*Prev: `05-v1-spec.md`. Consumer: `prototype/graph/` throwaway build.*
