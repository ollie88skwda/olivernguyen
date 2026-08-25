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

- `data-theme` selects the ladder. Absent → the light ladder, because `.sakura` declares it as the
  base. Never leave the page token-less.
- `data-mode` selects the interface. Owned by `src/mode/ModeProvider.jsx`.
- An explicit user choice on either axis wins and persists. First-visit theme follows
  `prefers-color-scheme`; first-visit mode follows `05-v1-spec.md` §6.2.
- **Interim (2026-08-26):** nothing writes `data-theme` outside `/_components`.
  `src/styles/sakura.css` carries one back-compat clause,
  `html:not([data-theme])[data-mode="terminal"]`, so the shipped terminal stays dark. **Delete that
  clause in the same change that adds a `ThemeProvider`** — see §6.

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
npm run test:run                     # 353 unit tests
npx playwright test e2e/gallery-shots.spec.js   # 4 combos × 1440px + 375px, fails on console errors
```

- The gate resolves each theme the way the cascade would, then re-checks the tables in
  `04-sakura-palette.md`. Text ≥ 4.5:1 on every surface it can sit on, large display ≥ 3:1,
  non-text UI ≥ 3:1.
- It also carries a **coverage guard**: a `.sakura`-scoped block that declares a colour and belongs
  to no theme fails the run. Adding a fifth block means registering it in `THEMES` in the script.
- Every combination is a URL: `/_components?mode=terminal&theme=light` (dev-only route).

## 6. Follow-ups this scheme created

1. **`ThemeProvider`** — resolve `?theme=` → `localStorage` → `prefers-color-scheme`, write
   `data-theme`, and delete the back-compat clause in `src/styles/sakura.css`. Mirror
   `ModeProvider`'s shape; the two must not share state.
2. **`<meta name="theme-color">`** currently follows mode in `ModeProvider` (`graph` → `#faf1f5`,
   `terminal` → `#180f14`). It must follow **theme**.
3. **`src/components/ui/sonner.jsx`** derives sonner's `theme` prop from mode. Same fix.
4. **A theme control in the UI** — specified by D-23, not yet built. Sun/moon `lucide` icons on the
   18px `--icon` grid, 40px square button at `3px` radius (44px coarse, **never** 999px), in
   `.sc-right` immediately after the TERM|GRAPH toggle and before the conditional `SEARCH ⌘K`
   button. Shows the current theme; `aria-label` names the action and flips with state; 140ms
   crossfade. `sun` and `moon` join `check` on `src/components/brand/icon.jsx`'s allow-list.
5. **`docs/redesign-research/05-v1-spec.md` §6.3** is superseded by D-03 and now by this file.
