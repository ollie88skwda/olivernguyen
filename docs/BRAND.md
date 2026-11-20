# BRAND.md — olivernguyen.com

Master design system. Decided by D-37 (portfolio) and D-38 (sitewide), 2026-11-20. It replaces the
earlier sakura system. Reference implementation: `src/portfolio/portfolio.css` (live at `/`); shared
tokens for every other page: `src/styles/sakura.css` (the `.sakura` scope, token names kept).
Contrast is enforced by `node scripts/contrast-check.mjs`. Same system as Clarity, accent rotated to pink.

## 1. Rules
- Build only from tokens: `var(--token)`, never a hex, radius, duration or font name in a component.
- Tokens live on `.sakura` (light) and `html[data-theme="dark"] .sakura`. Never on `:root`.
- Component values live in `src/styles/components.css`; inventory in `docs/COMPONENTS.md`.
- Need a value that is not here: stop and ask, then record it here and in `docs/DECISIONS.md`.

## 2. Colour (token → light / dark)
| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | #fcf9f4 | #191513 | page |
| `--surface-2` | #f7f1e8 | #1f1b18 | subtle band |
| `--surface` | #fffefb | #221e1c | cards, fields |
| `--hover` | #ece5da | #292421 | hover fill |
| `--border` | #dcd7ce | #383330 | hairlines |
| `--border-strong` | #c4bdb3 | #514c48 | control borders |
| `--text` | #211816 | #ece7df | ink |
| `--text-muted` | #5a4c47 | #c4bcb4 | secondary text |
| `--text-faint` | #786c63 | #958e88 | tertiary, labels |
| `--primary` / `--on-primary` | #251d1a / #fcf9f4 | #e2ddd5 / #191513 | primary button |
| `--accent` | #783555 | #eba6c4 | accent TEXT, links, focus ring, slash |
| `--accent-hi` | #eab1c9 | #e19dba | accent SOLID fill (carries `--on-accent` #211816) |
| `--selection` | #fee2ed | #2c1921 | text selection, accent wash |
| `--success` | #036262 | #77cfcf | success |

Pink is the only accent. Use it for the slash, links, focus and small fills, not large areas.

## 3. Theme
`<html data-theme="light|dark">`, written by `src/theme/ThemeProvider.jsx`. Graph/terminal mode is
retired (D-37); its `--node-*`, `--term-*` tokens remain only so the unmounted code still resolves.

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
The slash mark (path in `src/portfolio/Portfolio.jsx`, drawn by `<Wordmark>`) in `--accent`, then "oliver nguyen" in 700, 18px.

## 9. Chrome
`src/chrome/SiteChrome.jsx` shows on every route except `/`: 56px, page colour at 88%, 12px blur, wordmark left, theme toggle and Pages menu right.

## 10. Voice
Plain, short, sentence case, no em or en dashes, no AI vocabulary, facts only (humanizer skill).

## 11. Scope
Legacy pages under `src/pages/` take the brand through their own restyle lanes; the legacy navy/gold `theme.css` is being retired page by page.
