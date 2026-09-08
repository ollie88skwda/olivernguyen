# Redesign research 02 — Component sourcing: libraries & registries

**Constraint from owner:** minimize custom-built code. Source from libraries and copy-paste registries.

**Audited stack (verified in repo, 2025):**

- Create React App (`react-scripts ^5.0.1`), **CRA is officially sunset** (Feb 2025 deprecation)
- React `18.3.1` / ReactDOM `18.3.1`
- `react-router-dom ^5.2.0` — v5 API (`Switch`, `useHistory`), 14 routes in `src/Routes.js`, several gated (Clerk via `ClerkBridge` + `routerPush/routerReplace` wired to v5 `useHistory`; passphrase gates on `/major` and `/apply`)
- **Plain CSS** (`src/styles/*.css`, per-page stylesheets). No Tailwind anywhere (`yarn.lock` confirms).
- `motion ^11.17.0` already installed; code imports `framer-motion` (resolves to 11.18.2 transitively). Used in `home.js`, `WordReveal`, `Reveal`, `TiltCard`, etc.
- `zustand`, `@clerk/react`, Supabase, CodeMirror (essay studio), `react-helmet-async`
- Deployed on **Vercel** with `framework: null`, SPA rewrite to `index.html`, serverless functions in `/api` (independent of CRA — survives any frontend migration)
- 97 JS files with JSX in `.js` extension (zero `.jsx`/`.tsx`), 3 static `REACT_APP_*` env vars plus one dynamic `process.env.REACT_APP_...` access pattern in `src/auth/api.js`-land
- Hand-rolled components that libraries would replace outright: `Marquee`, `TiltCard`, `MagneticButton`, `WordReveal`, `Reveal`, `ScrollProgress`, `Tooltip`

The site is a client-heavy SPA. Nothing here needs SSR.

---

## 1. Magic UI — magicui.design

**What it is:** shadcn-style copy-paste registry of ~150 animated marketing/portfolio components. Code lands in your repo; you own it.

**Portfolio-grade components by name:**

- **Effects/decorations:** Marquee, Globe (WebGL, built on `cobe`), Particles, Meteors, Border Beam, Shine Border, Magic Card (cursor-tracking gradient border), Animated Beam, Orbiting Circles, Ripple, Retro Grid, Dot Pattern, Grid Pattern, Flickering Grid, Warp Background, Confetti (canvas-confetti), Cool Mode, Lens, Scratch To Reveal
- **Text:** Text Reveal (scroll-driven), Sparkles Text, Word Rotate, Typing Animation, Hyper Text (scramble), Morphing Text, Number Ticker, Blur Fade, Text Animate, Aurora Text, Line Shadow Text
- **Layout/UI:** Bento Grid, Dock (macOS-style magnify), Animated List, Terminal, File Tree, Icon Cloud, Avatar Circles, Tweet Card, Hero Video Dialog, Scroll Progress, Safari / iPhone / Android mockups
- **Buttons:** Shimmer Button, Rainbow Button, Ripple Button, Pulsating Button, Interactive Hover Button, Animated Subscribe Button

**Install model:** shadcn CLI — `npx shadcn@latest add "https://magicui.design/r/marquee"` — or manual copy-paste. Not an npm package.

**Hard dependencies:** **Tailwind (now targets v4)** + the shadcn `cn()` utility (`clsx` + `tailwind-merge`). Uses `motion` (Framer Motion) internally for most animated pieces; Globe needs `cobe` (WebGL); Confetti needs `canvas-confetti`. React 18 fine; **Next.js NOT required** (works on Vite/CRA if Tailwind exists).

**License/cost:** MIT, free. "Magic UI Pro" sells full page templates (~$149 one-time) — not needed for components.

**CRA compat today:** ❌ blocked solely by Tailwind. Every component is authored in Tailwind utility classes; hand-porting to plain CSS = custom work, which violates the constraint.

---

## 2. Aceternity UI — ui.aceternity.com

**What it is:** the biggest "wow-effect" copy-paste collection (~100 components), heavily used in dev portfolios. shadcn-compatible registry.

**Portfolio-grade components by name:**

