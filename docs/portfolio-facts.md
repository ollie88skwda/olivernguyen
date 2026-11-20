# Portfolio facts: Oliver Nguyen

Research snapshot, 2026-11-19. Read-only research; no repo was edited except this file.

Rules used:
- Every fact cites the file it came from. Numbers appear only where a source states them.
- Git dates are from `git log` (first and last commit, short date). "n/a" means the folder is not a git repo.
- Screenshot paths exist and are over 30KB, but I did not open the images. Check each one visually before using it.
- Status labels follow the docs. "Live" means a public URL is documented in a handoff or README. Deployment state can change.

Contents: Clarity, Hangr, Everbloom, CrackTrack, Smart Goals, Synkra, ScopeCreep Notary, Consent Lab, Niobium, EchoLearn, Voice, Aura, SBL, Haeren, Tierline, Atlas, olivernguyen.com history, Non-software making, Uncertain.

---

## 1. Clarity

**One line:** A study site where you learn a topic by explaining it to an AI that acts like a curious, then skeptical, student.

**Description:** The learner picks a passage or question, explains it in their own words, and the AI (named "clarity") asks one question at a time about unclear claims, missing links, or contradictions. A later study flow adds an exam deadline planner, a recall-first session, and calendar export. The design problem in the docs is keeping the learner in control: clarity never advances, scores, or widens scope on its own, and four fixed observations (Correctness, Reasoning, Clarity, Help used) are shown as reflection, not as a grade. Oliver's brand work (D-212 to D-214, Oct 29, 2026) set two switchable themes (Fern and Cornflower) with Day and Graphite Night modes and a Geologica wordmark.

**Stack / tools:** Target stack is Clerk (email-link auth), Convex (app data), and Cloudflare (hosting), per D-040/D-042/D-043. Supabase and Vercel are listed as old development artifacts. Uses OpenRouter for the model (prototype model `openrouter/meta/muse-spark-1.3-contributor`). Also a Python/Bun simulation under `tools/brain/` (FSRS and ACT-R learner models).
- Sources: `/Users/Ollie/Documents/Code/because/PRODUCT.md` (Local implementation state; Prototype model boundary), `/Users/Ollie/Documents/Code/because/README.md`.

**Dates:** first commit 2026-09-08; last commit 2026-11-19; 226 commits. Source: `git -C /Users/Ollie/Documents/Code/because log`.

**Public URL:** https://clarity.olivernguyen.com (documented in `/Users/Ollie/Documents/Code/because/DECISIONS.md` D-208/D-209/D-222). D-209 says open signup and public entry. D-222 (2026-11-01) says the guided study flow was released to the live personal site. The handoff also says the current UI is a local/private preview at 127.0.0.1 and that Clerk, Convex, and cloud auth were not verified. Treat "live" as "deployed, with some parts unverified."

**Status:** live (personal production site, per D-222), with active local preview work. Real-learner use is gated by privacy, consent, and provider items in `O-006`.

**Notable details (as written):**
- Brain simulation, "simulation only": the guided flow beat reread, practice-test cramming, Kahoot, AI tutor chat, and Quizlet by 11 to 31 points, using 130 simulated learners per cell. Source: `/Users/Ollie/Documents/Code/because/README.md`. Do not present this as real learning evidence; the doc says effectiveness is untested with real learners.
- Model spending cap for the prototype: US$5 total (D-060, in `PRODUCT.md`). Use only if relevant; it is a constraint, not a result.
- Brand (D-212): Fern `#afcfab` and Cornflower `#acc6ec` themes; base-8 corners. Source: `/Users/Ollie/Documents/Code/because/README.md`.

**Screenshots:**
- `/Users/Ollie/Documents/Code/because/.lavish/because-plan-assets/final-desktop-top.png` (160KB, Sep 2026, older)
- `/Users/Ollie/Documents/Code/because/.lavish/because-plan-assets/v2-final-desktop-model-voice.png`
- `/Users/Ollie/Documents/Code/because/.lavish/because-plan-assets/final-mobile-planning-records.png`
- Brand lockup: `/Users/Ollie/Documents/Code/because/docs/brand/lockup.svg.html` (HTML, not a screenshot)

**Brand folder:** `/Users/Ollie/Documents/Code/because/docs/brand/` contains `clarity-doc.css`, `Geologica-variable-latin.woff2`, and `lockup.svg.html`. Brand decisions are in `/Users/Ollie/Documents/Code/because/DECISIONS.md` (D-212 to D-216).

---

## 2. Hangr

**One line:** A demo landing site for Hangr, a Virtual Enterprise company that sells a clothes hanger with steam and scent.

**Description:** Built for a Virtual Enterprise website competition. The site is one landing page with a product exploration CTA (`Explore Hangr`, not shopping or signup). The brief required extra-bold, confident typography and authored motion that work for both professionals and teenagers, plus Three.js scene work. Scope limits are explicit: no real sales, no safety, quality, or garment-care claims, and an "Illustrative design" label. The HANDOFF also records a sales-team photo swap on 2026-11-19 that replaced product photos with cutouts from a supplied PDF.

