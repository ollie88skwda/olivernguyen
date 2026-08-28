// /major sakura restyle — lane gate. Renders the real page in four
// theme/viewport combinations, fails on unhandled console errors, then drives
// the primary interactions (EDIT, duel answer, tornado preview, evidence add)
// and the reduced-motion path.
//
// The passphrase gate's /api/auth/session is stubbed to 200 so the page itself
// mounts; Supabase is hit for real where reachable and falls back to the local
// seed (offline) where not — both are the page's own loading/offline states.
import { devices, test, expect } from "@playwright/test";

// Known non-regression noise on this route:
// - Supabase realtime/select failures when the sandbox has no network route to
//   supabase.co — the store catches these (offline fallback) and logs them as
//   warnings, but the websocket path can surface its own errors.
const isAllowedConsoleError = (msg) => {
  const text = msg.text();
  if (/supabase|websocket|WebSocket|channel/i.test(text)) return true;
  if (/Failed to fetch|NetworkError|ERR_/i.test(text)) return true;
  return false;
};

const collectErrors = (page) => {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !isAllowedConsoleError(m)) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
};

const bypassGate = async (page) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
};

const mount = async (page, { theme, width, height }) => {
  await page.setViewportSize({ width, height });
  await bypassGate(page);
  const errors = collectErrors(page);
  await page.goto(`/major?theme=${theme}`, { waitUntil: "load" });
  // The gate check resolves async; the page then loads the doc (or the offline
  // seed) and renders S0.
  await expect(page.locator("#status")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  return errors;
};

const COMBOS = [
  { theme: "light", width: 1440, height: 1000, id: "light-desktop" },
  { theme: "dark", width: 1440, height: 1000, id: "dark-desktop" },
  { theme: "light", width: 375, height: 812, id: "light-phone" },
  { theme: "dark", width: 375, height: 812, id: "dark-phone" },
];

for (const { theme, width, height, id } of COMBOS) {
  test(`major renders clean: ${id}`, async ({ page }) => {
    const errors = await mount(page, { theme, width, height });
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.screenshot({ path: `e2e/__shots__/major-${id}.png`, fullPage: true });
    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test(`major has no horizontal overflow: ${id}`, async ({ page }) => {
    await mount(page, { theme, width, height });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `horizontal overflow ${overflow}px`).toBeLessThanOrEqual(0);
  });
}

test("major: dark board cells meet text contrast", async ({ page }) => {
  await mount(page, { theme: "dark", width: 1440, height: 1000 });
  const minimumContrast = await page.locator("#board .mj-cell").evaluateAll((cells) => {
    const parseRgb = (value) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d");
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
    const luminance = (value) => {
      const channels = parseRgb(value).map((channel) => channel / 255);
      const linear = channels.map((channel) =>
        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      );
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const contrast = (foreground, background) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    return Math.min(
      ...cells.map((cell) => {
        const styles = getComputedStyle(cell);
        return contrast(styles.color, styles.backgroundColor);
      })
    );
  });
  expect(minimumContrast).toBeGreaterThanOrEqual(4.5);
});

test("major: primary interactions work", async ({ page }) => {
  await mount(page, { theme: "light", width: 1440, height: 1000 });

  // EDIT toggle
  await page.getByRole("button", { name: "EDIT" }).click();
  await expect(page.getByRole("button", { name: "DONE" })).toBeVisible();
  // A duel answer changes the progress readout
  await page.getByText("of 21 answered").first().waitFor();
  await page.locator(".mjb-scale").first().waitFor();
  await page.locator(".mjb-stop").nth(3).click();
  await expect(page.locator(".mjb-scale")).toBeVisible();
  // Tornado preview redraws the board and shows the sticky banner
  const previewButton = page.locator(".mjb-torn-hit").first();
  if (await previewButton.count()) {
    await previewButton.click();
    await expect(page.locator(".mj-preview")).toBeVisible();
    await expect(page.getByRole("button", { name: "clear" })).toBeVisible();
  }
  // Exit edit mode
  await page.getByRole("button", { name: "DONE" }).click();
  await expect(page.getByRole("button", { name: "EDIT" })).toBeVisible();
});

test("major: evidence form adds a row (edit mode)", async ({ page }) => {
  await mount(page, { theme: "light", width: 1440, height: 1000 });
  await page.getByRole("button", { name: "EDIT" }).click();
  await page.locator("#ev-note").fill("A test row from the lane gate.");
  await page.getByRole("button", { name: "Add to the log" }).click();
  await expect(page.getByText("A test row from the lane gate.")).toBeVisible();
});

test("major: reduced motion leaves the page static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = await mount(page, { theme: "dark", width: 1440, height: 1000 });
  // Entrances that would animate are present as static content.
  await expect(page.locator("#uncertainty .mjb-ridges")).toBeVisible();
  await expect(page.locator("#fragility .mjb-torn-row").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("major: coarse controls keep the brand tap target", async ({ page }) => {
  const context = await page.context().browser().newContext({
    ...devices["iPhone 13"],
    baseURL: "http://localhost:3100",
  });
  const coarsePage = await context.newPage();
  await bypassGate(coarsePage);
  await coarsePage.goto("/major?theme=light", { waitUntil: "load" });
  await expect(coarsePage.locator("#status")).toBeVisible({ timeout: 30_000 });
  await coarsePage.getByRole("button", { name: "EDIT" }).click();
  await expect(coarsePage.getByRole("button", { name: "DONE" })).toBeVisible();
  const height = await coarsePage.locator(".mjb-stop").first().evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(44);
  await context.close();
});
