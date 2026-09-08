/**
 * e2e/mode-roundtrip.spec.js — X-3: the two-interface contract on the REAL
 * "/" (ModeProvider + chrome + lazy chunks). GRAPH→TERM→GRAPH via toggle AND
 * via intents both ways; graph unaffected after the round-trip; terminal
 * keys dead while graph is mounted and vice versa (P3 never-trap by
 * unmount); the terminal chunk is never fetched until the mode flips (P6).
 * X-1: "integrated panes" cases exercise the ^G grammar, panes.open
 * auto-split, replay day-follow, statusbar pane state and E-errors on the
 * REAL route (component-level coverage stays in terminal-panes.spec.js).
 */
import { test, expect, devices } from "@playwright/test";

const watchErrors = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
};

const bootEcho = (page) =>
  expect(page.locator(".reader-intro h1")).toHaveText("Oliver Nguyen", {
    timeout: 15_000,
  });

test.describe("mode round-trip — X-3", () => {
  test("P6: terminal chunk not fetched until the mode flips (network assert)", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const fetched = [];
    page.on("request", (r) => fetched.push(r.url()));

    await page.goto("/");
    await page.waitForSelector(".g-stage");
    await page.waitForTimeout(800);
    const before = fetched.filter((u) => u.includes("/src/terminal/"));
    expect(before, "no terminal modules before the flip").toEqual([]);

    await page.getByRole("button", { name: "TERM" }).click();
    await expect(page.getByTestId("terminal-home")).toBeVisible();
    const after = fetched.filter((u) => u.includes("/src/terminal/"));
    expect(after.length, "terminal chunk fetched on flip").toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test("toggle round-trip: graph → terminal → graph; terminal remounts FRESH", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await page.waitForSelector(".g-stage");

    // → terminal: boots, page scroll locked
    await page.getByRole("button", { name: "TERM" }).click();
    await bootEcho(page);
    await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
      timeout: 15_000,
    });
    // build session state that must NOT survive the round-trip
    await page.getByTestId("term-promptline").click();
    await page.keyboard.type("ls");
    await page.keyboard.press("Enter");
    await expect(page.locator(".ln.echo")).toHaveCount(1);
    expect(
      await page.evaluate(() => document.body.style.overflow),
    ).toBe("hidden");

    // → graph: terminal unmounted, scroll lock released, graph functional
    await page.getByRole("button", { name: "GRAPH", exact: true }).click();
    await expect(page.locator(".graph-root")).toBeVisible();
    await expect(page.locator(".term-screen")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
    await page.waitForTimeout(600);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(800);
    await expect(page.locator(".d-title")).toHaveText("Oliver Nguyen");

    // → terminal again: a fresh session (09: no persistence — scrollback died)
    await page.keyboard.press("Escape"); // close the graph dossier first
    await page.getByRole("button", { name: "TERM" }).click();
    await bootEcho(page);
    await expect(page.locator(".ln.echo")).toHaveCount(0); // ls echo is gone
    expect(errors).toEqual([]);
  });

  test("intent round-trip both ways: `mode graph` command ⇄ graph palette intent", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    // direct terminal entry (?mode= forces it)
    await page.goto("/?mode=terminal");
    await bootEcho(page);
    await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
      timeout: 15_000,
    });

    // terminal → graph via the REAL command (ModeProvider catches the event;
    // no fallback error line may print)
    await page.getByTestId("term-promptline").click();
    await page.keyboard.type("mode graph");
    await page.keyboard.press("Enter");
    await expect(page.locator(".graph-root")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "graph");
    await expect(page.locator(".term-screen")).toHaveCount(0);

    // graph → terminal via the graph's own ⌘K intent
    await page.getByRole("button", { name: "Open command palette" }).click();
    await expect(page.locator(".palette.open")).toBeVisible();
    await page.type(".pal-input", "terminal");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("terminal-home")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
    await bootEcho(page);
    expect(errors).toEqual([]);
  });

  test("P3 both directions: terminal keys dead under graph, graph keys dead under terminal", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await page.waitForSelector(".g-stage");
    await page.waitForTimeout(600);

    // terminal keys while graph mounted: no terminal DOM may appear, no echo
    await page.keyboard.press("j");
    await page.keyboard.press("1");
    await page.keyboard.press("Control+g"); // ^G v: the pane grammar too
    await page.keyboard.press("v");
    await page.waitForTimeout(300);
    await expect(page.locator(".term-screen")).toHaveCount(0);
    await expect(page.locator(".pane")).toHaveCount(0);
    await expect(page.locator(".ln.echo")).toHaveCount(0);

    // graph keys while terminal mounted: '/' and 'f' are just prompt text
    await page.getByRole("button", { name: "TERM" }).click();
    await bootEcho(page);
    await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
      timeout: 15_000,
    });
    await page.getByTestId("term-promptline").click();
    await page.keyboard.type("/f");
    await expect(page.getByTestId("term-pecho")).toContainText("/f");
    await expect(page.locator(".graph-root")).toHaveCount(0);
    await expect(page.locator(".filterbar")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

/* --------------------------- integrated panes (X-1) ---------------------- */

const openTerminal = async (page) => {
  await page.goto("/?mode=terminal&still");
  await bootEcho(page);
  await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
    timeout: 15_000,
  });
};

const chord = async (page, key) => {
  await page.keyboard.press("Control+g");
  await page.keyboard.press(key);
};

