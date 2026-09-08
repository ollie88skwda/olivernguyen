/**
 * e2e/graph-shots.spec.js — exec-graph dev utility + G-2 gate support.
 * Screenshots the graph-dev harness (and edge-style variants) for the G-2.6/
 * G-2.7 side-by-side review vs prototype. Env-gated: only runs with
 * GRAPH_SHOTS=1 so the normal suite stays fast.
 */
import { test, expect } from "@playwright/test";

const ON = !!process.env.GRAPH_SHOTS;
const OUT = "/tmp/graph-shots";

test.describe("graph-dev harness shots", () => {
  test.skip(!ON, "GRAPH_SHOTS not set");

  const grab = async (page, url, name) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console: ${m.text()}`);
    });
    await page.goto(url);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    expect(errors, `${name}: ${errors.join(" | ")}`).toEqual([]);
  };

  test("harness still — weighted (ship default)", async ({ page }) => {
    await grab(page, "/graph-dev.html?still", "harness-weighted");
  });

  test("harness still — arc", async ({ page }) => {
    await grab(page, "/graph-dev.html?still&edges=arc", "harness-arc");
  });

  test("harness still — elbow", async ({ page }) => {
    await grab(page, "/graph-dev.html?still&edges=elbow", "harness-elbow");
  });

  test("harness animated boot renders clean", async ({ page }) => {
    await grab(page, "/graph-dev.html", "harness-animated");
  });
});
