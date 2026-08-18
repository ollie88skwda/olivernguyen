// Gate 1 (plan §6): the TERM|GRAPH toggle swaps <html data-mode>, persists to
// localStorage ('on.mode'), and URL-syncs via replaceState on /; ?mode= forces
// a mode over storage. Legacy-body freeze lives in legacy-visual.spec.js; the
// contrast script (yarn contrast) is the third Gate-1 leg.
import { test, expect } from "@playwright/test";

const collectErrors = (page) => {
  const errors = { console: [], page: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.console.push(msg.text());
  });
  page.on("pageerror", (err) => errors.page.push(String(err)));
  return errors;
};

const dataMode = (page) =>
  page.locator("html").getAttribute("data-mode");

test.describe("mode toggle — Gate 1", () => {
  test("defaults to graph (P3), toggle swaps data-mode + URL + storage, persists", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");

    // P3: everyone defaults to graph.
    expect(await dataMode(page)).toBe("graph");
    const graphBtn = page.getByRole("button", { name: "GRAPH" });
    const termBtn = page.getByRole("button", { name: "TERM" });
    await expect(graphBtn).toHaveAttribute("aria-pressed", "true");
    await expect(termBtn).toHaveAttribute("aria-pressed", "false");

    // Toggle → terminal: data-mode, aria state, URL param, localStorage.
    await termBtn.click();
    expect(await dataMode(page)).toBe("terminal");
    await expect(termBtn).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/[?&]mode=terminal/);
    expect(
      await page.evaluate(() => window.localStorage.getItem("on.mode")),
    ).toBe("terminal");
    // theme-color follows the mode's --bg (04 §5).
    await expect(
      page.locator('meta[name="theme-color"]'),
    ).toHaveAttribute("content", "#180f14");

    // Persistence: fresh load WITHOUT the param stays terminal.
    await page.goto("/");
    expect(await dataMode(page)).toBe("terminal");

    // Toggle back → graph, URL updates in place (replaceState, same entry).
    await page.getByRole("button", { name: "GRAPH" }).click();
    expect(await dataMode(page)).toBe("graph");
    await expect(page).toHaveURL(/[?&]mode=graph/);

    expect(errors.page, "uncaught page errors").toEqual([]);
    expect(errors.console, "console errors").toEqual([]);
  });

  test("?mode= param forces a mode over stored preference", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await page.evaluate(() =>
      window.localStorage.setItem("on.mode", "terminal"),
    );
    await page.goto("/?mode=graph");
    expect(await dataMode(page)).toBe("graph");
    await page.goto("/?mode=terminal");
    expect(await dataMode(page)).toBe("terminal");
    expect(errors.page, "uncaught page errors").toEqual([]);
    expect(errors.console, "console errors").toEqual([]);
  });

  test("X-2 contract: cancelable 'on:set-mode' CustomEvent is handled", async ({
    page,
  }) => {
    await page.goto("/");
    expect(await dataMode(page)).toBe("graph");
    const defaultPrevented = await page.evaluate(() => {
      const ev = new CustomEvent("on:set-mode", {
        detail: "terminal",
        cancelable: true,
      });
      window.dispatchEvent(ev);
      return ev.defaultPrevented;
    });
    // preventDefault signals "the app handled it" — otherwise the graph shows
    // its holding-screen toast (exec-graph note in the status header).
    expect(defaultPrevented).toBe(true);
    expect(await dataMode(page)).toBe("terminal");
  });

  test("toggle present on a chromed legacy route; NO_CHROME route opts out", async ({
    page,
  }) => {
    await page.goto("/pull");
    await expect(page.getByRole("button", { name: "TERM" })).toBeVisible();
    // /debt is gone from the pages menu (05 §6.4).
    await page.getByRole("button", { name: "Open pages menu" }).click();
    const menu = page.locator("#sc-pages-menu");
    await expect(menu).toBeVisible();
    expect(await menu.locator('a[href="/debt"]').count()).toBe(0);

    await page.goto("/be-my-girlfriend");
    await expect(page.locator(".site-chrome")).toHaveCount(0);
  });
});