**Stack / tools:** TypeScript/React, Astro (`astro.config.mjs`), Three.js and Motion for React (per PRODUCT.md), Vercel deployment. Also Cloudflare/`hangrve.pages.dev` references, and a review-comment mode with a shared reviewer code.
- Sources: `/Users/Ollie/Documents/Code/hangr/PRODUCT.md` (Stack), `/Users/Ollie/Documents/Code/hangr/HANDOFF.md`.

**Dates:** first commit 2026-11-17; last commit 2026-11-19; 41 commits.

**Public URL:** https://hangrve.vercel.app (HANDOFF: "Production https://hangrve.vercel.app").

**Status:** live (production, deployed 2026-11-19 per HANDOFF). Competition edition, round, and rules were marked unresolved in PRODUCT.md, so do not state the competition result.

**Notable details (as written):**
- HANDOFF says the 2026-11-19 sales photo swap was verified live at 12 pages × 390 and 1440 widths: "0 broken images, 0 old-image requests … 0 overflow, 0 page errors."
- Suit price shown as `$265`; delivery `15-30` min (HANDOFF, 2026-11-19 entry).
- PRODUCT.md: "Build no Shop/About pages, catalog, cart, checkout, accounts, payments, or admin tools now." Reconcile with the later shop/cart pages in the HANDOFF before saying anything about scope.

**Screenshots:**
- `/Users/Ollie/Documents/Code/hangr/public/media/product/hangr-classic.webp` (51KB; product cutout, final asset)
- `/Users/Ollie/Documents/Code/hangr/public/media/product/hangr-suit.webp` (exists in the handoff list; size not checked)
- `/Users/Ollie/Documents/Code/hangr/public/media/product/hangr-prestige-bundle.webp` (same caveat)
- Note: the `.next-vercel/` and `out*` folders hold older build outputs. Do not use them.

---

## 3. Everbloom

**One line:** A flower shop demo site for a Virtual Enterprise company, with a catalog, bundles, a demo checkout, and a sales-editor admin page.

**Description:** A conversion-focused storefront for a Virtual Enterprise flower company. The home page has a hero with product one-liner and two CTAs, a scroll story, a comparison against a competitor, and bundle cards with per-bouquet pricing. Oliver built a WebGL wind effect on the hero flowers (falls back to static with no WebGL or reduced motion) and a sales editor for the catalog. The admin editor commits catalog changes through GitHub and redeploys Vercel, and it is served through a Cloudflare Worker proxy.

**Stack / tools:** Astro, motion and lenis (`src/scripts/motion.ts`), WebGL canvas (`src/scripts/wind.ts`), Vercel, Cloudflare Workers + KV for the admin backend, GitHub API for saves. Sources: `/Users/Ollie/Documents/Code/everbloom/HANDOFF.md`.

**Dates:** first commit 2026-11-01; last commit 2026-11-06; 23 commits.

**Public URL:** https://everbloom-ve.vercel.app (HANDOFF).

**Status:** live demo (public site). Checkout is a demo: arrangements and scent pods use "the demo checkout (EB-XXXXXX order numbers)"; bundles use a Virtual Enterprise trade show POS.

**Notable details (as written):**
- Wind effect: `src/scripts/wind.ts` "bends it from the stems (gusts left to right, corner roses heavier)." Source: HANDOFF, 2026-11-05 entry.
- Checks at the time: `npm test (2/2 pass), astro check 0 errors` (HANDOFF, 2026-11-05).
- The admin page is intentionally weakly protected per a 2026-11-06 request in HANDOFF. Do not describe it as secure, and do not put its credentials in any public material.

**Screenshots:**
- `/Users/Ollie/Documents/Code/everbloom/dist/assets/img/arrangements.webp` (product photo; check size and whether it is a built asset)
- `/Users/Ollie/Documents/Code/everbloom/dist/assets/img/rose-blush.webp` (product photo)
- No full-page product screenshots found in the repo; a live screenshot would need to be taken.

---

## 4. CrackTrack (folder: poptab)

**One line:** A personal energy-drink log: crack a can, rate it, search 97 flavors, and see your stats.

**Description:** A personal shelf for every energy drink you've tried. You log each can, rate it out of 10, search flavors across major brands, and see stats. Every can is drawn in code (`src/Can.tsx`), and the UI uses a serif "crack" treatment. Recent work added accounts with server-side sessions (CSRF, rate limits, hashed tokens) and a favorites heart. The folder keeps the old name `poptab` on purpose (renamed popcrack on 2026-11-18, then CRACKTRACK on 2026-11-19).

**Stack / tools:** Vite, React, TypeScript; Bun; a small server in `server/auth.ts` and `server/prod.ts`; shared sanitizer in `shared/sanitize.ts`. Sources: `/Users/Ollie/Documents/Code/poptab/HANDOFF.md`, `/Users/Ollie/Documents/Code/poptab/README.md`.

**Dates:** first commit 2026-11-18; last commit 2026-11-19; 26 commits.

**Public URL:** none documented. The iPhone link in HANDOFF is a Tailscale address for the dev server, so it does not count.

**Status:** prototype. HANDOFF says deployment to Cloudflare is planned but not approved, and the storage must move to a Worker plus D1 before it can go live.

**Notable details (as written):**
- "search 97 flavors across the big brands" (README.md).
- Ratings are out of 10 (`State.scale = 10`), and old 1–5 ratings are doubled on load (HANDOFF).
- Sessions: HttpOnly cookie for 30 days; rate limits of 10 failed logins per ip+user and 50 per ip per 15 minutes (HANDOFF).

