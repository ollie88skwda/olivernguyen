// e2e/terminal-shots.spec.js — exec-terminal Gates R-T2 and R-T3
// (docs/redesign-research/12-rebuild-plan.md §8).
//
// R-T2 shoots the SURFACE on its own dev harness; R-T3 (the block at the
// bottom) shoots it mounted through the rebuilt SiteChrome on the real "/"
// route, which is what GATE TERMINAL signs off.
//
// Dev-only: screenshots the ported terminal surface in ALL FOUR theme × mode
// combinations at 1440px and 375px, plus both overlays, and fails on any
// console error. AGENTS.md §4 requires those renders before visual work is
// called done. Output lands in e2e/__shots__/ and is gitignored — eyeballing
// artefacts, not visual-regression baselines.
//
// WHY FOUR AND NOT TWO. The console only ever ships under data-mode="terminal",
// so its real combinations are terminal · dark and terminal · light. The other
// two are the robustness case: under data-mode="graph" sakura.css declares NO
// --term-* tokens at all, and every read of one in terminal.css carries the
// shared-ladder fallback components.css uses. These shots prove the surface
// still renders legibly with the console ladder absent.
//
// ?still keeps prints instant (no 28ms cadence) so a shot is deterministic;
// ?theme= is read by src/terminal/dev.jsx, which writes <html data-theme> the
// same way ThemeProvider does in production (docs/THEMES.md §2).
import { test, expect, devices } from "@playwright/test";

const HARNESS = "/terminal-dev.html";

const COMBOS = [
  { mode: "terminal", theme: "dark", id: "terminal-dark" }, // shipped default
  { mode: "terminal", theme: "light", id: "terminal-light" }, // D-22
  { mode: "graph", theme: "light", id: "no-console-ladder-light" }, // fallbacks
  { mode: "graph", theme: "dark", id: "no-console-ladder-dark" }, // fallbacks
];

const VIEWPORTS = [
  { w: 1440, h: 900, id: "1440" },
  { w: 375, h: 812, id: "375" },
];

function watchErrors(page) {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function boot(page, theme, mode) {
  // the harness page hardcodes data-mode="terminal"; an init script re-writes it
  // BEFORE any stylesheet resolves, so the ladder is never re-computed mid-shot.
  await page.addInitScript((m) => {
    document.addEventListener(
      "DOMContentLoaded",
      () => document.documentElement.setAttribute("data-mode", m),
      { once: true },
    );
  }, mode);
  await page.goto(`${HARNESS}?still&theme=${theme}`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => !!window.__term);
  await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
    timeout: 15_000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

for (const { mode, theme, id } of COMBOS) {
  for (const vp of VIEWPORTS) {
    test(`terminal renders clean: ${id} @ ${vp.id}`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await boot(page, theme, mode);

      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("html")).toHaveAttribute("data-mode", mode);

      // the three rows of the 100dvh grid are all on screen
      await expect(page.getByTestId("term-statusbar")).toBeVisible();
      await expect(page.getByTestId("term-promptline")).toBeVisible();
      await expect(page.locator(".term-buffer").first()).toBeVisible();

      await page.screenshot({
        path: `e2e/__shots__/terminal-${id}-${vp.id}.png`,
        fullPage: false,
      });
      expect(errors, `console errors in ${id} @ ${vp.id}`).toEqual([]);
    });
  }
}

// §4/§9 regression guard: the two overlays were a 6px panel under a 24/64 drop
// shadow before R-T1. They are library surfaces now — radius 0, hairline, no
// shadow — and this is the assertion that keeps them there.
for (const { theme } of COMBOS.filter((c) => c.mode === "terminal")) {
  test(`terminal overlays are library surfaces: ${theme}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, theme, "terminal");

    // ⌘K palette
    await page.keyboard.press("Meta+k");
    const palette = page.getByTestId("term-palette");
    await expect(palette).toBeVisible();
    const paletteBox = palette.locator(".palette-panel");
    await expect(paletteBox).toHaveCSS("border-radius", "0px");
    await expect(paletteBox).toHaveCSS("box-shadow", "none");
    // §8: the prompt sigil is the ratified ▸ glyph, not a stray ›
    await expect(palette.locator('[data-slot="glyph"][data-glyph="prompt"]')).toHaveText("▸");
    await page.screenshot({ path: `e2e/__shots__/terminal-palette-${theme}.png` });
    await page.keyboard.press("Escape");
    await expect(palette).toBeHidden();

    // ? help sheet
    await page.keyboard.press("?");
    const help = page.getByTestId("term-help");
    await expect(help).toBeVisible();
    const helpBox = help.locator(".help-panel");
    await expect(helpBox).toHaveCSS("border-radius", "0px");
    await expect(helpBox).toHaveCSS("box-shadow", "none");
    // §7: key hints are <Kbd>
    await expect(help.locator('[data-slot="kbd"]').first()).toBeVisible();
    await page.screenshot({ path: `e2e/__shots__/terminal-help-${theme}.png` });
    await page.keyboard.press("Escape");
    await expect(help).toBeHidden();

    expect(errors, `console errors in overlays @ ${theme}`).toEqual([]);
  });
}

// R-T2's mobile story: a coarse pointer flattens the pane grid, drops the
// statusbar's right group and lifts every remaining target to §1's 44px. The
// behaviour is gated in terminal-a11y.spec.js; this is the render.
for (const { theme } of COMBOS.filter((c) => c.mode === "terminal")) {
  test(`terminal mobile story renders clean: ${theme}`, async ({ browser }) => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await boot(page, theme, "terminal");

    // §1: tap targets clear 44px on a coarse pointer. The CTA row prints AFTER
    // the hero line boot() waits on, so wait for the element itself first.
    for (const sel of ['button.obtn[data-cmd="cat tools.txt"]', ".term-statusbar .tab"]) {
      const target = page.locator(sel).first();
      await expect(target).toBeVisible();
      const box = await target.boundingBox();
      expect(box.height, `${sel} tap height`).toBeGreaterThanOrEqual(44);
    }
    // P9: the pane grid is flat — one pane, no title-row split buttons
    await expect(page.locator("section.pane")).toHaveCount(1);

    await page.screenshot({ path: `e2e/__shots__/terminal-mobile-${theme}.png` });
    expect(errors, `console errors on mobile @ ${theme}`).toEqual([]);
    await ctx.close();
  });
}

// R-T2's keyboard story: the pane grammar is reachable and the split chrome
// renders in both console themes.
for (const { theme } of COMBOS.filter((c) => c.mode === "terminal")) {
  test(`terminal panes render clean: ${theme}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, theme, "terminal");

    await page.keyboard.press("Control+g");
    await page.keyboard.press("v");
    await expect(page.locator("section.pane")).toHaveCount(2);
    // §4: a pane is a surface, so square
    await expect(page.locator("section.pane").first()).toHaveCSS(
      "border-radius",
      "0px",
    );
    await page.screenshot({ path: `e2e/__shots__/terminal-panes-${theme}.png` });
    expect(errors, `console errors in panes @ ${theme}`).toEqual([]);
  });
}

