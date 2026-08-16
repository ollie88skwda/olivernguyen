# 03 · Art Directions for olivernguyen.com

Creative-director concepts for the redesign. Brief: high-school senior who builds LLM agents
with custom MCP tools, ran an autonomous Claude Code loop that operated a project alone for a
week, robotics mentor (15+ students, Worlds-qualified team), Eagle Scout, college-bound.
Wants artistic and visually impressive: animation, video, interactive representation of the
work. NOT typography-on-a-page. Minimal custom code: lean on Magic UI, Aceternity, React Bits,
Motion, Lenis, React Three Fiber.

**Design read:** developer/creative portfolio for admissions readers, recruiters, and fellow
builders. The story that no one else his age can tell is *"my software works while I sleep."*
Every direction below is built around making that claim visible, not just stated.

**Hard bans carried into all four:** no purple gradients, no glassmorphism card grids, no
particle spam, no meteors/vortex slop, no fake div screenshots, no em-dashes, one marquee max
per page, motion always gated behind `prefers-reduced-motion`.

**Stack reality check (affects every "effort" estimate):** the site is CRA + React 18 with
plain CSS and `motion@11` already installed. Magic UI and Aceternity distribute as
Tailwind + TS snippets, so each borrowed component needs either (a) Tailwind added to the
build, or (b) a one-time port of its classes to plain CSS. React Bits offers a plain-CSS
variant of most components, which makes it the cheapest source here. R3F v8 + drei run fine
on React 18/CRA.

---

## Direction 1 · "OVERNIGHT" (mission-control replay)

### 1. Concept + narrative spine
The site is a **replay console for the week the agent ran alone**. Not a metaphorical
terminal aesthetic: an actual scripted replay of the operator loop, with the 257-entry
decisions log as the raw material. The page opens mid-session, the visitor scrubs through
seven days of autonomous operation by scrolling, and every other project is introduced as
"another thing built by the same person who built this." Narrative spine: *boot → the week
replays → the toolbox (MCP registry, ScopeCreep, Articlewriter) → the human behind the
operator (robotics, mentoring, Eagle) → contact as an open channel.*

### 2. Hero treatment
Full-viewport dark console. A real terminal component types an actual (curated) transcript:
`operator loop · day 3 · 06:12 — decision #141 logged`, tool calls streaming, then the
cursor pauses and types **"built by Oliver Nguyen"** in huge display type via a scramble/
decrypt effect. Behind the terminal, a very dim flickering-grid texture, not particles.
One CTA. The terminal is the hero image; no screenshot fakery because the transcript content
is real log data.

### 3. Projects, represented interactively
- **Voice/Operator** IS the site's centerpiece: a scroll-scrubbed 7-day timeline. As Lenis
  scroll advances, a day counter ticks 1→7, real decision-log excerpts stream into a pinned
  console panel, and a morning-summary "email" composes itself on day boundaries. The
  visitor literally replays the week.
- **Niobium Mac-Agent**: an interactive MCP tool board. Each registered tool
  (`vault_search`, `rescore_leads`, …) is a row; hovering one fires an animated beam from
  "Claude" node to that tool and shows a one-line sample invocation + result.
- **ScopeCreep Notary**: a live before/after compare slider on a real client message,
  highlighted phrases on the right side. Tagline: "zero LLM calls at runtime, on purpose."
- **Articlewriter**: a 3-stage pipeline strip where scrolling pushes a payload through
  rank → write → tag, ending on the real composited product image.

### 4. Motion system
- **Scroll choreography:** Lenis smooth scroll as the spine. The Operator section uses the
  canonical GSAP-style pin (or Motion `useScroll` + sticky) — section pins at `top top`,
  scroll scrubs the day counter and log stream. Other sections use light `whileInView`
  staggers only. One pinned section per page; everything else breathes normally.
- **Micro-interactions:** cursor-following spotlight on the console panels; text-scramble on
  section headings (fires once); number tickers for the stats row (257 decisions, 7 days,
  15+ students); tool rows glow via border-beam on hover; magnetic contact CTA.

### 5. Color + type
Near-black blue (`#0a0f14` family), off-white text, **single phosphor-amber accent**
(`#f5a623` desaturated ~70%) for live/active states — deliberately CRT-amber, not hacker
green, not AI blue. Type: **Berkeley Mono or JetBrains Mono** for all console/log content,
**Space Grotesk or Geist** for display headlines. Mono is content here (real logs), so
mono-heavy is honest, not aesthetic.

