// e2e/graph-state-lift.spec.js — F-P.2 (exec-term-panes follow-up round).
// TERM↔GRAPH camera state-lift on the REAL "/": focus a node + move the
// camera → flip to terminal → interact → flip back → the graph restores
// camera/focus/dossier instead of remounting to the fresh entry view.
// Never-trap stays inviolate (core's mode-roundtrip.spec asserts key
// deadness; here we sanity-check handlers are ALIVE again after restore).
// Variants: motion (default) + reduced-motion.
import { test, expect } from "@playwright/test";

const watchErrors = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
};

/** Wait until the camera flight settles (world transform stable ≥250ms). */
const settleCamera = (page) =>
  page.waitForFunction(
    () => {
      const el = document.querySelector(".g-world");
      if (!el || !el.style.transform) return false;
      const t = el.style.transform;
      if (el.__lastT === t) return performance.now() - el.__lastAt > 250;
      el.__lastT = t;
      el.__lastAt = performance.now();
      return false;
    },
    { timeout: 10_000 },
  );

const worldTransform = (page) =>
  page.locator(".g-world").evaluate((el) => el.style.transform);

/**
 * Wait until a node card stops moving in viewport space. The 0.85s entry
 * assemble moves it tens of px per sample; the perpetual ±3px drift garnish
 * moves it <2px per 250ms — so a 5px threshold separates the two (the drift
 * is also why plain .click() never sees the card as "stable").
 */
const settleNode = async (page, selector) => {
  const loc = page.locator(selector);
  let prev = await loc.boundingBox();
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(250);
    const cur = await loc.boundingBox();
    if (prev && cur && Math.hypot(cur.x - prev.x, cur.y - prev.y) < 5) return;
    prev = cur;
  }
};

/**
 * Drive the shared scenario. Steps:
 *  graph: focus mac-agent (dossier opens, camera flies) + zoom in ×2
 *  term:  boot, then run a real command (digit 5 → cat contact.txt)
 *  graph: assert camera/focus/dossier all restored, handlers alive.
 */
async function roundTrip(page, errors) {
  await page.goto("/");
  await page.waitForSelector(".g-stage");

  // focus a node (cancels the 6s tour autostart; dossier opens).
  // settle first (entry assemble must finish or the force-click lands on
  // whatever node is passing through that point), then force past the
  // drift garnish that never satisfies Playwright's stability check.
  await settleNode(page, '.node[data-id="mac-agent"] .card');
  await page.locator('.node[data-id="mac-agent"] .card').click({ force: true });
  await expect(page.locator(".dossier .d-title")).toHaveText("Mac-Agent");
  await expect(page.locator('.node.active[data-id="mac-agent"]')).toHaveCount(1);

  // move the camera on top of the focus flight: drag-pan on the stage
  // (>6px drags never close the dossier; the dossier aside covers the
  // zoom buttons, so panning is the honest user gesture here)
  await settleCamera(page);
  const box = await page.locator(".g-stage").boundingBox();
  await page.mouse.move(box.x + 220, box.y + 320);
  await page.mouse.down();
  await page.mouse.move(box.x + 360, box.y + 250, { steps: 6 });
  await page.mouse.up();
  await settleCamera(page);
  const t1 = await worldTransform(page);
  const zoom1 = await page.locator(".z-label").textContent();

  // → TERM: opens fresh, then interact for real
  await page.getByRole("button", { name: "TERM" }).click();
  await expect(page.locator(".reader-intro h1")).toHaveText("Oliver Nguyen", {
    timeout: 15_000,
  });
  await page.keyboard.press("5"); // empty-prompt digit → cat contact.txt
  await expect(page.locator(".ln.echo .cmdtext").last()).toHaveText(
    "cat contact.txt",
    { timeout: 15_000 },
  );

  // → GRAPH: state restored, not a fresh entry
  await page.getByRole("button", { name: "GRAPH", exact: true }).click();
  await page.waitForSelector(".g-stage");
  await expect(page.locator(".dossier .d-title")).toHaveText("Mac-Agent");
  await expect(page.locator('.node.active[data-id="mac-agent"]')).toHaveCount(1);
  expect(await worldTransform(page), "camera transform restored").toBe(t1);
  expect(await page.locator(".z-label").textContent(), "zoom label restored").toBe(zoom1);

  // never-trap regression guard, alive side: graph keys work again after
  // the round-trip (Esc closes the restored dossier and flies back)
  await page.keyboard.press("Escape");
  await expect(page.locator('.node.active[data-id="mac-agent"]')).toHaveCount(0);
  await settleCamera(page);
  expect(await worldTransform(page), "Esc fly-back moved the camera").not.toBe(t1);

  expect(errors).toEqual([]);
}

test.describe("graph state-lift — F-P.2", () => {
  test("TERM→GRAPH restores camera + focus + dossier (motion)", async ({ page }) => {
    const errors = watchErrors(page);
    await roundTrip(page, errors);
  });

  test("TERM→GRAPH restores camera + focus + dossier (reduced motion)", async ({ page }) => {
    const errors = watchErrors(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await roundTrip(page, errors);
  });

  test("an untouched graph round-trips to a FRESH entry (no stale restore)", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await page.waitForSelector(".g-stage");
    await settleCamera(page);
    const entry = await worldTransform(page);

    // flip without touching the graph at all
    await page.getByRole("button", { name: "TERM" }).click();
    await expect(page.getByTestId("terminal-home")).toBeVisible();
    await page.getByRole("button", { name: "GRAPH", exact: true }).click();
    await page.waitForSelector(".g-stage");
    await settleCamera(page);

    expect(await worldTransform(page), "entry view again").toBe(entry);
    await expect(page.locator(".node.active")).toHaveCount(0);
    await expect(page.locator(".dossier .d-title")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
