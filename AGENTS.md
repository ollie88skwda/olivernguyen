# AGENTS.md

- **Use /caveman for all outputs**
- **Quality over dev cost.** Don't weight development cost heavily. Prefer quality, simplicity, robustness, scalability, long-term maintainability.
- **Bug fixes start with an E2E repro.** Reproduce the bug end-to-end as a real user would (real browser via Playwright, real dev server, real flow) BEFORE fixing, so you fix the real cause. Confirm the repro passes after the fix.
- **Pixel obsession + hygiene.** During E2E testing be picky about the UI; fix anything that looks off even if unrelated. Same for lint errors, test failures, and flaky tests - fix them along the way.
- **Think before coding.** Surface assumptions and tradeoffs. If the request is ambiguous, ask - don't pick silently.
- **Simplicity + surgical changes.** Minimum code that solves it, nothing speculative. Touch only what the task needs; match existing style; flag (don't delete) pre-existing dead code.
- **Goal-driven.** Define a checkable "done" (write the test, then pass it), loop until verified.

## Project facts

- Create React App + yarn (see `package.json`). Checks: `CI=true yarn test` and `CI=true yarn build`
  (the build is the lint gate — warnings fail it). A fresh worktree needs `yarn install` first.
- `build/` is checked into git but Vercel rebuilds from source (`vercel.json` `buildCommand`),
  so never commit local build output; `git checkout -- build` after running a build.
- Full-bleed pages with their own art direction opt out of the site chrome by adding their route
  to `NO_CHROME` in `src/Routes.js`, and keep their palette scoped to a page-level stylesheet
  rather than editing the global tokens in `src/styles/theme.css`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