### 6. Component map
| Element | Off-the-shelf |
|---|---|
| Smooth scroll spine | **Lenis** (`lenis/react`) |
| Hero terminal | **Magic UI `Terminal`** (typing sequence, ported to CSS) |
| Headline scramble | **React Bits `DecryptedText`** (plain-CSS variant) |
| Dim hero texture | **React Bits `FaultyTerminal`** or Magic UI `FlickeringGrid`, opacity ≤ 0.06 |
| Day-replay pin + scrub | **Motion `useScroll` + `useTransform`** on a sticky container |
| Decision-log stream | **Aceternity `Sticky Scroll Reveal`** pattern |
| Claude→tool beams | **Magic UI `AnimatedBeam`** |
| ScopeCreep before/after | **Aceternity `Compare`** slider |
| Stats | **Magic UI `NumberTicker`** |
| Hover glow on tool rows | **Magic UI `BorderBeam`** |
| Magnetic CTA | existing `MagneticButton` (keep) |

### 7. Signature wow moment
**The scroll-scrubbed week.** Visitor hits the Operator section, the viewport pins, and
seven days of real autonomous operation replay under their thumb — day ticker, log lines,
morning emails. No other applicant's portfolio can replay a week of their software running
unattended, because no other applicant has the log.

### 8. Risk / effort · what stays custom
**Effort: Medium.** Highest-value-per-hour of the four. Risks: pinned scrub sections are
the #1 place scroll implementations break (must pin at `top top`, must have a mobile
fallback that unpins and shows a static day-by-day list); dark mono-heavy pages can read
"hacker cliché" if the amber discipline slips. **Custom:** curating the decisions log into
~30 replayable beats (content work, not code), the day-scrub state wiring (~150 lines), and
CSS ports of Magic UI pieces. Everything else is assembled.

---

## Direction 2 · "SHOP FLOOR" (exploded machine, R3F)

### 1. Concept + narrative spine
The portfolio as a **machine being assembled**. Robotics mentor + agent builder share one
identity: he designs systems from parts. A single 3D assembly (stylized robot mechanism or
abstract machine of gears, arms, and boards) starts exploded across the viewport and
assembles as the visitor scrolls; each subassembly that clicks into place introduces a
chapter (agents → robotics → leadership → contact). Narrative spine: *parts → subassemblies
→ a working machine → "I also assemble teams" (the mentoring reframe) → ship it.*

### 2. Hero treatment
Light drafting-paper background (evolves the current cream/navy identity rather than
abandoning it). Name set huge in engineering-stencil display type; floating beside/behind it,
the exploded 3D assembly slowly drifting (drei `Float` + `PresentationControls`, so it's
grabbable and spinnable immediately — interactive within 1 second of load). Dimension-line
underline draws itself under the name. Subhead ≤ 20 words.

### 3. Projects, represented interactively
- Each project is a **part callout**: as its subassembly flies together on scroll, an SVG
  leader line draws from the 3D part to a spec panel (title, blurb, real stats, link).
  Feels like an interactive engineering drawing, not a card grid.
- **Robotics section is the star:** photos/video of real robots and students presented as a
  draggable 3D arc gallery, with the Worlds-qualification stat as a machined plaque.
- **Agent projects** get "control board" parts: the MCP registry maps to a PCB-like part
  whose pads light up per tool on hover (drei `Html` annotations anchored in 3D).
- A flat fallback list below the fold serves SEO, reduced-motion, and low-power devices.

### 4. Motion system
- **Scroll choreography:** the entire assembly sequence is one R3F `ScrollControls` scene:
  scroll progress drives part positions (lerped along explode vectors) and camera dolly.
  Between 3D chapters, normal DOM sections scroll conventionally with `whileInView` reveals,
  so the page alternates 3D-pinned / DOM-flow / 3D-pinned rhythm.
- **Micro-interactions:** parts highlight + name themselves on hover (raycast); dimension
  lines and leader lines draw in via SVG path animation; the contact CTA is a big industrial
  toggle that physically flips on click; subtle contact shadows ground the model.

