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
