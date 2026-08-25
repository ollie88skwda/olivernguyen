// Chrome gate (plan R-C4) — the brand rules the rebuilt bar has to keep.
//
// Deliberately does NOT re-test what e2e/mode.spec.js already covers (the mode
// toggle flipping data-mode, the pages menu content, NO_CHROME opt-out). What
// is here is the set of things R-C3 changed and a screenshot cannot catch:
// §4's radius split, the theme axis, and the reduced-motion fallback.
import { test, expect } from "@playwright/test";

const COMBOS = [
  { mode: "terminal", theme: "dark" },
  { mode: "graph", theme: "light" },
  { mode: "terminal", theme: "light" },
  { mode: "graph", theme: "dark" },
];

const THEME_COLOR = { light: "#faf1f5", dark: "#180f14" };

test.describe("site chrome — R-C4", () => {
  test("§10 wordmark: oN.c with the dot in --accent", async ({ page }) => {
    await page.goto("/?mode=graph&theme=light");
    const mark = page.locator('[data-slot="wordmark"]');
    await expect(mark).toHaveText("oN.c");

    const dot = mark.locator(".on-wordmark-dot");
    const [dotColor, accent] = await Promise.all([
      dot.evaluate((el) => getComputedStyle(el).color),
      mark.evaluate((el) => getComputedStyle(el).getPropertyValue("--accent").trim()),
    ]);
    // light --accent is #a83a68
    expect(accent).toBe("#a83a68");
    expect(dotColor).toBe("rgb(168, 58, 104)");

    // …and it must NOT be the same colour as the letters, or the mark is three
    // letters and §10's whole idea is gone.
    const letters = await mark.evaluate((el) => getComputedStyle(el).color);
    expect(letters).not.toBe(dotColor);
  });

  test("§4 radius: the mode toggle is the round one, the theme control is not", async ({
    page,
  }) => {
    await page.goto("/?mode=graph&theme=light");
    const toggle = page.locator('[data-slot="mode-toggle"]');
    await expect(toggle).toHaveCSS("border-radius", "999px");

    // D-23: the theme control is an ORDINARY 3px icon button, square on
    // purpose so it does not read as half of the pill beside it.
    const themeBtn = page.getByRole("button", { name: /Switch to .* theme/ });
    await expect(themeBtn).toHaveCSS("border-radius", "3px");
    const box = await themeBtn.boundingBox();
    expect(box.width).toBe(box.height);
  });

  for (const { mode, theme } of COMBOS) {
    test(`theme-color follows the ladder, not the mode: ${mode} · ${theme}`, async ({
      page,
    }) => {
      await page.goto(`/?mode=${mode}&theme=${theme}`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
      const content = await page
        .locator('meta[name="theme-color"]')
        .getAttribute("content");
      expect(content).toBe(THEME_COLOR[theme]);
    });
  }

  test("the theme control round-trips and leaves the mode alone", async ({ page }) => {
    await page.goto("/?mode=terminal&theme=dark");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
    expect(
      await page.locator('meta[name="theme-color"]').getAttribute("content"),
    ).toBe(THEME_COLOR.light);

    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
  });

  test("nav is graph-only; the terminal carries its own", async ({ page }) => {
    await page.goto("/?mode=graph&theme=light");
    await expect(page.locator(".sc-nav").getByRole("link")).toHaveCount(3);
    await page.getByRole("button", { name: "TERM" }).click();
    await expect(page.locator(".sc-nav")).toHaveCount(0);
  });

  // §6: every animated element needs a static fallback carrying the same DOM
  // content. The bar's slide, the toggle thumb and the icon crossfade are all
  // transitions, so under reduce they must resolve instantly and the control
  // state must still be readable — which is why it is on aria-pressed, not on
  // the thumb position alone.
  test.describe("reduced motion", () => {
    test("no transitions, and state is still carried by the DOM", async ({ page }) => {
      // emulateMedia(), not test.use({ reducedMotion }) — the latter reports
      // matchMedia() false under this config's Desktop Chrome device, so the
      // assertion below would pass for the wrong reason.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/?mode=graph&theme=light");
      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      ).toBe(true);

      for (const sel of ['[data-slot="mode-toggle"] .on-mode-thumb', ".site-chrome-bar"]) {
        const dur = await page
          .locator(sel)
          .evaluate((el) => getComputedStyle(el).transitionDuration);
        expect(dur, sel).toBe("0s");
      }

      await expect(page.getByRole("button", { name: "GRAPH" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.getByRole("button", { name: "TERM" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
  });
});