### 5. Color + type
**Bone paper + graphite ink + one safety-orange accent** (`#e8630a` family) — shop-floor
palette, zero relation to AI-slop blues/purples, and a warm evolution of the current site.
3D materials: matte graphite + brushed aluminum with the orange reserved for "active" parts.
Type: **Archivo Expanded or Söhne Breit** for stenciled display, **IBM Plex Mono** for
callout/spec text.

### 6. Component map
| Element | Off-the-shelf |
|---|---|
| 3D runtime | **React Three Fiber + drei** (`ScrollControls`, `useScroll`, `Float`, `PresentationControls`, `ContactShadows`, `Environment`, `Html`) |
| Model | CC0/purchased GLTF robot-arm or gear assembly, re-materialed — do **not** model from scratch |
| Scroll feel | **Lenis** for DOM sections (R3F `ScrollControls` owns its own canvas scroll) |
| Leader-line spec panels | drei `Html` + **Motion** layout animations |
| Robot photo gallery | **React Bits `CircularGallery`** or `DomeGallery` (plain-CSS variant) |
| Draw-in lines | **Motion** SVG `pathLength` animation (built-in) |
| Stats plaques | **Magic UI `NumberTicker`** |
| Section reveals | **Motion `whileInView`** stagger (skill §5.C pattern) |
| Post-processing | `@react-three/postprocessing` (SSAO + slight bloom only on orange) |

### 7. Signature wow moment
**The assembly.** Scroll from hero to contact and a machine builds itself out of the
projects — then the final frame stamps "ASSEMBLED BY OLIVER NGUYEN, 2027" like a nameplate.
The visitor's own scrolling is the assembly line: work + robotics + leadership literally
become one machine.

### 8. Risk / effort · what stays custom
**Effort: High (the moonshot).** Risks: sourcing a good GLTF is make-or-break (a bad model
sinks the whole direction); mobile GPUs need a decimated model + capped DPR; scroll-sync
between R3F `ScrollControls` and DOM Lenis sections needs a clean handoff; 60fps must be
proven in week one or the direction gets cut to a hero-only 3D moment. **Custom:** explode/
assemble keyframe data per part (~a day of tuning), material pass on the model, leader-line
layout. The 3D plumbing itself is all drei.

---

## Direction 3 · "TOOL ROUTER" (the portfolio you can prompt)

### 1. Concept + narrative spine
The portfolio as a **live agent graph the visitor operates**. Premise: "You are the model.
My work is your tool registry." The whole site is one spatial canvas of nodes — projects,
roles, skills — wired with edges. The visitor navigates by *invoking tools*: click a node or
type into an ever-present prompt bar ("show robotics", "what did the loop do on day 4?",
"contact"), and a pulse routes through the graph to the answer. Narrative spine: *you arrive
holding a prompt → the registry reveals what he's built → each invocation returns real
output → the final tool is `contact.send`.*

### 2. Hero treatment
Light, warm off-white canvas with a fine dot-grid (whiteboard/Figma energy — deliberately
NOT a dark AI page). Center: his name as the root node in huge type. On load, edges draw
outward via SVG path animation and 5-6 first-level nodes bloom in with spring physics. A
prompt bar sits docked bottom-center like a command palette, pre-filled placeholder:
`try: "run the week-long loop"`. The hero is the interface; there is no separate hero.

### 3. Projects, represented interactively
- Every project is a **node with an expandable dossier**: click → the graph eases that node
  to center and it morphs (Motion `layoutId`) into a full panel with description, real
  stats, media, and a mini "invocation": e.g. the ScopeCreep node runs its lexicon on a
  sample sentence live in the panel; the Mac-Agent node lists its real MCP tools as
  sub-nodes that light up in sequence.
- **The Operator loop** is a node cluster: seven day-nodes in a ring; invoking it pulses
  through all seven, each flashing its top decision of the day.
- Robotics/mentoring/Eagle live in the same graph as human-labeled nodes — the point being
  the system-builder and the mentor are one connected graph, not separate résumé sections.
- The prompt bar is scripted, not an LLM: ~15 canned intents fuzzy-matched, each mapped to
  a camera move + node invocation. Honest, offline, zero API cost — and it never hallucinates.

### 4. Motion system
- **Scroll choreography:** minimal by design — this direction trades scrolltelling for
  spatial navigation. Scroll/pinch zooms the canvas; a linear "guided tour" autoplays the
  main path for visitors who don't engage within a few seconds (and for the reduced-motion
  and mobile fallback, the graph collapses into a clean vertical list of the same dossiers).
