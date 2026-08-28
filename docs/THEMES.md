# THEMES.md — the theme scheme

**Status: SHIPPED (2026-08-26).** All four themes exist, are contrast-gated, and were signed off
against live renders of `/_components`.

Scope of this file: how the four themes are switched, scoped and verified, and what every token is
in each of them. It does **not** restate design rules.

- Colour philosophy, rationing, radius, spacing, motion, type, icons → `docs/BRAND.md`.
- Derivation maths, OKLCH ladders, contrast tables → `docs/redesign-research/04-sakura-palette.md` §2, §3, §6.
- Why any of it is the way it is → `docs/DECISIONS.md` (D-19 … D-22).
- Which component reads which token → `docs/COMPONENTS.md`.

---

## 1. The 2×2

Two axes, independent. Theme never follows mode.

| | terminal | graph |
|---|---|---|
| **light** | plum ink on sakura paper | Sakura Paper canvas |
| **dark** | Night Plum console | Night Plum canvas |

- **Theme** = which lightness ladder the palette sits on. Two: `light`, `dark`.
- **Mode** = which interface is mounted. Two: `terminal`, `graph`.
- One hue slice (OKLCH H 344–356°) carries all four, plus the ratified jade / red / gold
  satellites. A new hue is a `BRAND.md` decision.

## 2. Switching contract

```html
<html data-theme="light|dark" data-mode="terminal|graph">
```

- `data-theme` selects the ladder. Owned by `src/theme/ThemeProvider.jsx`. Absent → the light
  ladder, because `.sakura` declares it as the base. Never leave the page token-less.
- `data-mode` selects the interface. Owned by `src/mode/ModeProvider.jsx`.
- Two providers, no shared state. Mounted side by side in `src/Routes.js`.
- Theme resolution: `?theme=` → `localStorage['on.theme']` → `prefers-color-scheme` → `light`.
  Mode resolution is `05-v1-spec.md` §6.2.
- An explicit user choice on either axis wins and persists. `ThemeProvider` watches the
  `prefers-color-scheme` media query only until that choice is made, and stores nothing before it.
- The `html:not([data-theme])[data-mode="terminal"]` back-compat clause is **gone** (deleted with
  the provider, 2026-08-26). Terminal no longer implies dark: a URL with no `?theme=` follows the
  OS in either mode.

## 3. Selector scheme

All four live in `src/styles/sakura.css`, under `.sakura`, never on `:root`.

| Block | Selector | Declares |
|---|---|---|
| light ladder | `.sakura` | light core + light canvas tokens |
| dark ladder | `html[data-theme="dark"] .sakura` | dark core + dark canvas tokens |
| console · dark | `html[data-theme="dark"][data-mode="terminal"] .sakura` | dark `--term-*` |
| console · light | `html[data-theme="light"][data-mode="terminal"] .sakura` | light `--term-*`, plus light `--border-strong` and `--error-hi` |

Rules that follow from it:

- **Canvas tokens ship with the ladder.** `--node-fill` `--node-border` `--node-border-active`
  `--edge` `--routing-pulse` `--dot-grid` are declared on both ladders, so they always match the
  active one.
- **Read canvas tokens only under `html[data-mode="graph"]`.** They describe the canvas; a node
  card rendered inside the terminal takes the shared surface ladder instead.
- **Console tokens are mode-scoped.** Consumers keep a var() fallback
  (`var(--term-log, var(--text-muted))`) so a `Log` rendered in graph mode still resolves.
- **Roles that follow the ladder are theme-keyed, not mode-keyed** — `--danger-text`,
  `--shadow-dossier`, `--dossier-border`.

## 4. Tokens per theme

Core and canvas values for both ladders: `04-sakura-palette.md` §2.1 (dark), §3.2/§3.3 (light),
§6.3 (dark canvas). Console values: §2.2 (dark), §6.1 (light). Do not copy hexes into a component —
`BRAND.md` §11.1.

What differs between the two themes on a single ladder is only the `--term-*` set; the core never
moves. What differs between the two ladders is everything except the hue.

### 4.1 Tokens that exist on one ladder only

| Token | Where | Why |
|---|---|---|
| `--border-strong` | dark core; light **console only** | Light core would restyle shipped controls — D-21. |
| `--error-hi` | dark core; light **console only** | Same. Light `--error` already clears 4.5:1 everywhere. |

Consumers of both must keep their fallback: `var(--border-strong, var(--border))`,
`var(--border-strong, var(--text-faint))`, `var(--danger-text)`.

## 5. Verification — required before any theme change lands

```bash
node scripts/contrast-check.mjs      # 183 pairs across all four themes; exit 0 or it does not land
npm run test:run                     # 441 unit tests
npx playwright test e2e/gallery-shots.spec.js   # 4 combos × 1440px + 375px, fails on console errors
```

- The gate resolves each theme the way the cascade would, then re-checks the tables in
  `04-sakura-palette.md`. Text ≥ 4.5:1 on every surface it can sit on, large display ≥ 3:1,
  non-text UI ≥ 3:1.
- It also carries a **coverage guard**: a `.sakura`-scoped block that declares a colour and belongs
  to no theme fails the run. Adding a fifth block means registering it in `THEMES` in the script.
- Every combination is a URL: `/_components?mode=terminal&theme=light` (dev-only route).

## 6. Plumbing — done 2026-08-26

All of §6's follow-ups shipped in one change on `feat/component-library`. No palette value moved.

1. **`src/theme/ThemeProvider.jsx`** — writes `data-theme`, `useTheme() → { theme, setTheme }`,
   URL synced with `history.replaceState`. Back-compat clause deleted from `src/styles/sakura.css`
   and from the `THEMES` map in `scripts/contrast-check.mjs` in the same commit.
2. **`<meta name="theme-color">`** moved out of `ModeProvider` into `ThemeProvider`:
   `light` → `#faf1f5`, `dark` → `#180f14`.
3. **`src/components/ui/sonner.jsx`** reads `useTheme()`, not `useMode()`.
4. **The account menu's Appearance section** (D-36) — the Account trigger and portalled
   `DropdownMenu` live in `src/chrome/SiteChrome.jsx`. Its Light/Dark radio items call
   `setTheme`; `sun` and `moon` remain on `src/components/brand/icon.jsx`'s allow-list. The
   account-shaped menu leaves room for future Clerk actions without adding auth state or a
   sign-in placeholder.
5. **`/_components`** no longer owns theme state; its ladder switch calls `setTheme()`.

`docs/redesign-research/05-v1-spec.md` §6.3 is superseded by D-03 and by this file.
