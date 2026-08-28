# /articlewriter restyle — lane record

Lane of `docs/redesign-research/16-legacy-restyle.md` (PR #12). Page:
`src/pages/archive/article_writer.js`, stylesheet `src/styles/ArticleWriter.css`,
gate `e2e/articlewriter.spec.js`. Base `origin/feat/component-library`.

## Brand coverage — /articlewriter

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | legacy navy `:root` body, plain div | `BRAND.md §2` ladder / `sakura.css --bg` | `.aw-page` (`.sakura` scope, full-viewport `min-height:100dvh` and background) with `.aw-content` constrained to the 880px column |
| Surfaces/cards/panels | none (bare elements) | `BRAND.md §4/§9` / `Card` | `Card` on success output: radius 0, 1px hairline, `--pad-card`, no shadow |
| Text and type roles | `<h1>`/`<h2>` UA defaults, Big Shoulders from legacy `:root` | `BRAND.md §7` / `SectionHead` / `CardTitle` / `MonoLabel` | `SectionHead as="h1"` (`--fs-section` display), `CardTitle as="h2"` (`--fs-title`), `MonoLabel` for the `HTML` meta |
| Spacing and layout | none | `BRAND.md §5` / `--s-*` | `.aw-content` 880px column cap; outer `.aw-page` keeps `--s-16 + --s-8` bar clearance; form gaps `--s-3`/`--s-6`; section gaps `--s-36` (96 phone); `--pad-card` via `Card` |
| Controls and inputs | raw `<input>`/`<button>` | `BRAND.md §4/§8` / `Label` + `Input` + `Button` | `Input face="sans"` (3px, `--ctl-h`, Hanken), `Button` primary/ghost (3px, 40px, 44px coarse) |
| Links and states | none | `BRAND.md §2/§6` / token | button hover/disabled states from `components.css` (`--dur-state` 140ms); input focus ring (`--focus-ring`) |
| Icons and marks | none | n/a — no icon needed | no decorative mark added; none present |
| Images/data graphics | none | n/a | n/a |
| Motion | none | `BRAND.md §6` / `--dur-pulse` | `Skeleton` pulse (1800ms, opacity only) — the library's ratified loop, off under `prefers-reduced-motion` via `components.css`; no page-level animation |
| Responsive behavior | none | `BRAND.md §1/§5` | 880px column → fluid; `--pad-card` and section gaps drop a rung ≤767px; 44px controls on coarse pointer; verified 375px iPhone profile, no horizontal overflow |
| Loading/error/empty states | loading = `<p>` text; error = console-only; empty = bare form | state token/component | loading: `role="status"` + `MonoLabel` + `Skeleton` + disabled button; failure: `role="alert"` + `StatusPill status="error"` + `--danger-text` body; empty: form with labeled input |
| Generated-article HTML | `dangerouslySetInnerHTML` | flagged (see below) | `.aw-article` token-only prose mapping in `ArticleWriter.css` |

**Unmapped aspects** (each blocks done until the owner decides):
- **Arbitrary article-HTML typography.** The library has no prose-headings component, and the generator returns unknown HTML. The page maps returned elements onto ratified roles in `ArticleWriter.css` (h1–h4 → display face at `--fs-title-lg`/`--fs-title`/`--fs-body`; p/li → sans body; a → `--accent-hi` underline; code → JetBrains mono; blockquote/hr → §9 hairline; img `max-width:100%`). Flag: owner decides whether to ratify a shared prose component (`BRAND.md §11.4`) or accept the page-local mapping. Elements the mapping does not cover (tables, forms, …) render with UA defaults — also flagged.
- **Trust boundary unchanged.** `dangerouslySetInnerHTML` on generator output is preserved exactly; this lane found no separate security requirement and did not change product behavior. Flag: security review of the generator output boundary is out of scope for a visual lane.
- **Visible failure state added.** The old page swallowed fetch errors into `console.error`; the plan's done criteria require a visible, accessible failure state, so the lane added `role="alert"` + a `--danger-text` message. The request, loading, and success behavior are unchanged (plus `!response.ok` now surfaces non-2xx JSON bodies instead of rendering nothing).

**Hard-coded visual values:** none outside tokens or shared brand roles. `max-width:880px` and `max-width:70ch` are `BRAND.md §5`'s named column caps (the library's own `.on-code` uses the same 880px literal); loading lines use the content measure at full width, then subtract `--s-12` and `--s-24`; generated heading line-height `1.05` mirrors the shared `Display`/`SectionHead` role in `components.css`; `text-underline-offset:3px` mirrors `.on-btn`'s link treatment; `1px` hairlines are `BRAND.md §9`; `767px` is the shared phone breakpoint (`sakura.css`/`components.css`).

## Verification

- `CI=true yarn test` — 450 passed.
- `CI=true yarn build` — passes; `/articlewriter` stays a separate lazy chunk (`article_writer-*.js`).
- `npx playwright test e2e/articlewriter.spec.js` — 4 passed: empty, loading+success+copy (stubbed generator, clipboard permission granted), failure (`route.abort`), 375px coarse-pointer (iPhone profile, dark ladder: bar clearance, 44px targets, no overflow).
- Full e2e suite: 148 passed; `/permit` legacy-visual is the documented permitted red (`OPEN-DECISIONS.md` item 1); `/studio` + `/transfer` fail identically on the untouched base tree (Clerk instance unreachable in this environment); `/definitely-not-a-page` passed on re-run (timing flake under full parallel load, page untouched by this lane).
- Live computed-style audit in both themes: page `--bg`, Familjen on all headings, 3px controls at 40px, square `Card` with hairline + 28px padding, JetBrains inline code, danger error text — all mapped.
