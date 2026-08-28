# AGENTS.md — olivernguyen.com

Project rules for any coding agent working in this repo. Read this before touching anything.
General engineering rules also live in the global `~/AGENTS.md`.
`CLAUDE.md` in this repo is a symlink to this file — one set of project rules, not two.

---

## 0. What to work on next

- **Handed no specific task, or asked "what's next"? Read `docs/OPEN-DECISIONS.md` first.** It is the
  one ranked list of every design call still open and what each one unblocks.
- Deferring something → add it to `docs/OPEN-DECISIONS.md` in the same change.
- Closing something → log it in `docs/DECISIONS.md`, then delete it from `docs/OPEN-DECISIONS.md`.
- **Never hunt `docs/redesign-research/` for open work.** Those plan status blocks go stale:
  `12-rebuild-plan.md` note 13 still called shipped work "IN FLIGHT" (found 2026-08-27).

## 1. Design comes from ONE place

**`docs/BRAND.md` is the master design system. Read it before writing any UI, and build only
from its tokens.**

This is not a suggestion or a starting point. Colour, radius, spacing, motion, type, icons,
surface treatment, and the wordmark are all locked there. Every one of those values was decided
by reviewing live renders of this site, and each rejected alternative is recorded with its reason.

- **Reuse the component library before building anything new.** `docs/COMPONENTS.md` inventories the primitives in `src/components/ui/**` and the brand pieces in `src/components/brand/**`, with values centralised in `src/styles/components.css` and the gallery at `/_components`. Before writing any UI, check it and reuse an existing piece — only add a new component when none exists, then log it in `docs/COMPONENTS.md`.
- Building or restyling anything visual → open `docs/BRAND.md` first.
- Wondering why a value is what it is, or tempted to re-open a settled choice →
  `docs/DECISIONS.md` has the history. Re-litigating a logged decision without being asked is
  wasted work; several of them cost multiple review rounds.
- Need a value the brand doc does not define → **stop and ask.** Adding a token is a decision.
  When it is agreed, write it into `docs/BRAND.md` and log it in `docs/DECISIONS.md`.
- Colour science, contrast tables and derivations → `docs/redesign-research/04-sakura-palette.md`.
- Product spec, IA, phases → `docs/redesign-research/05-v1-spec.md` (note: its §6.3 is superseded
  by decision D-03 — theme and mode are independent switches).

Never hardcode a hex, a radius, a duration, or a font name in a component. Reference
`var(--token)`. Tokens live in `src/styles/sakura.css`.

Never invent a new aesthetic direction because it looked good elsewhere. If a page needs to feel
different, that is a brand decision, not a component decision.

## 2. Scoping rules (important — this repo is half-migrated)

- Sakura tokens live under the `.sakura` scope class, keyed off `<html data-theme="light|dark">` and
  `<html data-mode="terminal|graph">`. **Never put them on `:root`.**
- `src/styles/theme.css` owns the legacy `:root` tokens (navy/gold). Leave it alone.
- Remaining legacy pages under `src/pages/` are frozen and keep their own stylesheets until a
  restyle is explicitly scheduled. `/college` is the explicit sakura-restyle exception. Do not let
  new styles bleed into the rest.
- New surfaces mount inside `.sakura`.

## 3. Stack facts

- Vite + React 18 + React Router **v5** (do not "upgrade" it in passing).
- Tailwind v4, **preflight disabled** on purpose — remaining legacy pages must not be re-reset.
- shadcn/ui is configured (`components.json`, JS not TS, `@/components/ui`). Components are ours
  once added; restyle them to the brand tokens rather than shipping registry defaults.
- Motion (`motion/react`) for animation. `lucide-react` is the only icon family.
- Tests: Vitest + Playwright. Dev server: `npm run dev` on :3000.

## 4. Verification before you call it done

- Screenshot the real thing in a real browser: terminal mode, graph mode, and a 375px viewport.
- `node scripts/contrast-check.mjs` must pass for any palette-adjacent change.
- Reduced-motion: every animation needs a static fallback carrying the same DOM content.
- **Bug fixes start with an end-to-end repro, before the fix.** Reproduce it the way a real user
  would — real browser via Playwright, real dev server, real flow — so you fix the real cause.
  Confirm the repro passes after.
- Be picky while you are in there: fix anything that looks off, even if unrelated. Same for lint
  errors, test failures and flaky tests.

### Restyling a legacy page (sakura lane recipe, 2026-08-27)

- Mount the page's own `.sakura` root (like `GraphHome` does); never read legacy `:root` tokens.
- Compose from `@/components/ui/*` + `@/components/brand/*`; keep page-specific CSS in the page
  stylesheet, scoped under `.sakura`, tokens only.
- `e2e/legacy-visual.spec.js` screenshot-freezes legacy bodies — an intentional restyle must
  refresh its baseline deliberately: `npx playwright test e2e/legacy-visual.spec.js -g <route> --update-snapshots`.
- Add a lane gate spec (see `e2e/college-lane.spec.js`, `e2e/college-style-audit.spec.js`,
  `e2e/college-layout-audit.spec.js`) and a coverage record (`docs/college-restyle-coverage.md`).
- Playwright's `webServer` pins port 3100 (`reuseExistingServer: true`). When parallel lanes run
  vite servers, that port belongs to another lane — verify lane e2e on a private port with a
  throwaway `playwright.lane.config.js` (never kill the other lane's server).

## 5. Working rules

- **Quality over dev cost.** Do not weight development cost heavily. Prefer quality, simplicity,
  robustness, scalability, long-term maintainability.
- **Output voice is `~/AGENT-VOICE.md`, in every harness. Nothing in this repo overrides it.**
  Retired 2026-08-27: the old project `CLAUDE.md` said "`/caveman` for all outputs"; Oliver ruled the
  voice file wins. Do not re-add it.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
