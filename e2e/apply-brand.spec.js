// Brand-contract verification for the /apply restyle (fm/restyle-apply lane).
// Computed-style checks that the tokens actually landed: faces, radii, sizes,
// no shadows, no legacy colour leaks, focus ring, mono for dates/numbers.
// Mock contract identical to apply-restyle.spec.js.
import { test, expect } from "@playwright/test";
import { createSeed } from "../src/pages/apply/seed.js";

const ROW = {
  doc: createSeed(),
  updated_at: "2026-08-20T12:00:00.000Z",
};

async function mockBackend(page) {
  await page.route("**/api/auth/session", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );
  await page.route("**/api/decision/save**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );
  await page.route("**/rest/v1/apply_decision**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ROW) })
  );
  await page.routeWebSocket("**/realtime/v1/websocket**", (ws) => ws.close());
}

test("no legacy colour or shadow leaks into the page", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");
  await page.waitForSelector(".ap-board tbody tr");

  // the page background comes from the sakura ladder
  const bg = await page.locator("main.ap-page").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(250, 241, 245)"); // light --bg #faf1f5

  // nothing on the page may cast a shadow (§9)
  const shadows = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("main.ap-page *")) {
      const s = getComputedStyle(el).boxShadow;
      if (s && s !== "none") out.push(`${el.className || el.tagName}: ${s}`);
    }
    return out.slice(0, 10);
  });
  expect(shadows).toEqual([]);

  // no legacy navy/gold hexes anywhere in the tree
  const legacy = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("main.ap-page *")) {
      const cs = getComputedStyle(el);
      for (const prop of ["color", "backgroundColor", "borderColor", "borderTopColor", "borderLeftColor", "fill", "stroke"]) {
        const v = cs[prop];
        if (v && (v === "rgb(9, 36, 65)" || v === "rgb(18, 34, 49)" || v === "rgb(241, 233, 212)" || v === "rgb(212, 175, 55)")) {
          out.push(`${el.className || el.tagName} ${prop}: ${v}`);
        }
      }
    }
    return out.slice(0, 10);
  });
  expect(legacy).toEqual([]);
});

test("type roles and radii map to brand tokens", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");
  await page.waitForSelector(".ap-board tbody tr");

  const font = (sel) =>
    page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontFamily);

  // hero + section titles: Familjen Grotesk (display)
  expect(await font(".ap-hero-title")).toContain("Familjen Grotesk");
  expect(await font(".on-section-title")).toContain("Familjen Grotesk");
  // body copy: Hanken Grotesk
  expect(await font(".on-prose")).toContain("Hanken Grotesk");
  // labels/kickers: Martian Mono
  expect(await font(".on-label")).toContain("Martian Mono");
  // dates + numbers: JetBrains Mono
  expect(await font(".ap-clock-v")).toContain("JetBrains Mono");
  expect(await font(".ap-dial-v")).toContain("Familjen Grotesk"); // the dial figure is display type
  expect(await font(".ap-total")).toContain("JetBrains Mono");

  // surfaces square, controls 3px
  const cardRadius = await page.locator(".ap-rho").first().evaluate((el) => getComputedStyle(el).borderRadius);
  expect(cardRadius).toBe("0px");
  const btnRadius = await page.locator(".on-btn").first().evaluate((el) => getComputedStyle(el).borderRadius);
  expect(btnRadius).toBe("3px");
  const inputRadius = await page.locator(".on-field").first().evaluate((el) => getComputedStyle(el).borderRadius);
  expect(inputRadius).toBe("3px");
  // pills are the only 999px things: enter edit mode to render the save stamp
  await page.getByRole("button", { name: "EDIT", exact: true }).click();
  const pill = page.locator("[data-slot='status-pill']");
  const pillRadius = await pill.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(pillRadius).toBe("999px");
});

test("focus ring appears on controls and tooltip bubbles carry no shadow", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=dark");
  await page.waitForSelector(".ap-board tbody tr");

  const btn = page.getByRole("button", { name: "EDIT", exact: true });
  await btn.focus();
  const outline = await btn.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");

  // glossary bubble: restyled surface, hairline, 3px, no shadow (§9)
  const tip = page.locator(".tt").first();
  await tip.hover();
  const bub = page.locator(".tt .bub").first();
  await bub.waitFor({ state: "visible" });
  const shadow = await bub.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).toBe("none");
  const radius = await bub.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(radius).toBe("3px");
});

test("edit controls reach 40px on a fine pointer and board cells 32px", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/apply?theme=light");
  await page.waitForSelector(".ap-board tbody tr");

  const edit = page.getByRole("button", { name: "EDIT", exact: true });
  expect(await edit.evaluate((el) => el.getBoundingClientRect().height)).toBe(40);
  const cell = page.locator(".ap-cellbtn").first();
  expect(await cell.evaluate((el) => el.getBoundingClientRect().height)).toBe(32);
});
