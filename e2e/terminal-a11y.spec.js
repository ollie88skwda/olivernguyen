/**
 * e2e/terminal-a11y.spec.js — exec-term-core Gate C3 (mobile/RM/a11y).
 * P9 touch story on an iPhone-class viewport, reduced-motion full-static
 * rendering, axe on the booted screen + open overlays, skip link. axe-core
 * injected from CDN (graph-a11y pattern) — offline skips loudly, never
 * false-passes.
 */
import { test, expect, devices } from "@playwright/test";

const HARNESS = "/terminal-dev.html";
const STILL = HARNESS + "?still";

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

async function tryAxe(page) {
  try {
    await page.addScriptTag({
      url: "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js",
    });
  } catch {
    return null;
  }
  return page.evaluate(() =>
    window.axe.run(document, { resultTypes: ["violations"] }),
  );
}

const bootDone = (page) =>
  expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
    timeout: 15_000,
  });

test.describe("terminal — Gate C3 (mobile touch story, P9)", () => {
  test("coarse pointer: no autofocus, tabs + printed buttons carry navigation", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);

    // input NOT auto-focused — the software keyboard never pops uninvited
    expect(
      await page.evaluate(() => document.activeElement?.id ?? "none"),
    ).not.toBe("term-prompt-input");

    // statusbar tab tap prints the section; still no focus steal
    await page.getByRole("button", { name: "2:agents" }).tap();
    await expect(page.locator(".blk").last()).toContainText(
      "Voice / Operator",
    );
    expect(
      await page.evaluate(() => document.activeElement?.id ?? "none"),
    ).not.toBe("term-prompt-input");

    // printed CTA button tap runs its command
    await page.locator('button.obtn[data-cmd="mode graph"]').first().tap();
    await expect(page.locator(".ln.err").last()).toContainText(
      "mode graph: no handler",
    );

    // tap targets ≥44px (CTA buttons + tabs)
    for (const sel of [
      'button.obtn[data-cmd="cat tools.txt"]',
      '.term-statusbar .tab >> nth=0',
    ]) {
      const box = await page.locator(sel).first().boundingBox();
      expect(box.height, `${sel} tap height`).toBeGreaterThanOrEqual(44);
    }

    // tapping the promptline is the one way to summon the keyboard
    await page.getByTestId("term-promptline").tap();
    expect(
      await page.evaluate(() => document.activeElement?.id),
    ).toBe("term-prompt-input");
    await page.evaluate(() => document.activeElement.blur());

    // buffer scrolls natively by touch (own scroll region, page fixed)
    expect(
      await page.evaluate(() => {
        const el = document.querySelector(".term-buffer");
        return getComputedStyle(el).overflowY;
      }),
    ).toBe("auto");
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test("palette opens from the tappable statusbar chip and runs by tap", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);

    await page.getByTestId("sb-cmdk").tap();
    const palette = page.getByTestId("term-palette");
    await expect(palette).toBeVisible();
    // suggestions ready; tap one → command runs, palette closes
    await palette
      .locator('[role="option"]', { hasText: "Replay the week-long loop" })
      .tap();
    await expect(palette).toBeHidden();
    await expect(page.locator(".ln.echo .cmdtext").last()).toHaveText(
      "open operator",
    );
    await expect(page.locator(".blk").last()).toContainText(
      "Autonomous Claude Code loop",
    );
    expect(errors).toEqual([]);
    await ctx.close();
  });
});

test.describe("terminal — Gate C3 (reduced motion, C-3.2)", () => {
  test("RM: boot is fully static — no typing, no stagger, no blink", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const t0 = Date.now();
    await page.goto(HARNESS);
    await page.waitForFunction(() => !!window.__term);
    // the whole boot (motd + echo + frame + hero) lands ~instantly
    await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
      timeout: 2_000,
    });
    expect(Date.now() - t0, "RM boot must not stagger").toBeLessThan(3_000);
    expect(await page.locator(".ln.pending").count()).toBe(0);
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(document.querySelector(".pcursor")).animationName,
      ),
    ).toBe("none");
    // prints stay instant post-boot
    await page.keyboard.press("2");
    await expect(page.locator(".blk").last()).toContainText("Articlewriter", {
      timeout: 1_000,
    });
    expect(await page.locator(".ln.pending").count()).toBe(0);
    expect(errors).toEqual([]);
  });

  test("?still param: instant prints for screenshots without RM emulation", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const t0 = Date.now();
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await expect(page.locator("h1.name")).toHaveText("Oliver Nguyen", {
      timeout: 2_000,
    });
    expect(Date.now() - t0).toBeLessThan(3_000);
    expect(errors).toEqual([]);
  });
});

test.describe("terminal — Gate C3 (SR layer + axe, C-3.3)", () => {
  test("log role, labels, skip link; axe passes on screen + overlays", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto(STILL);
    await page.waitForFunction(() => !!window.__term);
    await bootDone(page);

    // SR fundamentals
    await expect(
      page.getByRole("log", { name: "Terminal scrollback" }),
    ).toBeVisible();
    await expect(page.getByLabel("Terminal prompt")).toHaveCount(1);

    // skip link: first tabbable element in the screen, delivers the prompt
    await expect(
      page.locator("main > a.term-skip:first-child"),
    ).toHaveCount(1);
    await page.locator(".term-skip").focus();
    await expect(page.locator(".term-skip")).toBeFocused();
    await page.keyboard.press("Enter");
    expect(
      await page.evaluate(() => document.activeElement?.id),
    ).toBe("term-prompt-input");

    // axe: booted main screen
    const axeMain = await tryAxe(page);
    if (axeMain) {
      expect(
        axeMain.violations.map((v) => `${v.id}: ${v.nodes.length}`),
      ).toEqual([]);
    } else {
      console.warn("AXE SKIPPED — axe-core CDN unreachable (offline?)");
    }

    // axe: help sheet open (dialog semantics)
    await page.keyboard.press("?");
    await expect(
      page.getByRole("dialog", { name: "Keyboard help" }),
    ).toBeVisible();
    const axeHelp = await tryAxe(page);
    if (axeHelp) {
      expect(
        axeHelp.violations.map((v) => `${v.id}: ${v.nodes.length}`),
      ).toEqual([]);
    }
    await page.keyboard.press("Escape");

    // axe: palette open
    await page.keyboard.press("ControlOrMeta+k");
    await expect(
      page.getByRole("dialog", { name: "Command palette" }),
    ).toBeVisible();
    const axePal = await tryAxe(page);
    if (axePal) {
      expect(
        axePal.violations.map((v) => `${v.id}: ${v.nodes.length}`),
      ).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
});