- **Hero backgrounds:** Background Beams, Background Beams With Collision, Aurora Background, Vortex, Sparkles (tsparticles-based), Spotlight / Spotlight New, Lamp Effect, Wavy Background, Shooting Stars, Glowing Stars, Meteor Effect, Grid and Dot Backgrounds, Background Gradient Animation, Background Lines, Canvas Reveal Effect
- **Scroll-driven:** Container Scroll Animation (tilting screenshot hero), MacBook Scroll, Sticky Scroll Reveal, Tracing Beam, Parallax Scroll, Hero Parallax, Timeline, Google Gemini Effect, Scroll-based Velocity
- **Cards:** 3D Card Effect (tilt), Card Hover Effect, Evervault Card, Glare Card, Wobble Card, Focus Cards, Card Stack, Expandable Cards, Apple Cards Carousel, Draggable Card, 3D Pin
- **Text:** Typewriter Effect, Text Generate Effect, Flip Words, Text Hover Effect, Colourful Text, Cover, SVG Mask Effect
- **Nav/misc:** Floating Navbar, Resizable Navbar, Navbar Menu, Infinite Moving Cards (marquee), Animated Testimonials, Animated Tooltip, Moving Border, Hover Border Gradient, Placeholders And Vanish Input, Multi Step Loader, Compare, Lens, Link Preview, Following Pointer, Images Slider, Direction Aware Hover, Layout Grid, World Map, **GitHub Globe** (three.js + `three-globe`), 3D Marquee, Signup Form, File Upload

**Install model:** copy-paste or shadcn CLI (`npx shadcn@latest add https://ui.aceternity.com/registry/...`). Not an npm package.

**Hard dependencies:** **Tailwind** + `motion`/`framer-motion` on nearly everything. A few need extras: GitHub Globe → `three` + `three-globe` + `@react-three/fiber`; Sparkles → `@tsparticles/react` + `@tsparticles/slim`; Vortex → simplex-noise; Link Preview → microlink. React 18 OK. **Next.js not required** (docs show Next but components are plain React + Tailwind; swap `next/image`/`next/link` for `img`/`a` — trivial).

**License/cost:** free components are MIT-style free-to-use; **Aceternity UI Pro** is paid (templates + premium blocks, ~$149+ tiers). Everything named above is in the free tier.

**CRA compat today:** ❌ Tailwind-blocked, same as Magic UI.

---

## 3. shadcn/ui + registry ecosystem

**What it is:** the de-facto copy-paste component standard. `shadcn` CLI installs component source into your repo from **any** compatible registry — this is the key strategic point: one CLI unlocks Magic UI, Aceternity, and dozens more.

**Core components (structural, not flashy):** Button, Card, Dialog, Sheet, Drawer (Vaul), Tabs, Accordion, Dropdown Menu, Navigation Menu, Tooltip, Popover, Command (⌘K palette), Sonner (toasts), Carousel (Embla), Skeleton, Badge, Avatar, Separator, Scroll Area, Form. Built on Radix primitives (new "base" components on Base UI). Would replace the hand-rolled `Tooltip` and give the redesign solid a11y-correct structure for free.

**Notable third-party registries (all shadcn-CLI installable, all Tailwind):**

- **Motion Primitives** (motion-primitives.com, MIT) — Text Effect, Text Loop, Text Shimmer, Animated Number, Sliding Number, Infinite Slider, Accordion, Dialog, Cursor, Dock, Carousel, In View, Scroll Progress, Tilt, Magnetic, Spotlight, Border Trail, Glow Effect, Morphing Dialog. Tasteful, less "AI-slop" than the flashier kits — strong fit for a personal site.
- **Origin UI** (originui.com, MIT) — 500+ plain Tailwind copy-paste building blocks (inputs, navbars, tables).
- **Cult UI**, **Animata**, **Skiper UI**, **Kibo UI** — more animated blocks, same model.
- **tweakcn** — theme generator for shadcn tokens.

**Install model:** `npx shadcn@latest init` then `add`. **Vite is an officially documented install target** (docs include a Vite guide) — Next.js NOT required.

**Hard dependencies:** **Tailwind (v4 default; v3 still supported by CLI)**, React 18+. Radix works with React 18.

**License/cost:** MIT, free.

**CRA compat today:** ❌ Tailwind-blocked, and the CLI has no CRA guide (CRA is dead upstream).

---

## 4. React Bits — reactbits.dev

**What it is:** ~110 animated React components, and **the only major registry that ships every component in 4 variants: JS or TS × Tailwind or PLAIN CSS.** This is the single best CRA-compatible source in this entire catalog.

**Portfolio-grade components by name:**

