# Brand coverage — /sat-signup

Every visual aspect of the restyled placeholder maps to a brand source.

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | Legacy navy/gold from `theme.css` `:root`; `.content` 680px column | `.sakura` scope (`BRAND.md §3`; `sakura.css` `.sakura` block) | `.sat-signup` root |
| Surfaces/cards/panels | None | None; `Card` reserved for future form content | No surfaces rendered |
| Text and type roles | Big Shoulders 900 heading; sans body at 1.0625rem | `Display` (`BRAND.md §7`) at `--fs-section`; `.on-prose` (`BRAND.md §7`) | `Display as="h1"`; paragraph classes |
| Spacing and layout | `.content` padding 120/24/80px; 680px column | `BRAND.md §5` ladder; 70ch body measure | `.sat-signup-main` |
| Controls and inputs | None | None; reserved for the future form | No controls rendered |
| Links and states | None | None; chrome navigation remains unchanged | No page links or states |
| Icons and marks | None | None | No icons or marks rendered |
| Images/data graphics | None | None | No graphics rendered |
| Motion | None | None | Static placeholder |
| Responsive behavior | Side padding 24px, then 18px at 720px | Sakura ladder side padding; phone breakpoint at 767px | `@media (max-width: 767px)` |
| Loading/error/empty states | Lazy-route fallback; placeholder copy | Lazy route and fallback unchanged; placeholder states its next step | `Routes.js`; page copy |

**Unmapped aspects:** none.

**Hard-coded visual values:** none. Authorized functional layout literal: `min-height: 100dvh` on `.sat-signup` for full-viewport coverage; it is not a Sakura visual token. Named brand rules also permit `70ch` for the body measure and `767px` for the phone breakpoint.