**Screenshots:**
- `/Users/Ollie/Documents/Code/poptab/wig-account.png`
- `/Users/Ollie/Documents/Code/poptab/wig-cooler.png`
- `/Users/Ollie/Documents/Code/poptab/public/logos/monster.png` (logo asset, not UI)
- These two root PNGs are the only UI shots; their size and content were not checked.

---

## 5. Smart Goals

**One line:** A goal tracker for setting SMART goals, breaking each into steps, and adding photo proof.

**Description:** Oliver's direction (2026-11-10): "a bunch of goals and a goal tracker with photos, that's it." The app walks a user through S, M, A, R, and T one screen at a time, then tracks overarching goals with steps and photos. The design rule is simplicity: goals, steps, photos, with no streaks, accounts, or sync. Data stays on the device, and the app exports a JSON file for recovery.

**Stack / tools:** Next.js 16, React 19, Tailwind v4, no backend. Local storage for goals, IndexedDB for photos (`PRODUCT.md`, Operating Context and Capabilities).

**Dates:** first commit 2026-11-09; last commit 2026-11-10; 11 commits.

**Public URL:** https://smart-goals-sooty.vercel.app/ (documented as the v4 release in HANDOFF).

**Status:** live for v4 ("proof sheet", released 2026-11-10 per HANDOFF). The v5 "Calm Plan" simplification (the current PRODUCT.md direction) is a Workshop build and not deployed. Do not present v5 as live.

**Notable details (as written):**
- SMART setup: one letter per screen (S title, M measure, A steps, R why, T deadline) (PRODUCT.md).
- Success metric in PRODUCT.md: "a goal is set in under a minute, and progress is visible at a glance." This is a target, not a measured result.
- "No testimonials, user counts or benchmarks exist; none may be invented." (PRODUCT.md, Evidence on Hand.)

**Screenshots:**
- `/Users/Ollie/Documents/Code/smart-goals/reports/live-shots/390-light-03-today.png` (1.6MB; mobile)
- `/Users/Ollie/Documents/Code/smart-goals/reports/live-shots/1440-02-capture.png` (4.0MB; desktop)
- `/Users/Ollie/Documents/Code/smart-goals/reports/live-shots/1440-05-relevant.png` (desktop)
- Check which version each shot shows (v4 or v5) before using it.

---

## 6. Synkra

**One line:** A group calendar app for finding times that work for everyone, restyled to look like Cloudflare's dashboard.

**Description:** Users create or join a shared calendar, mark availability, and see the best times for a group. Oliver's most recent work (Nov 2026) restyled the whole app in a Cloudflare-like look using the Kumo system, plus sample screens for demoing without a backend. The docs say the restyle is uncommitted and Workshop-only, and that real calendars cannot be created or joined because the Supabase host in `.env.local` does not resolve in DNS.

**Stack / tools:** Next.js (App Router, `app/`), Supabase (per `.env.local` note), Cloudflare Workers references, Tailwind, Convex folder present, `components.json` (shadcn). Sources: `/Users/Ollie/Documents/Code/synkra/HANDOFF.md`, `/Users/Ollie/Documents/Code/synkra/README.md` (boilerplate).

**Dates:** first commit 2026-04-01; last commit 2026-11-08; 53 commits.

**Public URL:** synkra-app.vercel.app is named in HANDOFF as the live app, but the handoff says real calendar flows probably fail there. Treat the URL as "exists, not verified working."

**Status:** Workshop / in progress. Not live for real use.

**Notable details (as written):**
- "Creating/joining/viewing real calendars fails on Workshop and almost certainly on live." (HANDOFF, rechecked 2026-11-02.)
- Sample screens at `/sample`, `/sample/join`, `/sample/share` (made-up data, dev only).

**Screenshots:**
- `/Users/Ollie/Documents/Code/synkra/final-home-1440.png` (227KB; desktop home)
- `/Users/Ollie/Documents/Code/synkra/discovery-calendar-1440.png` (desktop calendar; older work, size not checked)
- `/Users/Ollie/Documents/Code/synkra/discovery-home-375.png` (phone)

---

## 7. ScopeCreep Notary

**One line:** A Chrome extension that flags scope-creep language in client Slack messages and drafts a change-order email.

**Description:** The extension watches client messages in Slack, flags phrases that expand scope, and shows a badge. Clicking the badge opens a popup with the flagged message, the matched phrases, the user's SOW, and a drafted change-order email in one of four tones. The design choice is privacy: no server, no analytics, no LLM at runtime. It uses a deterministic phrase-scoring method, and the README gives a scoring example.

**Stack / tools:** Chrome extension (Manifest, `manifest.json`), plain JavaScript, Playwright for tests, a marketing site on Vercel. Source: `/Users/Ollie/Documents/Code/scopecreep/README.md`.

**Dates:** first commit 2026-05-23; last commit 2026-05-27; 33 commits.

**Public URL:** https://scopecreep-notary.vercel.app (marketing site and privacy page, per README; README says "pending DNS" for the custom domain).

