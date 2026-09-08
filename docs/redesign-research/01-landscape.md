# 01 — Landscape: Elite Developer/AI Portfolio Sites, 2024–2026

Research for the olivernguyen.com redesign. Subject: high-school senior building LLM
agents + MCP tools, robotics mentor (Worlds-qualified team), Eagle Scout. Goal of this
doc: map what the best personal sites actually do, what has curdled into cliché, and
what is worth stealing.

---

## 1. Case studies: the canonical portfolios

### 1.1 rauno.me — Rauno Freiberg (Vercel, design engineer)
**The archetype of "craft blog as portfolio."**
- Near-empty homepage: name, one-line bio, and a list of *interaction craft* essays
  ("Invisible Details of Interaction Design", "Web Interface Guidelines"). The work IS
  the site — every element has obsessive micro-interaction polish.
- Signature moves: spring-physics micro-interactions on hover/press; inline video
  loops (muted, autoplaying, `playsinline`) demonstrating interactions instead of
  static screenshots; a "craft" grid of tiny prototypes (dynamic island experiments,
  drag physics, magnetic elements) each presented as a small looping demo card.
- Typography-first: system-adjacent sans, generous line-height, very narrow measure,
  low-contrast gray-on-near-black. Dark by default.
- Why it works: zero decoration, but *touch anything and it responds beautifully*.
  Credibility comes from demonstrated skill, not claims. The site loads instantly.
- Lesson: **prototypes-as-content**. A grid of small live/looping demos of things you
  built beats a hero animation of nothing.

### 1.2 paco.me — Paco Coursey (Vercel; author of cmdk)
**Radical minimalism + one killer artifact.**
- Essentially a text page: name, role, links, short writing list. Famous for shipping
  **⌘K command menu** (cmdk library) — the site itself historically had a command
  palette as navigation, which thousands of sites then copied.
- Muted palette, no images above the fold, sub-100KB pages. The flex is restraint plus
  one open-source artifact everyone uses.
- Lesson: a **single interactive signature** (his was ⌘K) can carry an entire site's
  identity. Also note: cmd-K menus are now fully commoditized (see §4).

### 1.3 emilkowal.ski — Emil Kowalski (ex-Vercel; Sonner, Vaul; "Animations on the Web" course)
- Portfolio doubles as a storefront for his animation course. Homepage: short intro,
  then interactive animation demos embedded inline — you *feel* the easing curves he
  teaches. Toast (Sonner) and drawer (Vaul) demos run live in-page.
- Heavy use of `motion` (Framer Motion) layout animations, exit animations, and
  spring configs shown with side-by-side "bad vs good" comparisons.
- Lesson: **teach through the site**. Interactive comparisons (linear vs spring, no
  exit animation vs exit animation) are memorable and demonstrate taste explicitly.

### 1.4 brittanychiang.com — Brittany Chiang (Klaviyo)
**The most-forked portfolio on GitHub (v4 repo ~20k stars) — and therefore a trap.**
- v4 (2024-era): single-page, left column fixed (name, role, nav with animated
  indicator), right column scrolls (about, experience list, projects). Navy/slate
  Tailwind palette, subtle **cursor spotlight** (radial-gradient following the mouse).
- Objectively clean and accessible (semantic HTML, focus states, reduced-motion
  respected). But: because tens of thousands of people forked it, the *exact layout* —
  fixed left rail, spotlight cursor, slate-on-navy, "pill" tech tags on hover-lift
  cards — now reads as "I forked a template." Recruiters see it weekly.
- Lesson: study her **content architecture** (experience rows with date ranges, tight
  project cards, accessibility rigor) but do not reproduce the visual system. The
  spotlight-follows-cursor gradient is on the AI-slop list now (§4).

