// One-off lane verification for /college (not a committed spec).
// Loads both ladders at desktop + 375px, screenshots, and asserts the
// interaction/accessibility contract: links, headings, badges, focus, targets.
import { test, expect } from "@playwright/test";

const COMBOS = [
  { theme: "light", width: 1440, name: "light-desktop" },
  { theme: "dark", width: 1440, name: "dark-desktop" },
  { theme: "light", width: 375, name: "light-phone" },
  { theme: "dark", width: 375, name: "dark-phone" },
];

for (const { theme, width, name } of COMBOS) {
  test(`/college ${name}`, async ({ page }) => {
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/college?theme=${theme}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    // placeholder copy is present and obvious
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("[ headline ]");
    await expect(page.getByText("[ two or three sentences introducing the college work ]")).toBeVisible();

    // three tool cards, each a real link with an h2 and its gate badge
    const links = page.locator("a.cl-tool");
    await expect(links).toHaveCount(3);
    const badges = await page.locator("a.cl-tool [data-slot='badge']").allTextContents();
    expect(badges).toEqual(["Passphrase", "Passphrase", "Sign in"]);
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).toEqual(["/major", "/apply", "/studio"]);
    const headings = await page.locator("a.cl-tool h2").allTextContents();
    expect(headings).toEqual(["Major", "Apply", "Studio"]);

    // tap targets: every interactive area >= 44px in both dimensions
    for (const box of await links.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()))) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    // keyboard focus: Tab walks through the fixed chrome bar first, then lands
    // on the first card with a visible outline
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      if (await page.locator("a.cl-tool:focus").count()) break;
    }
    const focused = page.locator("a.cl-tool:focus-visible");
    await expect(focused).toHaveCount(1);
    const ring = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ring).not.toBe("none");

    // screenshot
    await expect(page).toHaveScreenshot(`college-${name}.png`, {
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    });
    expect(errors).toEqual([]);
  });
}
