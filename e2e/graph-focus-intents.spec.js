/**
 * e2e/graph-focus-intents.spec.js — F-C.2/F-C.3: the graph's inbound intent
 * surface + restored top-bar Work/About/Contact links.
 *   · on "/" (graph, desktop) the three links focus their node in-page
 *     (no navigation — the cancelable 'on:graph-intent' event is handled)
 *   · from a legacy route the link navigates to /?focus=<id> and the canvas
 *     consumes it (param stripped)
 *   · mobile list consumes ?focus= by scrolling to the section
 *   · terminal mode renders no section links (its own nav carries the mode)
 */
import { test, expect, devices } from "@playwright/test";

const watchErrors = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
};

test.describe("graph focus intents — F-C.2/3", () => {
  test("Work/About/Contact focus their nodes in-page on / (no navigation)", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/?still");
    await page.waitForSelector(".g-stage");

    const nav = page.locator(".sc-nav");
    await expect(nav.getByRole("link")).toHaveCount(3);

    await nav.getByRole("link", { name: "Work" }).click();
    await expect(page.locator(".d-title")).toHaveText("Agents");
    expect(page.url()).not.toContain("focus=");

    await page.keyboard.press("Escape");
    await nav.getByRole("link", { name: "About" }).click();
    await expect(page.locator(".d-title")).toHaveText("Oliver Nguyen");

    await page.keyboard.press("Escape");
    await nav.getByRole("link", { name: "Contact" }).click();
    // registry 'contact' intent routes to the email node
    await expect(page.locator(".d-title")).toHaveText("Email");
    expect(page.url()).not.toContain("focus=");
    expect(errors).toEqual([]);
  });

  test("legacy route → link navigates to /?focus= and the canvas consumes it", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/pull");
    await page.locator(".sc-nav").getByRole("link", { name: "Work" }).click();
    await page.waitForSelector(".g-stage");
    await expect(page.locator(".d-title")).toHaveText("Agents", {
      timeout: 15_000,
    });
    // deep-link param consumed + stripped
    await expect(page).not.toHaveURL(/focus=/);
    expect(errors).toEqual([]);
  });

  test("direct ?focus= deep-link focuses on load (desktop canvas)", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/?still&focus=robotics");
    await page.waitForSelector(".g-stage");
    await expect(page.locator(".d-title")).toHaveText("Robotics", {
      timeout: 15_000,
    });
    await expect(page).not.toHaveURL(/focus=/);
    expect(errors).toEqual([]);
  });

  test("mobile list consumes ?focus= by scrolling to the section (P6 intact)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    const fetched = [];
    page.on("request", (r) => fetched.push(r.url()));

    await page.goto("/?focus=agents");
    await expect(page.locator(".g-list")).toBeVisible();
    await expect(page).not.toHaveURL(/focus=/);
    // the agents section header scrolled to (at/near the viewport top)
    await expect
      .poll(async () => {
        const box = await page.locator("#gl-h-agents").boundingBox();
        return box ? Math.abs(box.y) : 9999;
      })
      .toBeLessThan(120);
    // P6 untouched: still no canvas/d3 on mobile
    const offenders = fetched.filter((u) =>
      /GraphCanvas|GraphEdges|GraphNode|useCamera|runPulse|d3-/.test(u),
    );
    expect(offenders).toEqual([]);
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test("terminal mode renders no section links; graph mode restores them", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/?mode=terminal&still");
    await expect(page.getByTestId("terminal-home")).toBeVisible();
    await expect(page.locator(".sc-nav")).toHaveCount(0);
    await page.getByRole("button", { name: "GRAPH", exact: true }).click();
    await page.waitForSelector(".g-stage");
    await expect(page.locator(".sc-nav")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