**Status:** beta. README: "v0.4.0 beta — install-tested, awaiting Chrome Web Store listing." The Web Store listing was still pending in the README; I did not confirm it since.

**Notable details (as written):**
- "274 hand-curated phrases across 15 categories" (README).
- "stop losing $8–15k/yr to unbilled scope creep" (README one-line pitch). This is a marketing claim, not a measured result, so cite it only as the pitch.
- MIT license, "Copyright © 2026 Oliver Nguyen" (README, `LICENSE`).

**Screenshots:**
- `/Users/Ollie/Documents/Code/scopecreep/marketing/screenshot.png` (137KB)
- `/Users/Ollie/Documents/Code/scopecreep/marketing/demo-poster.png`
- `/Users/Ollie/Documents/Code/scopecreep/marketing/webstore/promo-large.png` (store promo art)

---

## 8. Consent Lab (ConsentLab)

**One line:** A local, dependency-free lab that compares normal bulk confirmation with scoped, recoverable approval for AI agent actions.

**Description:** For designers building AI agents that act on a person's documents, messages, or calendar. The lab simulates actions locally, shows the proposed state change, and tests two approval methods: conventional bulk confirmation and scoped, recoverable approval. It includes 24 synthetic cases, three workflows, four reference policies, and 96 evaluations, plus a manuscript on decision gates. The design problem is "decision advice is not permission": the advice helper never grants approval.

**Stack / tools:** Static HTML, CSS, and JavaScript modules, Node's built-in test runner, no dependencies. Sources: `/Users/Ollie/Documents/Code/consent-lab/PRODUCT.md`, `/Users/Ollie/Documents/Code/consent-lab/HANDOFF.md`.

**Dates:** not a git repo. Dates from the docs: the machine date at the start of the work was 2026-10-22 (PRODUCT.md, Operating Context); the manuscript's history runs into late October (HANDOFF). Exact first and last dates not verified.

**Public URL:** none. Local only.

**Status:** prototype and research artifact (local). The manuscript is not deposited or submitted (PRODUCT.md says "do not deposit the manuscript in this run").

**Synthetic caveats (important):**
- All 72 score probes use synthetic 0/0.5/1 values, not real responses (HANDOFF).
- All run data is synthetic. Results describe the reference implementations, not real people or external AI systems (PRODUCT.md, Product Purpose).
- Do not claim it invents informed consent, undo, human-in-the-loop, or agent permissions (PRODUCT.md, Positioning).

**Notable details (as written):**
- "24 authored synthetic cases, three abstract workflows, four deliberately ablated reference policies, 96 evaluations" (HANDOFF).
- Manuscript: "Decision Advice Is Not Permission: A Reproducible Lab and Evaluation Protocol for AI Decision Gates" (HANDOFF, `papers/decision-advice.html`).

**Screenshots:**
- `/Users/Ollie/Documents/Code/consent-lab/artifacts/paper-serif-desktop.png` (1.4MB; manuscript render)
- `/Users/Ollie/Documents/Code/consent-lab/artifacts/paper-serif-mobile.png` (manuscript, phone)
- `/Users/Ollie/Documents/Code/consent-lab/.impeccable/review/desktop-final.png` (lab UI; review image, check before use)

---

## 9. Niobium

**One line:** Oliver's AI-driven sales and marketing studio: a Next.js app, a design system, and a legal-audit site for a client, with a long build history.

**Description:** The main repo holds several apps and tools: a Next.js web app, a design system (`DESIGN.md` describes a "cold luxury" style, "The Monolith", with extreme contrast and whitespace), onboarding research, a Remotion video folder, and a set of sales-tool screens (objection trainer, leads import, bookings report, autopilot, closer kit) saved as e2e test screenshots. Several Niobium-related outputs live in the same repo. I did not read the full product history, so the Niobium description here is limited to what the files state.

**Stack / tools:** Next.js, TypeScript, Tailwind, Bun, Playwright tests, Remotion, and a design-system git submodule (`https://github.com/ollie88skwda/niobium-design-system`). Sources: `/Users/Ollie/Documents/Code/niobium/README.md`, `/Users/Ollie/Documents/Code/niobium/DESIGN.md`.

**Dates:** first commit 2026-03-22; last commit 2026-08-07; 2,500 commits (per `git rev-list --count`).

**Public URL:** https://www.niobium.studio is referenced (`/api/hq/mcp` in the README). I did not verify that it is live.

**Status:** unverified; product work appears active through Aug 2026. Do not claim "live" without checking.

**Notable details (as written):**
- The DESIGN.md "cold luxury" direction (`/Users/Ollie/Documents/Code/niobium/DESIGN.md`).
- Niobium Studio also appears as a founding activity in Oliver's CA grid: "Plan/film short-form agentic AI edu series (AI For Everyone, 120+ vids, ~30k views/month). Build 2 apps/>30 automations" (`/Users/Ollie/Documents/Code/college-apps/profile/ca-activities-grid.md`, entry 7). Use only as Oliver's own statement in his grid.

**Screenshots:**
- Most candidates are under `.claude/worktrees/` and `docs/working/hq-e2e-2026-07/` (test-run captures). Skip them per the brief.
- No clean product hero screenshot was found. Needs a fresh capture or a manual pick.

---

## 10. EchoLearn

