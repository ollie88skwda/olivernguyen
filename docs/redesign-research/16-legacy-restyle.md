# Legacy page restyle plan

**Owner:** legacy-page restyle lanes
**Base:** `origin/feat/component-library`
**Scope:** ten frozen navy/gold routes only. Do not change the already-redesigned home, graph, or terminal surfaces.

## Frozen route set

| Route | Page entry | Current stylesheet(s) | Current state |
|---|---|---|---|
| `/permit` | `src/pages/driving/permit.js` | `src/styles/App.css` | Long driving-permit guide with headings, paragraphs, links, ordered steps, and the DMV image. Uses a large display heading, mono section headings, navy/gold legacy tokens, and a Framer Motion entrance. |
| `/license` | `src/pages/driving/drivers_license.js` | `src/styles/App.css` | Short follow-on guide with one section and a link back to `/permit`; currently inherits the generic legacy content treatment. |
| `/articlewriter` | `src/pages/archive/article_writer.js` | `src/styles/App.css` | Minimal article-generation form: product input, generate action, loading copy, generated HTML, and clipboard action. It calls the local generation service and injects returned HTML. |
| `/sat-resources` | `src/pages/sat/sat_resources.js` | `src/styles/App.css` | Placeholder resource page with a single “Coming soon” state. |
| `/sat-signup` | `src/pages/sat/sat_signup.js` | `src/styles/App.css` | Placeholder information page with a heading and explanatory copy; no working form yet. |
| `/pull` | `src/pages/pull.js` | `src/styles/Pull.css` | Stateful AU tournament scheduler. It has a name screen, commitment choices, weekend cards, progress bars, chips, rankings, loading, and Supabase-backed persistence. It currently has its own navy/gold visual system, 10px rounded controls, and bespoke transitions. |
| `/emoji` | `src/pages/emoji.js` | `src/styles/Emoji.css` | Interactive emoji fishbowl generator with drag behavior, count input, background swatches, clear/download actions, and a white/black Geist-style visual system. It paints a full viewport background and uses pill controls. |
| `/college` | `src/pages/college/index.js` | `src/styles/College.css` | Private-tools hub with eyebrow, placeholder headline and lede, a rule, and three linked cards for `/major`, `/apply`, and `/studio`; lock labels and routes are visible. |
| `/major` | `src/pages/major/index.js` and section files | `src/styles/Major.css`, `MajorB.css`, `MajorC.css` | Large private decision engine with status dial, scoring board, duel, sensitivity sections, evidence, glossary, edit controls, persistence, and loading/offline states. It has page-local warning/good colors, bespoke SVG/data visualizations, and legacy spacing/type/motion values. |
| `/apply` | `src/pages/apply/index.js` and section files | `src/styles/Apply.css`, `ApplyB.css` | Large private application planner with status, school board, portfolio, programs, calendar, filters, effort, evidence, glossary, edit controls, persistence, and loading/offline states. It has page-local tokens, charts, forms, and legacy spacing/type/motion values. |

`src/Routes.js` confirms these ten route entries. `/` mounts `src/home/Home.jsx`; graph and terminal are mounted by their own redesigned surfaces and are not legacy work. `/sign-in`, `/studio`, and `/transfer` are private/gated flows explicitly excluded by `docs/redesign-research/05-v1-spec.md` §2.3. The full-bleed `/be-my-girlfriend` routes are also excluded. `src/pages/home.js` and `src/pages/top_bar.js` are unmounted leftovers, not routes to restyle.

## Shared migration contract

1. Mount every migrated page inside `.sakura`; never rely on `:root` values from `src/styles/theme.css`.
2. Use only values from `docs/BRAND.md` and tokens in `src/styles/sakura.css`. Keep the two independent axes: `data-theme` selects the ladder and `data-mode` selects the interface.
3. Prefer the library primitives from `@/components/ui/*` and brand pieces from `@/components/brand` listed in `docs/COMPONENTS.md`. Keep page-specific composition in the page stylesheet; do not create duplicate controls.
4. Preserve each page's information, working interactions, links, persistence, gates, loading/error states, and accessibility semantics unless a lane records a separate product decision.
5. Replace legacy Big Shoulders with Familjen Grotesk, legacy mono with the correct JetBrains body or Martian label role, and bespoke values with the nearest ratified spacing/type/radius/motion token.
6. Keep surfaces square, controls 3px, and pills only where the brand allows them. Do not carry over legacy gradients, glow, grain, arbitrary shadows, rounded cards, or unratified animation.
7. Keep the existing route and lazy-loading behavior in `src/Routes.js`. Do not pull a legacy page into the `/` entry chunk.

## Brand-book coverage rule

**Every visual aspect of every page must map to a brand source.** A valid source is exactly one of:

- a named rule or value in `docs/BRAND.md`;
- a token in `src/styles/sakura.css`;
- a component or encoded rule in `src/components/ui/*`, `src/components/brand/*`, and its inventory in `docs/COMPONENTS.md`.

