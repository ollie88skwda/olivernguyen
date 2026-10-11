import { expect, test } from "@playwright/test";

const HARNESS = "/time-blocks-dev.html";

async function settleCapture(page) {
  // Starting a run scrolls to top while the fixed chrome reappears on a
  // 140ms transition; capture only once the bar is fully back (y >= 0,
  // no transform) and webfonts are settled, or the shot catches clipped
  // chrome and fallback type.
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(async () => page.locator(".site-chrome-bar").evaluate((bar) => {
    const box = bar.getBoundingClientRect();
    return box.y >= 0 && getComputedStyle(bar).transform === "none";
  })).toBe(true);
}

async function openBlocks(page, query = "mode=graph&theme=light") {
  await page.goto(`${HARNESS}?${query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { name: "Time blocks", exact: true })).toBeVisible();
}

test.describe("private time blocks · in-memory test storage", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });

  test("edits the phone schedule and starts a persisted one-hour session", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await openBlocks(page);
      const chromeBox = await page.locator(".site-chrome-bar").boundingBox();
      const headerBox = await page.locator(".time-blocks-header").boundingBox();
      expect(headerBox.y).toBeGreaterThanOrEqual(chromeBox.y + chromeBox.height);
      await page.getByRole("textbox", { name: "Activity 1" }).fill("School");
      await page.getByRole("spinbutton", { name: "Activity 1 hours" }).fill("2");
      await page.getByRole("button", { name: "Add activity" }).click();
      await page.getByRole("textbox", { name: "Activity 3" }).fill("Reading");
      await page.getByRole("spinbutton", { name: "Activity 3 hours" }).fill("1");
      await page.getByRole("button", { name: "Save schedule" }).click();
      await expect(page.getByText("Schedule saved for your next run.")).toBeVisible();
      await page.getByRole("button", { name: "Start today’s plan" }).click();
      await expect(page.getByText("School · hour 1 of 2")).toBeVisible();
      await page.getByRole("button", { name: "Start timer" }).first().click();
      await expect(page.getByRole("button", { name: "Finish timer" }).first()).toBeVisible();
      await expect(page.locator(".time-blocks-timer")).toHaveText("00:00:00");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
      await settleCapture(page);
      await page.screenshot({ path: testInfo.outputPath("time-blocks-active-375.png"), fullPage: true });
    } finally {
      await context.close();
    }
  });

  test("keeps the focus heading and primary action visible after starting from the editor bottom", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      const browserErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      page.on("pageerror", (error) => browserErrors.push(error.message));
      await openBlocks(page);
      for (let index = 0; index < 6; index += 1) {
        await page.getByRole("button", { name: "Add activity" }).click();
      }
      const activityNames = page.getByRole("textbox", { name: /Activity/ });
      for (let index = 2; index < 8; index += 1) {
        await activityNames.nth(index).fill(`Focus ${index + 1}`);
      }
      await page.getByRole("button", { name: "Save schedule" }).click();
      await expect(page.getByText("Schedule saved for your next run.")).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

      await page.getByRole("button", { name: "Start today’s plan" }).click();

      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expect(page.getByRole("heading", { name: "Your time blocks" })).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole("button", { name: "Start timer" }).first()).toBeInViewport({ ratio: 1 });
      expect(browserErrors).toEqual([]);
      await settleCapture(page);
      await page.screenshot({ path: testInfo.outputPath("time-blocks-focus-from-editor-bottom-375.png") });
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

  test("names fields, focuses validation, protects edits, and contains long activity names", async ({ page }) => {
    await openBlocks(page, "mode=graph&theme=dark");
    const startTime = page.getByLabel("Preferred first-hour start");
    const firstActivity = page.getByRole("textbox", { name: "Activity 1" });
    await expect(startTime).toHaveAttribute("name", "preferredStartTime");
    await expect(startTime).toHaveAttribute("autocomplete", "off");
    await expect(firstActivity).toHaveAttribute("name", "activities[0].name");
    await expect(firstActivity).toHaveAttribute("autocomplete", "off");
    await expect(firstActivity).toHaveAttribute("placeholder", "For example, School…");
    expect(await startTime.evaluate((input) => getComputedStyle(input).colorScheme)).toBe("dark");

    await firstActivity.fill("");
    await expect(firstActivity).toHaveAttribute("aria-invalid", "true");
    await expect(firstActivity).toHaveAttribute("aria-describedby", "time-blocks-validation");
    await page.getByRole("button", { name: "Save schedule" }).click();
    await expect(page.locator("#time-blocks-validation")).toBeFocused();

    await firstActivity.fill("A".repeat(60));
    await page.getByRole("button", { name: "Save schedule" }).click();
    await expect(page.getByText("Schedule saved for your next run.")).toBeVisible();
    await page.getByRole("button", { name: "Start today’s plan" }).click();
    await page.getByRole("button", { name: "Edit next schedule" }).click();
    await page.getByRole("textbox", { name: "Activity 1" }).fill("Unsaved schedule name");

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Back to current run" }).click();
    await expect(page.getByRole("heading", { name: "Your schedule" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Activity 1" })).toHaveValue("Unsaved schedule name");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Back to current run" }).click();
    await expect(page.getByText(`${"A".repeat(60)} · hour 1 of 2`, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  });

  test("starts and finishes a due timer with two taps", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await openBlocks(page, "state=ended&mode=graph&theme=dark");
      const firstBlock = page.locator(".time-blocks-activity").first();
      await expect(firstBlock.getByRole("button", { name: "Start timer" })).toBeEnabled();
      await page.screenshot({ path: testInfo.outputPath("time-blocks-timer-ready-375.png"), fullPage: true });
      await firstBlock.getByRole("button", { name: "Start timer" }).click();
      await expect(firstBlock.getByRole("button", { name: "Finish timer" })).toBeVisible();
      await firstBlock.getByRole("button", { name: "Finish timer" }).click();
      await expect(firstBlock.getByRole("button", { name: "Finish timer" })).toHaveCount(0);
      await expect(firstBlock).toContainText("finished");
    } finally {
      await context.close();
    }
  });

  test("lets late due blocks be skipped without auto-crediting them", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openBlocks(page, "state=late&mode=terminal&theme=light");
    const secondBlock = page.locator(".time-blocks-activity").nth(1);
    const thirdBlock = page.locator(".time-blocks-activity").nth(2);
    await expect(secondBlock.getByRole("button", { name: "Start timer" })).toBeVisible();
    await expect(secondBlock.getByRole("button", { name: "Skip block" })).toBeVisible();
    await secondBlock.getByRole("button", { name: "Skip block" }).click();
    await expect(secondBlock).toContainText("skipped");
    await expect(thirdBlock.getByRole("button", { name: "Start timer" })).toBeVisible();
    await expect(thirdBlock.getByRole("button", { name: "Skip block" })).toBeVisible();
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