- **Micro-interactions:** edges carry animated bead-pulses when a route is invoked; nodes
  are magnetic and spring on hover; the prompt bar has typewriter placeholder rotation;
  dossier open/close uses shared-layout morph; a subtle click-spark confirms invocations.

### 5. Color + type
**Off-white paper, ink-black nodes and edges, one signal-green accent** (`#0faa5f` family)
strictly reserved for "currently routing" state — the palette of a whiteboard diagram that
came alive. Type: **Geist** for UI and dossiers, **Geist Mono** for node labels and the
prompt bar. Quietest palette of the four; the interaction carries the wow.

### 6. Component map
| Element | Off-the-shelf |
|---|---|
| Canvas pan/zoom + nodes + edges | **React Flow (`@xyflow/react`)** — free, does draggable canvas, custom nodes, edge routing out of the box |
| Edge pulses | React Flow animated edges + **Magic UI `AnimatedBeam`** styling ideas |
| Node → dossier morph | **Motion `layoutId`** shared layout |
| Prompt bar | **cmdk** (command-palette lib) restyled; typewriter placeholder via **Magic UI `TypingAnimation`** |
| Dot-grid canvas | **React Bits `DotGrid`** background (plain-CSS) |
| Node hover physics | **React Bits `Magnet`** + Motion springs |
| Invocation spark | **React Bits `ClickSpark`** |
| Dossier stats | **Magic UI `NumberTicker`** |
| Guided-tour easing | Motion `animate()` camera sequencing on React Flow viewport |

### 7. Signature wow moment
**Prompting the portfolio.** The visitor types "what ran for a week?" and watches the
request route through the graph — pulse traveling edge by edge — until the Operator cluster
lights up and answers with a real log excerpt. The medium is the message: an agent builder
whose portfolio you interact with the way he builds software.

### 8. Risk / effort · what stays custom
**Effort: Medium-high.** Risks: spatial UIs can disorient — the guided tour and the "reset
view" affordance are load-bearing, not nice-to-haves; mobile needs the full list fallback
(graph browsing on a phone is miserable); discoverability of the prompt bar must be tested
on real humans. React Flow is battle-tested, which removes the scariest custom surface.
**Custom:** the intent→route script (~15 entries, mostly content), graph layout data, node
dossier components, camera choreography (~200 lines). No custom canvas math anywhere.

---

## Direction 4 · "CARTRIDGE" (pixel-craft arcade)

### 1. Concept + narrative spine
Lean all the way into the pixel vocabulary already in his identity (the current site's pixel
separators, "PIXEL ART" marquee token) and his age — the one direction that only works
because he's 17. The portfolio as a **cartridge shelf**: each project is a game cartridge
for a fictional console ("ON-01"). Slot a cartridge in and it "boots" into a playable-
feeling vignette with real footage. Serious content, playful chrome: the boot screens
deliver actual stats and real project detail. Narrative spine: *power on → choose cartridge
→ each boot is a real shipped thing → secret level: the robotics/mentoring save file
(co-op mode, 15+ players) → insert coin to contact.*

### 2. Hero treatment
CRT power-on: a scanline flash, then his name renders in chunky pixel display type,
dithering from 8×8 blocks into crisp text (pixel-transition reveal). Behind it, a slow
retro-grid horizon — restrained, two colors, no vaporwave sunset. A pixel sprite of Oliver
(commissioned or self-drawn, he does pixel art) idles beside the name, blinking, with a
walk-cycle triggered as you scroll. Subhead in plain modern sans so credibility anchors
immediately: "I build LLM agents. One ran a project alone for a week."

### 3. Projects, represented interactively
- **Cartridge shelf:** four large cartridges with pixel label art. Hover = tilt + glare
  pull-out; click = the cartridge slides into a console slot, screen "boots" (2-second boot
  chime + logo), then plays the project vignette **as real screen-capture video** framed in
  a CRT bezel with subtle curvature — this is where the video requirement lands. Operator
  loop = timelapse of the log growing over 7 days; ScopeCreep = real extension demo;
  Articlewriter = pipeline output montage; Mac-Agent = terminal session capture.
- Each boot screen shows a "stats card" like a game manual page: real numbers as HP/XP-style
  bars? No — banned (progress-bar slop). Instead pixel-numeral counters and plain lines.