### 1.5 bruno-simon.com — Bruno Simon (Three.js Journey)
**The maximalist landmark: portfolio as a video game.**
- Drive an RC car (Cannon.js physics + Three.js) around a low-poly world; knock over
  blocks that spell out his work. 2024–25 iterations added polish, mobile joystick
  controls, and quality settings.
- It won every award (Awwwards SOTD/Annual) and is the single most-referenced
  "wow" portfolio ever. It also spawned a thousand bad clones.
- Honest assessment: it works *because* his product is literally teaching Three.js —
  the site is a product demo. Load cost is high, content discoverability is poor
  (you must drive to find things), and it's the least accessible famous portfolio.
- Lesson: full-3D-world portfolios only make sense when 3D IS your pitch. For an
  LLM-agent builder, the equivalent "site as product demo" would be an **agent living
  in the site**, not a car.

### 1.6 davidhaz.com — David Hazañas (creative dev; Awwwards SOTD ~2024)
- Known for the viral **"real programming languages" hero** (joke list: HTML, CSS…)
  and heavy WebGL: fluid/smoke cursor-trail simulation over the hero, chunky display
  type, marquee rows, view-transition page morphs, playful copywriting.
- Represents the 2024 "creative dev TikTok" aesthetic: oversized type + WebGL fluid +
  irreverent copy. Screen-recorded constantly on social; the fluid-cursor hero got
  cloned into dozens of YouTube tutorials within months (→ now near-cliché).
- Lesson: humor and personality travel further on social than technical difficulty.
  But any single visual trick that goes viral is fully commoditized within ~6 months.

### 1.7 jhey.dev — Jhey Tompkins (CSS wizard; Google → Shopify)
- Portfolio is a thin index; his real presence is hundreds of CodePen demos (the bear
  mascot, "can't-uncheck" checkboxes, scroll-driven CSS animations). Site features
  playful mascot illustration, wobbly springy hovers, and modern-CSS showpieces
  (`scroll-timeline`, anchor positioning, `@property` gradients) with graceful
  degradation.
- Lesson: **a body of small public experiments compounds**. For a student, a
  "lab/playground" section of 10 tiny demos signals more skill than 2 big case studies.

### 1.8 henryheffernan.com — Henry Heffernan (2022, still the reference for "OS portfolios")
- Simulated vintage Windows-98-style computer in Three.js: you look at a CRT monitor
  running an interactive OS with working apps (Doom, videos, his résumé). SOTD winner.
- Spawned the "portfolio as operating system" genre: macOS-clone portfolios
  (dustinbrett.com runs actual apps incl. Doom and a local LLM chat; countless
  React "macOS desktop" portfolios on GitHub). By 2025 the OS-clone is its own
  template category — impressive to civilians, eye-roll to hiring engineers unless
  the execution is extraordinary.

### 1.9 Awwwards-tier agency/personal sites shaping 2024–2026 taste
- **lusion.co** (agency) — R3F/WebGPU showreel site; per-element 3D that reacts to
  scroll and cursor; the benchmark for "premium tech" motion. Their work popularized
  ballpit/physics hero toys.
- **dennissnellenberg.com** (freelancer, Site of the Year candidate era) — the source
  of the now-ubiquitous **magnetic buttons + rounded-corner page-transition curtain +
  "location/time" footer ticker** freelancer aesthetic. Cloned endlessly via a famous
  YouTube tutorial; treat its exact moves as saturated.
- **Igloo Inc** (igloo.inc, Awwwards Site of the Year 2024) — cinematic WebGL
  (ice/glass refraction, scroll-driven camera). Set the 2025 bar for "scroll as
  camera dolly" storytelling.
- **Active Theory** (activetheory.net) — long-standing WebGL house; portal/immersive
  navigation patterns.
- **basement.studio** — brutalist-luxe: giant condensed type, harsh black/white,
  scanline/CRT textures, hover-to-play video reels.
- **Niccolò Miranda** (niccolomiranda.com) — SOTD personal site: retro-futurist,
  hand-drawn touches, exquisite type-in/preloader choreography.
