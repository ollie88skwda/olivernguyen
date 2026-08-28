# Brand coverage — `/permit`

Lane handoff for the legacy permit-page restyle. Companion gate: `e2e/permit-lane.spec.js`.

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | Legacy page used the unscoped content shell and legacy palette | `.sakura` scope and `sakura.css` `--bg` ladder (`BRAND.md §2/§3`) | `main.sakura.permit`; lane checks both theme ladders across both modes |
| Surfaces/cards/panels | No route-owned cards; the DMV image had legacy presentation | Square surface treatment, `--border`, `--surface`, and `--r-surface` (`BRAND.md §4/§9`) | `.pm-shot-link`; lane checks the rendered image frame |
| Text and type roles | Legacy heading, labels, and body copy used legacy faces and sizes | `Display`, `MonoLabel`, `SectionHead`, `.on-prose`, and token-backed subheads (`BRAND.md §7`) | `permit.js` roles; lane checks the h1, h2 headings, ordered steps, and complete route content |
| Spacing and layout | Legacy wrapper supplied bespoke spacing and width | `--s-*` ladder, 70ch body measure, and phone/desktop chrome clearance (`BRAND.md §5`) | `.pm-guide`, `.pm-section`, `.pm-head`; lane checks desktop, phone, no horizontal overflow, and bottom reachability |
| Controls and inputs | No route-owned controls or inputs | None; links remain semantic anchors, and shared chrome remains outside this route's ownership | `permit.js` contains no route-owned form control; lane checks every route link is visible and reachable |
| Links and states | Legacy links inherited generic link styling and had small coarse-pointer targets | `--accent-hi`, focus ring tokens, state duration/easing, and the coarse `--ctl-h` hit area (`BRAND.md §1/§2/§6`) | `.pm-guide a`; lane checks all external hrefs, `target`, `rel`, keyboard focus, hover-ready state, and 44px coarse targets |
| Icons and marks | No route-owned icons or marks | None; shared chrome owns its existing brand marks | No icon or mark rendered by `permit.js`; route matrix covers the mounted page with both mode axes |
| Images/data graphics | DMV requirements screenshot was retained with legacy sizing and presentation | `--surface`, `--border`, and `--r-surface` are the nearest sanctioned square media treatment | `.pm-shot`, `.pm-shot-link`; lane checks exact alt text, visibility, and loaded image. Image sizing/presentation remains flagged because BRAND.md has no explicit media-frame rule |
| Motion | Legacy Framer Motion entrance translated the page for 800ms | Opacity-only `pm-fade` at `--dur-state`/`--ease-state`; reduced motion removes animation and transitions (`BRAND.md §6`) | `.permit.pm-in`, reduced-motion lane test checks static animation and zero-duration transitions |
| Responsive behavior | Legacy layout was not covered across the brand matrix | Phone/desktop boundary, spacing ladder, and coarse `--ctl-h` (`BRAND.md §1/§5`) | Eight lane cases cover both themes × both modes at 1440px and 375px/coarse pointer; each checks overflow and reachable content |
| Loading/error/empty states | Static page had no route-owned data states; lazy loading used the shared fallback | No route-owned state component; shared `RouteFallback` behavior remains in `Routes.js` | Lane waits for the mounted page after navigation and checks the final content; no route-owned loading, error, or empty UI exists |

**Unmapped aspects:** DMV image sizing and border presentation has no dedicated brand media-frame rule. It is explicitly flagged in `permit.css` and uses the nearest sanctioned square surface treatment pending an owner decision.

**Hard-coded visual values:** `70ch` maps to the `BRAND.md §5` body measure; `100dvh` provides functional full-page coverage; `767px`/`768px` implement the `BRAND.md §1` phone boundary; the `3px` underline offset and `1px` focus offset match the existing brand link and focus treatment.

**Verification:** `npx playwright test e2e/permit-lane.spec.js` passed 9 tests in this review: eight theme × mode × viewport cases plus reduced motion.
