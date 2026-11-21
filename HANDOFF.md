# olivernguyen.com handoff

## Workshop (set up 2026-11-19)
- Link (Tailscale, phone OK): http://100.69.165.32:13300/
- Dev server: Herdr workspace `olivernguyen` (w179), tab `└ workshop-dev` (pane w179:p1K): `./node_modules/.bin/vite --host 127.0.0.1 --port 3300 --strictPort` (hot reload). Stop: Ctrl-C in that pane.
- Exposure: `tailnet-expose 3300 13300 --bg`; stop with `tailnet-expose --stop 13300`.
- Survives only while that pane and the tailnet-expose process run; not proven across reboots.

## Current work
- 2026-11-19: terminal portfolio home (D-37). Code `src/portfolio/`, images `public/portfolio/`, facts `docs/portfolio-facts.md`. On Workshop only, NOT live. Live needs Oliver's explicit yes and a deploy from `main` (current branch `feat/component-library`).
- Open: BRAND.md still describes sakura; rewrite if the pink-clarity direction sticks. Synkra shown as prototype (its Supabase host does not resolve per facts file).
- 2026-11-20: Oliver prefers the old Sakura colors ("I like the old colors better except for the bar at the bottom"). Home `/` now defaults to `data-palette="sakura"` (`.pf[data-palette="sakura"]` in `src/portfolio/portfolio.css`); bottom bar restyled to a quiet tinted strip for Sakura. Oliver then said "Switch everything": D-39 applies Sakura sitewide (`src/styles/sakura.css`), comparison toggle removed. Workshop only, not live.
- 2026-11-20 23:15: LIVE. Oliver said "push to prod". Branch work since f3ffa6df was applied onto origin/main as one commit `8a7a3500` (main had squash-merged the earlier branch work as #27, so a straight merge conflicted in ~80 files). Conflicts resolved: `src/chrome/SiteChrome.jsx` keeps the new bar plus main's sign-in items and owner-only tracker/time-blocks links (now inside the pages menu); `src/Routes.js` hides chrome on `/` and passes `clerkEnabled`. Decisions renumbered on main: portfolio D-40, sitewide brand D-41, Sakura colours D-42 (main's D-37/D-38 = rebuild merge / Hangr). Vercel auto-deploys main; verified https://olivernguyen.com at 390px, both themes, `/`, `/pull`, `/permit`, `/sign-in`, 404, `/hangr` redirect. Rollback: `git revert 8a7a3500 && git push origin main`.
- Follow-up: `feat/component-library` still says D-37/38/39 for these; rebase or reset it onto main before more work so the two don't drift.