test.describe("integrated panes — X-1 (^G grammar + panes.open on /)", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test("boot = ONE chrome-less pane; ^G v splits, statusbar counts, ^G x closes", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await openTerminal(page);

    // boot: single main pane, flattened card (title row stays — its split
    // buttons are the 09 mouse-discoverability requirement)
    await expect(page.locator(".pane")).toHaveCount(1);
    await expect(page.locator(".pane")).toHaveCSS("border-top-width", "0px");
    await expect(page.locator(".term-statusbar .sb-panes")).toHaveCount(0);

    // ^G v → 2 panes; manual split runs the help fallback; statusbar counts
    await chord(page, "v");
    await expect(page.locator(".pane")).toHaveCount(2);
    await expect(page.getByTestId("sb-panes")).toHaveText("2 panes");
    await expect(page.locator(".pane").nth(1)).toContainText("^G v split right");
    // main stays LEFT (P7): first pane in DOM order is main
    expect(
      await page.locator(".pane").first().getAttribute("data-pane"),
    ).toBe("main");

    // ^G z zoom → [Z] flag; Esc unzooms (cascade tail)
    await chord(page, "z");
    await expect(page.getByTestId("sb-zoom")).toHaveText("[Z]");
    await expect(page.locator('[data-pane="main"]')).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(page.locator(".term-statusbar .sb-zoom")).toHaveCount(0);
    await expect(page.locator('[data-pane="main"]')).toBeVisible();

    // ^G x closes the focused (new) pane → back to the flat single pane
    await chord(page, "x");
    await expect(page.locator(".pane")).toHaveCount(1);
    await expect(page.locator(".pane")).toHaveCSS("border-top-width", "0px");
    expect(errors).toEqual([]);
  });

  test("refusals surface as statusbar E-errors: close main, pane limit", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await openTerminal(page);

    // only main → ^G x refuses (E97)
    await chord(page, "x");
    await expect(page.getByTestId("sb-err")).toContainText("E97");
    await expect(page.locator(".pane")).toHaveCount(1);

    // build 4 panes (v, -, focus-left, -), then any split → E94 limit
    await chord(page, "v");
    await chord(page, "-");
    await chord(page, "h");
    await chord(page, "-");
    await expect(page.locator(".pane")).toHaveCount(4);
    await expect(page.getByTestId("sb-panes")).toHaveText("4 panes");
    await chord(page, "v");
    await expect(page.getByTestId("sb-err")).toContainText("E94");
    await expect(page.locator(".pane")).toHaveCount(4);
    expect(errors).toEqual([]);
  });

  test("open <entity> auto-splits RIGHT with toast; second open reuses the pane", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await openTerminal(page);

    await page.keyboard.type("open mac-agent");
    await page.keyboard.press("Enter");
    await expect(page.locator(".pane")).toHaveCount(2);
    // main LEFT, artifact RIGHT with the entity dossier
    expect(
      await page.locator(".pane").first().getAttribute("data-pane"),
    ).toBe("main");
    const artifactPane = page.locator(".pane").nth(1);
    await expect(artifactPane).toContainText("MCP toolbelt for macOS");
    await expect(artifactPane.locator(".pane-name")).toHaveText("mac-agent");
    // toast advertises the close key (09 §C)
    await expect(page.locator(".pane-toast")).toContainText("^G x closes");

    // ranger-style reuse: opening another node retargets the SAME pane
    await page.keyboard.type("open scopecreep");
    await page.keyboard.press("Enter");
    await expect(page.locator(".pane")).toHaveCount(2);
    await expect(artifactPane).toContainText("Chrome extension");
    await expect(artifactPane.locator(".pane-name")).toHaveText(
      "scopecreep notary",
    );
    expect(errors).toEqual([]);
  });

  test("day N prints beats AND the replay pane follows it (P5/§3.2)", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await openTerminal(page);

    await page.keyboard.type("day 4");
    await page.keyboard.press("Enter");
    // beats print into the session buffer (C1 behavior preserved)
    await expect(page.locator('[data-pane="main"]')).toContainText(
      "decision #163 — pin dependency, stop the flake",
    );
    // and the replay pane opens right, following day 4
    await expect(page.locator(".pane")).toHaveCount(2);
    const replayPane = page.locator(".pane").nth(1);
    await expect(replayPane.locator(".pane-name")).toHaveText(
      "operator · day 4",
    );
    await expect(replayPane).toContainText("pin dependency");

    // day 6 → SAME pane retargets (no stacking)
    await page.keyboard.type("day 6");
    await page.keyboard.press("Enter");
    await expect(page.locator(".pane")).toHaveCount(2);
    await expect(replayPane.locator(".pane-name")).toHaveText(
      "operator · day 6",
    );
    await expect(replayPane).toContainText("freeze scope for ship");
    expect(errors).toEqual([]);
  });

  test("P9 mobile: splits disabled — open prints in-buffer, single pane holds", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      ...devices["iPhone 13"],
    });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto("/?mode=terminal&still");
    await bootEcho(page);

    // palette chip → tap a suggested artifact intent (touch path, no typing)
    await page.getByTestId("sb-cmdk").tap();
    await page
      .getByTestId("term-palette")
      .locator('[role="option"]', { hasText: "Show the MCP toolbelt" })
      .tap();
    // dossier prints INTO the session buffer; still exactly one pane
    await expect(page.locator('[data-pane="main"]')).toContainText(
      "the 8 registered tools",
    );
    await expect(page.locator(".pane")).toHaveCount(1);
    await expect(page.locator(".pane-toast")).toHaveCount(0);
    expect(errors).toEqual([]);
    await ctx.close();
  });
});
