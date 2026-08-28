// Integration X-1..X-3 (exec-infra) — the graph on the REAL app ("/"), not the
// dev harness. Harness specs (graph*.spec.js) keep validating graph internals;
// this spec covers what only integration can: the lazy mount, the mode
// round-trip through ModeProvider, and P6 on the integrated route.
import { test, expect, devices } from "@playwright/test";

const watchErrors = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
};

test.describe("integrated / — FINAL GATE", () => {
  test("first visit lands in graph; canvas mounts full-viewport", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    // fresh context = first-time visitor → graph (P3/L2)
    await expect(page.locator("html")).toHaveAttribute("data-mode", "graph");
    await expect(page.locator(".graph-root")).toBeVisible();
    await expect(page.locator(".graph-root")).not.toHaveClass(/listing/);
    await expect(page.locator(".g-stage")).toHaveAttribute("role", "application");
    await page.waitForSelector('[data-id="operator"]', { state: "attached" });
    // old home must be gone (P4)
    await expect(page.locator(".hero")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("TERM mounts the real terminal; toggling back restores a working graph", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await page.waitForSelector(".g-stage");

    await page.getByRole("button", { name: "TERM" }).click();
    // X-2: the doc-10 holding screen is gone — the lazy terminal mounts + opens
    await expect(page.getByTestId("terminal-home")).toBeVisible();
    await expect(page.locator(".reader-intro h1")).toHaveText("Oliver Nguyen", {
      timeout: 15_000,
    });
    await expect(page.locator(".graph-root")).toHaveCount(0); // unmounted — no key hijack
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");

    await page.getByRole("button", { name: "GRAPH", exact: true }).click();
    await expect(page.locator(".graph-root")).toBeVisible();
    // graph is functional again: Tab cycles to the root node, dossier opens
    await page.waitForTimeout(600);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(800);
    await expect(page.locator(".d-title")).toHaveText("Oliver Nguyen");
    expect(errors).toEqual([]);
  });

  test("chrome SEARCH ⌘K opens the palette; terminal intent round-trips via on:set-mode (X-2)", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await page.waitForSelector(".g-stage");

    await page.getByRole("button", { name: "Open command palette" }).click();
    await expect(page.locator(".palette.open")).toBeVisible();
    await page.type(".pal-input", "terminal");
    await page.keyboard.press("Enter");

    // ModeProvider preventDefaults 'on:set-mode' and swaps the mode — the
    // graph must NOT show its fallback toast; the real terminal mounts (X-2).
    await expect(page.getByTestId("terminal-home")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
    await expect(page).toHaveURL(/[?&]mode=terminal/);
    expect(errors).toEqual([]);
  });

  test("mobile / renders the dossier list; canvas/d3 chunks never fetched (P6)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    const fetched = [];
    page.on("request", (r) => fetched.push(r.url()));

    await page.goto("/");
    await expect(page.locator(".graph-root")).toHaveClass(/listing/);
    await expect(page.locator(".g-list .gl-name")).toHaveText("Oliver Nguyen");
    await expect(page.locator(".g-stage")).toHaveCount(0);

    const offenders = fetched.filter((u) =>
      /GraphCanvas|GraphEdges|GraphNode|useCamera|runPulse|d3-/.test(u),
    );
    expect(offenders).toEqual([]);
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test("reduced motion renders the integrated graph static and clean", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto("/");
    await expect(page.locator(".graph-root")).toBeVisible();
    await expect(page.locator(".g-stage")).not.toHaveClass(/ready/);
    expect(errors).toEqual([]);
    await ctx.close();
  });
});
