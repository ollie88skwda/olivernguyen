#!/usr/bin/env node
/* Contrast gate (plan I-1.2). Parses the *actual* token values out of
 * src/styles/sakura.css and re-verifies every WCAG pair documented in
 * 04-sakura-palette.md §2.3 (dark) + §3.4 (light). Exits 1 on any failure,
 * so a palette edit can never silently regress contrast. CI-runnable:
 *   node scripts/contrast-check.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../src/styles/sakura.css"),
  "utf8",
);

// Split the file into the light (default .sakura) and dark (terminal) blocks.
// Comments are stripped first so they can't glue onto selectors.
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
const blocks = [...stripped.matchAll(/([^{}]+)\{([^}]*)\}/g)];
const readVars = (selectorRe) => {
  const vars = {};
  for (const [, sel, body] of blocks) {
    if (!selectorRe.test(sel.trim())) continue;
    for (const [, name, hex] of body.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
      vars[name] = hex.toLowerCase();
    }
  }
  return vars;
};
const light = readVars(/^\.sakura$/);
const dark = { ...light, ...readVars(/^html\[data-mode="terminal"\] \.sakura$/) };

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
const check = (mode, vars, fg, bg, min) => {
  checked++;
  const [f, b] = [vars[fg], vars[bg]];
  if (!f || !b) {
    failures.push(`${mode}: missing token ${!f ? fg : bg}`);
    return;
  }
  const r = ratio(f, b);
  if (r < min) {
    failures.push(
      `${mode}: ${fg} (${f}) on ${bg} (${b}) = ${r.toFixed(2)} < ${min}`,
    );
  }
};

const SURFACES = ["--bg", "--surface", "--surface-2"];

/* ---- DARK (04 §2.3) ---- */
for (const fg of [
  "--text", "--text-muted", "--text-faint",
  "--accent", "--accent-hi", "--success", "--warning", "--error-hi",
]) {
  for (const bg of SURFACES) check("dark", dark, fg, bg, 4.5);
}
// petalRed passes bg+surface only; surface-2 is the documented --error-hi case.
check("dark", dark, "--error", "--bg", 4.5);
check("dark", dark, "--error", "--surface", 4.5);
check("dark", dark, "--on-accent", "--accent", 4.5);
check("dark", dark, "--on-accent", "--accent-hi", 4.5);
check("dark", dark, "--text", "--selection", 4.5);
check("dark", dark, "--term-log", "--term-active-line", 4.5);
check("dark", dark, "--term-prompt", "--term-active-line", 4.5);
check("dark", dark, "--text", "--term-active-line", 4.5);

/* ---- LIGHT (04 §3.4) ---- */
for (const fg of [
  "--text", "--text-muted", "--text-faint",
  "--accent", "--accent-hi", "--success", "--warning", "--error",
]) {
  for (const bg of SURFACES) check("light", light, fg, bg, 4.5);
}
check("light", light, "--on-accent", "--accent", 4.5);
check("light", light, "--on-accent", "--accent-hi", 4.5);
check("light", light, "--text", "--selection", 4.5);
// Non-text UI (≥3:1) against the canvas.
check("light", light, "--node-border", "--bg", 3);
check("light", light, "--node-border-active", "--bg", 3);
check("light", light, "--routing-pulse", "--bg", 3);
// routing-pulse doubles as label text per 04 §3.4.
check("light", light, "--routing-pulse", "--bg", 4.5);

if (failures.length) {
  console.error(`contrast-check: ${failures.length}/${checked} pairs FAILED`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`contrast-check: all ${checked} pairs pass (dark §2.3 + light §3.4)`);
