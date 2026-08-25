// R-G2 gate (12-rebuild-plan §8): the graph home surface must render clean in
// ALL FOUR themes (BRAND.md §3 — theme and mode are independent) at 1440px and
// at 375px, plus a reduced-motion pass, with no console errors.
//
// ?mode= and ?theme= are read by ModeProvider / ThemeProvider, so a combination
// is just a URL. ?still freezes the entry assemble and the typewriter
// placeholder so a screenshot is comparable run to run.
//
// Shots land in e2e/__shots__/ and are gitignored — review artefacts, not
// visual-regression baselines.
import { test, expect } from "@playwright/test";

const THEMES = ["light", "dark"];

const watch = (page) => {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
};

for (const theme of THEMES) {
  test(`graph home renders clean at 1440px: graph · ${theme}`, async ({ page }) => {
    const errors = watch(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/?mode=graph&theme=${theme}&still`);
    await page.waitForSelector(".g-stage");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    await expect(page.locator("html")).toHaveAttribute("data-mode", "graph");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.screenshot({ path: `e2e/__shots__/graph-home-${theme}-1440.png` });

    // dossier open — §9's one shadow, and the panel's own token pass
    await page.locator('.node[data-id="mac-agent"] .card').click({ force: true });
    await expect(page.locator(".d-title")).toHaveText("Mac-Agent");
    await page.waitForTimeout(700);
    await page.screenshot({ path: `e2e/__shots__/graph-home-${theme}-1440-dossier.png` });

    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test(`graph home renders clean at 375px: graph · ${theme}`, async ({ page }) => {
    const errors = watch(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/?mode=graph&theme=${theme}&still`);
    await page.waitForSelector(".g-list");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    await expect(page.locator(".graph-root")).toHaveClass(/listing/);
    await page.screenshot({
      path: `e2e/__shots__/graph-home-${theme}-375.png`,
      fullPage: true,
    });
    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });
}

// The other two combinations of the four: the graph surface must not fall apart
// when the terminal ladder is selected (a NodeCard outside the canvas takes the
// shared surface ladder on purpose — COMPONENTS.md "the four themes").
for (const theme of THEMES) {
  test(`graph list survives the terminal ladder: terminal · ${theme}`, async ({ page }) => {
    const errors = watch(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/?mode=graph&theme=${theme}&still`);
    await page.waitForSelector(".g-list");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-mode", "terminal");
    });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `e2e/__shots__/graph-list-termladder-${theme}-375.png`,
      fullPage: true,
    });
    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });
}

test("graph home is static under prefers-reduced-motion", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?mode=graph&theme=light");
  await page.waitForSelector(".g-stage");
  await page.waitForTimeout(600);

  // no entry draw-in, and the node card carries no transition to animate
  await expect(page.locator(".g-stage")).not.toHaveClass(/ready/);
  const cardTransition = await page
    .locator('.node[data-id="mac-agent"] .card')
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(cardTransition.split(",").every((d) => d.trim() === "0s")).toBe(true);

  await page.screenshot({ path: "e2e/__shots__/graph-home-reduced-motion.png" });
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  await ctx.close();
});
