# AGENTS.md

- **Use /caveman for all outputs**
- **Quality over dev cost.** Don't weight development cost heavily. Prefer quality, simplicity, robustness, scalability, long-term maintainability.
- **Bug fixes start with an E2E repro.** Reproduce the bug end-to-end as a real user would (real browser via Playwright, real dev server, real flow) BEFORE fixing, so you fix the real cause. Confirm the repro passes after the fix.
- **Pixel obsession + hygiene.** During E2E testing be picky about the UI; fix anything that looks off even if unrelated. Same for lint errors, test failures, and flaky tests - fix them along the way.
- **Think before coding.** Surface assumptions and tradeoffs. If the request is ambiguous, ask - don't pick silently.
- **Simplicity + surgical changes.** Minimum code that solves it, nothing speculative. Touch only what the task needs; match existing style; flag (don't delete) pre-existing dead code.
- **Goal-driven.** Define a checkable "done" (write the test, then pass it), loop until verified.

## Project facts

- Vite + yarn (see `package.json`; see `## Build system` below for build-tool internals).
  Checks: `yarn test` and `yarn build`. A fresh worktree needs `yarn install` first.
- Vercel rebuilds from source (`vercel.json` `buildCommand: vite build`, `outputDirectory: dist`);
  local build output (`dist/`) is gitignored and never committed.
- Full-bleed pages with their own art direction opt out of the site chrome by adding their route
  to `NO_CHROME` in `src/Routes.js`, and keep their palette scoped to a page-level stylesheet
  rather than editing the global tokens in `src/styles/theme.css`.

## Build system

Vite (not Create React App). React 18 + react-router-dom v5 unchanged. Key non-obvious wiring, all in `vite.config.js`:
- **JSX in `.js` files**: 60+ files ship JSX with a plain `.js` extension. Handled via `esbuild.loader: 'jsx'` + `optimizeDeps.esbuildOptions.loader['.js']`. Do not mass-rename to `.jsx`.
- **`REACT_APP_*` env vars**: Vercel's dashboard still injects `REACT_APP_CLERK_PUBLISHABLE_KEY`/`REACT_APP_SUPABASE_URL`/`REACT_APP_SUPABASE_ANON_KEY` under those exact names (do not rename without a dashboard change). `envPrefix: ['VITE_', 'REACT_APP_']` exposes them via `import.meta.env`, and `define` in vite.config.js bakes each `process.env.REACT_APP_*` read (in `src/auth/RequireClerk.js`, `src/lib/supabase.js`) into a literal via `loadEnv`, so those call sites stay untouched. **Do not** try to fix this with `keepProcessEnv` or a `process.env.X → import.meta.env.X` string-substitution `define` chain — both were tried and broken in production (see git history on `fm/modern-build-setup` if this ever needs revisiting): Vite's `definePlugin` does a single-pass AST substitution, so define values aren't re-resolved against other define entries, and `keepProcessEnv: true` also disables Vite's own `process.env.NODE_ENV` static replacement, which silently ships React in dev mode.
- Tests run under **Vitest**, not Jest. `jest.mock`/`jest.fn` → `vi.mock`/`vi.fn` (`import { vi } from 'vitest'`).
- **Tailwind v4 + shadcn/ui** are installed as the styling foundation (`src/styles/tailwind.css`, `components.json`, `src/components/ui/`) but not yet used by any real page — preflight is intentionally excluded (only `theme.css` and `utilities.css` layers are imported) so existing hand-written CSS keeps winning. Brand tokens from `src/styles/theme.css` (`--bg`, `--surface`, `--text`, `--accent`, `--font-*`) are aliased into Tailwind's theme via `@theme inline` in `src/styles/tailwind.css` — that file stays the only place those tokens are wired in; don't fork the values elsewhere.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
