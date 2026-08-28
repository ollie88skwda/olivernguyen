# Brand coverage — `/apply`

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | Full-page application surface | `sakura.css --bg`; `BRAND.md §2` | `.sakura`, `.ap-page` |
| Surfaces/cards/panels | Status, profile, portfolio and evidence panels | `BRAND.md §4/§9`; `--surface`, `--surface-2`, `--r-surface` | `.ap-clock`, `.ap-rho`, `.ap-evidence`, `.ap-panel` |
| Text and type roles | Hero, section heads, prose, labels, dates and numbers | `BRAND.md §7`; `Display`, `MonoLabel`, `--font-mono-body` | `.ap-hero-title`, `.on-section-title`, `.on-prose`, `.on-label`, `.ap-clock-v`, `.ap-total` |
| Spacing and layout | Editorial sections, card padding, phone stacking | `BRAND.md §5`; `--s-*`, `--pad-card` | `.ap-hero`, `.ap-sec`, `.ap-profile-grid`, phone media block |
| Controls and inputs | Editing, sorting, profile fields, filters, duels and sliders | `BRAND.md §4/§8`; UI primitives | `Button`, `Select`, `Input`, `Checkbox`, `RadioGroup`, `Switch`; `.ap-cellbtn` and native range controls use `--r-control` |
| Links and states | Source links, saved/offline, active and warning states | `BRAND.md §2/§6`; ladder state tokens and `--dur-state` | `.ap-source`, `.ap-stamp`, `.ap-flag-warn`, `:focus-visible`, hover rules |
| Icons and marks | Existing wordmark/chrome and control marks | `BRAND.md §8/§10`; shared chrome and library icons | route chrome; UI primitive indicators; no new bespoke icon |
| Images/data graphics | No external images; ratings, odds, calendar, effort and portfolio visuals retained | Token-derived CSS/SVG; explicit flag in `apply.css` header | `.ap-dial`, `.ap-cellbtn`, `.ap-rung`, `.ap-range`, `.ap-curve`, `.ap-gantt`, `.ap-costbar`; no library chart exists |
| Motion | Legacy reveals and bespoke motion removed; state/tooltips remain animated | `BRAND.md §6`; `--dur-state`; reduced-motion fallback | `.ap-tip`, progress transitions, bottom `prefers-reduced-motion` block |
| Responsive behavior | Desktop composition and horizontally readable board on phone | `BRAND.md §1/§5` | `@media (max-width: 767px)` in `apply.css`; 375px coverage |
| Loading/error/empty states | Loading, offline/not-saving, saved, empty profile and unresearched rows retained | Sakura state tokens and shared primitives | `.ap-loading`, `.ap-stamp-off`, `.ap-empty`, `.ap-unresearched`, state tests |

**Unmapped aspects:** none. The dial, ink cells, duel rungs, range sliders, compare bars, marginal curve, gantt, and cost/value bars are retained data encodings with no library chart primitive; they use only Sakura tokens and are explicitly flagged in `apply.css` for a later product decision.

**Hard-coded visual values:** none. Numeric SVG geometry and data-derived percentages are not visual tokens; all colour, type, spacing, radius, motion, and control sizing use Sakura variables or shared component rules.
