// Lane gate: /license at desktop + 375px, both ladders, interaction + a11y.
import { test, expect } from "@playwright/test";

test("license renders sakura, headings ordered, link works, focus visible", async ({ page }) => {
  await page.goto("/license?theme=light", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  // heading order: exactly one h1 then an h2
  const hs = await page.evaluate(() =>
    [...document.querySelectorAll("main h1, main h2")].map((h) => h.tagName),
  );
  expect(hs).toEqual(["H1", "H2"]);

  // the root carries .sakura and the sakura bg token, not legacy navy/gold
  const bg = await page.evaluate(() => {
    const main = document.querySelector("main.sakura");
    return getComputedStyle(main).backgroundColor;
  });
  expect(bg).toBe("rgb(250, 241, 245)"); // light ladder --bg #faf1f5

  // link present with brand accent color
  const link = page.getByRole("link", { name: "here" });
  await expect(link).toBeVisible();
  const linkColor = await link.evaluate((el) => getComputedStyle(el).color);
  expect(linkColor).toBe("rgb(147, 39, 90)"); // --accent-hi #93275a (light)

  // focus-visible shows the brand focus ring: tab until the link is focused
  await link.scrollIntoViewIfNeeded();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => document.activeElement?.textContent);
    if (active === "here") break;
  }
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.textContent))
    .toBe("here");
  const outline = await link.evaluate((el) => getComputedStyle(el).outline);
  expect(outline).toContain("2px");
  expect(outline).toContain("rgb(147, 39, 90)");

  // clicking navigates to /permit
  await link.click();
  await page.waitForURL("**/permit");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("permit");

  // desktop screenshot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/license?theme=light", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/license-desktop-light.png", fullPage: true });
});

test("license dark ladder + 375px coarse pointer", async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/license?theme=dark", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const bg = await page.evaluate(() => {
    const main = document.querySelector("main.sakura");
    return getComputedStyle(main).backgroundColor;
  });
  expect(bg).toBe("rgb(24, 15, 20)"); // dark ladder --bg #180f14

  await page.screenshot({ path: "/tmp/license-desktop-dark.png", fullPage: true });

  const phoneContext = await browser.newContext({
    baseURL: "http://localhost:3100",
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });
  const phonePage = await phoneContext.newPage();
  try {
    await phonePage.goto("/license?theme=dark", { waitUntil: "networkidle" });
    await phonePage.evaluate(() => document.fonts.ready);
    await phonePage.waitForTimeout(300);

    const coarsePointer = await phonePage.evaluate(() => ({
      pointer: window.matchMedia("(pointer: coarse)").matches,
      touchPoints: navigator.maxTouchPoints,
    }));
    expect(coarsePointer.pointer).toBe(true);
    expect(coarsePointer.touchPoints).toBeGreaterThan(0);

    await phonePage.screenshot({ path: "/tmp/license-phone-dark.png", fullPage: true });

    // no horizontal overflow on phone
    const overflow = await phonePage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  } finally {
    await phoneContext.close();
  }
});
