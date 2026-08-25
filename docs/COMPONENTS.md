# COMPONENTS.md — component library inventory

Built 2026-08-25 on branch `feat/component-library`. Source of truth for the components; the
source of truth for the *values* they use is `docs/BRAND.md`, and nothing here overrides it.

All twelve open questions were reviewed and closed the same day — see `docs/DECISIONS.md` D-12…D-18.

Gallery: `/_components` (dev server only). `docs/DECISIONS.md` follow-on item 4 is this work.

---

## Rules for using this library

- Import primitives from `@/components/ui/<name>`, brand pieces from `@/components/brand`.
- **Every consumer must render inside an element carrying `.sakura`.** Tokens are scoped there and
  never on `:root` (`AGENTS.md` §2). Outside it, a component inherits legacy navy/gold.
- Overlays (dialog, sheet, popover, dropdown, select, tooltip, command dialog) portal to
  `document.body` and re-scope themselves via `@/components/brand/portal-scope`. Do not portal a
  new overlay without it.
- `<Toaster />` renders in place, not through a portal — mount it **inside** a `.sakura` element.
- Every visual value lives in `src/styles/components.css`. `.jsx` files carry structure and class
  names only: no hex, no radius, no duration, no font name (`BRAND.md` §11.1).
- Do not add a Tailwind utility to override a component. `components.css` is unlayered and beats
  `@layer utilities`; that is deliberate.
- All components are React 18 `forwardRef`. Registry output assumes React 19 and omits it; anything
  used as a Radix `asChild` child breaks without it. Swept and enforced 2026-08-26 (D-24) by
  `src/components/ui/forward-ref.test.jsx`, which fails on any DOM-rendering export that is a plain
  function. The exceptions are the parts that render no DOM of their own — `Dialog`, `Sheet`,
  `Select`, `Popover`, `DropdownMenu`, `DropdownMenuSub`, `Tooltip`, `TooltipProvider`,
  `CommandDialog` — which are Radix context Roots with no node to point a ref at.

## Token layer

`src/styles/sakura.css` now names the values `BRAND.md` locks, so components reference tokens:

| Group | Tokens | Source |
|---|---|---|
| Radius | `--r-surface` `--r-control` `--r-pill` | §4 |
| Spacing | `--s-1 … --s-36`, `--pad-card` | §5 |
| Motion | `--dur-state` `--ease-state` `--dur-camera` `--ease-camera` `--type-cadence` | §6 |
| Type | `--fs-display` `--fs-section` `--fs-title-lg` `--fs-title` `--fs-body` `--fs-mono` `--fs-label` `--lh-body` `--lh-mono` `--track-display` `--track-label` | §7 |
| Mark | `--fs-wordmark` | §10 — names the "nav: ~20px" the section already fixes (added D-25) |
| Fonts | `--font-display` `--font-sans` `--font-mono-body` `--font-mono-label` | §7 / D-07 / D-08 |
| Derived | `--danger-text` `--overlay` `--shadow-dossier` `--focus-ring` `--focus-ring-w` | §2.3 / §9 |
| Controls | `--ctl-h` `--ctl-h-sm` | §4 (added D-12) |
| Icons | `--icon` (the §8 18px grid unit) | §8 (added D-17) |
| Motion | `--dur-pulse` | §6 (added D-18) |

`--font-mono` is retained as an alias of `--font-mono-label`, because every pre-existing
sakura-scoped use of it (`chrome.css`, `graph.css`) is a label. New code should name the role.

## Where each component came from

Registry components were added with `npx shadcn@latest add <name>` (style `radix-nova`, JS output),
then restyled and trimmed. "Trimmed" means variants and slots the brand has no use for were deleted
from the file, not just left unstyled.

### Primitives — `@/components/ui`

