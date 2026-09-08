// Geometric layout audit for /college — positions, alignment, overflow.
import { test, expect } from "@playwright/test";

for (const [width, label] of [[1440, "desktop"], [375, "phone"]]) {
  test(`layout audit ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/college?theme=light", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    const m = await page.evaluate(() => {
      const r = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height };
      };
      return {
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        eyebrow: r(".cl-eyebrow"),
        title: r(".cl-title"),
        rule: r(".cl-rule"),
        lede: r(".cl-lede"),
        cards: r(".cl-cards"),
        tools: [...document.querySelectorAll("a.cl-tool")].map((el) => {
          const b = el.getBoundingClientRect();
          const foot = el.querySelector(".on-card-footer")?.getBoundingClientRect();
          const badge = el.querySelector(".on-badge")?.getBoundingClientRect();
          const head = el.querySelector(".on-card-header")?.getBoundingClientRect();
          return {
            top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height,
            footTop: foot?.top, footBottom: foot?.bottom,
            badgeRight: badge?.right, headRight: head?.right, headTop: head?.top,
          };
        }),
      };
    });

    // no horizontal overflow at either width
    expect(m.scrollW).toBeLessThanOrEqual(m.innerW + 1);

    // the fixed chrome bar is 64px; content must clear it with air
    expect(m.eyebrow.top).toBeGreaterThanOrEqual(96);

    // vertical order: eyebrow < title < rule < lede < cards
    expect(m.eyebrow.bottom).toBeLessThan(m.title.top);
    expect(m.title.bottom).toBeLessThan(m.rule.top);
    expect(m.rule.bottom).toBeLessThan(m.lede.top);
    expect(m.lede.bottom).toBeLessThan(m.cards.top);

    // §9 hairline: 1px tall, spans the content column
    expect(m.rule.height).toBe(1);
    const ledeWidth = m.lede.right - m.lede.left;
    expect(m.rule.width).toBeGreaterThan(ledeWidth * 0.98);

    // cards row
    expect(m.tools).toHaveLength(3);
    if (width >= 768) {
      // three equal cards side by side, same top and bottom (equal heights)
      const tops = new Set(m.tools.map((t) => Math.round(t.top)));
      const bottoms = new Set(m.tools.map((t) => Math.round(t.bottom)));
      expect(tops.size).toBe(1);
      expect(bottoms.size).toBe(1);
      // footers pinned to the same baseline (all three cards equal height)
      const footTops = new Set(m.tools.map((t) => Math.round(t.footTop)));
      expect(footTops.size).toBe(1);
      // badge inside the header, right-aligned to the card edge
      for (const t of m.tools) {
        expect(t.badgeRight).toBeLessThanOrEqual(t.right - 20); // within padding
        expect(t.badgeRight).toBeGreaterThan(t.left + 100); // on the right side
      }
    } else {
      // stacked, full width
      for (let i = 0; i < 3; i++) {
        expect(m.tools[i].width).toBeGreaterThan(300);
        if (i > 0) expect(m.tools[i].top).toBeGreaterThan(m.tools[i - 1].bottom);
      }
    }

    // usable target: every card taller than the 44px floor
    for (const t of m.tools) {
      expect(t.height).toBeGreaterThanOrEqual(44);
      expect(t.width).toBeGreaterThanOrEqual(44);
    }
  });
}
