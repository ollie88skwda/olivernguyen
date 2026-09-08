import { expect, test } from "@playwright/test";

test.describe("tracker account navigation", () => {
  test("the proven Radix menu path opens and the authorized tracker action navigates", async ({ page }) => {
    await page.goto("/tracker-dev.html?mode=graph&theme=light", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Classes & notes" })).toBeVisible();

    await page.getByRole("button", { name: "Open account menu" }).click();
    await expect(page.getByRole("menuitemradio", { name: "Light" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Account" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Open pages menu" }).click();
    const tracker = page.getByRole("menuitem", { name: "Life tracker" });
    await expect(tracker).toBeVisible();
    await expect(tracker).toHaveAttribute("href", "/tracker");
    await tracker.click();
    await expect(page).toHaveURL(/\/tracker$/);
    await expect(page.getByText(/not configured/i).first()).toBeVisible();
  });

  test("a signed-in non-owner never sees the tracker entry", async ({ page }) => {
    await page.goto("/tracker-dev.html?mode=graph&theme=light&owner=no", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open account menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Open pages menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Life tracker" })).toHaveCount(0);
  });

  test("signed-out navigation never exposes the tracker entry", async ({ page }) => {
    await page.goto("/?mode=graph&theme=light", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open account menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Sign in" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Open pages menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Life tracker" })).toHaveCount(0);
  });
});