| Component | Source | Props | Brand rules encoded |
|---|---|---|---|
| `button` | shadcn/ui | `variant` `primary\|ghost\|link\|danger`, `size` `default\|sm\|icon`, `asChild` | §4 3px · §7 Martian label · §6 140ms · §1 44px on coarse pointer |
| `input` | shadcn/ui | `face` `sans\|mono`, native input props | §4 3px · §7 16px sans body (`face="mono"` → JetBrains, D-08) |
| `textarea` | shadcn/ui | `face`, native textarea props | as `input` |
| `select` | shadcn/ui | Radix Select parts, `SelectTrigger/Content/Item/Label/Separator/Group/Value` | trigger 3px, panel 0 · §8 glyph chevron and tick, no lucide |
| `checkbox` | shadcn/ui | Radix Checkbox props | §4 3px · 24px so an §8 18px icon fits (D-17) · tick is the one ratified icon exception (D-13) |
| `radio-group` | shadcn/ui | Radix RadioGroup props | §4's third named exception — round (D-12) |
| `switch` | shadcn/ui | Radix Switch props (`size` deleted) | §4 — redrawn as a 3px track, **not** a 999px pill · 24px tall to match the checkbox (D-17) |
| `label` | shadcn/ui | `role` `label\|inline` | §7 label role is uppercase Martian; `inline` is sans for checkbox text |
| `badge` | shadcn/ui | `tone` `neutral\|accent\|success\|warning\|danger`, `solid`, `asChild` | §4 3px · §2 tones limited to rationed states |
| `card` | shadcn/ui | `interactive`; `CardHeader/Title/Description/Content/Footer` (`CardAction` deleted) | §4 radius 0 · §9 hairline, no shadow · §5 `--pad-card` |
| `separator` | shadcn/ui | `orientation` `decorative` | §9 the 1px hairline |
| `avatar` | shadcn/ui | `size` `sm\|default\|lg`; `AvatarImage` `AvatarFallback` (badge/group/count deleted) | §10 **square, 3px, `oN` on `--bg`** — not a circle |
| `skeleton` | shadcn/ui | `shape` `surface\|control\|text` | §6's second permitted loop: 1800ms opacity pulse, off under reduced motion (D-18) |
| `progress` | shadcn/ui | `value` 0–100 | §4 radius 0 · §5 4px tall · §6 140ms |
| `scroll-area` | shadcn/ui | `orientation`; `ScrollBar` | §9 hairline thumb |
| `table` | shadcn/ui | `numeric` on `TableHead`/`TableCell` | §7 header is a label row · §9 hairline rows · D-08 numerics in JetBrains |
| `tabs` | shadcn/ui | Radix Tabs parts (pill/segmented list variants deleted) | §4 no 999px tabs · active = accent hairline on the §9 rail |
| `tooltip` | shadcn/ui | Radix Tooltip parts, `TooltipProvider` required | §7 label mono · §9 no shadow, no arrow · §1 never the only carrier of a label |
| `dialog` | shadcn/ui | `showClose`; Radix Dialog parts | §4 radius 0 · §9 no shadow, confirmed in review · §6 140ms fade, no scale |
| `sheet` | shadcn/ui | `side` `right\|left\|top\|bottom`, `showClose` | §4 radius 0 · §6 enters on the 640ms camera curve |
| `dropdown-menu` | shadcn/ui | Radix DropdownMenu parts incl. checkbox/radio items, sub-menus, `tone="danger"` on items | panel 0 / item 3px · §8 glyph indicators |
| `popover` | shadcn/ui | Radix Popover parts, `PopoverTitle` `PopoverDescription` | §4/§9 as dialog |
| `command` | shadcn/ui (cmdk) | `Command` `CommandDialog` `CommandInput` `CommandList` `CommandEmpty` `CommandGroup` `CommandItem` `CommandShortcut` `CommandSeparator` | §8 `▸` prompt sigil instead of a search icon · matches `src/terminal/Palette.jsx` |
| `sonner` | shadcn/ui (sonner) | `Toaster`, all sonner props | §4 radius 0 · §9 no shadow · §8 glyph icons |
| `kbd` | shadcn/ui | `Kbd` `KbdGroup` | §7 key hints are Martian · §8 `⌘` is a glyph |

### Brand components — `@/components/brand`

All hand-built: no registry ships an equivalent, and every one of them is a `BRAND.md` concept
rather than a generic UI part.