This includes the page background, surfaces, borders, text, typefaces, sizes, line heights, spacing, radii, icons, illustrations, images, charts, controls, focus states, hover/active states, loading/error/success states, responsive behavior, and motion. If an aspect has no brand home, **flag it in the lane handoff and in the page PR; never invent an ad hoc value.** A flag blocks that page's definition of done until the owner decides whether to remove the aspect, map it to an existing rule, or open a product/design decision.

### Required lane coverage record

Copy this template into each lane's working notes or PR description and fill every row. A blank, “same as before,” or unexplained hard-coded value fails review.

```md
### Brand coverage — /route

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background |  | `BRAND.md §…` / `sakura.css --…` | selector or component |
| Surfaces/cards/panels |  | `BRAND.md §4/§9` / `Card` | selector or component |
| Text and type roles |  | `BRAND.md §7` / `Display` / `MonoLabel` | selector or component |
| Spacing and layout |  | `BRAND.md §5` / `--s-*` | selector or component |
| Controls and inputs |  | `BRAND.md §4/§8` / UI primitive | component + props |
| Links and states |  | `BRAND.md §2/§6` / token | hover, focus, active evidence |
| Icons and marks |  | `BRAND.md §8/§10` / `Glyph` / `Icon` | name and component |
| Images/data graphics |  | named brand rule or flagged decision | alt text + treatment |
| Motion |  | `BRAND.md §6` / `--dur-state` | reduced-motion behavior |
| Responsive behavior |  | `BRAND.md §1/§5` | phone + desktop evidence |
| Loading/error/empty states |  | state token/component | rendered state evidence |

**Unmapped aspects:** none, or list each exact aspect and the decision/flag that blocks it.
**Hard-coded visual values:** none, or list each with its brand source.
```

## Page plans and definitions of done

### `/permit`

- Map the guide shell to `.sakura`, `SectionHead`, `Display`/`MonoLabel`, `Card` or square media framing, and `Button`/link treatment where controls are needed.
- Map numbered instructions to `Log`/`LogLine` only if they remain log-like; otherwise use semantic ordered lists with the brand body and label roles. Keep the DMV image, its alt text, and external links.
- Replace the long entrance translate animation with the permitted opacity-only scroll/state behavior, or remove it. Preserve the long native scroll because the content needs it.
- Flag the image presentation if no existing brand media-frame rule covers its crop, sizing, or border.
- Done: content and external links work; image remains accessible; phone and desktop renders have no overlap; all visual rows have coverage evidence; reduced motion is static; `/permit` passes the legacy visual check or its changed baseline is explicitly reviewed.

### `/license`

- Use the same content-page grammar as `/permit`: `.sakura`, display heading, body copy, semantic section, and brand link treatment.
- Keep the `/permit` cross-link and make the short page intentional rather than padding it with invented copy.
- Done: route and link work; the page has no legacy navy/gold dependency; heading order and focus state pass; coverage record is complete at phone and desktop.

### `/articlewriter`

- Map the product field to `Label` + `Input` (`face="sans"`), generate/copy actions to `Button`, loading to `Skeleton` or an explicit text state, and output to `Card`/`CodeBlock` as appropriate to the returned content.
- Keep the API request, loading/error behavior, generated HTML semantics, and clipboard action. Sanitize or preserve the existing trust boundary only if the lane finds a separate security requirement; do not silently change product behavior in a visual lane.
- Flag the rendered arbitrary article HTML treatment if it needs typography or elements not covered by the library.
- Done: empty/loading/success/failure states are visible and accessible; input and buttons meet touch sizes; copy still works; no ad hoc type/color/radius values remain; coverage record is complete.

### `/sat-resources`

- Treat “Coming soon” as an intentional empty state: `SectionHead` plus brand body/status treatment, not a fake resource list.
- Use a square `Card` only if it adds meaning; do not add invented content.
- Done: empty state is clear; route renders inside `.sakura`; no unnecessary motion; coverage record is complete at phone and desktop.

### `/sat-signup`

- Keep the informational placeholder. Map heading/body to `Display`/body roles and reserve `Button`, `Input`, or `Card` for real controls/content only when they exist.
- Do not fake-terminalize the future form; `05-v1-spec.md` says forms stay forms.
- Done: copy remains accurate; the placeholder has a clear next state without invented claims; route, typography, focus behavior, and coverage record pass.

### `/pull`

