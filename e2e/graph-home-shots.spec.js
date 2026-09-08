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

// The framing contract, and the two things that broke when the shimmer went in.
test("the canvas frames clear of the chrome bar and keeps its labels", async ({
  page,
}) => {
  const errors = watch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?mode=graph&theme=dark");
  await page.waitForSelector(".g-stage");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600);

  // nothing hides behind the fixed bar, or behind the prompt bar
  const [minTop, maxBottom] = await page.locator(".node .card").evaluateAll((els) => {
    const r = els.map((e) => e.getBoundingClientRect());
    return [Math.min(...r.map((b) => b.top)), Math.max(...r.map((b) => b.bottom))];
  });
  expect(minTop).toBeGreaterThanOrEqual(64);
  expect(maxBottom).toBeLessThanOrEqual(900 - 120);

  // semantic zoom must not be engaged at rest, or every card loses its labels
  await expect(page.locator(".g-stage.far")).toHaveCount(0);

  // …and the shimmer must not blank the text it drifts. A CSS animation here
  // promotes each node to a layer rasterised before .g-world's scale(), which
  // drops the glyphs entirely — src/graph/drift.js exists because of that.
  const drift = page.locator('[data-id="mac-agent"] .drift');
  const before = await drift.evaluate((el) => el.style.transform);
  await page.waitForTimeout(900);
  const after = await drift.evaluate((el) => el.style.transform);
  expect(before, "shimmer is running").not.toBe("");
  expect(after, "shimmer is moving").not.toBe(before);
  await expect(page.locator('[data-id="mac-agent"] .card .t')).toHaveText("Mac-Agent");

  await page.screenshot({ path: "e2e/__shots__/graph-home-framing.png" });
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("?still freezes the shimmer", async ({ page }) => {
  await page.goto("/?mode=graph&theme=dark&still");
  await page.waitForSelector(".g-stage");
  await page.waitForTimeout(1600);
  const drift = page.locator('[data-id="mac-agent"] .drift');
  expect(await drift.evaluate((el) => el.style.transform)).toBe("");
});

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

  // §6: the shimmer is never started, and the DOM is the same either way
  await page.waitForTimeout(1200);
  const drift = page.locator('[data-id="mac-agent"] .drift');
  expect(await drift.evaluate((el) => el.style.transform)).toBe("");
  const b1 = await drift.boundingBox();
  await page.waitForTimeout(900);
  const b2 = await drift.boundingBox();
  expect(Math.hypot(b2.x - b1.x, b2.y - b1.y)).toBeLessThan(0.01);
  const cardTransition = await page
    .locator('.node[data-id="mac-agent"] .card')
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(cardTransition.split(",").every((d) => d.trim() === "0s")).toBe(true);

  await page.screenshot({ path: "e2e/__shots__/graph-home-reduced-motion.png" });
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  await ctx.close();
});
