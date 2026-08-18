// e2e/terminal.spec.js — exec-term-core gates, driven against the DEV harness
// (/terminal-dev.html → window.__term). Gate T0 cases (C-0.5): the page never
// scrolls, blocks print line-at-a-time + pin, echo renders, clear empties,
// pos% follows buffer scroll, reduced-motion prints instantly, zero console
// errors. Gate C1 (C-1.6): boot hero, tabs/digits print sections, command
// errors, history/Tab, content spot-checks vs site.js (kept literal so the
// spec fails loudly if content drifts — graph.spec pattern).
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

// Gate T0 cases drive the raw engine — ?noboot keeps the buffer empty and
// deterministic. Gate C1+ cases use the booting harness (production default).
const openHarness = async (page, params = "?noboot") => {
  await page.goto(HARNESS + params);
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

/* ------------------------------- GATE C1 -------------------------------- */

// literals mirror src/content/site.js (spot-checks per §6 Gate C1)
const TAGLINE = "I build LLM agents. One ran a project alone for a week.";
const DAY3_BEAT = "decision #141 — restructure email templates";
const DAY4_BEAT = "decision #163 — pin dependency, stop the flake";
const EMAIL = "oliverdnguyen@gmail.com";

const STILL = HARNESS + "?still"; // instant cadence for command-table cases

const bootDone = async (page) => {
  await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
    timeout: 15_000,
  });
};

test.describe("terminal core — Gate C1 (prompt, commands, sections, boot)", () => {
  test("boot autoruns: motd, auto-typed command, day-3 frame, hero, CTAs (§3.1.4)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openHarness(page, ""); // REAL boot, full cadence

    // motd printed before the first command
    await expect(page.locator(".ln.faint").first()).toContainText("Last login:");
    // the site types its own first command → echo line
    await expect(page.locator(".ln.echo .cmdtext").first()).toHaveText(
      "operator --replay --day 3",
      { timeout: 15_000 },
    );
    // day-3 log frame from site.week + operator stats summary
    await expect(page.locator(".ln.k-log").first()).toContainText(DAY3_BEAT, {
      timeout: 15_000,
    });
    await expect(page.locator(".ln.k-ok").first()).toContainText(
      "257 decision entries",
    );
    // scramble settles on the real name; tagline is site.meta's
    await bootDone(page);
    await expect(page.locator(".ln.tagline").first()).toHaveText(TAGLINE);
    // CTA row buttons
    await expect(
      page.locator('button.obtn[data-cmd="cat tools.txt"]'),
    ).toBeVisible();
    await expect(
      page.locator('button.obtn[data-cmd="mode graph"]'),
    ).toBeVisible();
    // statusbar: window 1 active, prompt back to NORMAL
    await expect(page.getByRole("button", { name: "1:boot" })).toHaveClass(
      /active/,
    );
    await expect(page.getByTestId("sb-mode")).toHaveText("-- NORMAL --");
    assertClean(errors);
  });

  test("every tab prints its section; active tab follows (§3.1.6)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);

    const expectSection = async (tab, needle) => {
      await page.getByRole("button", { name: tab }).click();
      await expect(page.locator(".blk").last()).toContainText(needle, {
        timeout: 10_000,
      });
      await expect(page.getByRole("button", { name: tab })).toHaveClass(
        /active/,
      );
    };
    await expectSection("2:agents", "Voice / Operator");
    await expectSection("3:robotics", "TechX Robotics");
    await expectSection("4:leadership", "Eagle Scout");
    await expectSection("5:contact", "OPEN CHANNEL.");
    // echoes are real commands
    await expect(page.locator(".ln.echo .cmdtext").nth(1)).toHaveText(
      "cat tools.txt",
    );
    assertClean(errors);
  });

  test("digits 1–5 in the empty prompt auto-type the window command", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);
    await page.keyboard.press("2");
    await expect(page.locator(".ln.echo .cmdtext").nth(1)).toHaveText(
      "cat tools.txt",
    );
    await expect(page.locator(".blk").last()).toContainText("ScopeCreep Notary");
    await page.keyboard.press("5");
    await expect(page.locator(".blk").last()).toContainText("github");
    assertClean(errors);
  });

  test("typed commands: ls, cat errors, day N, open, email, quit, mode terminal", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);

    const type = async (cmd) => {
      await page.keyboard.type(cmd);
      await page.keyboard.press("Enter");
    };

    await type("ls");
    await expect(page.locator(".blk").last()).toContainText("tools.txt");
    await expect(page.locator(".blk").last()).toContainText("contact.txt");

    await type("cat nosuch.txt");
    await expect(page.locator(".ln.err").last()).toHaveText(
      "cat: nosuch.txt: No such file",
    );

    await type("day 4");
    await expect(page.locator(".blk").last()).toContainText(DAY4_BEAT);
    await type("day 9");
    await expect(page.locator(".ln.err").last()).toHaveText(
      "day: expected 1-7",
    );

    await type("open mac-agent");
    await expect(page.locator(".blk").last()).toContainText(
      "MCP toolbelt for macOS",
    );
    await expect(page.locator(".blk").last()).toContainText("8 MCP tools");

    await type("email");
    await expect(page.locator(".ln.ok").last()).toHaveText(
      `copied ${EMAIL} ✓`,
    );

    await type("quit");
    await expect(page.locator(".blk").last()).toContainText(
      "this is a website. you live here now.",
    );

    await type("mode terminal");
    await expect(page.locator(".blk").last()).toContainText(
      "already in terminal mode",
    );
    assertClean(errors);
  });

  test("history (↑/↓) and Tab completion; mode indicator tracks input (§3.1.3)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);

    // Tab completion: command word, then cat filename
    await page.keyboard.type("he");
    await expect(page.getByTestId("sb-mode")).toHaveText("-- INSERT --");
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("term-pecho")).toContainText("help");
    await page.keyboard.press("Enter");
    await expect(page.locator(".blk").last()).toContainText("Tab completes");

    await page.keyboard.type("cat rob");
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("term-pecho")).toContainText(
      "cat robotics.log",
    );
    await page.keyboard.press("Escape"); // clears the prompt
    await expect(page.getByTestId("sb-mode")).toHaveText("-- NORMAL --");

    // : prefix → COMMAND mode
    await page.keyboard.type(":ls");
    await expect(page.getByTestId("sb-mode")).toHaveText("-- COMMAND --");
    await page.keyboard.press("Enter");

    // history: boot cmd + help + :ls recorded
    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("term-pecho")).toContainText(":ls");
    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("term-pecho")).toContainText("help");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("term-pecho")).toContainText(":ls");
    assertClean(errors);
  });

  test("printed [data-cmd] buttons run commands (CTA → tools section)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);
    await page.locator('button.obtn[data-cmd="cat tools.txt"]').click();
    await expect(page.locator(".ln.echo .cmdtext").nth(1)).toHaveText(
      "cat tools.txt",
    );
    await expect(page.locator(".blk").last()).toContainText("Articlewriter");
    await expect(page.getByRole("button", { name: "2:agents" })).toHaveClass(
      /active/,
    );
    assertClean(errors);
  });

  test("content honesty: three entities render their site.js facts verbatim", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);
    await page.keyboard.press("2");
    const blk = page.locator(".blk").last();
    // operator (site.js stats)
    await expect(blk).toContainText("257 decision entries");
    await expect(blk).toContainText("RAN 7 DAYS");
    // scopecreep
    await expect(blk).toContainText("0 LLM calls");
    // articlewriter
    await expect(blk).toContainText("ARCHIVED");
    assertClean(errors);
  });
});
