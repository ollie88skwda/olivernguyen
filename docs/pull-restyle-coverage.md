# Brand coverage — `/pull`

Lane record for the isolated legacy `/pull` restyle. Companion gate: `e2e/pull.spec.js`.

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | Legacy navy/gold page shell; name screen centered in the viewport | `.sakura` scope and independent theme ladder from `BRAND.md §2/§3`; full-page coverage uses `100dvh` | `.pull.sakura`, `.pull-name-screen`, `.pull-page` in `pull.js`/`Pull.css`; both theme query cases |
| Surfaces/cards/rows | Rounded legacy weekend cards and bespoke separators | Square `Card`, `--r-surface`, `--surface`, and `--border` hairlines from `BRAND.md §4/§9` | `Card interactive` for weekend rows and `Card` for the ranking banner |
| Text and type roles | Big Shoulders title, legacy mono labels, and bespoke body sizes | `Display`, `SectionHead`, `MonoLabel`, `.on-prose`, `--font-mono-body`, and `--fs-*` from `BRAND.md §7` | Name hero uses `.pull-name-title` → `--fs-display`; dates and amounts use JetBrains; labels use Martian |
| Spacing and layout | Bespoke page and control spacing | `BRAND.md §5` 4px ladder, card padding, row gap, and body measure | `--s-*`, `--pad-card`, and `70ch` on the page-owned prose/error detail |
| Controls and inputs | Native legacy input, buttons, and custom commitment rows | `Input`, `Label`, `Button`, `--r-control`, `--ctl-h`, and the 44px coarse-pointer rule | Name form uses `Label`/`Input`/`Button`; commitment rows retain `aria-pressed`; coarse-pointer gate measures disclosure and level rows |
| Links and actions | Legacy change and submit actions | Button variants and 140ms state transition from `BRAND.md §4/§6` | `Button` owns enter, clear, change, retry, and toast-triggering actions |
| Commitment states | Custom active status and check mark | `StatusPill` only for the real committed state; accent selection is a control state; jade is not decorative | `StatusPill status="routing"` for committed amounts; selected rows use `aria-pressed` and `--accent` |
| Icons and marks | Bespoke dot, close mark, and disclosure glyphs | `Glyph` from `BRAND.md §8`; text marks remain typographic | `Glyph` supplies dot, close, separator, up, and down; no decorative chart is added |
| Amount visual language | Legacy pool fill encoded with a custom bar | Existing `Progress` component with its sanctioned square 4px bar and 140ms fill transition | `Progress aria-label="Group pool size"`; the pool value remains a functional data encoding |
| Loading/error/empty/unavailable states | Plain loading text and no explicit fetch error panel | `Skeleton`, `Button`, `Badge`, `StatusPill`, `--error`, and sanctioned state tones | Skeleton cards; retry alert; empty weekend text; unavailable action; selected and committed rows; POST failure toast and rollback gate |
| Persistence and refresh behavior | Direct browser write and optimistic state | Existing Supabase reads/realtime plus the server write path preserved; failed reconciliation restores the pre-write state | `loadPicks`, realtime subscription, `/api/pull/pick`, and the failed POST + failed GET browser test |
| Motion | Legacy transform-heavy transitions and off-book timings | `--dur-state`/`--ease-state`, opacity-only expansion, and reduced-motion fallback from `BRAND.md §6` | `pull-card-expanded` and control transitions; reduced-motion gate checks the static animation state |
| Responsive behavior and accessibility | Legacy layout lacked the Sakura phone/coarse-pointer contract | `BRAND.md §1/§5`; semantic form labels, buttons, list rows, alert, progress label, and disclosure semantics | `375px` overflow and tap-target gate; heading, label, `aria-expanded`, `aria-pressed`, `role="alert"`, `aria-busy`, and progress assertions |

**Unmapped aspects:** none.

**Hard-coded visual values:** The page-owned `1px` borders are the `BRAND.md §9` hairline rule and use Sakura border/error colour tokens; the focus ring uses the shared `.on-focus` treatment from `components.css`, including its sanctioned `1px` offset. `440px` name-card width, `680px` scheduler-column width, and `240px` player-name truncation cap are retained page layout limits and are not Sakura tokens; `100dvh` is functional full-page coverage; `70ch` is the named `BRAND.md §5` body-measure rule. Data thresholds `5000` and `25000` are commitment-pool domain values, not visual tokens. No hard-coded colour, radius, font, or motion value remains in the route stylesheet.