**One line:** A learning app where a student explains a concept and an AI follows up, checks against the source, and tracks what the student can actually explain.

**Description:** Built around teach-back: the learner explains a concept, the agent asks one useful follow-up question, checks the explanation against the source, and points out corrections. The product's goal, per PRODUCT.md, is to make understanding observable. A design direction (D-029) applies a modern visual target to a separate Feynman preview; the production app keeps its legacy look until implementation is approved. The beta is invite-only and fixture-based. No learner data goes to OpenAI.

**Stack / tools:** Next.js app (`app/`), Supabase folder (`supabase/`), Vitest, OpenAI (admin key kept in Keychain; temporary), Vercel preview at https://echolearn-staging.vercel.app. Sources: `/Users/Ollie/Documents/Code/EchoLearn/PRODUCT.md`, `/Users/Ollie/Documents/Code/EchoLearn/HANDOFF.md`, `/Users/Ollie/Documents/Code/EchoLearn/README.md`.

**Dates:** first commit 2026-09-02; last commit 2026-09-03; 8 commits.

**Public URL:** https://echolearn-staging.vercel.app (public invite-only preview, per HANDOFF; "Use the public, invite-only Preview deployment").

**Status:** prototype / invite-only staging preview. The name "EchoLearn" is still open (O-001 in OPEN-DECISIONS.md).

**Notable details (as written):**
- Feynman preview, a separate page: `/Users/Ollie/Documents/Code/EchoLearn/.lavish/feynman-learning-workbench.html` (per PRODUCT.md).
- Voice: optional local in-browser transcription with typing fallback; agent replies are text only (PRODUCT.md, D-011).
- Beta: "invited US beta access for any age" with no age or guardian data collection (PRODUCT.md, Users).

**Screenshots:**
- `/Users/Ollie/Documents/Code/EchoLearn/.lavish/build-map-desktop.png` (515KB; desktop, design-process image; check first)
- `/Users/Ollie/Documents/Code/EchoLearn/.lavish/saas-direction-assets/check-desktop-light.png` (design check)
- `/Users/Ollie/Documents/Code/EchoLearn/.lavish/saas-direction-assets/check-mobile-dark.png` (design check, phone)

---

## 11. Voice (operator autonomous agent loop)

**One line:** A self-managing task queue and operator dashboard where Claude works through a list of tasks on its own.

**Description:** `TASKS.md` describes a loop: Claude reads the top unblocked task, claims it, does the work, marks it done, and moves on. An operator dashboard (`dashboard.html`) polls `operator-state.js` every 5 seconds and shows what the agent is working on, with a pulsing dot for liveness. The repo also holds council reports and design research for a companion marketing site. The product area is a VibeShield-style AI-code security scanner, and the docs note its market is "saturated" with 10+ competitors.

**Stack / tools:** Plain HTML/JS dashboard, shell scripts (`update-state.sh`), a marketing site on Vercel (`marketing-three-delta.vercel.app`, referenced in the repo). Sources: `/Users/Ollie/Documents/Code/voice/TASKS.md`, `/Users/Ollie/Documents/Code/voice/CLAUDE.md`.

**Dates:** first commit 2026-05-26; last commit 2026-05-27; 4 commits.

**Public URL:** https://marketing-three-delta.vercel.app (referenced in `voice/` files; not verified).

**Status:** prototype / archived-looking. Last activity May 2026 in git. The task queue is empty in TASKS.md.

**Notable details (as written):**
- Dashboard "Polls operator-state.js every 5s. Dark mono ops-terminal aesthetic." (TASKS.md-linked docs, `dashboard.html`)
- Work-queue rules are in TASKS.md (`T-NNN` IDs, `[priority: P0|P1|P2]`, `[blocked-by:]`).

**Screenshots:** none found that are clearly product UI. The `council-report-*.html` and `21st-components-pick-2026-05-26.html` files are docs. Use a fresh capture of `dashboard.html` if needed.

---

## 12. Aura (VEX robot)

**One line:** A VEX V5 robot design for the 2026-27 "Override" game, built around a 6-bar lift with a 4-bar on top, tuned for Robot Skills.

**Description:** Oliver's second competition robot, built for the VEX V5RC team's States run in the 2026-27 "Override" game. The goal in the HANDOFF is to make high scores "impossibly easy" with aligners and sensors and to stack seven pins per stack. The design work includes a lift linkage based on a known 471B design, a narrow drivetrain to reach wall pins, a plastic-piece budget of 12 pieces (each up to 4×8×0.070 in), and simulations of the lift. Built by an agent team on Oliver's behalf.

**Stack / tools:** VEX V5 hardware, CAD (`cad/`), simulation (`sim/`), Python/JS sim scripts. Sources: `/Users/Ollie/Documents/Code/aura/HANDOFF.md`.

**Dates:** first commit 2026-11-15; last commit 2026-11-15; 1 commit.

**Public URL:** none.

**Status:** in progress (design and sim). Not built or competition-tested in the docs.

**Notable details (as written):**
- "Build 2nd robot for States, tuned for Robot Skills" (HANDOFF, User goals, 2026-11-15).
- "Must stack 7 pins per stack (70 pts/stack per user). Current robot does 6." (HANDOFF).
- Plastic budget: "max 12 plastic pieces, each <=4x8x0.070 in, no bonding" (HANDOFF, R24).
- Simulation result for one lift: "471B lengths 18/11 -> 26 in, 3 pins. 34/27 -> 7 pins, top 48.6 (1.4 in margin)" (HANDOFF). Simulation output, not measured on a robot.

