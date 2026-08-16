# terminal-mode prototype v2 — you are INSIDE the terminal (throwaway)
Open `index.html` directly in a browser — no build, no server. The page never scrolls; only the scrollback buffer does.
Navigating = running commands: `1`-`5` / tmux tabs print sections (`cat tools.txt`…), `j`/`k` scroll, `gg`/`G` top/bottom, `?` help, `⌘K`/`Ctrl+K` palette.
The prompt is always live: type `ls`, `cat whoami.txt`, `day 4`, `mode graph`, `email`, `clear` — Tab completes, `↑`/`↓` history, `:` prefix works.
Smoke check: `node smoke.mjs` (uses globally installed Playwright + Chromium).