| Component | Props | Brand rules encoded |
|---|---|---|
| `Glyph` | `name` (see `GLYPHS`), `tone`, `label` | §8 / D-09 — a mono character in a `<span>`, never an SVG path. Unlabelled marks get `aria-hidden`. `checkText` is text-only (D-14) |
| `MonoLabel` | `tone` `faint\|muted\|text\|accent`, `as` | §7 the uppercase Martian label role |
| `Display` | `as` | §7 Familjen Grotesk 700 at `-0.02em` |
| `SectionHead` | `kicker` `title` `as` `rule` | §7 section head · §5 12px label→content · §9 optional hairline rule |
| `Log` / `LogLine` | `time` `glyph` `state` `dim\|default\|active\|success\|error` | §5 the one place density is allowed, 880px column cap · §7 JetBrains body + Martian timestamp · §8 glyph, incl. the text-only tick (D-14) · §1 readable at 375px |
| `CodeBlock` | `title` `meta` | §4 radius 0 · §7 mono body · §9 hairline header strip |
| `Statusline` / `StatuslineSpacer` | — | §5 density · §7 Martian |
| `StatusPill` | `status` `neutral\|live\|routing\|warning\|error`, `dot` | §4 — one of the only two components allowed 999px · §2 jade means "it worked" |
| `PromptBar` | `placeholder` `onSubmit`, native input props | §4 3px control · §8 `▸` sigil · §6 140ms focus |
| `NodeCard` | `kicker` `title` `description` `tech[]` `active` `as` | §4 radius 0 · §7 display title · §9 hairline. Reads `--node-*` **only** under `html[data-mode="graph"]` — they describe the canvas (`THEMES.md` §3) |
| `TechToken` / `TechRow` | — | §4 3px · §5 8px inline token gap · §2 low-contrast so a stack list is not the loudest thing on screen |
| `Dossier` / `DossierHeader` | `kicker` `title` `meta` `onClose` | §9 the only component that lifts — and only in light; dark uses `--border-strong` instead (D-15) |
| `StatBlock` / `StatRow` | `value` `label` | §7 display figure + Martian label |
| `Icon` | `name` (allow-list), `size` | §8's narrow exception — lucide only, stroke locked to 1.5, sized on `--icon`. Adding a name is a decision (D-13, D-17) |
| `Wordmark` | `as` | §10 — `oN.c`, display face, the dot in `--accent`. One size (`--fs-wordmark`); §10's 12px floor is a constraint on shrinking it, not a second size. The dot is a colour swap only, so the mark survives monochrome (D-25) |
| `ModeToggle` | `mode` `onModeChange` `label` | §4 — the second and last 999px component. Controlled only: mode lives in `src/mode/ModeProvider.jsx`, and reaching for that context here would break the gallery. Two fixed labels, no `options` prop — the brand has two interfaces (D-25) |
| `PortalScope` | — | `AGENTS.md` §2 — re-scopes `.sakura` around portalled overlays |

### Not sourced from Magic UI or 21st.dev

- **Magic UI**: its registry index was fetched and read (247 items). It is a motion/decoration
  library — shimmer, meteors, particles, border-beam, orbiting circles, glow cards, marquee,
  typing. `BRAND.md` §6 bans infinite loops, particles and springs; §9 bans glow and
  glassmorphism. The two arguably relevant items (`terminal`, `typing-animation`) duplicate
  `src/terminal/` and its 28ms cadence engine in `src/terminal/lib/cadence.js`, worse.
- **21st.dev**: publishes per-author shadcn-compatible URLs, no flat index. Its primitives for this
  list are re-publishes of the same shadcn/Radix bases; taking them upstream from shadcn gives the
  same code without a third-party indirection.

---

## Decisions taken 2026-08-25

Every gap this library hit was reviewed by Oliver against live renders and closed. Full rationale
and what was rejected: `docs/DECISIONS.md` D-12…D-18. Summary of what changed in the code:

