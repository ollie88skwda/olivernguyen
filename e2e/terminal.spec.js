// e2e/terminal.spec.js — exec-term-core gates, driven against the DEV harness
// (/terminal-dev.html → window.__term). Gate T0 cases (C-0.5): the page never
// scrolls, blocks print line-at-a-time + pin, echo renders, clear empties,
// pos% follows buffer scroll, reduced-motion prints instantly, zero console
// errors. C1/C2/C3 describe-blocks append below as their phases land.
import { test, expect } from "@playwright/test";

const HARNESS = "/terminal-dev.html";

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
  await page.waitForFunction(() => !!window.__term);
};

test.describe("terminal core — Gate T0 (buffer engine + screen shell)", () => {
  test("the page itself never scrolls — only the buffer does (§3.1.1)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openHarness(page);

    // Overflow the buffer hard, instantly.
    await page.evaluate(() =>
      window.__term.api.print(
        Array.from({ length: 120 }, (_, i) => `overflow line ${i + 1}`),
        { stagger: 0 },
      ),
    );

    const m = await page.evaluate(() => ({
      bodyScrollH: document.body.scrollHeight,
      bodyClientH: document.body.clientHeight,
      docScrollH: document.documentElement.scrollHeight,
      docClientH: document.documentElement.clientHeight,
      scrollY: window.scrollY,
      bufScrollH: document.querySelector(".term-buffer").scrollHeight,
      bufClientH: document.querySelector(".term-buffer").clientHeight,
    }));
    expect(m.bodyScrollH, "body scrollHeight == clientHeight").toBe(
      m.bodyClientH,
    );
    expect(m.docScrollH, "html scrollHeight == clientHeight").toBe(
      m.docClientH,
    );
    expect(m.bufScrollH, "buffer actually overflows").toBeGreaterThan(
      m.bufClientH,
    );

    // Even a forced window scroll goes nowhere.
    await page.evaluate(() => window.scrollBy(0, 500));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    assertClean(errors);
  });

  test("blocks print line-at-a-time and pin to bottom (§3.1.5)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openHarness(page);

    // Kick off a 25-line print WITHOUT awaiting it.
    await page.evaluate(() => {
      window.__printDone = window.__term.api.print(
        Array.from({ length: 25 }, (_, i) => `printed line ${i + 1}`),
      );
    });

    // Mid-flight: some lines revealed, not all (line-at-a-time, not at once).
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".blk .ln:not(.pending)").length >= 3,
    );
    const mid = await page.evaluate(
      () => document.querySelectorAll(".blk .ln:not(.pending)").length,
    );
    expect(mid).toBeGreaterThanOrEqual(3);
    expect(mid, "mid-flight reveal must be partial").toBeLessThan(25);

    // Finished: all lines revealed, none pending, buffer pinned to bottom.
    await page.evaluate(() => window.__printDone);
    expect(
      await page.evaluate(
        () => document.querySelectorAll(".blk .ln:not(.pending)").length,
      ),
    ).toBe(25);
    expect(
      await page.evaluate(
        () => document.querySelectorAll(".blk .ln.pending").length,
      ),
    ).toBe(0);
    const pinned = await page.evaluate(() => {
      const el = document.querySelector(".term-buffer");
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    });
    expect(pinned, "buffer pinned to bottom after print").toBe(true);
    assertClean(errors);
  });

  test("echo lines render with sigil + command text", async ({ page }) => {
    const errors = collectErrors(page);
    await openHarness(page);
    await page.evaluate(() => window.__term.api.echo("cat tools.txt"));
    const echo = page.locator(".blk .ln.echo");
    await expect(echo).toHaveCount(1);
    await expect(echo.locator(".psigil")).toHaveText(/oliver@on\.c:~\$/);
    await expect(echo.locator(".cmdtext")).toHaveText("cat tools.txt");
    assertClean(errors);
  });

  test("clear() empties the scrollback; printErr styles as error", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openHarness(page);
    await page.evaluate(async () => {
      window.__term.api.echo("ls");
      await window.__term.api.print(["a", "b"], { stagger: 0 });
      await window.__term.api.printErr("cat: nosuch.txt: No such file");
    });
    await expect(page.locator(".blk .ln.err")).toHaveText(
      "cat: nosuch.txt: No such file",
    );
    expect(
      await page.evaluate(() => document.querySelectorAll(".blk").length),
    ).toBeGreaterThan(0);
    await page.evaluate(() => window.__term.api.clear());
    expect(
      await page.evaluate(() => document.querySelectorAll(".blk").length),
    ).toBe(0);
    assertClean(errors);
  });

  test("pos% feeds the statusbar and follows buffer scroll (§3.1.6)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openHarness(page);
    await page.evaluate(() =>
      window.__term.api.print(
        Array.from({ length: 120 }, (_, i) => `pos line ${i + 1}`),
        { stagger: 0 },
      ),
    );
    // Printed output pins to bottom → 100%.
    await expect(page.getByTestId("sb-pos")).toHaveText("100%");
    await page.evaluate(() => window.__term.api.scrollEnd("top"));
    await expect(page.getByTestId("sb-pos")).toHaveText("0%");
    await page.evaluate(() => window.__term.api.scrollRows(20));
    const midPos = await page.evaluate(() => window.__term.api.pos());
    expect(midPos).toBeGreaterThan(0);
    expect(midPos).toBeLessThan(100);
    await page.evaluate(() => window.__term.api.scrollEnd("bottom"));
    await expect(page.getByTestId("sb-pos")).toHaveText("100%");
    assertClean(errors);
  });

  test("reduced motion: prints land instantly, cursor does not blink", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openHarness(page);
    const elapsed = await page.evaluate(async () => {
      const t0 = performance.now();
      await window.__term.api.print(
        Array.from({ length: 40 }, (_, i) => `rm line ${i + 1}`),
      );
      return performance.now() - t0;
    });
    expect(elapsed, "RM print must not stagger").toBeLessThan(250);
    expect(
      await page.evaluate(
        () => document.querySelectorAll(".blk .ln:not(.pending)").length,
      ),
    ).toBe(40);
    expect(
      await page.evaluate(
        () => document.querySelectorAll(".blk .ln.pending").length,
      ),
    ).toBe(0);
    // terminal.css RM block kills the blink animation.
    expect(
      await page.evaluate(
        () => getComputedStyle(document.querySelector(".pcursor")).animationName,
      ),
    ).toBe("none");
    assertClean(errors);
  });

  test("screen grid: buffer + promptline + statusbar all visible at 100dvh", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openHarness(page);
    await expect(page.getByTestId("terminal-home")).toBeVisible();
    await expect(page.locator(".term-buffer")).toBeVisible();
    await expect(page.getByTestId("term-promptline")).toBeVisible();
    await expect(page.getByTestId("term-statusbar")).toBeVisible();
    const fits = await page.evaluate(() => {
      const s = document.querySelector(".term-screen");
      return Math.abs(s.getBoundingClientRect().height - window.innerHeight) <= 1;
    });
    expect(fits, ".term-screen owns exactly the viewport").toBe(true);
    assertClean(errors);
  });
});
