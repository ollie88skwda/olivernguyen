// R-I1 — the rebuild's final gate: home + chrome TOGETHER, on "/", in all four
// theme × mode combinations (BRAND.md §3 — the two axes are independent).
//
// The harness specs (graph*, terminal*, gallery-shots) each validate one
// surface on a bare viewport, and e2e/chrome.spec.js validates the bar. None of
// them can see the thing that only exists once the pieces are assembled: the
// chrome is `position: fixed`, so it sits ON TOP of whatever the home surface
// puts at y=0, and the only thing keeping the two apart is the integration glue
// at the bottom of src/chrome/chrome.css.
//
// That glue is per-selector, so a surface can gain a new top-anchored element
// and be silently swallowed by the bar. It already happened once: at 375px the
// graph's mobile list rendered its whole `oN.c GRAPH MODE` brand line behind
// the bar, and every static screenshot of the page looked fine, because what
// you see is a page that simply starts at the headline. Hence the occlusion
// assertions below — they are the point of this file.
import { test, expect, devices } from "@playwright/test";

const COMBOS = [
  { mode: "terminal", theme: "dark", id: "terminal-dark" }, // shipped
  { mode: "graph", theme: "light", id: "graph-light" }, // shipped
  { mode: "terminal", theme: "light", id: "terminal-light" }, // derived 04 §6.1
  { mode: "graph", theme: "dark", id: "graph-dark" }, // derived 04 §6.3
];

const THEME_COLOR = { light: "#faf1f5", dark: "#180f14" };

const watchErrors = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  return errors;
};

// Nothing the visitor is meant to read may start above the bar's bottom edge.
// `.term-skip` is excluded by name: it is the skip link, parked off-screen on
// purpose until it takes focus.
const assertClearsChrome = async (page, selectors) => {
  const bar = await page.locator(".site-chrome-bar").boundingBox();
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if ((await el.count()) === 0) continue;
    const box = await el.boundingBox();
    if (!box) continue; // display:none — nothing to occlude
    expect(
      box.y,
      `${sel} starts at ${box.y}, above the chrome's bottom edge at ${bar.y + bar.height}`,
    ).toBeGreaterThanOrEqual(bar.y + bar.height - 0.5);
  }
};

test.describe("R-I1 · integrated / — REBUILD DONE", () => {
  for (const { mode, theme, id } of COMBOS) {
    test(`1440px renders clean: ${id}`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/?mode=${mode}&theme=${theme}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2000); // the terminal types itself in (§6 signature 1)

      await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      // theme-color follows the LADDER even though the MODE is what changed
      expect(
        await page.locator('meta[name="theme-color"]').getAttribute("content"),
      ).toBe(THEME_COLOR[theme]);

      await assertClearsChrome(
        page,
        mode === "graph"
          ? [".graph-root .legend", ".graph-root .dossier", ".promptbar", ".hintbar"]
          : [".term-main", ".promptline", ".term-statusbar"],
      );

      await page.screenshot({ path: `e2e/__shots__/i1-${id}-1440.png` });
      expect(errors, errors.join(" | ")).toEqual([]);
    });

    test(`375px renders clean: ${id}`, async ({ browser }) => {
      const ctx = await browser.newContext({
        ...devices["iPhone 13"],
        viewport: { width: 375, height: 812 },
      });
      const page = await ctx.newPage();
      const errors = watchErrors(page);
      await page.goto(`/?mode=${mode}&theme=${theme}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2000);

      await assertClearsChrome(
        page,
        // graph falls back to the grouped list on a phone (BRAND.md §1), so the
        // top-anchored element is the list's brand line, not the canvas HUD.
        // Check the first READABLE thing, never the container: `.g-list` is a
        // full-height scroll box whose top is legitimately 0 and whose padding
        // is what clears the bar.
        mode === "graph" ? [".gl-brand"] : [".term-main"],
      );

      await page.screenshot({ path: `e2e/__shots__/i1-${id}-375.png` });
      expect(errors, errors.join(" | ")).toEqual([]);
      await ctx.close();
    });
  }

  test("both axes round-trip on / and neither drags the other (D-19)", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/?mode=graph&theme=light");
    await page.waitForSelector(".g-stage");

    // theme moves, mode holds
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "graph");

    // mode moves, theme holds — this is the derived graph · dark combination
    await page.getByRole("button", { name: "TERM" }).click();
    await expect(page.getByTestId("terminal-home")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");

    // and back to the other diagonal: terminal · light
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
    expect(
      await page.locator('meta[name="theme-color"]').getAttribute("content"),
    ).toBe(THEME_COLOR.light);

    await page.getByRole("button", { name: "GRAPH", exact: true }).click();
    await expect(page.locator(".graph-root")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(errors, errors.join(" | ")).toEqual([]);
  });

  // §6: every animated element needs a static fallback carrying the same DOM
  // content. Assembled, that means both home surfaces AND the chrome hold still
  // while still saying everything they say in motion.
  for (const mode of ["graph", "terminal"]) {
    test(`reduced motion: ${mode} home + chrome hold still and keep their content`, async ({
      browser,
    }) => {
      const ctx = await browser.newContext({ reducedMotion: "reduce" });
      const page = await ctx.newPage();
      const errors = watchErrors(page);
      await page.goto(`/?mode=${mode}&theme=dark`);
      await page.waitForTimeout(1500);

      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      ).toBe(true);

      for (const sel of [".site-chrome-bar", '[data-slot="mode-toggle"] .on-mode-thumb']) {
        expect(
          await page.locator(sel).evaluate((el) => getComputedStyle(el).transitionDuration),
          sel,
        ).toBe("0s");
      }

      if (mode === "terminal") {
        // reduced motion still lands the guided document as complete content
        await expect(page.locator(".reader-intro h1")).toHaveText(
          "Oliver Nguyen",
        );
      } else {
        await expect(page.locator(".graph-root")).toBeVisible();
        await expect(page.locator(".g-stage")).not.toHaveClass(/ready/);
      }

      await page.screenshot({ path: `e2e/__shots__/i1-reduced-${mode}.png` });
      expect(errors, errors.join(" | ")).toEqual([]);
      await ctx.close();
    });
  }
});
