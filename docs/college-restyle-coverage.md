# Brand coverage — /college

Lane handoff for the legacy restyle (OPEN-DECISIONS item 1). Every visual aspect of the
restyled page maps to a brand source. Companion gates: `e2e/college-lane.spec.js`,
`e2e/college-style-audit.spec.js`, `e2e/college-layout-audit.spec.js`.

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | cream `--bg-base`, 120px top pad | `BRAND.md §2` ladder + `§5` — `sakura.css --bg`; chrome offset `calc(--s-16 + --s-12)` | `.sakura.cl-page` (College.css) |
| Surfaces/cards/panels | legacy `.cl-card`, border-merged 1px grid, 28/24/32 padding | `BRAND.md §4` radius 0 + `§9` hairline — `Card` (`--pad-card` 28/20) | `<Card interactive>` from `@/components/ui/card` |
| Text and type roles | Big Shoulders 900 uppercase title, Martian 0.62rem eyebrow, 1.1rem lede | `BRAND.md §7` — `Display` (Familjen 700, `--fs-display`), `MonoLabel` (Martian 11px, 0.12em), `.on-prose` body 16/1.6 | `Display as="h1"`, `MonoLabel`, `p.cl-lede.on-prose` |
| Spacing and layout | bespoke 18/26/26/64px margins, `minmax(240px,1fr)` grid | `BRAND.md §5` ladder — `--s-3` label→content, `--s-6` row gap, `--s-36`/`--s-24` section gap, grid gap `--s-6`; content column `880px` = `§5` cap | College.css selectors |
| Controls and inputs | bespoke `.cl-lock` chip | `BRAND.md §4` + `§7` — `Badge` (3px control, Martian label) | `<Badge>` neutral, three gates |
| Links and states | hover bg→`--surface-2`, `-2px` accent outline | `BRAND.md §6` + `§9` + focus tokens — `Card interactive` hover (hairline→accent, 140ms), `--focus-ring`/`--focus-ring-w` | `.cl-tool:focus-visible`, `Card interactive` |
| Icons and marks | none (route text in mono) | `BRAND.md §7` label role — `MonoLabel tone="faint"` routes; `·` in eyebrow is the `§8` separator glyph as literal text | `<MonoLabel tone="faint">` in `CardFooter` |
| Images/data graphics | none | none (no graphics on this page) | — |
| Motion | bespoke 160ms hover | `BRAND.md §6` — `--dur-state`/`--ease-state` via `Card interactive`; killed under reduced-motion by `components.css` | verified `transition: none` under emulated `reduce` |
| Responsive behavior | auto-fit 3→1 col, pads 96/18/72 | `BRAND.md §1` + `§5` — `repeat(3,1fr)` → `1fr` @767, `--pad-card` 20, section gap 96, chrome offset `--s-16 + --s-8` | College.css media query; `e2e/college-layout-audit.spec.js` |
| Loading/error/empty states | Suspense `Blank` fallback in `Routes.js` | unchanged — the lazy page keeps the shared fallback; the page owns no data states | — |

**Unmapped aspects:** none.
**Hard-coded visual values:** `max-width: 880px` on `.cl-inner` — maps to `BRAND.md §5`'s
"content column caps at ~880px" (named value, not a token). Everything else is a token or a
library component.
