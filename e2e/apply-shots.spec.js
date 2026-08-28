// /apply restyle review shots (fm/restyle-apply lane).
// Four theme × mode combinations at 1440 and 375, plus EDIT mode and the
// loading state. Same mock contract as apply-restyle.spec.js — no real
// backend, no real Supabase row touched. Shots land in e2e/__shots__/.
import { test, devices } from "@playwright/test";
import { createSeed } from "../src/pages/apply/seed.js";

const ROW = {
  doc: createSeed(),
  updated_at: "2026-08-20T12:00:00.000Z",
};

async function mockBackend(page) {
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );
  await page.route("**/api/decision/save**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );
  await page.route("**/rest/v1/apply_decision**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ROW) })
  );
  await page.routeWebSocket("**/realtime/v1/websocket**", (ws) => ws.close());
}

test.describe.configure({ mode: "serial" });

const THEMES = ["light", "dark"];
const MODES = ["graph", "terminal"];

for (const theme of THEMES) {
  for (const mode of MODES) {
    test(`desktop ${theme} · ${mode}`, async ({ page }) => {
      await mockBackend(page);
      await page.goto(`/apply?theme=${theme}${mode === "terminal" ? "&mode=terminal" : ""}`);
      await page.waitForSelector(".ap-board tbody tr");
      await page.screenshot({
        path: `e2e/__shots__/apply-${theme}-${mode}-1440.png`,
        fullPage: true,
      });
    });
  }
}

test.describe("phone", () => {
  const { defaultBrowserType: _ignored, ...pixel } = devices["Pixel 7"];
  test.use({ ...pixel, viewport: { width: 375, height: 812 } });

  for (const theme of THEMES) {
    for (const mode of MODES) {
      test(`${theme} · ${mode}`, async ({ page }) => {
        await mockBackend(page);
        await page.goto(`/apply?theme=${theme}${mode === "terminal" ? "&mode=terminal" : ""}`);
        await page.waitForSelector(".ap-board");
        await page.screenshot({
          path: `e2e/__shots__/apply-${theme}-${mode}-375.png`,
          fullPage: true,
        });
      });
    }
  }
});

test("edit mode", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");
  await page.waitForSelector(".ap-board tbody tr");
  await page.getByRole("button", { name: "EDIT", exact: true }).click();
  await page.waitForSelector("input[aria-label*='Kinesiology access, lo']");
  await page.screenshot({
    path: "e2e/__shots__/apply-edit-1440.png",
    fullPage: true,
  });
});

test("loading state", async ({ page }) => {
  // Hold the supabase read open forever so the store stays in loading
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );
  await page.route("**/rest/v1/apply_decision**", () => new Promise(() => {}));
  await page.routeWebSocket("**/realtime/v1/websocket**", (ws) => ws.close());
  await page.goto("/apply?theme=dark");
  await page.waitForSelector(".ap-loading");
  await page.waitForTimeout(300); // let the MonoLabel settle
  await page.screenshot({ path: "e2e/__shots__/apply-loading-1440.png" });
});
