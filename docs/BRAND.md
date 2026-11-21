# BRAND.md — olivernguyen.com

Master design system. Decided by D-40 (portfolio), D-41 (sitewide) and D-42 (Sakura colours back), 2026-11-20. Reference implementation: `src/portfolio/portfolio.css` (live at `/`); shared
tokens for every other page: `src/styles/sakura.css` (the `.sakura` scope, token names kept).
Contrast is enforced by `node scripts/contrast-check.mjs`. Type and shape follow Clarity; colours are Sakura (D-42).

## 1. Rules
- Build only from tokens: `var(--token)`, never a hex, radius, duration or font name in a component.
- Tokens live on `.sakura` (light) and `html[data-theme="dark"] .sakura`. Never on `:root`.
- Component values live in `src/styles/components.css`; inventory in `docs/COMPONENTS.md`.
- Need a value that is not here: stop and ask, then record it here and in `docs/DECISIONS.md`.

## 2. Colour (token → light / dark)
| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | #faf1f5 | #180f14 | page |
| `--surface-2` | #f2e2ea | #2a1b22 | subtle band |
| `--surface` | #fdf8fa | #1f1319 | cards, fields |
| `--hover` | #f2e2ea | #2a1b22 | hover fill |
| `--border` | #e2c9d4 | #3a2430 | hairlines |
| `--border-strong` | #d9b6c4 | #5c3a48 | control borders |
| `--text` | #3a1e2b | #f5dce6 | ink |
| `--text-muted` | #6f4459 | #d888a8 | secondary text |
| `--text-faint` | #84536a | #b0788f | tertiary, labels |
| `--primary` / `--on-primary` | #3a1e2b / #fdf8fa | #f5dce6 / #180f14 | primary button |
| `--accent` | #a83a68 | #ffb7d1 | accent TEXT, links, focus ring, slash |
| `--accent-hi` | #93275a | #ff6fb0 | accent SOLID fill (carries `--on-accent` #fdf8fa / #1f1319) |
| `--selection` | #f9d9e6 | #3a2430 | text selection, accent wash |
| `--success` | #15734f | #46b989 | success |

Colours are the original Sakura palette (D-02: Sakura Paper / Night Plum), restored by D-42. The
whole palette is dyed pink; do not swap in neutral-base colours. The home's bottom bar is a quiet
tinted strip, not a solid accent slab.

Pink is the only accent. Use it for the slash, links, focus and small fills, not large areas.

## 3. Theme
`<html data-theme="light|dark">`, written by `src/theme/ThemeProvider.jsx`. Graph/terminal mode is
retired (D-40); its `--node-*`, `--term-*` tokens remain only so the unmounted code still resolves.

## 4. Shape
- Radii 4 / 8 / 12 / 16 (`--r-xs`, `--r-control` 8, `--r-surface` 12). Pills (999px) only for badges, status pills and switches.
- Buttons: 44px high, radius 8, weight 600, sentence case. Primary = `--primary` fill; ghost = hairline.
- Focus: 2px `--accent` ring. Surfaces are hairlines, no shadow except the open dossier.

## 5. Spacing and motion
4px ladder via `--s-*`. State changes 140ms ease-out. Every animation needs a reduced-motion fallback.

## 6. Type
- Geologica variable (`/fonts/Geologica-variable-latin.woff2`), `font-variation-settings: "SHRP" 100, "CRSV" 0, "slnt" 0`, antialiased.
- Body 410, line-height 1.55. Labels 550 to 600. Headings 700. Display 760, -0.05em, line-height 0.96.
- Mono (`ui-monospace`, SF Mono, Menlo) only for small terminal-style labels and prompts.

## 7. Icons
`lucide-react` only, 18px, strokeWidth 1.75 (see `src/components/brand/icon.jsx`). Theme toggle: Sun / Moon in a 44px ghost button.

## 8. Logo
The slash mark (path in `src/portfolio/Portfolio.jsx`, drawn by `<Wordmark>`) in `--accent`, then "Oliver Nguyen" in 700, 18px.

## 9. Chrome
`src/chrome/SiteChrome.jsx` shows on every route except `/`: 56px, page colour at 88%, 12px blur, wordmark left, theme toggle and Pages menu right.

## 10. Voice
Plain, short, sentence case, no em or en dashes, no AI vocabulary, facts only (humanizer skill).

## 11. Scope
Legacy pages under `src/pages/` take the brand through their own restyle lanes; the legacy navy/gold `theme.css` is being retired page by page.
