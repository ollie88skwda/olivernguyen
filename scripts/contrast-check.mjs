#!/usr/bin/env node
/* Contrast gate (plan I-1.2, extended 2026-08-26 for BRAND.md §3's four themes).
 *
 * Parses the *actual* token values out of src/styles/sakura.css, resolves them
 * the way the cascade would for each of the FOUR theme × mode combinations, and
 * re-verifies every WCAG pair documented in 04-sakura-palette.md:
 *
 *   graph · light     §3.4          terminal · dark   §2.3
 *   terminal · light  §6.2 (new)    graph · dark      §6.4 (new)
 *
 * Exits 1 on any failure, so a palette edit can never silently regress
 * contrast, and a new theme cannot land unchecked. CI-runnable:
 *   node scripts/contrast-check.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../src/styles/sakura.css"),
  "utf8",
);

/* ---------------------------------------------------------------- parsing */
// Comments are stripped first so they can't glue onto selectors. Blocks are
// kept in FILE ORDER: that is the order the cascade applies them in, and every
// selector below is a plain class/attribute chain of equal-enough specificity
// that source order is what decides.
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
const blocks = [...stripped.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, sel, body]) => ({
  parts: sel.split(",").map((s) => s.replace(/\s+/g, " ").trim()),
  body,
}));

// The scoping scheme, spelled out: which selectors apply to which theme. Any
// .sakura-scoped selector that declares a hex and is NOT listed here fails the
// coverage guard at the bottom — so a fifth block cannot be added and go
// unchecked.
const LIGHT_LADDER = ".sakura";
const DARK_LADDER = [
  'html[data-theme="dark"] .sakura',
  'html:not([data-theme])[data-mode="terminal"] .sakura',
];
const TERM_DARK = [
  'html[data-theme="dark"][data-mode="terminal"] .sakura',
  'html:not([data-theme])[data-mode="terminal"] .sakura',
];
const TERM_LIGHT = ['html[data-theme="light"][data-mode="terminal"] .sakura'];

const THEMES = {
  "graph · light": [LIGHT_LADDER],
  "terminal · light": [LIGHT_LADDER, ...TERM_LIGHT],
  "graph · dark": [LIGHT_LADDER, ...DARK_LADDER],
  "terminal · dark": [LIGHT_LADDER, ...DARK_LADDER, ...TERM_DARK],
};

const KNOWN_SELECTORS = new Set([
  LIGHT_LADDER,
  ...DARK_LADDER,
  ...TERM_DARK,
  ...TERM_LIGHT,
]);

// Resolve a theme: walk the blocks in file order, take every block whose
// selector list intersects the theme's applicable selectors.
const resolve = (selectors) => {
  const vars = {};
  for (const { parts, body } of blocks) {
    if (!parts.some((p) => selectors.includes(p))) continue;
    for (const [, name, hex] of body.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
      vars[name] = hex.toLowerCase();
    }
  }
  return vars;
};

/* --------------------------------------------------------------- measuring */
// WCAG 2.x relative luminance + contrast ratio.
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const failures = [];
let checked = 0;
let theme = "";
let vars = {};
const check = (fg, bg, min) => {
  checked++;
  const [f, b] = [vars[fg], vars[bg]];
  if (!f || !b) {
    failures.push(`${theme}: missing token ${!f ? fg : bg}`);
    return;
  }
  const r = ratio(f, b);
  if (r < min) {
    failures.push(`${theme}: ${fg} (${f}) on ${bg} (${b}) = ${r.toFixed(2)} < ${min}`);
  }
};
const checkAll = (fgs, bgs, min) => {
  for (const fg of fgs) for (const bg of bgs) check(fg, bg, min);
};

const SURFACES = ["--bg", "--surface", "--surface-2"];
const TEXT_TIERS = ["--text", "--text-muted", "--text-faint"];
const TEXT = 4.5; // body + small mono
const UI = 3; // non-text UI (borders)

/* ---- the LIGHT ladder core (04 §3.4) ---- */
const lightCore = () => {
  checkAll(
    [...TEXT_TIERS, "--accent", "--accent-hi", "--success", "--warning", "--error"],
    SURFACES,
    TEXT,
  );
  check("--on-accent", "--accent", TEXT);
  check("--on-accent", "--accent-hi", TEXT);
  check("--text", "--selection", TEXT);
};

