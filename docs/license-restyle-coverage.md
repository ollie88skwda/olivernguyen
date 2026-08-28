# Brand coverage — /license

Lane handoff for the legacy license-page restyle. Companion gate: `e2e/license-lane.spec.js`.

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | Legacy `.content` page inherited navy/gold `:root` values and had no chrome clearance | `.sakura` scope (`BRAND.md §3`); Sakura ladder `--bg` (`sakura.css`); shared fixed chrome remains the route shell | `main.sakura.dl`; `SiteChrome` in `Routes.js` |
| Surfaces/cards/panels | No cards or panels; legacy content wrapper supplied the page surface | No route-owned card or panel; square page composition follows `BRAND.md §4/§9` | `main.sakura.dl`; no surface component is rendered |
| Text and type roles | Legacy heading and paragraph used the generic content stylesheet | `Display`, `MonoLabel`, and `.on-prose` (`BRAND.md §7`; `components.css`) | `Display as="h1"`, `MonoLabel`, `p.on-prose` in `drivers_license.js` |
| Spacing and layout | Legacy content wrapper supplied unscoped page spacing | `BRAND.md §5`; `--s-*` ladder; 70ch body measure; phone/desktop chrome clearance | `.dl`, `.dl-col`, `.dl-hero`, and `.dl-section` in `drivers_license.css` |
| Controls and inputs | No route-owned controls or inputs | None; the `/permit` anchor remains a semantic link, with a coarse-pointer hit area using `--ctl-h` | `drivers_license.js` and the coarse-pointer rule in `drivers_license.css`; shared chrome controls remain library components |
| Links and states | One plain `/permit` anchor with legacy link styling | `--accent-hi`; existing brand underline treatment; `--focus-ring`/`--focus-ring-w`; `--dur-state`/`--ease-state` (`BRAND.md §2/§6`) | `.dl-link`; lane gate checks visibility, accent colour, focus ring, `/permit` navigation, and the coarse hit area |
| Icons and marks | No route-owned icons or marks | None; shared chrome wordmark and controls use the existing brand components | No icon or mark rendered by `drivers_license.js`; shared chrome is covered by `docs/COMPONENTS.md` |
| Images/data graphics | None | None | No image, chart, canvas, or data graphic is rendered |
| Motion | No route-specific motion | `--dur-state`/`--ease-state` for the link state change; reduced motion removes the transition (`BRAND.md §6`) | `.dl-link`; `@media (prefers-reduced-motion: reduce)` in `drivers_license.css` |
| Responsive behavior | Legacy wrapper did not provide this Sakura layout | `BRAND.md §1/§5`; 375px phone gutter and desktop layout on the 4px ladder; `--ctl-h` coarse hit area | `@media (max-width: 767px)`, `@media (min-width: 768px)`, and `@media (pointer: coarse)`; lane gate uses a 375px `isMobile`/`hasTouch` context and measures the link |
| Loading/error/empty states | Static page had no page-owned data states; lazy loading used the shared route fallback | No route-owned state component; shared `RouteFallback` behavior is preserved outside this route stylesheet | `RouteFallback` in `Routes.js`; `DriversLicense` has no async state |

**Unmapped aspects:** none. The page owns no controls, icons, images, data graphics, or error/empty state UI.

**Hard-coded visual values:** `70ch` maps to the `BRAND.md §5` body measure; `100dvh` is functional full-page coverage; `768px`/`767px` implement the `BRAND.md §1` phone boundary; `3px` underline offset and `1px` outline offset match the existing brand link/focus treatment in `components.css`.
