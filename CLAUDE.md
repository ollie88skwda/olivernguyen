# CLAUDE.md

- **Use /caveman for all outputs**
- **Quality over dev cost.** Don't weight development cost heavily. Prefer quality, simplicity, robustness, scalability, long-term maintainability.
- **Bug fixes start with an E2E repro.** Reproduce the bug end-to-end as a real user would (real browser via Playwright, real dev server, real flow) BEFORE fixing, so you fix the real cause. Confirm the repro passes after the fix.
- **Pixel obsession + hygiene.** During E2E testing be picky about the UI; fix anything that looks off even if unrelated. Same for lint errors, test failures, and flaky tests - fix them along the way.
- **Think before coding.** Surface assumptions and tradeoffs. If the request is ambiguous, ask - don't pick silently.
- **Simplicity + surgical changes.** Minimum code that solves it, nothing speculative. Touch only what the task needs; match existing style; flag (don't delete) pre-existing dead code.
- **Goal-driven.** Define a checkable "done" (write the test, then pass it), loop until verified.