/* ---- the DARK ladder core (04 §2.3) ---- */
const darkCore = () => {
  checkAll(
    [...TEXT_TIERS, "--accent", "--accent-hi", "--success", "--warning", "--error-hi"],
    SURFACES,
    TEXT,
  );
  // petalRed passes bg + surface only; surface-2 is the documented --error-hi
  // case (04 §4.2), which is why --danger-text aliases to it on this ladder.
  check("--error", "--bg", TEXT);
  check("--error", "--surface", TEXT);
  check("--on-accent", "--accent", TEXT);
  check("--on-accent", "--accent-hi", TEXT);
  check("--text", "--selection", TEXT);
};

/* ---- the GRAPH canvas, on whichever ladder (04 §3.4 / §6.4) ---- */
const graphMode = () => {
  // node label text sits on the node fill, which may diverge from --surface.
  checkAll([...TEXT_TIERS, "--accent"], ["--node-fill"], TEXT);
  // non-text UI: the outline must read against the canvas AND its own fill.
  check("--node-border", "--bg", UI);
  check("--node-border", "--node-fill", UI);
  check("--node-border-active", "--bg", UI);
  check("--routing-pulse", "--bg", UI);
  // routing-pulse doubles as label text per 04 §3.4.
  check("--routing-pulse", "--bg", TEXT);
  // --edge and --dot-grid are decorative by decision (04 §3.3) — deliberately
  // quiet, exempt from 3:1, and therefore not gated here.
};

/* ---- the TERMINAL console, on whichever ladder (04 §2.3 / §6.2) ---- */
const terminalMode = ({ washesCarryState }) => {
  checkAll(["--term-log", "--term-log-dim", "--term-prompt"], SURFACES, TEXT);
  check("--term-log", "--term-active-line", TEXT);
  check("--term-prompt", "--term-active-line", TEXT);
  check("--text", "--term-active-line", TEXT);
  // The timestamp on the executing row. It renders in --term-log there, not the
  // faint tier, precisely because faint misses 4.5 on Night Plum's wash
  // (components.css `.on-log-line[data-state="active"] .on-log-time`).
  check("--term-log", "--term-active-line", TEXT);
  if (!washesCarryState) return;
  // LIGHT ONLY. Dark's washes are loud enough that --error measures 4.10 on
  // --term-active-line; that is a locked §2 value and the log never renders
  // --error text on the active row (states are mutually exclusive). The light
  // washes were derived the other way round — quiet enough that every state
  // colour AND the dim tier clear 4.5 on all three of them — so the gate holds
  // light to the stricter bar it was built to meet.
  checkAll(
    [
      "--text",
      "--term-log",
      "--term-log-dim",
      "--term-prompt",
      "--accent",
      "--success",
      "--warning",
      "--error",
      "--error-hi",
    ],
    ["--term-active-line", "--term-success-line", "--term-error-line"],
    TEXT,
  );
};

/* ------------------------------------------------------------------- run */
for (const [name, selectors] of Object.entries(THEMES)) {
  theme = name;
  vars = resolve(selectors);
  const dark = selectors.some((s) => DARK_LADDER.includes(s));
  if (dark) darkCore();
  else lightCore();
  if (name.startsWith("terminal")) terminalMode({ washesCarryState: !dark });
  else graphMode();
}

// Coverage guard: every .sakura-scoped block that declares a colour must belong
// to a theme above, or the gate is silently not checking it.
theme = "coverage";
for (const { parts, body } of blocks) {
  if (!/#[0-9a-fA-F]{6}/.test(body)) continue;
  for (const p of parts) {
    if (!p.includes(".sakura") || KNOWN_SELECTORS.has(p)) continue;
    failures.push(`coverage: selector "${p}" declares colours but no theme claims it`);
  }
}
// …and every theme must actually have resolved a palette.
for (const [name, selectors] of Object.entries(THEMES)) {
  if (!resolve(selectors)["--bg"]) failures.push(`coverage: ${name} resolved no --bg`);
}

if (failures.length) {
  console.error(`contrast-check: ${failures.length}/${checked} pairs FAILED`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(
  `contrast-check: all ${checked} pairs pass across ${Object.keys(THEMES).length} themes ` +
    `(${Object.keys(THEMES).join(" | ")})`,
);
