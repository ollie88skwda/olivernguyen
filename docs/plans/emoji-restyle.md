# /emoji restyle lane — handoff

Per-lane record for the legacy restyle. Branch `fm/restyle-emoji`.

- Page: `src/pages/emoji.js` mounted in `.sakura`; controls from the library.
- Route/lazy-loading in `src/Routes.js` untouched. Chrome bar unchanged.
- Gate: `e2e/emoji.spec.js` — interactions, both ladders, 375px coarse-pointer touch drag.
- Review artefacts: `e2e/__shots__/emoji-{light,dark}-{desktop,phone}.png` (gitignored).

## Brand coverage — /emoji

| Aspect | Existing behavior | New source | Evidence |
|---|---|---|---|
| Page shell/background | hard `#ffffff`, Geist | `BRAND.md §2` / `.sakura` `--bg` `--text` `--font-sans` | `.emoji-page.sakura` root |
| Chrome clearance | `padding-top: 64px` | `--s-16` (chrome's own height) | `.emoji-page` |
| Header wordmark | 14px Geist link "fishbowl" | `BRAND.md §7` Display at `--fs-title` (D-12) | `Display as="a"` + `.emoji-wordmark` |
| Header attribution | 12px `#8a8a8a` | `§7` mono-label → `MonoLabel tone="faint"` | `MonoLabel` |
| Canvas surface | artboard; PRD: 16px radius + shadow | `§4` square (`--r-surface`) + `§9` hairline `--border`; PRD shadow/radius dropped per §9 (flagged) | `.emoji-canvas` |
| Canvas background | user export colour | **flagged content** — export value, not page chrome | `BG_PRESETS` + inline style |
| Fishbowl image | JPG, runtime white-strip | **flagged content** — toy's fixed centre asset, `alt="fishbowl"` kept | `<img class="emoji-fishbowl">` |
| Emoji items | 900 weight, `-0.04em`, system emoji stack, 0.13×canvas | **flagged content typography** — must match export; face has no §7 home; fallback maps to `--font-sans` | `.emoji-item` |
| Item colour | `#fff`/`#000` selected by rendered sRGB contrast | **flagged functional contrast** — vs user canvas, mirrors export | `getRelativeLuminance` + `getItemColor` → `itemColor` |
| Drag feedback | hover/drag scale + drop-shadow | `§6` state change, `--dur-state`/`--ease-state`; shadow removed per §9 (flagged) | `.emoji-item` transition |
| Text input | pill, decorative `+` + `↵` | `Input` (`.on-field`: §4 3px, §1 44px coarse, §7 sans 16px); `+`/`↵` removed — not in §8 set (flagged); placeholder carries affordance | `Input` |
| Count presets | navy pills 67/41/25 | `Button size="sm"` ghost→primary when active (§4 3px, §7 label) | `Button` + `aria-pressed` |
| Count input | 44px navy number field | `Input face="mono"` (D-08 numerics), `--s-12` × `--ctl-h-sm` | `Input` |
| `×` + `↵` chars | aria-hidden decoration | removed — not in §8 glyph set; group `aria-label="count"` + visible `MonoLabel` carry semantics (flagged) | `role="group"` |
| Swatches | 24px circles, double ring active | round via §4's radio exception (`--r-pill`, D-12); `--s-8` desktop / `--ctl-h` coarse (§1); active+focus = `--focus-ring` | `.emoji-swatch` |
| Swatch rainbow | conic gradient | **flagged** — no brand source (no gradients outside §9's one texture/mode); kept as custom-colour affordance | `.emoji-swatch-rainbow` |
| Custom colour input | native `type="color"` | **flagged** — native control has no brand home; only browser-native arbitrary-colour picker; affordance is the round swatch | label + hidden input |
| Action bar | black 999px pill + shadow | `§4` surface square + `§5` `--pad-card` + `§9` hairline; shadow removed per §9 (flagged) | `.emoji-controls` |
| Divider | 1px white 15% | `Separator` (§9 hairline, `--border`) | `Separator orientation="vertical"` |
| Clear | ghost white text | `Button variant="ghost"`, disabled = `.on-btn:disabled` | `Button` |
| Download | white pill + hand-rolled SVG | `Button variant="primary"`; SVG removed — `icon.jsx` allow-list closed + §8 bans decorative icon beside label saying the word (flagged) | `Button` |
| Focus states | `rgba` box-shadow rings | `--focus-ring`/`--focus-ring-w` (one focus treatment) + same on page swatches | `:focus-visible` |
| Motion | 120ms ease, drag shadow | `--dur-state`/`--ease-state` 140ms (§6); reduced-motion kill block | `@media (prefers-reduced-motion: reduce)` |
| Responsive | wrap at 640px | `§1/§5` — phone stacks, 44px coarse targets, divider drops on phone, no horizontal overflow | `@media (max-width: 640px)` + `(pointer: coarse)` |
| Loading/error states | fishbowl onerror → empty canvas | preserved (no visual chrome added) | `img.onerror` |

## Unmapped aspects — flagged, owner decision needed

1. Canvas bg presets + custom picker — user content (export colours), not page chrome.
2. Fishbowl illustration asset.
3. Emoji item typography (900, `-0.04em`, system emoji stack) and 0.13×canvas size — content rendering.
4. Item colour contrast logic vs user canvas.
5. Swatch rainbow conic-gradient — custom-colour affordance.
6. Native `type="color"` input.
7. Canvas fit geometry (`70vmin`, `100vh - 364px`, `640px`, `0.13`).
8. Removed legacy decoration (all aria-hidden, zero info loss): `+` sigil, `×`, `↵`, download SVG,
   drag drop-shadow, action-bar shadow, 999px pills → square surfaces. Each removal sits on a
   §4/§8/§9 rule; nothing replaced with ad hoc sakura decoration.

## Hard-coded visual values

All six preset/canvas hexes, the two item-contrast hexes, the rainbow's eight hexes, and the emoji
font stack/weight/tracking are the flagged content values above. Everything else is tokens.