**Screenshots:**
- `/Users/Ollie/Documents/Code/aura/.lavish/assets/SkillsTopView.png` (474KB; top view of the skills design)
- `/Users/Ollie/Documents/Code/aura/.lavish/assets/Scored_Example_1.png` (474KB area; check content)
- `/Users/Ollie/Documents/Code/aura/.lavish/assets/LoaderSpecs.png` (specs image)

---

## 13. SBL (training notebook)

**One line:** A training lab notebook that logs workouts plus sleep, carbs, caffeine, and stress, then finds correlations between them.

**Description:** Log the work and the conditions around it, then surface relationships between inputs and outputs. The data stays open through export, a personal-token API, and an MCP server. The working title "SBL" is marked provisional in the README. The app was originally Expo/React Native and is archived on a branch; the current version is a Vite and React single-page app. Oliver's own training background (bodybuilding, powerlifting, science-based lifting coaching) is the natural reason this app exists, but the docs do not say so, so do not present that link as fact.

**Stack / tools:** Vite, React (`apps/web`), framework-free core logic (`packages/core`), MCP server (`packages/mcp`), Supabase (Postgres, RLS, Edge Functions), Bun, Playwright. Sources: `/Users/Ollie/Documents/Code/sbl/README.md`, `/Users/Ollie/Documents/Code/sbl/AGENTS.md`.

**Dates:** first commit 2026-06-21; last commit 2026-08-06; 50 commits.

**Public URL:** none documented. `vercel.json` exists; the URL is not stated.

**Status:** prototype (working title). Last commit Aug 2026.

**Notable details (as written):**
- "log the work *and* the conditions around it (sleep, carbs, caffeine, stress), then surface correlations" (README).
- Frog brand: "a Radix Themes 3 re-skin" with an accent of grass (AGENTS.md, the Frog brand section).

**Screenshots:**
- `/Users/Ollie/Documents/Code/sbl/docs/brand/assets/frog-logo-reference.jpg` (logo reference, not UI)
- No product UI screenshot found outside `test-results/`. Needs a fresh capture.

---

## 14. Haeren

**One line:** A 30-second silent looping launch video for a trade-show booth TV, built with Remotion.

**Description:** Haeren is a company with an audit, apparel, and app product. The deliverable is a 1920×1080, 30 fps, silent, looping 30-second video (900 frames) shown on a booth TV. Oliver chose the scene order (Audit → Apparel → App) and "no prices" through a Lavish review. The loop seam was verified by frame comparison. The render uses a Node API script because the Remotion CLI hung on his Mac.

**Stack / tools:** Remotion 4.0.541 (`video/`), Bun, Node scripts (`scripts/render.mjs`, `scripts/stills.mjs`), Lavish review pages. Source: `/Users/Ollie/Documents/Code/haeren/HANDOFF.md`.

**Dates:** not a git repo. The HANDOFF gives a 2026-11-05 Lavish decision date. Exact first and last dates not verified.

**Public URL:** none (booth video).

**Status:** v1 built and rendered; waiting for Oliver's notes (per HANDOFF).

**Notable details (as written):**
- Output: `video/out/haeren-booth-loop.mp4`, 5.5 MB, h264 crf16, 30.0 s, 900 frames; loop seam "frame 0 vs 899 mean diff 0.06/255" (HANDOFF).
- Render time: "~20 s" (HANDOFF).

**Screenshots:**
- `/Users/Ollie/Documents/Code/haeren/.lavish/assets/logo-primary.png` (logo)
- `/Users/Ollie/Documents/Code/haeren/.lavish/assets/R03_C01.png` (a storyboard or still; check)
- A still from `video/out/` would be better; not found as a plain image file.

---

## 15. Tierline

**One line:** Unknown from the repo. The README is the default Next.js template, and the screenshot names point to a music or ranking app.

**Description:** Not enough evidence in the repo to write a project description. The file names (`prod-ranking.png`, `pastel-landing.png`, `audit-album-modal.png`, `mobile-ranking-before.png`) suggest a ranking and album-review web app with a landing page, a design audit, and a mobile fix, but no doc explains it. Ask Oliver what it is before using it in the portfolio.

**Stack / tools:** Next.js (`next.config.ts`, `app/`), TypeScript, Bun, Geist font (default template). Sources: `/Users/Ollie/Documents/Code/tierline/README.md`, `/Users/Ollie/Documents/Code/tierline/AGENTS.md`.

**Dates:** first commit 2026-05-08; last commit 2026-05-08; 2 commits.

**Public URL:** none documented.

**Status:** unknown. Likely prototype.

**Screenshots (candidates; purpose not confirmed):**
- `/Users/Ollie/Documents/Code/tierline/prod-ranking.png` (112KB)
- `/Users/Ollie/Documents/Code/tierline/prod-landing.png` (97KB)
- `/Users/Ollie/Documents/Code/tierline/pastel-ranking.png`

---

## 16. Atlas

**One line:** A travel-planning mobile app built with Expo / React Native.

