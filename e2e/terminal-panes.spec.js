// e2e/terminal-panes.spec.js — exec-term-panes gates, driven against the
// panes DEV harness (/terminal-panes-dev.html → window.__panes). NO window
// key listeners exist in the harness (P3/§5) — Playwright injects synthetic
// key events through the pure prefixStep reducer via __panes.send(e).
//
// Gate N2 (N-2.3): 3-pane layout by simulated actions; focus follows clicks
// + ^G h/j/k/l; zoom hides siblings; resize clamps; DOM mirrors tree 1:1;
// zero console errors. Gate N3 cases (N-3.3) extend this file.
import { test, expect } from "@playwright/test";

const HARNESS = "/terminal-panes-dev.html";

const collectErrors = (page) => {
  const errors = { console: [], page: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.console.push(msg.text());
  });
  page.on("pageerror", (err) => errors.page.push(String(err)));
  return errors;
};

const assertClean = (errors) => {
  expect(errors.page, "uncaught page errors").toEqual([]);
  expect(errors.console, "console errors").toEqual([]);
};

const openHarness = async (page) => {
  await page.goto(HARNESS);
  await page.waitForFunction(() => !!window.__panes);
};

/** Inject a key sequence through the reducer: 'C-g' = prefix chord. */
const send = (page, keys) =>
  page.evaluate((seq) => {
    for (const k of seq) {
      if (k === "C-g") window.__panes.send({ key: "g", ctrlKey: true });
      else window.__panes.send({ key: k });
    }
  }, keys);

const getState = (page) => page.evaluate(() => window.__panes.getState());

/** herdr 3-pane build: main LEFT, right column split in two. */
const threePanes = async (page) => {
  await send(page, ["C-g", "v"]); // main | p2 (p2 focused)
  await send(page, ["C-g", "-"]); // main | (p2 / p3) (p3 focused)
};