/* ==========================================================================
 * R-T3 — TerminalHome mounted through the rebuilt SiteChrome, on "/".
 *
 * This is GATE TERMINAL. The harness above proves the surface; these prove the
 * integration, and everything they assert is a way the fixed 64px bar can
 * break a 100dvh grid that is not allowed to scroll the page (09 §3.1.1):
 *   - the bar's own offset glue (chrome.css `html[data-mode="terminal"]
 *     .term-screen { padding-top }`) actually lands,
 *   - the statusbar, the bottom row of that grid, is still fully on screen,
 *   - the page still does not scroll behind the fixed bar,
 *   - the bar's portalled DropdownMenu opens OVER the console,
 *   - theme and mode round-trip without unmounting or losing the ladder (D-19).
 * ========================================================================== */

const CHROME_H = 64; // .site-chrome-bar height — chrome.css, var(--s-16)

async function bootRoute(page, theme) {
  await page.goto(`/?mode=terminal&theme=${theme}`, { waitUntil: "networkidle" });
  await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
    timeout: 20_000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

for (const theme of ["dark", "light"]) {
  for (const vp of VIEWPORTS) {
    test(`terminal through chrome: ${theme} @ ${vp.id}`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await bootRoute(page, theme);

      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator(".site-chrome-bar")).toBeVisible();

      // the glue landed: the console clears the bar rather than hiding under it
      const screen = page.locator(".term-screen");
      expect(
        await screen.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop)),
      ).toBe(CHROME_H);
      const firstRow = await page.locator(".pane-title").first().boundingBox();
      expect(firstRow.y, "pane title must sit below the bar").toBeGreaterThanOrEqual(
        CHROME_H,
      );

      // the bottom row of the 100dvh grid is still fully on screen
      const bar = await page.getByTestId("term-statusbar").boundingBox();
      expect(bar.y + bar.height).toBeLessThanOrEqual(vp.h + 1);

      // §3.1.1: the page itself never scrolls while the terminal is mounted
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight,
        ),
      ).toBeLessThanOrEqual(0);

      await page.screenshot({
        path: `e2e/__shots__/terminal-chrome-${theme}-${vp.id}.png`,
      });
      expect(errors, `console errors through chrome: ${theme} @ ${vp.id}`).toEqual([]);
    });
  }
}

test("chrome's portalled pages menu opens over the console", async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootRoute(page, "dark");

  await page.getByRole("button", { name: /pages menu/i }).click();
  const menu = page.locator(".sc-menu[role='menu']");
  await expect(menu).toBeVisible();
  // it portals to <body>, so it must re-scope .sakura or it renders in legacy
  // navy/gold on top of Night Plum (COMPONENTS.md, PortalScope)
  expect(
    await menu.evaluate((el) => !!el.closest(".sakura, .sakura-portal")),
  ).toBe(true);
  await page.screenshot({ path: "e2e/__shots__/terminal-chrome-menu.png" });
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  expect(errors).toEqual([]);
});

test("theme and mode round-trip over a mounted terminal (D-19)", async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootRoute(page, "dark");

  // scope to the bar: the printed console CTAs answer to "graph" too
  const bar = page.locator(".site-chrome-bar");
  const modeToggle = bar.getByRole("group", { name: "Site mode" });

  // theme flips, mode does not — two independent attributes
  await bar.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("menuitemradio", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
  await expect(page.getByTestId("terminal-home")).toBeVisible();
  // mode flips to graph and back; terminal remounts fresh (P3)
  await modeToggle.getByRole("button", { name: "GRAPH" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "graph");
  await expect(page.getByTestId("terminal-home")).toHaveCount(0);
  await modeToggle.getByRole("button", { name: "TERM" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
  await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
    timeout: 20_000,
  });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const log = page.locator(".term-buffer .k-log").first();
  await expect(log).toBeVisible();
  const logStyle = await log.evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.color, fontFamily: style.fontFamily };
  });
  expect(logStyle.color).toBe("rgb(111, 68, 89)");
  expect(logStyle.fontFamily).toContain("JetBrains Mono");
  expect(errors).toEqual([]);
});