- **Robb Owen** (robbowen.digital) — warm, illustrated, personality-forward; proof
  that "crafted, not flashy" also wins awards.
- **Adham Dannaway** (adhamdannaway.com) — the split "designer/coder" half-face hero;
  iconic but now a known trope.
- Trend note 2025–26: Awwwards personal-site winners increasingly split into two
  camps: (a) cinematic WebGL/WebGPU scroll films, and (b) hyper-edited "digital
  garden / editorial" sites with perfect typography and almost no ornament. The
  middle (generic parallax + gradient blobs) wins nothing.

### 1.10 Adjacent references worth knowing
- **linusrogge.com, benji.org, joshwcomeau.com** — editorial/personal-tone sites;
  Comeau's interactive-article widgets (sliders that manipulate live demos) are the
  gold standard for "explain by letting the reader touch it."
- **antfu.me** — open-source-first portfolio; contribution graph + projects grid;
  the model for "my GitHub is the portfolio, the site is a lens."
- **Vercel/Linear design-engineer aesthetic** (linear.app style): dark, grain,
  glass, precise 1px borders, `Inter`/`Geist`, subtle glow — massively influential
  and now the default look of every AI startup (→ risk of looking like slop, §4).

---

## 2. Technique inventory (what elite sites actually do)

### 2.1 Hero treatments
| Pattern | Examples | 2026 status |
|---|---|---|
| Text-only, tiny, confident ("I'm X. I build Y.") | paco.me, rauno.me, benji.org | Evergreen; reads senior |
| Oversized display type filling viewport, name as texture | basement.studio, davidhaz.com | Strong if type is custom/variable |
| WebGL object/scene as hero | lusion.co, igloo.inc | Elite-only; expensive to do well |
| Interactive toy in hero (physics, fluid, particles) | davidhaz (fluid), lusion (ballpit) | Fluid sim = near-cliché; bespoke toys still land |
| Live "proof" hero (terminal, running demo, agent chat) | rare — mostly AI-tool startups | **Open lane for an agent builder** |
| Split persona hero | adhamdannaway.com | Trope; avoid |
| Preloader → type reveal choreography | niccolomiranda.com, dennissnellenberg | Saturated (esp. % counters) |

### 2.2 Scroll choreography
- **Scroll-as-camera** (GSAP ScrollTrigger scrub or R3F camera on scroll): igloo.inc,
  lusion. Cinematic; huge effort; kills skim-reading if overdone.
- **Pin + horizontal gallery** for project reels: everywhere since 2022; fine in
  small doses, hated when it hijacks the wheel.
- **CSS scroll-driven animations** (`animation-timeline: scroll()/view()`): jhey.dev
  demos; the 2025+ way to do reveals with zero JS and free `prefers-reduced-motion`
  handling. Progressive enhancement — Safari support landed late, so keep fallbacks.
- **Reveal-on-view fade/translate**: universal; only offensive when *every* element
  staggers in 100ms apart (the "everything floats up" AI-slop tell).
- **Text effects**: per-line masked reveals (SplitText/Splitting.js) still read
  premium; per-character scramble/decrypt and word-by-word opacity scroll (the
  "Apple keynote paragraph") are both now overdone.

### 2.3 WebGL / 3D
- Stack of choice: **React Three Fiber + drei**, GSAP for orchestration; Spline for
  no-code embeds (Spline embeds are heavy and increasingly recognizable → slop-ish).
- 2025–26 frontier: **WebGPU/TSL** experiments, gaussian-splat scenes, shader
  distortion on images (hover ripple, pixelation transitions — bruno's ogl demos,
  Codrops tutorials).
- Tasteful mid-tier move: one small 3D object (keyboard, robot, artifact from your
  actual work) with cursor parallax — not a whole world.
- For this project: a **low-poly robot** (robotics mentorship) or a 3D-rendered
  MCP/agent graph could be the single 3D artifact. A whole bruno-simon world: no.