- **Robotics = the co-op save file:** a save-select screen with three slots ("Rookie Teams
  ×3", "Worlds Run", "15+ Players Mentored"), each opening real team photos treated with a
  light dither filter for cohesion.

### 4. Motion system
- **Scroll choreography:** Lenis + a horizontal-pan section for the cartridge shelf
  (vertical scroll pans across the shelf — the one scroll-hijack on the page, built on the
  canonical pin-at-top pattern). Everything else is vertical flow with staggered pixel-
  dissolve reveals (elements resolve from coarse blocks to sharp, echoing the hero).
- **Micro-interactions:** sprite reacts to cursor proximity; cartridges have glare-on-hover;
  buttons depress with a 1-frame chunky shift (no easing — instant, like a sprite swap);
  optional muted 8-bit SFX behind an explicit sound toggle, off by default; konami code
  easter egg unlocks the pixel-art gallery.

### 5. Color + type
**Four-color base palette, Game-Boy-discipline:** deep ink `#1a1c2c`, warm cream `#f4f0e8`,
mid slate, and **one hot coral accent** `#ef5b5b` for interactive states. Strict palette
rationing is what separates "crafted retro" from "retro clutter." Type: **Departure Mono or
Silkscreen** for pixel display moments only; **Hanken Grotesk** (already in the stack) for
all body/reading text — the pixel font never sets a paragraph.

### 6. Component map
| Element | Off-the-shelf |
|---|---|
| Pixel dissolve reveals | **React Bits `PixelTransition`** + Magic UI `PixelImage` |
| Hero grid horizon | **Magic UI `RetroGrid`** (two-color restraint) |
| Cartridge tilt + glare | **React Bits `TiltedCard`** + `GlareHover` |
| Shelf horizontal pan | canonical horizontal-pan skeleton (skill §5.B) or **Motion `useScroll`** transform |
| CRT video frame | **Magic UI `HeroVideoDialog`** as base + a CSS scanline/curvature overlay (small custom shader-free layer) |
| Boot-screen text | **Magic UI `TypingAnimation`** |
| Dither texture on photos | **React Bits `Dither`** background/filter |
| Save-select stagger | **Motion** `staggerChildren` |
| Smooth scroll | **Lenis** |
| Pixel-numeral counters | **Magic UI `NumberTicker`** styled in pixel font |

### 7. Signature wow moment
**Slotting the cartridge.** Grab a cartridge, drop it into the console, hear the click,
watch a real project boot on a CRT — the moment fuses the playful chrome with proof-of-work
video. Admissions readers see charm and shipped software in the same five seconds.

### 8. Risk / effort · what stays custom
**Effort: Medium.** Risks: tone — one notch too cute and it undercuts "trusted an agent
with a week of autonomy"; the fix is the discipline above (pixel type never sets paragraphs,
real stats everywhere, video is real captures). Needs 4 pieces of cartridge label art and a
sprite (he does pixel art — this is a feature, his own art becomes site content, but it's
calendar time). Video capture/editing of four projects is the other real cost. **Custom:**
cartridge-slot interaction (~100 lines of Motion), CRT overlay CSS, label art, video edits.

---

## Recommendation snapshot

| | Wow ceiling | Effort | Mobile story | Uniqueness of claim |
|---|---|---|---|---|
| 1 · Overnight | High | **Medium** | Good (unpins to list) | **Only he has the log** |
| 2 · Shop Floor | **Highest** | High | Hard (GPU budget) | Strong robotics fusion |
| 3 · Tool Router | High | Med-high | Needs full fallback | Medium is the message |
| 4 · Cartridge | High | Medium | **Best** (video scales down) | Only works at 17 |

**CD pick: Direction 1 (Overnight) as the base, stealing Direction 3's prompt bar as its
secondary interaction** — the replay is the strongest un-copyable asset, effort is sane on
the CRA stack, and the prompt bar ("ask the site what the loop did") adds the interactive
layer without a full spatial UI. Direction 4 is the strongest alternate if the priority
shifts from "impressive engineer" to "memorable human." Direction 2 only if there's
appetite for a multi-week build and week-one 3D performance proof.

Next step: pick one direction, then produce `04-blueprint.md` with section-by-section specs,
the component port list (Tailwind→CSS), and the content-gathering checklist (log curation,
video captures, art).
