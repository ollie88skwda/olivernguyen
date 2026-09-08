import { expect, test } from "@playwright/test";

const HARNESS = "/tracker-dev.html";

async function openTracker(page, query = "mode=graph&theme=light") {
  await page.goto(`${HARNESS}?${query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { name: "Classes & notes" })).toBeVisible();
}

test.describe("life tracker", () => {
  test("creates, renames, selects, and deliberately deletes classes", async ({ page }) => {
    await openTracker(page);

    await page.getByRole("textbox", { name: "Class name" }).fill("Chemistry");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Chemistry" })).toBeVisible();

    await page.getByRole("button", { name: "Rename" }).click();
    const rename = page.getByRole("textbox", { name: "Rename class" });
    await rename.fill("Organic Chemistry");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Organic Chemistry" })).toBeVisible();

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Delete class?" })).toBeVisible();
    await expect(dialog).toContainText("Organic Chemistry");
    await dialog.getByRole("button", { name: "Delete class" }).click();
    await expect(page.getByRole("heading", { name: "Organic Chemistry" })).toHaveCount(0);
  });

  test("creates, edits, saves, selects, and deletes persistent notes", async ({ page }) => {
    await openTracker(page);
    await page.getByRole("button", { name: "Academic Writing" }).click();
    await page.getByRole("button", { name: "Create a note" }).click();

    const title = page.locator('.tracker-editor-fields input');
    await title.fill("Research outline");
    const body = page.getByRole("textbox", { name: "Note body" });
    await body.fill("Claim, evidence, counterargument.");
    await body.press(process.platform === "darwin" ? "Meta+s" : "Control+s");
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Research outline/ })).toBeVisible();

    await page.getByRole("button", { name: "Delete note" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Delete note?" })).toBeVisible();
    await dialog.getByRole("button", { name: "Delete note" }).click();
    await expect(page.getByText("No notes yet")).toBeVisible();
  });

  for (const mode of ["terminal", "graph"]) {
    for (const theme of ["light", "dark"]) {
      test(`${mode} · ${theme} renders with the shared theme contract`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openTracker(page, `mode=${mode}&theme=${theme}`);
        await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator(".tracker-workspace")).toBeVisible();
        await page.screenshot({
          path: testInfo.outputPath(`tracker-${mode}-${theme}.png`),
          fullPage: true,
        });
      });
    }
  }

  test("375px layout stacks without horizontal overflow and keeps touch targets", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await openTracker(page, "mode=graph&theme=dark");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
      expect(await page.evaluate(() => {
        const body = getComputedStyle(document.body).backgroundColor;
        const tracker = getComputedStyle(document.querySelector(".tracker-page")).backgroundColor;
        return body === tracker;
      })).toBe(true);
      const classButton = page.getByRole("button", { name: /Physics 101/ });
      expect((await classButton.boundingBox()).height).toBeGreaterThanOrEqual(44);
      const panels = await page.locator(".tracker-panel").evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().top),
      );
      expect(panels[1]).toBeGreaterThan(panels[0]);
      expect(panels[2]).toBeGreaterThan(panels[1]);
      await page.screenshot({ path: testInfo.outputPath("tracker-mobile.png"), fullPage: true });
    } finally {
      await context.close();
    }
  });

  test("reduced motion keeps the same content without transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openTracker(page, "mode=terminal&theme=dark");
    await expect(page.getByRole("button", { name: /Physics 101/ })).toBeVisible();
    expect(
      await page.locator(".tracker-list-button").first().evaluate((node) =>
        getComputedStyle(node).transitionDuration,
      ),
    ).toBe("0s");
  });
});
