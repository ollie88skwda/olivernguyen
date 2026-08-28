// /apply restyle gate (fm/restyle-apply lane).
//
// /apply is passphrase-gated and reads its doc from Supabase; under plain vite
// neither works, so this spec mocks all three at the network level:
//   - /api/auth/session  → 200 JSON, so the gate renders the page
//   - supabase REST read → the seeded doc (no real row touched)
//   - /api/decision/save → 200, swallowing writes (no real backend)
//   - supabase realtime websocket → aborted, so a live row can never land in
//     the test and fight the fixture
//
// The real page runs against the real bundled code; only the network is fake.
import { test, expect, devices } from "@playwright/test";
import { createSeed } from "../src/pages/apply/seed.js";

const ROW = {
  doc: createSeed(),
  updated_at: "2026-08-20T12:00:00.000Z",
};

async function mockBackend(page) {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );
  await page.route("**/api/decision/save**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );
  await page.route("**/rest/v1/apply_decision**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ROW),
    })
  );
  // The realtime channel must never reach the real Supabase instance — a live
  // row would overwrite the fixture mid-test.
  await page.routeWebSocket("**/realtime/v1/websocket**", (ws) => {
    ws.close();
  });
}

const SECTION_IDS = [
  "status",
  "board",
  "weights",
  "portfolio",
  "programs",
  "calendar",
  "filters",
  "effort",
  "evidence",
  "glossary",
];

test("every section renders with the fixture", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");
  await expect(page.getByRole("heading", { name: "Where To Apply" })).toBeVisible();

  for (const id of SECTION_IDS) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }

  // The board collapses to 12 rows with a count
  await expect(page.getByText(/of \d+$/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /show all \d+/ })).toBeVisible();

  // The dial is the biggest number on the page
  await expect(page.locator(".ap-dial")).toBeVisible();
});

test("board sort select and ink-cell tooltip work", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=dark");

  // Ink cell tooltip (Radix): hover a cell, content appears
  const cell = page.locator(".ap-cellbtn").first();
  await cell.hover();
  const tip = page.locator(".on-tooltip");
  await expect(tip).toBeVisible();
  await expect(tip).toContainText(/best guess/);

  // Sort select (Radix): pick a criterion, board stays alive
  await page.getByRole("combobox", { name: "Sort the board" }).click();
  await page.getByRole("option", { name: /kinesiology/ }).click();
  await expect(page.getByRole("combobox", { name: "Sort the board" })).toContainText(/kinesiology/);
});

test("edit mode paints inputs and the save stamp", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");

  await page.getByRole("button", { name: "EDIT", exact: true }).click();
  await expect(
    page.getByLabel(/Kinesiology access, lo/).first()
  ).toBeVisible();
  // savedAt comes from the fixture's updated_at
  await expect(page.getByText(/SAVED \d{2}:\d{2}/)).toBeVisible();

  // a number typed into an edit cell writes through updateDoc (swallowed)
  const input = page.getByLabel(/Kinesiology access, lo/).first();
  await input.fill("7");
  await expect(input).toHaveValue("7");

  await page.getByRole("button", { name: "DONE", exact: true }).click();
  await expect(page.getByRole("button", { name: "EDIT", exact: true })).toBeVisible();
});

test("profile selects persist to localStorage only", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");

  await page.getByLabel("Grades").click();
  await page.getByRole("option", { name: "top 5%" }).click();

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("apply_profile") || "{}")
  );
  expect(stored.gpaPercentile).toBe(0.95);

  // the dial loses its provisional state once the profile is set
  await expect(page.locator(".ap-dial").getByText("provisional")).toHaveCount(0);
});

test("filters: hard mode cuts schools and lists them", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");

  const firstFilter = page.locator(".ap-filter").first();
  await firstFilter.getByRole("radio", { name: "hard" }).click();

  await expect(page.getByText(/Cut by hard filters/)).toBeVisible();
  await expect(page.locator(".ap-filter").first().getByText(/currently cutting them/)).toBeVisible();
});

test("duel rungs answer and drive weights", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=dark");

  const rung = page.locator(".ap-rung").first();
  await rung.click();
  await expect(page.locator(".ap-verdict-line")).toContainText(/more important/);
});

test("evidence toggle filters to gaps only", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");

  const rows = page.locator(".ap-ev-table tbody tr");
  const before = await rows.count();
  expect(before).toBeGreaterThan(0);

  await page.getByRole("checkbox", { name: "Only show schools with open gaps" }).check();

  await expect.poll(() => rows.count()).toBeLessThan(before);
  const gaps = page.locator(".ap-ev-gaps");
  const values = await gaps.allTextContents();
  expect(values.length).toBeGreaterThan(0);
  expect(values.every((value) => Number(value.trim()) > 0)).toBe(true);
});

test.describe("phone", () => {
  // a real mobile device context: (pointer: coarse) drives the 44px controls
  const { defaultBrowserType: _ignored, ...pixel } = devices["Pixel 7"];
  test.use({ ...pixel, viewport: { width: 375, height: 812 } });

  test("renders and scrolls the board at 375px + coarse pointer", async ({ page }) => {
    await mockBackend(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/apply?theme=light");

    await expect(page.getByRole("heading", { name: "Where To Apply" })).toBeVisible();
    // board scrolls horizontally instead of squashing
    const board = page.locator(".ap-board");
    const tableWrap = board.locator(".on-table-wrap");
    await expect(tableWrap).toBeVisible();
    const scrollable = await tableWrap.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrollable).toBe(true);
    // controls are 44px tall on a coarse pointer (--ctl-h)
    for (const name of ["EDIT"]) {
      const ctl = page.getByRole("button", { name, exact: true });
      const height = await ctl.evaluate((el) => el.getBoundingClientRect().height);
      expect(height).toBeGreaterThanOrEqual(44);
    }
    const rung = page.locator(".ap-rung").first();
    const rungHeight = await rung.evaluate((el) => el.getBoundingClientRect().height);
    expect(rungHeight).toBeGreaterThanOrEqual(44);
  });
});