| Was | Decision | Where it lives now |
|---|---|---|
| Control heights invented | `40 / 32 / 44-coarse`; checkbox + switch `24` | `--ctl-h`, `--ctl-h-sm`, `.on-check`, `.on-switch` |
| Mid-tier type sizes invented | card/dialog/node `24`, dossier `32` | `--fs-title`, `--fs-title-lg` |
| Radio shape unruled | round, third named §4 exception | `.on-radio` |
| 7 unratified glyphs | 6 ratified; the tick became an icon | `glyph.jsx`, `icon.jsx` |
| Tick weak at control size | lucide, 1.5 stroke, full 18px grid | `icon.jsx`, `--icon` |
| Tick also used in log text | character kept for text ONLY, named `checkText` | `glyph.jsx` |
| Skeleton frozen | 1800ms opacity pulse, second permitted loop | `--dur-pulse`, `.on-skeleton` |
| Dossier shadow guessed | sideways in light, none in dark | `--shadow-dossier`, `--dossier-border` |
| Terminal untextured | scanline reinstated at 3% | `.term-screen::after` |
| Dialog shadow uncertain | confirmed none | `.on-dialog` |
| Avatar font queried | already Familjen Grotesk 700, no change | `.on-avatar-fallback` |

### Closed 2026-08-26 — the four themes

**All four themes ship** (D-22). The scheme is `docs/THEMES.md`; values and contrast tables are
`docs/redesign-research/04-sakura-palette.md` §6. Theme and mode are independent attributes:
`<html data-theme="light|dark">` picks the ladder, `<html data-mode="graph|terminal">` picks the
interface. What changed for this library:

- `--node-*` is now declared on **both** ladders. `NodeCard` still reads them only under
  `html[data-mode="graph"]` — that guard is about the *canvas*, not about a missing theme: a node
  card rendered inside the terminal takes the shared surface ladder on purpose.
- `--term-*` is declared on both ladders too, under `[data-mode="terminal"]`.
- `--border-strong` and `--error-hi` gained light values, **scoped to terminal · light only** and
  staying that way (D-21). Keep every `var(--border-strong, …)` fallback chain intact.
- `Log` gained one theme-scoped rule each way: the light active row is marked by a hairline and 500
  weight rather than a loud wash (D-20), and the active row's timestamp steps from `--text-faint`
  to `--term-log` on both ladders (D-22).

**Still open — plumbing, not design:** nothing sets `data-theme` outside `/_components`, and
`sonner.jsx` still derives its `theme` prop from mode. Both are listed in `docs/THEMES.md` §6.

## Follow-up work this created

1. `src/graph/graph.css` sizes its display type for a **condensed** face (`/* condensed display
   face: 26 → 34 */`). Familjen Grotesk is normal-width, so `.kind-root .card .t`, `.d-title`,
   `.gl-name`, `.gl-title` and `.d-stat .v` now read wide and loose. They need a retune pass against
   screenshots — a visual decision, deliberately not made here.
2. `index.html` still loads **Big Shoulders**, because the frozen legacy `:root` stack in
   `src/styles/theme.css` points `--font-display` at it. Drop it from the font URL when the legacy
   pages under `src/pages/` are restyled.
3. `e2e/legacy-visual.spec.js` → `/permit` fails on `redesign/terminal-v1` **before** this branch
   (verified by stashing). `/pull` and `/college` pass. Unrelated pre-existing baseline drift.
4. Nothing shipped consumes this library yet, so `components.css` is absent from the production
   bundle. Entry chunk is 48.18 kB gz, inside the 180 kB budget.
5. **Do not strip the terminal scanline.** It was removed once under P8 and reinstated
   deliberately at 3% (D-16). Reversing it needs a new decision entry.

## Verification

```bash
node scripts/contrast-check.mjs            # 183/183 pairs pass, across all four themes
npm run test:run                           # 441 unit tests (353 + the D-24 forwardRef sweep)
npx playwright test e2e/gallery-shots.spec.js
```

`e2e/gallery-shots.spec.js` screenshots the gallery at 1440px and 375px in both shipped themes,
fails on any console error, and asserts the portalled dialog keeps `--surface`, radius 0 and no
shadow. Shots land in `e2e/__shots__/` (gitignored — review artefacts, not baselines).