- Keep the scheduler's name flow, commitment selection, weekend availability, ranking banner, progress, Supabase behavior, and clear/change actions.
- Map name and numeric entry to `Label` + `Input`, primary actions to `Button`, status/commitment states to `Badge` or `StatusPill` only when the state is real, repeated weekend entries to square `Card`/table-like rows, and amount/date values to mono body or label roles.
- Remove the bespoke 10px rounded controls, legacy navy/gold palette, arbitrary shadows, and transform-heavy transitions. Use the 140ms state transition; do not use jade except for active/routing/success meaning.
- Flag the “commitment amount” visual language if no existing brand component expresses it without inventing a new decorative chart.
- Done: both name and scheduler screens work with real persistence; loading, empty, unavailable, selected, and error states are covered; 44px coarse-pointer controls work; phone layout has no horizontal overflow; coverage record is complete.

### `/emoji`

- Preserve the toy interaction, drag behavior, count control, swatches, clear, and download actions, but mount the page in `.sakura` rather than its white/black standalone palette unless the route is explicitly approved as a separate art-directed exception.
- Map controls to `Input`, `Button`, and `Badge`/label roles; use `Glyph`/`Icon` only from the allow-list. Keep emoji glyph rendering as content, not as an invented icon system.
- Flag the fishbowl/canvas treatment, swatch rainbow, and custom color input if they have no brand-book home. Do not replace them with arbitrary Sakura decoration just to avoid a flag.
- Done: drag and keyboard/input paths still work; download and clear work; controls meet touch targets; custom color and emoji rendering remain legible in both ladders; every bespoke visual aspect is covered or flagged.

### `/college`

- Map the hub eyebrow to `MonoLabel`, title to `Display`, rule to `Separator`, and each tool link to an interactive `Card` with a state `Badge` for its real gate.
- Preserve the explicit placeholder copy; do not invent the headline or descriptions. Keep links to `/major`, `/apply`, and `/studio` and their gate labels.
- Done: placeholder status is obvious; cards have keyboard focus and 44px-equivalent usable targets; routes work; square surfaces and Sakura tokens are used; coverage record is complete.

### `/major`

- Preserve the decision model, calculations, edit mode, glossary, persistence, offline/saved states, sections, and all semantic explanations.
- Map page hierarchy to `Display`, `SectionHead`, `MonoLabel`, `Card`, `Table`, `Progress`, `Input`/`Select`/`Textarea`, `Button`, `Badge`/`StatusPill`, `Tooltip`, `Separator`, and `Log`/`EvidenceLog` where the existing semantics fit. Keep data graphics only when their marks can be tied to the brand palette and type rules.
- Replace `--major-warn` and `--major-good` with sanctioned warning/success tokens. Replace page-local sizes, gaps, radii, gradients, shadows, and transition durations with the Sakura ladder. Audit all three stylesheets and every section file, not only `index.js`.
- Flag the status dial, tornado/ridge/board visual encodings, and any SVG stroke/fill that lack a direct brand mapping. A chart's data meaning does not itself authorize a new color.
- Done: all existing calculations and edit interactions pass; loading/offline/saved/preview/glossary states pass; data graphics remain understandable in both themes; no console errors or overflow at phone/desktop; reduced motion works; coverage record has no unresolved unmapped aspect.

### `/apply`

- Preserve the application model, filters, portfolio calculations, school evidence links, deadlines, profile persistence, edit mode, glossary, loading/offline/saved states, and every section.
- Map hierarchy and controls as in `/major`; use `Table`, `Card`, `Progress`, `Badge`, `StatusPill`, `Input`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Button`, `Tooltip`, and `Log` where each matches its semantics. Use mono for dates/numbers and sanctioned state tones only.
- Replace `Apply.css`/`ApplyB.css` page-local tokens and legacy spacing, radius, gradient, shadow, and motion values. Audit all section components and any charts/portfolio visuals.
- Flag tier/odds/calendar/effort visual encodings or custom controls that do not map to a library component or explicit BRAND rule.
- Done: calculations, filters, profile save, edit controls, links, and all state variants work; deadlines and numeric data remain readable; coarse-pointer controls meet 44px; both themes and phone/desktop layouts pass; reduced motion works; coverage record has no unresolved unmapped aspect.

## Review gate for every lane

1. Read the route entry, all imported page styles, and every child section before editing.
2. Complete the coverage record before asking for review.
3. Search changed files for hex colors, `rgba`, `linear-gradient`, `box-shadow`, arbitrary `border-radius`, font names, and durations. Each remaining hit must point to a brand source or be flagged.
4. Test the route in a real browser at desktop and 375px/coarse-pointer conditions, including its primary interaction and every loading/empty/error state that can be reached without unavailable credentials.
5. Run the route's relevant tests plus the repository checks defined in `AGENTS.md`. Treat any failure other than the documented `/permit` baseline as a regression.
6. The reviewer rejects the page if any visual aspect is unmapped, silently invented, inaccessible, or only checked in one theme/viewport.

## Parallel ownership

Assign one lane per route. Lanes may share the migration contract and coverage template, but must not edit another route's page or stylesheet. A reviewer lane checks the completed coverage record, source audit, browser renders, and route behavior before the restyle is considered complete.
