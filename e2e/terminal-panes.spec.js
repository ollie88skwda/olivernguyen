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

test.describe("terminal panes — Gate N3 (programs, auto-split, limits, a11y)", () => {
  test("open artifact → auto-split RIGHT with main LEFT + toast; reuse retargets", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);

    const r = await page.evaluate(() =>
      window.__panes.open("artifact", { entity: "mac-agent", title: "mac-agent" }),
    );
    expect(r).toEqual({ ok: true, id: "p2" });

    // main stays LEFT: root split right, main in the a slot
    const s = await getState(page);
    expect(s.leaves).toEqual(["main", "p2"]);
    expect(s.focusedId).toBe("p2");
    const root = page.locator('[data-testid="pane-grid"] > .pane-split');
    await expect(root).toHaveClass(/dir-right/);
    await expect(root.locator('> .split-a > [data-pane="main"]')).toHaveCount(1);

    // toast advertises the close key (09 §C copy)
    await expect(page.locator(".pane-toast")).toHaveText("opened in pane 2 · ^G x closes");
    await expect(page.locator(".pane-toast")).toHaveAttribute("role", "status");

    // dossier content is real site.js data, printed into the pane's own log
    const pane = page.locator('[data-pane="p2"]');
    await expect(pane).toContainText("Mac-Agent");
    await expect(pane).toContainText("MCP toolbelt for macOS");
    await expect(pane).toContainText("[ACTIVE]");

    // ranger-style reuse: a second open retargets the SAME pane
    const r2 = await page.evaluate(() =>
      window.__panes.open("artifact", { entity: "articlewriter", title: "articlewriter" }),
    );
    expect(r2).toEqual({ ok: true, id: "p2", reused: true });
    expect((await getState(page)).paneCount).toBe(2);
    await expect(pane).toContainText("Articlewriter");
    await expect(pane).toContainText("research → draft → composite");

    assertClean(errors);
  });

  test("replay pane follows the last `day N`", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);

    await page.evaluate(() => window.__panes.open("replay", { day: 2 }));
    const pane = page.locator('[data-pane="p2"]');
    await expect(pane).toContainText("operator · day 2/7");
    await expect(pane).toContainText("2026-05-22");

    await page.evaluate(() => window.__panes.day(5));
    await expect(pane).toContainText("operator · day 5/7");
    await expect(pane).toContainText("2026-05-25");
    await expect(pane).not.toContainText("day 2/7"); // reprint, not append

    assertClean(errors);
  });

  test("limits surface as statusbar E-errors: 5th pane refused, main refuses close", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);

    // 4 panes: main | (p2 / (p3 / p4)) — the herdr layout
    await send(page, ["C-g", "v", "C-g", "-", "C-g", "-"]);
    expect((await getState(page)).paneCount).toBe(4);

    // 5th refused with the statusbar error (count limit)
    await send(page, ["C-g", "v"]);
    await expect(page.getByTestId("sb-err")).toHaveText("E94: pane limit reached (max 4)");
    expect((await getState(page)).paneCount).toBe(4);

    // main refuses close — via keyboard on the focused main pane
    await page.locator('[data-pane="main"] .pane-body').click();
    await send(page, ["C-g", "x"]);
    await expect(page.getByTestId("sb-err")).toHaveText("E97: 'main' refuses close");
    expect((await getState(page)).paneCount).toBe(4);

    // a successful op clears the error
    await send(page, ["C-g", "l"]);
    await expect(page.getByTestId("sb-err")).toHaveCount(0);

    assertClean(errors);
  });

  test("a11y: every pane is a labeled region; program buffers are labeled logs", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);

    await page.evaluate(() => window.__panes.open("artifact", { entity: "mac-agent", title: "mac-agent" }));
    await page.evaluate(() => window.__panes.open("help", { title: "help" }));

    await expect(page.getByRole("region", { name: "main" })).toBeVisible();
    await expect(page.getByRole("region", { name: "mac-agent" })).toBeVisible();
    await expect(page.getByRole("region", { name: "help" })).toBeVisible();
    expect(await page.getByRole("region").count()).toBe(3);

    // program adapters render real role=log buffers with labels
    await expect(page.getByRole("log", { name: "mac-agent" })).toBeVisible();
    await expect(page.getByRole("log", { name: "help" })).toBeVisible();
    // help pane carries the ^G bindings (09 §C: adds pane keys to 07's table)
    await expect(page.getByRole("log", { name: "help" })).toContainText("^G v split right");

    // DOM focus followed the last open for AT (focused pane is the section)
    await expect(page.locator("section.pane.focused")).toHaveCount(1);

    assertClean(errors);
  });

  test("mobile flatten (P9): single pane rendered, splits disabled, open falls back in-buffer", async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 480, height: 800 });
    await openHarness(page);

    // splits via the grammar are ignored below the breakpoint
    await send(page, ["C-g", "v"]);
    expect((await getState(page)).paneCount).toBe(1);
    await expect(page.locator("section.pane")).toHaveCount(1);

    // panes.open declines — the command layer prints in-buffer instead (P9)
    const r = await page.evaluate(() =>
      window.__panes.open("artifact", { entity: "mac-agent", title: "mac-agent" }),
    );
    expect(r).toEqual({ ok: false, inBuffer: true });
    expect((await getState(page)).paneCount).toBe(1);
    await expect(page.locator(".pane-toast")).toHaveCount(0);

    assertClean(errors);
  });
});