### 2.4 Cursor effects
- Custom dot/ring cursors with magnetic pull: dennissnellenberg lineage → saturated.
- Cursor spotlight/torch (radial gradient reveal): brittanychiang v4 → template tell.
- Image/video trail following cursor over project titles ("hover a title, a
  screenshot chases the mouse"): premium agencies still use it well.
- Fluid/smoke/particle trails: viral 2024, tutorial-ized to death.
- 2026 taste: keep the native cursor; spend the effort on **element response**
  (magnetic nav links done subtly, hover states with intent) rather than cursor
  replacement. Cursor effects also do nothing on mobile (~60% of first visits).

### 2.5 Page transitions
- **View Transitions API** (Next.js/Astro support 2024+): shared-element morphs
  (project card → project hero) with ~30 lines of code. This is the modern move —
  native, cheap, degrades gracefully.
- Curtain/wipe overlays with rounded SVG edge (dennissnellenberg style): saturated.
- Full preloaders with percentage counters on a text site: an anti-pattern —
  don't make users wait for content that's already loaded.

### 2.6 Project showcase patterns
- **List view with hover media** (big typographic index rows; hovering shows a
  floating screenshot/video): the current premium default (basement, many SOTDs).
- **Live embeds/loops instead of screenshots**: rauno's craft grid; for agent/MCP
  work, terminal recordings (asciinema or styled `<video>`) and short screen
  captures massively outperform static images.
- **Case study depth**: elite sites show 2–4 deep case studies (problem → decisions
  → artifacts → outcome/metrics), not 12 shallow cards. For a student: numbers
  (users, stars, latency, Worlds ranking) do heavy lifting.
- **Bento grids**: Apple-derived, everywhere in 2024, now the #1 AI-slop layout tell
  when used as decoration. Acceptable only if each cell is a real interactive demo.
- **The "proof strip"**: GitHub stars, npm downloads, awards inline with the
  project — small, factual, effective.

### 2.7 Video usage
- Muted autoplay loops (`<video autoplay muted loop playsinline>`, poster attr,
  lazy-loaded, ≤2–3MB H.265/AV1 with H.264 fallback) demoing UI — the single
  highest-ROI media technique on modern portfolios (rauno, emil).
- Hover-to-play on project rows; scroll-scrubbed video (Apple style) is expensive
  and mostly wasted on portfolios.

### 2.8 Sound
- Rare and mostly off by default. Done well: subtle UI ticks behind an explicit
  toggle (some Awwwards sites); jhey occasionally. Autoplaying audio = instant
  close. Verdict: skip, or ship one tiny opt-in easter-egg sound.

### 2.9 Easter eggs
- Konami code (jhey and many others), hidden CLI/terminal (`~` opens a shell),
  cmd-K secret commands, console.log ASCII art + hiring note (extremely common but
  still charming), pet/mascot that reacts (jhey's bear), click-counter toys.
- For an agent builder the elite move: an **actual working chat agent easter egg**
  ("talk to my site — it's running my own MCP tools") — on-brand, rare, memorable,
  and doubles as a live demo. Cost: API keys, rate limiting, prompt-injection care.

---

## 3. What makes a portfolio memorable vs templated

**Memorable ones share:**
1. **One signature interaction** owned completely (bruno's car, paco's ⌘K, henry's
   OS, rauno's craft loops) — not ten borrowed tricks.
2. **The medium demonstrates the pitch.** Three.js teacher → 3D site. Animation
   teacher → animated comparisons. Therefore: agent builder → site with a working
   agent / live tool calls. This is the strongest strategic insight in this doc.
3. **Specific voice.** Real sentences ("I taught a robotics team that qualified for
   Worlds"), humor, opinions — vs "Passionate developer crafting delightful
   experiences" (slop bingo).
4. **Evidence over adjectives.** Live demos, videos, metrics, shipped links.
5. **Restraint everywhere except the signature.** Elite sites are 90% quiet
   typography and 10% showpiece; templated sites spread 3/10-quality effects on
   everything.
6. **Speed.** rauno/paco load instantly; nothing says "craft" like a site that
   responds in 50ms.

**Templated ones share:** forked layout (brittanychiang rail, dennissnellenberg
curtains, macOS clone), stock effect stack (spotlight cursor + tilt cards + blob
gradients + scroll-fade-everything), generic copy, skills listed as icon walls or
percentage bars (never do skill bars), dark navy + purple gradient on `Inter`.

---

## 4. The 2025–26 AI-slop / cliché list (patterns that now signal "generated")

1. **Purple/indigo→pink gradient on dark navy**, glowing blob backgrounds, glassmorphic cards — the default output of every AI site generator.
2. **Bento grid as decoration** (cells with icons + three words, nothing interactive).
3. **Cursor spotlight gradient** following the mouse (brittanychiang-fork tell).
4. **Everything fades up on scroll** with identical stagger; AOS-library feel.
5. **Typewriter hero** ("I'm a developer | designer | creator…") and per-character text scramble.
6. **3D tilt cards** (vanilla-tilt) and generic particles.js starfields.
7. **Skill percentage bars / icon walls** ("HTML 95%").
8. **macOS/Windows desktop clone** without extraordinary execution.
9. **cmd-K palette that only does navigation** — commoditized; fine as garnish, not signature.
10. **Preloader percentage counter + curtain page transitions + magnetic custom cursor** combo (the tutorial-clone stack).
11. **"Crafting delightful digital experiences" copywriting** and AI-written case studies with the em-dash-heavy triad cadence.
12. **Marquee tech-logo tickers** and testimonial walls on a personal site.
13. **Spline hero embeds** of floating abstract shapes unrelated to the work.
14. **Fluid/smoke cursor simulation** heroes (post-davidhaz clone wave).
15. **Fake terminal that isn't real** — typed-out `npm install me` gags with no substance (ironic risk for this project: if we do terminal aesthetics, the terminal must actually work).

---

## 5. Performance & accessibility pitfalls of heavy animation

**Performance**
- WebGL heroes: 1–5MB+ JS/asset payloads; GPU cost tanks low-end mobile; battery
  drain. Mitigate: lazy-init after first paint, cap DPR at ~1.5–2, pause on
  `visibilitychange`/off-viewport, quality tiers (bruno-simon does this), and a
  static poster fallback. Test on a mid-range Android, not an M-series Mac.
- Scroll-jacking (Lenis/Locomotive smooth-scroll + scrub): breaks find-in-page,
  keyboard scroll, and scrollbar affordance; adds main-thread jank. If used, keep
  native scrollbar and never intercept wheel delta for horizontal sections.
- Layout-thrashing animations: animate only `transform`/`opacity`; use
  `will-change` sparingly; avoid animating filters/box-shadow on large surfaces.
- LCP/INP: hero videos and canvases can wreck Core Web Vitals — preload poster,
  defer canvas, keep hero text as real DOM text (also for SEO/AI-crawler
  legibility; recruiters increasingly ask ChatGPT about candidates — make the
  site parseable: real text, SSR, no text-in-canvas).
- Font games: variable font > multiple weights; `font-display: swap` with
  size-adjusted fallback to kill CLS.

**Accessibility**
- `prefers-reduced-motion` is non-negotiable: gate ALL scroll choreography,
  parallax, autoplay video, and canvas motion behind it (CSS scroll-driven
  animations + `@media (prefers-reduced-motion)` make this nearly free).
  Vestibular-disorder users get physically ill from parallax/zoom scrub.
- Custom cursors break for touch, keyboard, and screen-reader users; ensure focus
  styles exist independent of hover effects. Magnetic buttons must keep stable
  hit-targets.
- Canvas/WebGL content is invisible to AT — mirror all information in DOM text.
- Text split into per-char spans for animation garbles screen readers — use
  `aria-label` on the container and `aria-hidden` on the spans.
- Autoplay video needs `prefers-reduced-motion` respect + pause control; flashing
  effects must stay under 3 flashes/sec.
- Contrast: the fashionable gray-on-black (#888 on #0a0a0a) often fails WCAG AA —
  brittanychiang notably fixed this in her v4 rebuild after feedback.

---

## 6. Ranked shortlist — 10 steal-worthy patterns

1. **Working agent as the signature interaction** — a real chat/command surface
   wired to his actual MCP tools ("ask my site to query my projects"). Medium =
   message; nobody credible in the personal-portfolio space owns this yet.
   (Lineage: paco's ⌘K + dustinbrett's local LLM + rauno's "site as proof".)
2. **Craft/lab grid of small live demos** (rauno.me) — 6–12 cards, each a looping
   video or live embed of an agent run, MCP tool, robot code, CSS toy. Compounds
   forever; perfect for a student's breadth.
3. **Muted autoplay video loops instead of screenshots** everywhere a project is
   mentioned (rauno/emil) — terminal recordings for agent work, robot footage for
   robotics.
4. **Typographic project index with hover media** (basement/SOTD pattern) — big
   type rows; hover floats a screenshot/video; clicks use View Transition morphs.
5. **View Transitions API for card→page morphs** — modern, cheap, native,
   accessible; replaces curtain transitions entirely.
6. **Interactive explainers in case studies** (joshwcomeau/emil) — e.g. a slider
   showing agent reasoning steps, a "run this tool" button in the MCP write-up.
7. **One bespoke 3D artifact, not a world** — a small R3F low-poly robot (Worlds
   team) with cursor parallax in the about section; lazy-loaded, poster fallback.
8. **Quiet editorial base layer** (rauno/paco/benji): confident small hero, tight
   measure, generous whitespace, real sentences, instant loads — 90% of the site.
9. **Proof strip + metrics discipline**: stars, downloads, Worlds qualification,
   Eagle Scout, latency numbers — inline, factual, small type.
10. **One genuinely working easter egg** — console ASCII + a hidden terminal that
    is REAL (runs a constrained agent). Ship one, polish it, resist adding more.

## 7. Five patterns to avoid

1. **The template stack**: cursor spotlight/custom cursor + tilt cards + purple
   gradient blobs + fade-up-everything + typewriter hero. Any one of these reads
   as forked/AI-generated in 2026.
2. **Full 3D world / OS-clone portfolio** (bruno-simon, henryheffernan copies) —
   off-pitch for an agent builder, heavy, low content discoverability, and the
   genre is saturated.
3. **Scroll-jacking cinematics** — smooth-scroll hijack + pinned percent-counter
   preloader + curtain transitions (dennissnellenberg clone stack). Saturated and
   hostile to skimming recruiters.
4. **Decorative bento grids, skill bars, tech-logo icon walls, marquee tickers** —
   filler that signals "nothing real to show."
5. **Fake interactivity** — a terminal that only types a canned joke, a ⌘K that
   only navigates, a "chat" that's scripted. For someone whose pitch is *real
   agents*, anything fake is brand damage; every interactive element must
   actually work.

---
*Sources: training knowledge of the named sites through 2025 (rauno.me, paco.me,
emilkowal.ski, brittanychiang.com, bruno-simon.com, davidhaz.com, jhey.dev,
henryheffernan.com, dustinbrett.com, lusion.co, dennissnellenberg.com, igloo.inc,
activetheory.net, basement.studio, niccolomiranda.com, adhamdannaway.com,
joshwcomeau.com, antfu.me), Awwwards SOTD/Annual patterns 2024–2025, and Codrops/
tutorial-ecosystem diffusion of effects. Verify current-state details live before
copying any specific implementation.*