test.describe("terminal panes — Gate N2 (PaneGrid components in the harness)", () => {
  test("3-pane layout by injected actions — DOM mirrors the tree 1:1", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);

    // boot: exactly one pane, main, focused, no splits
    await expect(page.locator("section.pane")).toHaveCount(1);
    await expect(page.locator('[data-pane="main"]')).toHaveClass(/focused/);
    await expect(page.getByTestId("sb-panes")).toHaveText("1 pane");

    await threePanes(page);
    const s = await getState(page);
    expect(s.leaves).toEqual(["main", "p2", "p3"]);
    expect(s.focusedId).toBe("p3");

    // DOM structure mirrors: right split at root, down split in its b slot
    const root = page.locator('[data-testid="pane-grid"] > .pane-split');
    await expect(root).toHaveClass(/dir-right/);
    await expect(root.locator('> .split-a > [data-pane="main"]')).toHaveCount(1);
    const inner = root.locator("> .split-b > .pane-split");
    await expect(inner).toHaveClass(/dir-down/);
    await expect(inner.locator('> .split-a > [data-pane="p2"]')).toHaveCount(1);
    await expect(inner.locator('> .split-b > [data-pane="p3"]')).toHaveCount(1);

    // ratios rendered as flex-basis on the a-children
    await expect(root.locator("> .split-a")).toHaveCSS("flex-basis", "50%");
    await expect(inner.locator("> .split-a")).toHaveCSS("flex-basis", "50%");

    // pane chrome: title row + the 4 mouse-parity buttons per pane
    await expect(page.locator(".pane-title")).toHaveCount(3);
    await expect(page.locator(".pane-btns button")).toHaveCount(12);
    await expect(page.getByTestId("sb-panes")).toHaveText("3 panes");

    assertClean(errors);
  });

  test("focus follows clicks and ^G h/j/k/l (geometry moves)", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);
    await threePanes(page);

    // clicks focus (mouse parity)
    await page.locator('[data-pane="main"] .pane-body').click();
    await expect(page.locator('[data-pane="main"]')).toHaveClass(/focused/);
    await page.locator('[data-pane="p2"] .pane-body').click();
    await expect(page.locator('[data-pane="p2"]')).toHaveClass(/focused/);

    // ^G h/j/k/l directional moves across the split geometry
    await send(page, ["C-g", "j"]); // p2 → p3
    expect((await getState(page)).focusedId).toBe("p3");
    await send(page, ["C-g", "h"]); // p3 → main
    expect((await getState(page)).focusedId).toBe("main");
    await send(page, ["C-g", "l"]); // main → topmost right pane
    expect((await getState(page)).focusedId).toBe("p2");
    await send(page, ["C-g", "k"]); // top edge → stays
    expect((await getState(page)).focusedId).toBe("p2");

    // only one pane carries focus chrome at a time
    await expect(page.locator("section.pane.focused")).toHaveCount(1);

    // prefix indicator shows while pending, clears after the one-shot
    await page.evaluate(() => window.__panes.send({ key: "g", ctrlKey: true }));
    await expect(page.getByTestId("sb-prefix")).toHaveText("^G\u2025");
    await page.evaluate(() => window.__panes.send({ key: "Tab" }));
    await expect(page.getByTestId("sb-prefix")).toHaveCount(0);
    expect((await getState(page)).focusedId).toBe("p3"); // cycle p2 → p3

    assertClean(errors);
  });

  test("zoom hides siblings via CSS only — tree untouched; Esc unzooms", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);
    await threePanes(page);
    const before = (await getState(page)).tree;

    await send(page, ["C-g", "z"]); // zoom p3 (focused)
    await expect(page.getByTestId("sb-zoom")).toHaveText("[Z]");
    await expect(page.locator('[data-pane="p3"]')).toHaveClass(/zoomed/);
    await expect(page.locator('[data-pane="p3"]')).toBeVisible();
    // siblings still in the DOM (tree + layout untouched), just invisible
    await expect(page.locator('[data-pane="main"]')).toBeHidden();
    await expect(page.locator('[data-pane="p2"]')).toBeHidden();
    await expect(page.locator("section.pane")).toHaveCount(3);
    expect((await getState(page)).tree).toEqual(before);

    // zoomed pane fills the grid (absolute inset)
    const grid = await page.locator('[data-testid="pane-grid"]').boundingBox();
    const zoomed = await page.locator('[data-pane="p3"]').boundingBox();
    expect(zoomed.width).toBeGreaterThan(grid.width * 0.9);
    expect(zoomed.height).toBeGreaterThan(grid.height * 0.9);

    // Esc cascade tail: unzoom; everything visible again
    await send(page, ["Escape"]);
    expect((await getState(page)).zoomedId).toBe(null);
    await expect(page.getByTestId("sb-zoom")).toHaveCount(0);
    await expect(page.locator('[data-pane="main"]')).toBeVisible();

    // toggle parity: ^G z twice lands unzoomed
    await send(page, ["C-g", "z", "C-g", "z"]);
    expect((await getState(page)).zoomedId).toBe(null);

    assertClean(errors);
  });

  test("sticky resize mode nudges ±5% and clamps at [0.2, 0.8]", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);
    await send(page, ["C-g", "v"]); // main | p2

    await send(page, ["C-g", "r"]);
    await expect(page.getByTestId("sb-prefix")).toHaveText("-- RESIZE --");

    // one nudge right: 0.5 → 0.55, animated flex-basis on the a-child
    await send(page, ["l"]);
    expect((await getState(page)).tree.ratio).toBeCloseTo(0.55);

    // hammer past the bound: clamps at 0.8, no errors, still in resize mode
    await send(page, Array(10).fill("l"));
    expect((await getState(page)).tree.ratio).toBeCloseTo(0.8);
    await expect(
      page.locator('[data-testid="pane-grid"] > .pane-split > .split-a'),
    ).toHaveCSS("flex-basis", "80%");
    expect((await getState(page)).prefixMode).toBe("resize");

    // and the other bound
    await send(page, Array(15).fill("h"));
    expect((await getState(page)).tree.ratio).toBeCloseTo(0.2);

    // arrows work too; Esc exits the sticky mode
    await send(page, ["ArrowRight"]);
    expect((await getState(page)).tree.ratio).toBeCloseTo(0.25);
    await send(page, ["Escape"]);
    expect((await getState(page)).prefixMode).toBe("idle");
    await expect(page.getByTestId("sb-prefix")).toHaveCount(0);

    assertClean(errors);
  });

  test("title-row buttons drive the same ops on THEIR pane (mouse parity)", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);

    await page.getByRole("button", { name: "split pane right (main)" }).click();
    expect((await getState(page)).leaves).toEqual(["main", "p2"]);
    await page.getByRole("button", { name: "split pane down (p2)" }).click();
    expect((await getState(page)).leaves).toEqual(["main", "p2", "p3"]);

    // [×] on an UNFOCUSED pane closes that pane, not the focused one
    expect((await getState(page)).focusedId).toBe("p3");
    await page.getByRole("button", { name: "close pane (p2)" }).click();
    expect((await getState(page)).leaves).toEqual(["main", "p3"]);

    // [z] zooms its pane
    await page.getByRole("button", { name: "zoom pane (p3)" }).click();
    expect((await getState(page)).zoomedId).toBe("p3");

    assertClean(errors);
  });
});