- **Text animations:** Split Text, Blur Text, Shiny Text, Gradient Text, Decrypted Text, Scramble Text, Rotating Text, Circular Text, Text Pressure (variable-font weight on hover), Variable Proximity, Falling Text, Glitch Text, Fuzzy Text, Count Up, ASCII Text, True Focus, Text Trail, Curved Loop, Scroll Reveal, Scroll Float, Scroll Velocity Text
- **Backgrounds:** Aurora, Beams, Silk, Iridescence, Hyperspeed, Lightning, Dither, Faulty Terminal, Letter Glitch, Grid Motion, Squares, Waves, Particles, Threads, Orb, Ballpit, Liquid Chrome, Dark Veil, Galaxy, Prism, Ribbons, Dot Grid, Grid Distortion
- **Components:** Tilted Card, Spotlight Card, Magnet, Dock, Masonry, Carousel, Stack, Card Swap, Bounce Cards, Chroma Grid, Pixel Card, Glass Icons, Gooey Nav, Fluid Glass, Profile Card, Infinite Scroll, Flying Posters, Elastic Slider, Stepper, Counter, Folder, Lanyard (3D badge — R3F + rapier physics), Model Viewer
- **Cursor/interaction:** Splash Cursor, Blob Cursor, Click Spark, Crosshair, Magnet Lines, Pixel Trail, Meta Balls, Star Border, Noise, Shape Blur, Target Cursor, Cubes

Direct replacements for existing hand-rolled code: Tilted Card → `TiltCard`, Magnet → `MagneticButton`, Split/Blur Text → `WordReveal`/`Reveal`.

**Install model:** copy-paste from site, or CLI: `jsrepo` and shadcn-CLI-compatible registry paths per variant (e.g. `npx jsrepo add https://reactbits.dev/default/TextAnimations/SplitText`). Not an npm package.

**Hard dependencies:** varies per component — text animations mostly **GSAP** or `motion`; many backgrounds use **OGL** (lightweight WebGL, ~30KB) or `three`; Lanyard needs `@react-three/fiber` + `drei` + `rapier`. Each component page lists its deps. React 18 fine. **No Tailwind needed if you pick the CSS variant. No Next.js.**