**Description:** Atlas is a React Native travel planning app. Its main code is in `pencil/`, with a Pencil design file (`atlas.pen`) at the root. Setup notes show the app running in Expo's dev server and ready for a device. The file names suggest a discovery and planning flow, but I did not read the screens, so do not describe the features beyond "travel planning" from `CLAUDE.md`.

**Stack / tools:** Expo 54, React Native, Zustand, NativeWind (per the project table in the global instructions), AsyncStorage 2.2.0, Pencil design tool (`atlas.pen`). Sources: `/Users/Ollie/Desktop/atlas/CLAUDE.md`, `/Users/Ollie/Desktop/atlas/pencil/BUILD_STATUS.md`.

**Dates:** not a git repo. Dates from the docs only; `BUILD_STATUS.md` has no date. Not verified.

**Public URL:** none. Local Expo dev server (`exp://…:8081`) is not a public link and is not counted.

**Status:** prototype (dev build running locally per BUILD_STATUS.md).

**Notable details (as written):**
- "Atlas is a React Native travel planning app built with Expo. The main app lives in the `pencil/` directory." (CLAUDE.md)
- Setup fixes: AsyncStorage downgraded from 3.0.1 to 2.2.0 to match Expo 54 (BUILD_STATUS.md).

**Screenshots:** none found in the docs. `pencil/` has `assets/` and `dist/`; check `dist/` for an exported image before use.

---

## 17. olivernguyen.com site history (visual eras)

Sources: `/Users/Ollie/Documents/Code/olivernguyen/docs/DECISIONS.md`, `/Users/Ollie/Documents/Code/olivernguyen/docs/BRAND.md`, `/Users/Ollie/Documents/Code/olivernguyen-old/` (git history and `src/`).

**Era 1, Feb 2024 to Mar 2026: the original site (olivernguyen-old).** A Create React App site ("Oliver Nguyen."). Git history: first commit 2024-02-26, last commit 2026-03-27, 98 commits. Typography: DM Sans, Geist Mono, and Poppins (font files in `src/assets/`). Main colors: `#73937e` (sage green; 24 uses in `src/`) and `#28262c` (dark charcoal; 23 uses). Source: `/Users/Ollie/Documents/Code/olivernguyen-old/src/`. The site also has a "Generate Article" tool under `src/article_writer_stuff/`. I did not find an "oN.c" wordmark in this folder, so I did not confirm the 2024 green-wordmark look that was in the brief. Flag as unverified.

**Era 2, Mar 2026 to Aug 2026: the "navy/gold" theme.** `src/styles/theme.css` in the current repo owns the legacy `:root` tokens: `--bg-base: #f1e9d4` (cream), `--accent: #092441` (navy), `--accent-hi: #15406b`, `--accent-deep: #051a30`. AGENTS.md calls this "navy/gold" and says to leave it alone. Source: `/Users/Ollie/Documents/Code/olivernguyen/src/styles/theme.css`. Gold values were not isolated here, so do not state the gold hex.

**Era 3, Aug 2026 onward: the "Sakura" terminal and graph site (current).** The current repo: first commit 2024-02-26, last commit 2026-08-27, 241 commits.
- Design: `docs/BRAND.md` (locked 2026-08-24, amended 2026-08-25 and 2026-08-26). "Personal site for an agent-builder. Audience: recruiters, founders, robotics and engineering people." Language: "operator-editorial — terminal honesty, magazine spacing, one dyed-through palette."
- Palette (D-02): Night Plum (dark) and Sakura Paper (light). The pink brand hue is blossom `#ffb7d1`, jade `#46b989` for success, petal red `#e15647`, and gold `#e8a94a` for warnings. Source: `/Users/Ollie/Documents/Code/olivernguyen/docs/redesign-research/04-sakura-palette.md`, and `docs/DECISIONS.md` D-02.
- Two modes: "terminal" and "graph," with independent light and dark themes (D-03).
- Wordmark (D-11): `oN.c`, with the dot in the accent color, set in Familjen Grotesk 700. Favicon and avatar use `oN`.
- Key decisions: D-02 Sakura ("Do not re-propose neutral-base palettes"); D-03 four themes; D-11 wordmark.

**Screenshots of the site:**
- `/Users/Ollie/Documents/Code/olivernguyen/.lavish/current-home-full.png` (901KB; current home, full page)
- `/Users/Ollie/Documents/Code/olivernguyen/.lavish/check-sakura-term.png` (terminal mode)
- `/Users/Ollie/Documents/Code/olivernguyen/.lavish/check-sakura-graph.png` (graph mode)
- `/Users/Ollie/Documents/Code/olivernguyen/.lavish/check-palette.png` (palette check)

---

## 18. Non-software making (from the college-apps profile)

Source: `/Users/Ollie/Documents/Code/college-apps/profile/PROFILE.md` and `/Users/Ollie/Documents/Code/college-apps/profile/ca-activities-grid.md`. Numbers are as written. The PROFILE.md "Resolved by Oliver (2026-11-19)" section supersedes the earlier conflicts noted there.

