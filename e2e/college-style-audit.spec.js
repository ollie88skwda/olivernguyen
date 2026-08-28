// Programmatic style audit for the /college lane: every computed value must
// resolve to the sakura token ladder, in BOTH themes, at desktop AND phone.
import { test, expect } from "@playwright/test";

const LADDER = {
  light: {
    bg: "rgb(250, 241, 245)",
    surface: "rgb(253, 248, 250)",
    border: "rgb(226, 201, 212)",
    text: "rgb(58, 30, 43)",
    textMuted: "rgb(111, 68, 89)",
    textFaint: "rgb(132, 83, 106)",
    accent: "rgb(168, 58, 104)",
  },
  dark: {
    bg: "rgb(24, 15, 20)",
    surface: "rgb(31, 19, 25)",
    border: "rgb(58, 36, 48)",
    text: "rgb(245, 220, 230)",
    textMuted: "rgb(216, 136, 168)",
    textFaint: "rgb(176, 120, 143)",
    accent: "rgb(255, 183, 209)",
  },
};

for (const theme of ["light", "dark"]) {
  for (const [width, label] of [[1440, "desktop"], [375, "phone"]]) {
    test(`style audit ${theme} ${label}`, async ({ page }) => {
      const T = LADDER[theme];
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/college?theme=${theme}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);

      const audit = await page.evaluate(() => {
        const cs = (sel, prop) => {
          const el = document.querySelector(sel);
          if (!el) return `MISSING:${sel}`;
          return getComputedStyle(el)[prop];
        };
        return {
          pageBg: cs("main.cl-page", "backgroundColor"),
          pageMinH: cs("main.cl-page", "minHeight"),
          innerMaxW: cs(".cl-inner", "maxWidth"),
          eyebrowFont: cs(".cl-eyebrow", "fontFamily"),
          eyebrowSize: cs(".cl-eyebrow", "fontSize"),
          eyebrowTransform: cs(".cl-eyebrow", "textTransform"),
          eyebrowTrack: cs(".cl-eyebrow", "letterSpacing"),
          titleFont: cs(".cl-title", "fontFamily"),
          titleWeight: cs(".cl-title", "fontWeight"),
          titleSize: cs(".cl-title", "fontSize"),
          ruleH: cs(".cl-rule", "height"),
          ruleBg: cs(".cl-rule", "backgroundColor"),
          ledeSize: cs(".cl-lede", "fontSize"),
          ledeLh: cs(".cl-lede", "lineHeight"),
          ledeColor: cs(".cl-lede", "color"),
          ledeMaxW: cs(".cl-lede", "maxWidth"),
          cardBg: cs(".cl-tool .on-card", "backgroundColor"),
          cardRadius: cs(".cl-tool .on-card", "borderRadius"),
          cardBorder: cs(".cl-tool .on-card", "borderTopWidth"),
          cardPad: cs(".cl-tool .on-card", "padding"),
          cardTitleSize: cs(".on-card-title", "fontSize"),
          badgeRadius: cs(".on-badge", "borderRadius"),
          badgeFont: cs(".on-badge", "fontFamily"),
          routeFont: cs(".cl-tool-card .on-label", "fontFamily"),
          routeColor: cs(".cl-tool-card .on-label", "color"),
          gridCols: cs(".cl-cards", "gridTemplateColumns"),
          gridGap: cs(".cl-cards", "gap"),
        };
      });

      // --- shell / surfaces ---
      expect(audit.pageBg).toBe(T.bg);
      // 100dvh computes to the viewport height in px
      expect(audit.pageMinH).toBe("900px");
      expect(audit.cardBg).toBe(T.surface);
      expect(audit.cardRadius).toBe("0px");
      expect(audit.cardBorder).toBe("1px");
      // §5: card padding 28 desktop / 20 phone
      const wantPad = width >= 768 ? "28px" : "20px";
      expect(audit.cardPad.split(" ")[0]).toBe(wantPad);

      // --- type roles (§7) ---
      expect(audit.eyebrowFont).toContain("Martian Mono");
      expect(audit.eyebrowSize).toBe("11px");
      expect(audit.eyebrowTransform).toBe("uppercase");
      expect(audit.eyebrowTrack).toBe("1.32px"); // 11px * 0.12em (§7)
      expect(audit.titleFont).toContain("Familjen Grotesk");
      expect(audit.titleWeight).toBe("700");
      expect(audit.cardTitleSize).toBe("24px"); // --fs-title (D-12)
      expect(audit.ledeSize).toBe("16px");
      expect(audit.ledeLh).toBe("25.6px"); // 16px * 1.6
      expect(audit.ledeColor).toBe(T.textMuted);
      expect(audit.routeFont).toContain("Martian Mono");
      expect(audit.routeColor).toBe(T.textFaint);
      expect(audit.badgeFont).toContain("Martian Mono");
      expect(audit.badgeRadius).toBe("3px"); // §4 controls

      // --- §9 hairline separator ---
      expect(audit.ruleH).toBe("1px");
      expect(audit.ruleBg).toBe(T.border);

      // --- §5 ladder spacing ---
      expect(audit.gridGap).toBe("24px"); // row gap inside a group
      const wantCols =
        width >= 768
          ? /^[\d.]+px [\d.]+px [\d.]+px$/ // 3 equal columns
          : /^[\d.]+px$/; // single column at 375 - 2*16
      expect(audit.gridCols).toMatch(wantCols);
      expect(audit.innerMaxW).toBe("880px"); // §5 content column cap

      // --- hover + focus states ---
      const first = page.locator("a.cl-tool").first();
      await first.hover();
      await expect(first.locator(".on-card")).toHaveCSS("border-top-color", T.accent);
      await first.focus();
      await expect(first).toHaveCSS("outline-style", "solid");
      // --focus-ring = --accent-hi, ladder-dependent
      const accentHi = theme === "light" ? "rgb(147, 39, 90)" : "rgb(255, 111, 176)";
      await expect(first).toHaveCSS("outline-color", accentHi);
    });
  }
}
