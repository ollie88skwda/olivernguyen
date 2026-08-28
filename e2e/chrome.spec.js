// Chrome gate (plan R-C4) — the brand rules the rebuilt bar has to keep.
//
// Deliberately does NOT re-test what e2e/mode.spec.js already covers (the mode
// toggle flipping data-mode, the pages menu content, NO_CHROME opt-out). What
// is here is the set of things R-C3 changed and a screenshot cannot catch:
// §4's radius split, the theme axis, and the reduced-motion fallback.
import { test, expect } from "@playwright/test";
import { decodePng, sharpness } from "./lib/png-sharpness.mjs";

const COMBOS = [
  { mode: "terminal", theme: "dark" },
  { mode: "graph", theme: "light" },
  { mode: "terminal", theme: "light" },
  { mode: "graph", theme: "dark" },
];

const THEME_COLOR = { light: "#faf1f5", dark: "#180f14" };

test.describe("site chrome — R-C4", () => {
  test("§10 wordmark: oN.c with the dot in --accent", async ({ page }) => {
    await page.goto("/?mode=graph&theme=light");
    // Scoped to the bar: R-G3 put a second <Wordmark> in the graph's list layer,
    // which is the point of D-25 — the mark is a library piece now, so more
    // than one surface is allowed to render it.
    const mark = page.locator('.site-chrome-bar [data-slot="wordmark"]');
    await expect(mark).toHaveText("oN.c");

    const dot = mark.locator(".on-wordmark-dot");
    const dotColor = await dot.evaluate((el) => getComputedStyle(el).color);
    expect(dotColor).toBe("rgb(168, 58, 104)");

    // …and it must NOT be the same colour as the letters, or the mark is three
    // letters and §10's whole idea is gone.
    const letters = await mark.evaluate((el) => getComputedStyle(el).color);
    expect(letters).not.toBe(dotColor);
  });

  test("§4 radius: the mode toggle is the round one, the theme control is not", async ({
    page,
  }) => {
    await page.goto("/?mode=graph&theme=light");
    const toggle = page.locator('[data-slot="mode-toggle"]');
    await expect(toggle).toHaveCSS("border-radius", "999px");

    // Appearance is account-ready and uses the ordinary control radius.
    const accountBtn = page.getByRole("button", { name: "Open account menu" });
    await expect(accountBtn).toHaveCSS("border-radius", "3px");
    await accountBtn.click();
    await expect(page.getByRole("menuitemradio", { name: "Light" })).toBeVisible();
    await expect(page.getByRole("menuitemradio", { name: "Dark" })).toBeVisible();
    await page.keyboard.press("Escape");

    // D-29: the pages-menu trigger is ☰ drawn as an ICON, not `…` as a Glyph.
    // U+2630 is absent from JetBrains Mono — measured, it renders from a system
    // fallback face — so as a <Glyph> it is a per-platform lottery. Assert the
    // §8 icon contract (lucide, 1.5 stroke, 18px grid) and that no glyph is
    // left in the trigger, which is what regressing to `…` would put back.
    const menuBtn = page.getByRole("button", { name: "Open pages menu" });
    const menuIcon = menuBtn.locator('[data-slot="icon"][data-icon="menu"]');
    await expect(menuIcon).toHaveCount(1);
    await expect(menuIcon).toHaveAttribute("stroke-width", "1.5");
    await expect(menuIcon).toHaveAttribute("width", "18");
    await expect(menuBtn.locator('[data-slot="glyph"]')).toHaveCount(0);
  });

  for (const { mode, theme } of COMBOS) {
    test(`theme-color follows the ladder, not the mode: ${mode} · ${theme}`, async ({
      page,
    }) => {
      await page.goto(`/?mode=${mode}&theme=${theme}`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
      const content = await page
        .locator('meta[name="theme-color"]')
        .getAttribute("content");
      expect(content).toBe(THEME_COLOR[theme]);
    });
  }

  test("the theme control round-trips and leaves the mode alone", async ({ page }) => {
    await page.goto("/?mode=terminal&theme=dark");
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
    expect(
      await page.locator('meta[name="theme-color"]').getAttribute("content"),
    ).toBe(THEME_COLOR.light);

    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "terminal");
  });

  test("theme choice persists in a fresh browser context", async ({ page, browser }) => {
    await page.goto("/?mode=graph&theme=light");
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();

    const freshContext = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      colorScheme: "light",
      storageState: await page.context().storageState(),
    });
    try {
      const freshPage = await freshContext.newPage();
      await freshPage.goto("/");
      await expect(freshPage.locator("html")).toHaveAttribute("data-theme", "dark");
      await freshPage.getByRole("button", { name: "Open account menu" }).click();
      await expect(freshPage.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    } finally {
      await freshContext.close();
    }
  });

  test("graph menus retain keyboard ownership", async ({ page }) => {
    await page.goto("/?mode=graph&theme=light&still");
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitemradio", { name: "Light" })).toBeFocused();
    expect(await page.locator(".node.active").count()).toBe(0);
    await page.keyboard.press("Escape");
  });

  test("current OS theme becomes persistent after selection", async ({ browser }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL;
    const osContext = await browser.newContext({
      baseURL,
      colorScheme: "dark",
    });
    try {
      const osPage = await osContext.newPage();
      await osPage.goto("/?mode=graph");
      await expect(osPage.locator("html")).toHaveAttribute("data-theme", "dark");
      await osPage.getByRole("button", { name: "Open account menu" }).click();
      await osPage.getByRole("menuitemradio", { name: "Dark" }).click();
      expect(await osPage.evaluate(() => localStorage.getItem("on.theme"))).toBe("dark");

      const freshContext = await browser.newContext({
        baseURL,
        colorScheme: "light",
        storageState: await osContext.storageState(),
      });
      try {
        const freshPage = await freshContext.newPage();
        await freshPage.goto("/");
        await expect(freshPage.locator("html")).toHaveAttribute("data-theme", "dark");
      } finally {
        await freshContext.close();
      }
    } finally {
      await osContext.close();
    }
  });

  test("coarse pointer menu items meet the touch target", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      colorScheme: "light",
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const page = await context.newPage();
      await page.goto("/?mode=graph&theme=light");
      await page.getByRole("button", { name: "Open account menu" }).click();
      const lightBox = await page.getByRole("menuitemradio", { name: "Light" }).boundingBox();
      expect(lightBox.height).toBeGreaterThanOrEqual(44);
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Open pages menu" }).click();
      const homeBox = await page.getByRole("menuitem", { name: "Home" }).boundingBox();
      expect(homeBox.height).toBeGreaterThanOrEqual(44);
    } finally {
      await context.close();
    }
  });

  test("menus retain keyboard focus in terminal mode", async ({ page }) => {
    await page.goto("/?mode=terminal&theme=light&still");
    await expect(page.locator("h1.name")).toBeVisible();
    await page.keyboard.press("Control+g");

    await page.getByRole("button", { name: "Open account menu" }).click();
    const light = page.getByRole("menuitemradio", { name: "Light" });
    const dark = page.getByRole("menuitemradio", { name: "Dark" });
    await page.keyboard.press("ArrowDown");
    await expect(light).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(dark).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("sb-prefix")).toHaveCount(0);
    const prompt = page.locator("#term-prompt-input");
    await prompt.fill("j");
    await prompt.press("Enter");
    await expect(page.locator(".ln.echo .cmdtext").last()).toHaveText("j");

    await page.getByRole("button", { name: "Open pages menu" }).click();
    const home = page.getByRole("menuitem", { name: "Home" });
    const pull = page.getByRole("menuitem", { name: "PULL" });
    await page.keyboard.press("ArrowDown");
    await expect(home).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(pull).toBeFocused();
  });

  test("escape and overlays clear terminal chord state", async ({ page }) => {
    await page.goto("/?mode=terminal&theme=light&still");
    await expect(page.locator("h1.name")).toBeVisible();
    const prompt = page.locator("#term-prompt-input");
    const mode = page.getByTestId("sb-mode");

    await prompt.focus();
    await page.keyboard.type("g");
    await expect(mode).toHaveText("g‥");
    await page.keyboard.press("Escape");
    await expect(mode).toHaveText("-- NORMAL --");
    await page.keyboard.type("g");
    await expect(mode).toHaveText("g‥");
    await page.keyboard.press("Escape");

    await page.keyboard.press("Control+g");
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("term-palette")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("sb-prefix")).toHaveCount(0);

    await prompt.focus();
    await page.keyboard.type("g");
    await expect(mode).toHaveText("g‥");
    await page.getByRole("button", { name: "Open account menu" }).click();
    await expect(mode).toHaveText("-- NORMAL --");
    await page.keyboard.press("Escape");
  });

  test("terminal prompt regains focus after pane controls", async ({ page }) => {
    await page.goto("/?mode=terminal&theme=light&still");
    await expect(page.locator("h1.name")).toBeVisible();
    const prompt = page.locator("#term-prompt-input");
    await page.getByRole("button", { name: "split pane right (main)" }).click();
    await expect(prompt).toBeFocused();
  });

  test("terminal cd requests a linked public asset", async ({ page }) => {
    await page.goto("/?mode=terminal&theme=light&still");
    await expect(page.locator("h1.name")).toBeVisible();
    const pdfResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/resume.pdf",
    );
    const prompt = page.locator("#term-prompt-input");
    await prompt.fill("cd resume.pdf");
    await prompt.press("Enter");
    await expect(page.locator(".ln.echo .cmdtext").last()).toHaveText("cd resume.pdf");
    expect((await pdfResponse).status()).toBe(200);
  });

  // D-30 rides along here because this test already crosses the exact boundary
  // the blur is scoped to: graph home -> terminal, on the same page instance.
  // Folded in rather than added so the file's count stays 9 (as D-29 did).
  test("nav and the §9 blur are both graph-home-only; the terminal has neither", async ({
    page,
  }) => {
    const barStyle = () =>
      page
        .locator(".site-chrome-bar")
        .evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            filter: s.backdropFilter || s.webkitBackdropFilter,
            bg: s.backgroundColor,
            height: s.height,
          };
        });

    await page.goto("/?mode=graph&theme=light");
    await expect(page.locator(".graph-root")).toBeVisible();
    await expect(page.locator(".sc-nav").getByRole("link")).toHaveCount(3);

    // D-32: the veil above is only affordable because NOTHING muted and
    // nothing in --accent-hi sits directly on it. The bar's labels are --text,
    // and nav hover is an underline rather than a colour swap. Both of these
    // are load-bearing for contrast, not decoration — --accent-hi on this veil
    // measured 4.06–4.47:1 in graph · dark, which fails §2.3.
    const navLabel = page.locator(".sc-nav-link .on-label").first();
    const labelColor = await navLabel.evaluate((el) => getComputedStyle(el).color);
    expect(labelColor).toBe("rgb(58, 30, 43)");

    const link = page.locator(".sc-nav-link").first();
    await link.hover();
    await page.waitForTimeout(300); // §6's 140ms fade on the underline colour
    const hovered = await navLabel.evaluate((el) => {
      const s = getComputedStyle(el);
      return { color: s.color, line: s.textDecorationLine, dc: s.textDecorationColor };
    });
    // colour must NOT move on hover, and the underline must be the signal
    expect(hovered.color).toBe("rgb(58, 30, 43)");
    expect(hovered.line).toContain("underline");
    expect(hovered.dc).toBe("rgb(58, 30, 43)");

    const graph = await barStyle();
    // §9 permits exactly one blurred surface and this is it (D-30).
    expect(graph.filter).toBe("blur(8px)");
    // 50% is a MEASURED §2.3 floor (D-32), not a taste value: over 60 canvas
    // states the worst composite gives --text 5.29:1 in graph · dark and
    // 6.82:1 in graph · light. 40% fails.
    expect(graph.bg).toMatch(/0\.5\b/);
    // D-28: the camera and --graph-chrome-inset are keyed off the bar HEIGHT.
    // Changing the background must never move it.
    expect(graph.height).toBe("64px");

    await page.getByRole("button", { name: "TERM" }).click();
    await expect(page.locator(".sc-nav")).toHaveCount(0);

    const terminal = await barStyle();
    // the terminal screen is 100dvh and never scrolls, so the blur measured
    // 2/255 there — invisible, and an invisible effect still costs a layer
    expect(terminal.filter).toBe("none");
    expect(terminal.bg).toBe("rgb(250, 241, 245)");
    expect(terminal.height).toBe("64px");

    // Legacy routes carry data-mode="graph" too, so the scope leans on
    // :has(.graph-root). Without it the bar would blur over the navy legacy
    // palette, which is the two-palette mud §9 exists to stop.
    await page.goto("/permit?mode=graph");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "graph");
    expect(await page.locator(".graph-root").count()).toBe(0);
    const legacy = await barStyle();
    expect(legacy.filter).toBe("none");
    expect(legacy.height).toBe("64px");

    // ---- and it costs the canvas nothing (D-30) -------------------------
    // D-29 rejected the blur partly because it supposedly re-rasterised the
    // whole graph canvas soft. It does not; that was the 6s guided-tour
    // autostart moving the camera between the two frames. `?still` disables
    // BOTH the tour and the shimmer, which is the only way to compare two
    // frames of this canvas at all. Anything below the bar must be identical
    // with the blur on and with it suppressed.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?mode=graph&theme=light&still", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    const clip = { x: 0, y: 64, width: 1440, height: 700 };
    const withBlur = await page.screenshot({ clip });
    await page.addStyleTag({
      content: `.site-chrome-bar{background:var(--bg)!important;
        -webkit-backdrop-filter:none!important;backdrop-filter:none!important;}`,
    });
    await page.waitForTimeout(800);
    const withoutBlur = await page.screenshot({ clip });

    const A = decodePng(withBlur);
    const B = decodePng(withoutBlur);
    let differing = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      if (
        A.data[i] !== B.data[i] ||
        A.data[i + 1] !== B.data[i + 1] ||
        A.data[i + 2] !== B.data[i + 2]
      )
        differing++;
    }
    const total = A.width * A.height;
    expect(
      differing / total,
      `${differing}/${total} canvas pixels changed when the bar blur was switched off`,
    ).toBeLessThan(0.0005);
    // and the same said as "still sharp", which is the claim D-30 disproved
    expect(sharpness(A) / sharpness(B)).toBeGreaterThan(0.98);
  });

  // §6: every animated element needs a static fallback carrying the same DOM
  // content. The bar's slide, the toggle thumb and the icon crossfade are all
  // transitions, so under reduce they must resolve instantly and the control
  // state must still be readable — which is why it is on aria-pressed, not on
  // the thumb position alone.
  test.describe("reduced motion", () => {
    test("no transitions, and state is still carried by the DOM", async ({ page }) => {
      // emulateMedia(), not test.use({ reducedMotion }) — the latter reports
      // matchMedia() false under this config's Desktop Chrome device, so the
      // assertion below would pass for the wrong reason.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/?mode=graph&theme=light");
      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      ).toBe(true);

      for (const sel of ['[data-slot="mode-toggle"] .on-mode-thumb', ".site-chrome-bar"]) {
        const dur = await page
          .locator(sel)
          .evaluate((el) => getComputedStyle(el).transitionDuration);
        expect(dur, sel).toBe("0s");
      }

      await expect(page.getByRole("button", { name: "GRAPH" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.getByRole("button", { name: "TERM" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
  });
});
