import { expect, test } from "@playwright/test";

const HARNESS = "/time-blocks-dev.html";

async function openBlocks(page, query = "mode=graph&theme=light") {
  await page.goto(`${HARNESS}?${query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { name: "Time blocks" })).toBeVisible();
}

test.describe("private time blocks · in-memory test storage", () => {
  test("edits the phone schedule and starts a persisted one-hour session", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await openBlocks(page);
      await page.getByRole("textbox", { name: "Activity 1" }).fill("School");
      await page.getByRole("spinbutton", { name: "Hours" }).fill("2");
      await page.getByRole("button", { name: "Add activity" }).click();
      await page.getByRole("textbox", { name: "Activity 2" }).fill("Writing");
      await page.getByRole("spinbutton", { name: "Hours" }).nth(1).fill("1");
      await page.getByRole("button", { name: "Save schedule" }).click();
      await expect(page.getByRole("status")).toContainText("Schedule saved");
      await page.getByRole("button", { name: "Start today’s plan" }).click();
      await expect(page.getByText("School · hour 1 of 2")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
      await page.screenshot({ path: testInfo.outputPath("time-blocks-active-375.png"), fullPage: true });
    } finally {
      await context.close();
    }
  });

  test("exposes the menu item only in the owner test fixture", async ({ page }) => {
    await openBlocks(page);
    await page.getByRole("button", { name: "Open pages menu" }).click();
    const ownerLink = page.getByRole("menuitem", { name: "Time blocks" });
    await expect(ownerLink).toHaveAttribute("href", "/time-blocks");

    await openBlocks(page, "owner=no&mode=graph&theme=light");
    await page.getByRole("button", { name: "Open pages menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Time blocks" })).toHaveCount(0);
  });

  test("shows an in-app deadline alert and requires a self-report before advancing", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await openBlocks(page, "state=ended&mode=graph&theme=dark");
      const alert = page.getByRole("status").filter({ hasText: "Hour ended" });
      await expect(alert).toContainText("Did you complete School, hour 1?");
      await expect(page.getByRole("button", { name: "Confirm this hour" })).toBeEnabled();
      await page.screenshot({ path: testInfo.outputPath("time-blocks-hour-ended-375.png"), fullPage: true });
      await page.getByRole("button", { name: "Confirm this hour" }).click();
      await expect(page.getByText("Next scheduled item · due now")).toBeVisible();
      await expect(page.getByRole("button", { name: "Start next hour" })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("offers late start or skip and never auto-credits a missed hour", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openBlocks(page, "state=late&mode=terminal&theme=light");
    await expect(page.getByText(/This hour was due at/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Start this hour late" })).toBeVisible();
    await page.getByRole("button", { name: "Skip this hour" }).click();
    await expect(page.getByText("Writing · hour 1 of 1")).toBeVisible();
    await expect(page.getByText("2 of 3 hours resolved · 1 self-reported complete")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("time-blocks-late-skip-375.png"), fullPage: true });
  });

  for (const mode of ["terminal", "graph"]) {
    for (const theme of ["light", "dark"]) {
      test(`${mode} · ${theme} keeps the phone route readable`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await openBlocks(page, `mode=${mode}&theme=${theme}`);
        await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
        const buttons = await page.locator(".time-blocks-page button").all();
        for (const button of buttons) {
          const box = await button.boundingBox();
          if (box) expect(box.height).toBeGreaterThanOrEqual(44);
        }
        await page.screenshot({ path: testInfo.outputPath(`time-blocks-${mode}-${theme}-375.png`), fullPage: true });
      });
    }
  }

  test("recovers from a test-storage outage without losing the page", async ({ page }) => {
    await openBlocks(page, "storage=fail-once&mode=graph&theme=light");
    await expect(page.getByRole("alert")).toContainText("Test storage is temporarily unavailable");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "Your schedule" })).toBeVisible();
  });
});
