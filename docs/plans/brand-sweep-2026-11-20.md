# Brand + voice sweep (2026-11-20)

Owner: root agent in Herdr workspace `olivernguyen` (w179). Source request (Oliver, 2026-11-20): "make sure that all the branding stuff is consistent over all. get subagents on EVERY page making sure the branding/voice is consistent with the humanizer skill."

## Target brand (D-37, extended sitewide by D-38)
- Same system as Clarity (`/Users/Ollie/Documents/Code/because/src/app/globals.css`), accent rotated to pink. Reference implementation: `src/portfolio/portfolio.css` (tokens at the top of `.pf`), live at `/`.
- Font: Geologica variable (`/fonts/Geologica-variable-latin.woff2`), `font-variation-settings: "SHRP" 100, "CRSV" 0, "slnt" 0`, antialiased.
- Weights: body 410, labels 550-600, headings 700, display 760 at letter-spacing -0.05em, line-height 0.96. Body line-height 1.55.
- Mono (ui-monospace / SF Mono) only for small terminal-style labels and prompts.
- Light: page #fcf9f4, subtle #f7f1e8, surface #fffefb, hover #ece5da, line #dcd7ce, line-strong #c4bdb3, ink #211816, soft #5a4c47, faint #786c63, primary #251d1a, accent text #783555, accent solid #eab1c9, accent bg #fee2ed, success #036262.
- Dark: page #191513, subtle #1f1b18, surface #221e1c, hover #292421, line #383330, line-strong #514c48, ink #ece7df, soft #c4bcb4, faint #958e88, primary #e2ddd5, accent text #eba6c4, accent solid #e19dba, accent bg #2c1921, success #77cfcf.
- Radii 4/8/12/16. Buttons: 44px min height, radius 8, weight 600; primary = dark primary fill.
- Logo: the slash/parallelogram mark (`Slash` in `src/portfolio/Portfolio.jsx`) in accent pink, then "oliver nguyen" in 700.

## Voice
- Run the humanizer skill (`/Users/Ollie/.agents/skills/humanizer/SKILL.md`) over every visible string: no em/en dashes, no AI vocabulary, no rule-of-three padding, no promo language, plain and short. Sentence case. Facts only: never invent numbers, names or claims; if a sentence is unclear, simplify it rather than guessing.

## Rules for every worker
- Edit ONLY the files listed in your brief. Shared files (`src/styles/sakura.css`, `src/styles/components.css`, `src/components/**`, `src/chrome/**`, `src/Routes.js`, `index.html`, `docs/BRAND.md`, `docs/DECISIONS.md`) belong to the brand-layer worker or the root agent.
- Do NOT run git commit, add, stash, checkout, reset, rebase or push. The root agent commits.
- Dev server (shared, hot reload, do not restart): http://127.0.0.1:3300 . Check your pages with Playwright at 1440x900 and 390x844, light and dark (`?theme=dark`), no page errors, no horizontal overflow.
- Run `npx vitest run <your dirs>` and keep tests green; update tests only where they assert copy you changed.
- Keep behaviour, routes, auth gates and data untouched; this is look + words only.
- Report: files changed, before/after screenshot paths, tests run, anything left.

## Status (root agent, final)
- All helpers reported and committed: brand layer (Jack, D-38), pull/emoji (George), sat/driving (Mike), college/transfer/sign-in/404/articlewriter (Ruby), major (Leo), apply (Lucy), mom/girlfriend checked unchanged (Ben). Studio (Frank) closed without a report; his edits were reviewed by the root agent and committed.
- Root agent did: passphrase/sign-in gates, 404 layout, readable-pink text pass (`--accent-hi` text -> `--accent`), lowercase wordmark, sign-in test copy.
- Verified 2026-11-20: vitest 478/478, contrast-check 175/175, Playwright sweep of 15 routes x light/dark x 1440/390: no page errors, no overflow; only /mom keeps its own fonts (intentional gift page).
- Left open: Playwright e2e suites not run (several assert the old graph/terminal home and old pink hexes, e.g. e2e/permit-lane.spec.js); docs/COMPONENTS.md and /_components copy still describe old radii; /college has unwritten [headline] placeholders (Oliver to write); /transfer and /studio inner views only checked by code since they are behind Clerk sign-in.