- **Legacy VEX Robotics (Lead Engineer, Build/Code/CAD & Mentor).** Grades 9–11, 35 hrs/wk, 40 wks/yr (CA grid, entry 1; resolved in PROFILE.md). The UC grid says 20 hrs/wk x 40 wks, and PROFILE.md lists both as resolved by Oliver. "Build, code, CAD, document, & drive 8+ robots on team. Qualified to state championship 5/5 seasons + win awards." "Raised $20,000< as volunteer ref/judge @ five hosted tournaments." Oliver designed custom plastic pieces for the team (PROFILE.md, source `uc-piqs-piq6-academic-subject.md`).
- **TechX Robotics (Lead Mentor, Summer Teacher, VEX Expert, paid work).** "Mentor 3 VEX IQ competition teams … Qualified to Worlds, won 25< awards including Excellence, Build, and Think." 20 hrs/wk, 38 wks/yr (CA grid, entry 2).
- **Electric Vehicle Challenge (Driver, Systems/Operations Engineer, Data Analyst).** "Designed and built an electric vehicle to race in the Vital Link EV Challenge. Designed wiring systems, tuned wheel alignment and steering, assisted with the aerodynamics shell, and quality checked safety mechanisms." "Placing 4/32 based on how effective our team's speed and energy efficiency were." "Designed an app for my team to track lap times, watt usage, and total score." 200/200 design score. 8 hrs/wk, 36 wks/yr (CA entry 6). The UC grid gives 3 hrs/wk for the same activity. Conflict: flagged in PROFILE.md; not resolved.
- **Verus Aerospace internship (Manufacturing/Aero CTE Intern).** "4 chosen out of 20." "Custom designed 10+ solutions to optimize manufacturing (storage, nav systems). Audited using 6S. Proposed AI database automation for >500 employees." Summer, 20 hrs/wk, 5 wks/yr (CA entry 3).
- **Virtual Enterprise (Setta LLC and Hangr LLC; VP Digital Operations, Web Designer, Visual Media).** "Built and maintained a company website that generated $50,000+ in revenue." "Lead team of 4 to compete in and win 4x gold/2x bronze award" (CA entry 4). "Competed in national AI challenge, ranking top 5 nationwide for predictive inventory AI model implementation proposal." PROFILE.md resolved this as "VE ReKnew AI Challenge: Top 10." Use Top 10, per Oliver's 2026-11-19 answer.
- **Cell-U-Safe (VE Rapid Prototyping Challenge, Gold).** "ideated/constructed/pitched Cell-U-Safe to judges & 1000+ students" (CA honor 4). UC grid: "Cell-u-Safe phone blocker, 20 min to ideate."
- **Eagle Scout (Scouting America Troop 235).** "76 months leadership, >100 hrs service, Eagle project, 23 merit badges, 4% attain" (CA honor 2). Eagle project: "15+ volunteers over 80 hours reorganized and expanded Legacy Magnet Academy's middle school robotics room" (UC grid, entry 5). Oliver also states "120+ practical skills" for Scouting. Merit badge count resolved as 23 per PROFILE.md.
- **Troop 235 (Senior Patrol Leader).** "Active 12 yrs." SPL troop size resolved as 50 per PROFILE.md.
- **Custom keyboards.** UC grid entry 8–12 summary: "Typing (202 wpm 10-word test, top 7%, 5,400+ tests, 4 custom keyboards, sold 2 for $300 profit)." This is a summary of the UC grid; check the exact wording in `/Users/Ollie/Documents/Code/college-apps/profile/uc-activities-grid.md` before using it.
- **Science-Based Lifting.** "Research biomech/nutrition to develop paid custom science-based exercises/routines/diets for 20+ clients (injured, veg). Coached 5 clients in-person" (CA entry 8).
- **Niobium Studio / AI For Everyone (founder).** "Plan/film short-form agentic AI edu series (AI For Everyone, 120+ vids, ~30k views/month). Build 2 apps/>30 automations" (CA entry 7). This is Oliver's own description in the grid.

---

## 19. Uncertain (verify before use)

1. Clarity public status: D-222 says the guided study flow was released to clarity.olivernguyen.com on 2026-11-01, but the handoff describes local/private previews and unverified Clerk/Convex auth. Confirm which parts are live.
2. Hangr competition: edition, round, and result are unresolved in PRODUCT.md. Do not claim a placement.
3. Everbloom admin page: intentionally weak protection per HANDOFF. Keep it out of public material.
4. Synkra: the live Supabase host does not resolve (per HANDOFF). Do not describe it as working.
5. Smart Goals: confirm which version (v4 live, v5 Workshop) each screenshot shows.
6. Niobium: current status and whether niobium.studio is live are not verified.
7. Tierline: purpose is not documented. Ask Oliver.
8. Atlas: no git history, no dates, screens not read.
9. Aura, SBL: no public URLs. Aura's design work is in progress.
10. olivernguyen-old "oN.c" green wordmark: not found in the old source; the brief's claim is unverified.
11. Gold hex for the navy/gold era: not isolated in `theme.css`.
12. Clarity brain-simulation results are simulation only. Do not present them as user or learning evidence.
13. ScopeCreep Chrome Web Store listing: pending per README; not checked since.
14. EV Challenge hours: CA grid says 8 hrs/wk; UC grid says 3 hrs/wk. Unresolved in PROFILE.md.
15. Screenshots: paths confirmed to exist and be over 30KB. None were opened or visually reviewed.
