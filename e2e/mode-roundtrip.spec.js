/**
 * e2e/mode-roundtrip.spec.js — X-3: the two-interface contract on the REAL
 * "/" (ModeProvider + chrome + lazy chunks). GRAPH→TERM→GRAPH via toggle AND
 * via intents both ways; graph unaffected after the round-trip; terminal
 * keys dead while graph is mounted and vice versa (P3 never-trap by
 * unmount); the terminal chunk is never fetched until the mode flips (P6).
 * (The `^G v` pane-key row joins this spec at X-1 when the prefix wires in.)
 */
import { test, expect } from "@playwright/test";

const watchErrors = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
};

const bootEcho = (page) =>
  expect(page.locator(".ln.echo .cmdtext").first()).toHaveText(
    "operator --replay --day 3",
    { timeout: 15_000 },
  );

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
    await expect(page.locator(".ln.echo")).toHaveCount(2);
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
    await expect(page.locator(".ln.echo")).toHaveCount(1); // ls echo is gone
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
    await page.waitForTimeout(300);
    await expect(page.locator(".term-screen")).toHaveCount(0);
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
