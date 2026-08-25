// Dev-only: screenshots the component gallery in ALL FOUR themes (BRAND.md §3
// — theme and mode are independent) plus the 375px phone render, and fails on
// any console error. AGENTS.md §4 requires those renders before visual work is
// called done. Output lands in e2e/__shots__/ and is gitignored — these are
// eyeballing artefacts, not visual-regression baselines.
//
// The gallery reads ?mode= and ?theme= and writes both attributes itself, so a
// combination is just a URL.
import { test, expect } from "@playwright/test";

const THEMES = ["terminal", "graph"];
const COMBOS = [
  { mode: "terminal", theme: "dark", id: "terminal" }, // shipped
  { mode: "graph", theme: "light", id: "graph" }, // shipped
  { mode: "terminal", theme: "light", id: "terminal-light" }, // derived 04 §6.1
  { mode: "graph", theme: "dark", id: "graph-dark" }, // derived 04 §6.3
];

for (const { mode, theme, id } of COMBOS) {
  test(`gallery renders clean: ${id}`, async ({ page }) => {
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/_components?mode=${mode}&theme=${theme}`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.screenshot({ path: `e2e/__shots__/gallery-${id}.png`, fullPage: true });
    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test(`gallery renders clean at 375px: ${id}`, async ({ page }) => {
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/_components?mode=${mode}&theme=${theme}`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    await page.screenshot({ path: `e2e/__shots__/gallery-${id}-375.png`, fullPage: true });
    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });
}

// Every overlay's OPEN state, which the full-page shots above never reach.
// This exists because the registry's CommandDialog dropped cmdk children
// outside the <Command> root and threw the moment the palette opened — a crash
// no static screenshot could have caught (2026-08-25).
for (const mode of THEMES) {
  test(`overlays open without error: ${mode}`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.setViewportSize({ width: 1100, height: 780 });
    await page.goto(`/_components?mode=${mode}`, { waitUntil: "networkidle" });

    const open = async (name, how = "click") => {
      const trigger = page.getByRole("button", { name, exact: true });
      await trigger.scrollIntoViewIfNeeded();
      await (how === "hover" ? trigger.hover() : trigger.click());
      await page.waitForTimeout(500);
      await page.screenshot({ path: `e2e/__shots__/overlay-${mode}-${name.replace(/ /g, "-")}.png` });
      if (how !== "hover") await page.keyboard.press("Escape");
    };

    for (const name of ["Dialog", "Sheet", "Dropdown", "Popover", "Command palette", "Toast"]) {
      await open(name);
    }
    await open("Tooltip", "hover");

    expect(errors, `page errors: ${errors.join(" | ")}`).toEqual([]);
  });
}

// The overlay family portals out of `.sakura`; PortalScope is what keeps the
// tokens attached. If it ever regresses, a portalled panel inherits the legacy
// navy :root and this catches it.
test("portalled overlays keep the sakura tokens", async ({ page }) => {
  await page.goto("/_components?mode=terminal", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Dialog" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
  // Night Plum --surface is #1f1319.
  expect(bg).toBe("rgb(31, 19, 25)");
  const radius = await dialog.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(radius).toBe("0px"); // §4: a dialog is a surface
  const shadow = await dialog.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).toBe("none"); // §9: only the dossier lifts
});