**License/cost:** free; repo is MIT + Commons Clause (free for personal/commercial use in your projects; you can't resell the collection itself). Fine for this site.

**CRA compat today:** ✅ **works right now** (JS + CSS variants). Only caveat: per-component deps (gsap, ogl, three) must be `yarn add`-ed as prompted.

---

## 5. Motion (Framer Motion) — motion.dev

**Already installed** (`motion@11`, imported as `framer-motion`). npm package, MIT, free. React 18 fully supported; v12 (`motion/react` import) is a drop-in upgrade from 11.

**What it offers:** `motion.*` components, `AnimatePresence` (route/page transitions — works with react-router v5), layout animations & shared layout, `useScroll`/`useTransform`/`useSpring` (scroll-linked effects), `useInView`, `whileHover/whileTap/whileInView`, springs, gestures, `stagger`. This is the animation engine Magic UI, Aceternity, and Motion Primitives components run on, so it's a dependency you'd keep regardless.

**Motion+** (paid, ~$299 lifetime): premium APIs/components — `Cursor`, `AnimateNumber`, `Ticker`, `Carousel`, splitText. Optional; not needed.

**CRA compat:** ✅ already in use. Recommend consolidating on `motion@12` and the `motion/react` import path during the redesign.

---

## 6. Lenis — smooth scroll (darkroom.engineering)

npm `lenis` (formerly `@studio-freight/lenis`). MIT, free. Framework-agnostic; official React binding `lenis/react` (`<ReactLenis root>`). ~4KB. Zero Tailwind/Next/WebGL requirements.

The standard "expensive-feeling site" scroll. Integrates with GSAP ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`) and with Motion's `useScroll` out of the box. **CRA compat: ✅ works today.** Note: keep native scroll on CodeMirror/essay-studio routes (Lenis can wrap only the marketing pages, or use `data-lenis-prevent`).

---

## 7. Lucide icons

npm `lucide-react`. ISC license, free. 1,600+ icons, tree-shakable per-icon imports, stroke-based, consistent 24px grid. No Tailwind/Next deps; React 18 fine. The default icon set of the entire shadcn ecosystem, so adopting it now aligns with any future registry use. **CRA compat: ✅ works today.**

---

## 8. GSAP — greensock.com / gsap.com

npm `gsap` + `@gsap/react` (`useGSAP` hook).

**Licensing situation (important, changed 2025):** after the Webflow acquisition, **GSAP 3.13+ is 100% free for all use including commercial, and ALL formerly-paid Club plugins are now free on npm**: SplitText, ScrollTrigger, ScrollSmoother, DrawSVG, MorphSVG, MotionPath, Flip, Observer, Draggable, ScrambleText, etc. The license is the GSAP "Standard License" (proprietary but no-charge) — not OSS, but free; the only restriction is repackaging/reselling GSAP itself. No cost, no club membership anymore.

**Portfolio-grade capabilities:** ScrollTrigger (pinning, scrubbing, stacked sections), SplitText (line/word/char reveals — best-in-class), ScrollSmoother (alternative to Lenis), Flip (layout transitions), timelines. React Bits' text components depend on it, so it likely enters the stack anyway.

**Hard deps:** none. Works with plain CSS, React 18, CRA. **CRA compat: ✅ works today.**

Caution: GSAP + Motion both running is fine (React Bits does it), but pick one per concern — Motion for component/UI animation, GSAP for scroll choreography — to avoid two scroll systems fighting.

---

## 9. three.js + React Three Fiber + drei

npm `three` (MIT) + `@react-three/fiber` (MIT) + `@react-three/drei` (MIT). Free.

**Version constraint that matters here:** R3F **v9 requires React 19**. On React 18 you must pin `@react-three/fiber@^8` and `@react-three/drei@^9`. Works, but you're on the maintenance branch until a React 19 bump.

**Portfolio-grade drei helpers by name:** `Float`, `MeshDistortMaterial`, `MeshTransmissionMaterial` (glass), `Environment`, `ContactShadows`, `Text3D`, `ScrollControls`, `Sparkles`, `Stars`, `Clouds`, `CameraControls`/`OrbitControls`, `Html`, `useGLTF`. Enables Aceternity's GitHub Globe and React Bits' Lanyard/Model Viewer.

**Cost of entry:** WebGL; ~150KB+ gzip for three core before scene code; real custom scene work is *custom code* unless you only mount prebuilt registry components. **CRA compat: ✅ builds fine on CRA 5** (ESM `three/examples/jsm` handled). Recommendation: only via prebuilt components (React Bits/Aceternity), not bespoke scenes — bespoke violates the constraint.

Lightweight alternative for the classic hero globe: **cobe** (npm, MIT, ~5KB, no react dep issues, no Tailwind) — the same lib Magic UI's Globe wraps.

---

## 10. tsParticles

npm `@tsparticles/react` + `@tsparticles/slim` (or `@tsparticles/engine`, `@tsparticles/all`). MIT, free. Canvas-based (no WebGL requirement). Presets by name: links/network, stars, snow, fireworks, confetti, sea-anemone; JSON-config driven. Powers Aceternity's Sparkles. React 18 fine, no Tailwind/Next. **CRA compat: ✅ works today.** Note: Magic UI/React Bits "Particles" components are usually lighter bespoke canvas — prefer those if already adopting a registry; use tsParticles only if you want config-driven variety.

---

## 11. Rive — rive.app

npm `@rive-app/react-canvas` (or `-webgl2`). Runtime MIT, free. **But** animations are `.riv` files authored in the Rive editor — free tier exists (with limits), paid plans ($) for teams/advanced features. State-machine interactivity (cursor-following characters, animated buttons) is its superpower; runtime is small (WASM). React 18 fine, no Tailwind. **CRA compat: ✅ runtime works today.**

Honest fit: unless you buy/find a ready-made `.riv` from the Rive community/marketplace, this shifts custom work from code to a design tool. **Skip unless a specific community asset fits.**

---

## 12. Lottie

npm `lottie-react` or (preferred, smaller) `@lottiefiles/dotlottie-react`. Runtimes MIT, free. Plays After Effects/LottieFiles JSON/`.lottie` animations. Huge free asset library on lottiefiles.com (free assets under Lottie Simple License; marketplace has paid). Good for micro-illustrations (loaders, empty states, 404), weak for premium hero moments (tends to look stock). React 18, no Tailwind/Next. **CRA compat: ✅ works today.**

---

## 13. Spline — spline.design

npm `@splinetool/react-spline` (runtime MIT). Scenes built in the Spline web editor: free tier (public scenes, Spline watermark/logo on some embeds, limited exports), paid from ~$12/mo for watermark-free/private. Drag-drop 3D with mouse-follow interactivity — the "3D hero without writing three.js" option. Runtime is heavy (~multi-hundred-KB, three-based) and scenes load from Spline's CDN unless self-hosted. React 18 fine. **CRA compat: ✅ works today.**

Fit: fastest path to an interactive 3D hero with zero code, but performance cost is real and free-tier branding is a downside. Optional.

---

## 14. Other strong candidates (no-Tailwind friendly)

| Library | npm | License | What it gives | CRA today |
|---|---|---|---|---|
| **cobe** | `cobe` | MIT | The dotted WebGL globe (Magic UI Globe's engine), 5KB | ✅ |
| **number-flow** | `@number-flow/react` | MIT | Best-in-class animated numbers/counters, zero deps, plain CSS | ✅ |
| **Embla Carousel** | `embla-carousel-react` | MIT | Carousels (shadcn's engine), unstyled | ✅ |
| **canvas-confetti** | `canvas-confetti` | ISC | Confetti bursts (Magic UI Confetti's engine) | ✅ |
| **Sonner** | `sonner` | MIT | Toasts, ships own styles, no Tailwind needed | ✅ |
| **Vaul** | `vaul` | MIT | iOS-style drawers (needs its CSS; Tailwind-optional) | ✅ |
| **OGL** | `ogl` | MIT | Lightweight WebGL lib React Bits backgrounds use | ✅ |

---

## Compatibility matrix (current CRA stack, no changes)

| Source | Usable today? | Blocker |
|---|---|---|
| React Bits (CSS variants) | ✅ | none |
| Motion / Framer Motion | ✅ (installed) | none |
| Lenis | ✅ | none |
| Lucide | ✅ | none |
| GSAP (all plugins, free) | ✅ | none |
| tsParticles | ✅ | none |
| three + R3F v8 + drei v9 | ✅ | pin v8/v9 for React 18 |
| Lottie / Rive / Spline runtimes | ✅ | asset authoring, not code |
| cobe, number-flow, embla, canvas-confetti, sonner | ✅ | none |
| **Magic UI** | ❌ | Tailwind |
| **Aceternity UI** | ❌ | Tailwind |
| **shadcn/ui + registry ecosystem** | ❌ | Tailwind (+ dead CRA tooling) |
| Motion Primitives / Origin UI / Cult UI | ❌ | Tailwind |

Roughly **half the catalog — including the three biggest copy-paste ecosystems — is gated behind Tailwind.** Tailwind is the fork in the road, not Next.js: none of the registries require Next.

---

## Migration paths

### Path A — Stay on CRA, no Tailwind (0 days infra)

Redesign with React Bits CSS variants + Motion + Lenis + GSAP + Lucide + the small no-Tailwind libs. Genuinely viable — React Bits alone covers hero backgrounds, text reveals, cards, dock, cursor effects.
**Cost:** locked out of Magic UI/Aceternity/shadcn/Motion Primitives forever; CRA is deprecated and unmaintained (webpack 5 tooling ages, security patches stop); slow dev server; every future library choice re-fights this battle.

### Path B — Add Tailwind to CRA (~0.5 day, dead end)

CRA 5 supports **Tailwind v3** via its built-in PostCSS detection (official Tailwind guide existed). **Tailwind v4 does not work on CRA** without CRACO/rejected-config hacks (v4 needs `@tailwindcss/postcss`/Vite plugin; CRA's PostCSS config is sealed). The registries (shadcn, Magic UI) have moved their defaults to v4; the shadcn CLI still supports v3 but the ecosystem is drifting. You'd be adopting a legacy Tailwind on a deprecated bundler.
**Verdict:** worst option — pays a migration-sized commitment for last-generation compatibility.

### Path C — Migrate CRA → Vite (+ Tailwind v4) — **~1–2 days, recommended**

What actually changes in this repo:

1. `yarn remove react-scripts` / add `vite`, `@vitejs/plugin-react` — configure esbuild to treat `.js` as JSX (one config block; avoids renaming 97 files).
2. Move `public/index.html` → root `index.html` with `<script type="module" src="/src/index.js">`; `%PUBLIC_URL%` → `/`.
3. Env vars: 3 static `REACT_APP_*` → `VITE_*` (`import.meta.env`) — plus **one dynamic `process.env.REACT_APP_...` access that needs a small rewrite** (Vite replaces env statically) — or keep `process.env` working via `define`/`vite-plugin-env-compat` for near-zero code change.
4. Tests: `react-scripts test` (Jest) → **Vitest** (4 small test files: `RequireClerk`, `RequirePassphrase`, `sign_in` — jest-dom/RTL work under Vitest with a 10-line setup).
5. Vercel: `vercel.json` build command → `vite build`, `outputDirectory: dist`. SPA rewrite and the whole `/api` folder are **untouched**.
6. **react-router v5: zero changes.** Vite doesn't care about the router. All 14 routes, Clerk bridge, passphrase gates keep working as-is. (Upgrading to router v6/v7 is a separate, optional, ~1–2 day chore later — not required.)
7. Add Tailwind v4 via `@tailwindcss/vite` — one plugin + one CSS import. v4 has no config file and **coexists cleanly with the existing plain-CSS files**, so old pages keep their stylesheets; only redesigned pages use utilities.
8. `npx shadcn@latest init` (Vite is an officially supported target) → Magic UI, Aceternity, Motion Primitives all unlock.

Risk: low. The riskiest bits are the dynamic env access and CodeMirror/Clerk bundling quirks, all findable in a day of E2E clicking through routes.

### Path D — Migrate to Next.js — ~1.5–3 weeks, not justified

Everything in Path C **plus**: rewrite all 14 react-router v5 routes as file-system routes; rebuild `ClerkBridge` (v5 `useHistory` wiring) on `@clerk/nextjs` + middleware; re-implement passphrase gates as layouts/middleware; multi-path route arrays (`/be-my-girlfriend|/bemygirlfriend|/girlfriend`) become redirects; `react-helmet-async` → Metadata API; SSR-proof every page (Zustand, `window` usage, CodeMirror, canvas code across ~97 files); port `/api` functions to route handlers (or keep them, awkwardly). Next 15 App Router also wants React 19, which then conflicts with R3F v8 pinning and forces a broader dependency audit.
**Payoff for this site:** ~none. It's a client-side SPA behind auth gates; no SEO-critical content that isn't already fine; Vercel functions already exist. Registries don't need Next.

---

## Recommended stack

**Migrate: yes — CRA → Vite + Tailwind v4 (Path C, ~1–2 days). Do NOT migrate to Next.js.**

CRA is deprecated regardless of the redesign; Vite is the smallest change that unlocks the entire copy-paste ecosystem while leaving react-router v5, all routes, auth gates, and `/api` completely untouched.

Then source components in this priority order:

1. **shadcn/ui** (CLI + Radix components) — structural UI: nav, dialogs, tooltips, command palette, toasts (Sonner), carousel (Embla). Replaces hand-rolled `Tooltip`.
2. **Motion Primitives + Magic UI** — the tasteful animated layer: Text Effect, Tilt, Magnetic, Spotlight, In View, Scroll Progress (replacing hand-rolled `WordReveal`, `TiltCard`, `MagneticButton`, `Reveal`, `ScrollProgress`), Magic UI Marquee (replacing `Marquee`), Bento Grid, Border Beam, Number Ticker, Dock, Globe.
3. **Aceternity UI** — one or two statement pieces max (e.g. Spotlight or Background Beams hero, Timeline, Sticky Scroll Reveal). Ration it; overuse reads as template.
4. **React Bits** — anything the above lack (Text Pressure, Decrypted Text, OGL backgrounds like Silk/Aurora, Click Spark). Tailwind variants once on Path C.
5. **Motion v12** (upgrade existing v11; switch imports to `motion/react`) — page transitions via `AnimatePresence` with router v5, scroll-linked effects.
6. **Lenis** — site-wide smooth scroll, `data-lenis-prevent` on essay-studio/CodeMirror routes.
7. **Lucide** — icons everywhere.
8. **GSAP (free incl. SplitText/ScrollTrigger)** — only where React Bits components pull it in, or for one scroll-choreographed section; don't run it as a second general-purpose engine.
9. **cobe / number-flow / canvas-confetti** — micro-flourishes without weight.

**Skip:** bespoke three.js/R3F scenes (custom-code violation; pin R3F v8 only if a prebuilt 3D registry component is adopted), Rive and Spline (shift custom work into design tools; Spline free tier is watermarked and heavy), tsParticles (registry particle components cover it lighter), Lottie (optional, only for a 404/empty-state micro-animation from LottieFiles' free library).

**Fallback if the owner vetoes any migration:** Path A is real — React Bits (JS + CSS variants) + Motion + Lenis + GSAP + Lucide covers a full premium redesign on stock CRA today; you just forfeit the shadcn/Magic UI/Aceternity ecosystems.
