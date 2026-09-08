/**
 * e2e/graph-a11y.spec.js — exec-graph Gate G4 spec (plan §6).
 * Mobile dossier-list fallback + canvas-chunk network assertion, reduced-
 * motion static rendering, axe pass on both renderings. axe-core is
 * injected as a browser script (no package.json change needed); if
 * @axe-core/playwright lands later this keeps working unchanged.
 */
import { test, expect, devices } from "@playwright/test";

const HARNESS = "/graph-dev.html";

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

async function tryAxe(page) {
  try {
    await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js" });
  } catch {
    return null; // offline — skip loudly, never false-pass
  }
  return page.evaluate(() => window.axe.run(document, {
    resultTypes: ["violations"],
  }));
}

test.describe("graph mode — Gate G4", () => {
  test("mobile viewport renders the list; graph/d3 chunks are never fetched", async ({ browser }) => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    const fetched = [];
    page.on("request", (r) => fetched.push(r.url()));

    await page.goto(HARNESS);
    await page.waitForTimeout(1200);

    // the list renders, the canvas does not
    await expect(page.locator(".g-list .gl-name")).toHaveText("Oliver Nguyen");
    await expect(page.locator(".g-stage")).toHaveCount(0);
    await expect(page.locator(".gl-group")).toHaveCount(5);
    // every entity represented: 5 groups as section headers (asserted above),
    // root + 24 leaves as entries = 25 cards
    await expect(page.locator(".gl-entry")).toHaveCount(25);

    // network assertion: no canvas/d3 modules ever requested (P6)
    const offenders = fetched.filter((u) => /GraphCanvas|GraphEdges|GraphNode|useCamera|runPulse|d3-/.test(u));
    expect(offenders).toEqual([]);
    expect(errors).toEqual([]);

    const axe = await tryAxe(page);
    if (axe) {
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    } else {
      console.warn("AXE SKIPPED — axe-core CDN unreachable (offline?)");
    }
    await ctx.close();
  });

  test("reduced motion renders static: no draw-in, no drift, instant camera, no bead", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto(HARNESS);
    await page.waitForTimeout(900);

    // no edge draw-in class, drift animation disabled by the RM media query
    await expect(page.locator(".g-stage")).not.toHaveClass(/ready/);
    const anim = await page.$eval(
      ".drift",
      (el) => getComputedStyle(el).animationName,
    );
    expect(anim).toBe("none");

    // intent run: no traveling bead; dossier opens immediately (instant camera)
    await page.click(".p-input");
    await page.type(".p-input", "week");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await expect(page.locator(".bead")).toHaveCount(0);
    await expect(page.locator(".d-title")).toHaveText("Voice / Operator");

    // tour autostart is suppressed under RM
    await page.keyboard.press("Escape");
    await page.waitForTimeout(6500);
    await expect(page.locator(".tourhud")).toHaveCount(0);

    expect(errors).toEqual([]);

    const axe = await tryAxe(page);
    if (axe) {
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    } else {
      console.warn("AXE SKIPPED — axe-core CDN unreachable (offline?)");
    }
    await ctx.close();
  });

  test("desktop carries the visually-hidden entity list for screen readers", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`${HARNESS}?still`);
    await page.waitForTimeout(900);
    await expect(page.locator(".g-stage")).toHaveAttribute("role", "application");
    await expect(page.locator(".visually-hidden .gl-entry")).toHaveCount(25);
    await expect(page.locator(".visually-hidden .gl-group")).toHaveCount(5);
    expect(errors).toEqual([]);
  });
});
