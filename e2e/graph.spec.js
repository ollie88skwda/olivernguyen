/**
 * e2e/graph.spec.js — exec-graph Gate G3 spec (plan §6).
 * Runs against the dev harness (/graph-dev.html). Asserts: every entity
 * reachable by mouse alone, pulse routing visuals, ⌘K / prompt / filter /
 * tour behavior per prototype USAGE, Esc cascade, never-trap rules, and
 * zero console errors throughout.
 */
import { test, expect } from "@playwright/test";

const HARNESS = "/graph-dev.html?still";

// entities per cluster, mirroring src/content/site.js (kept literal so the
// spec fails loudly if content changes without the crawl being rethought)
const CRAWL = {
  agents: [
    ["operator", "Voice / Operator"],
    ["day-1", "Day 1"], ["day-2", "Day 2"], ["day-3", "Day 3"], ["day-4", "Day 4"],
    ["day-5", "Day 5"], ["day-6", "Day 6"], ["day-7", "Day 7"],
    ["mac-agent", "Mac-Agent"], ["mcp-tools", "MCP Toolbelt"],
    ["scopecreep", "ScopeCreep Notary"], ["articlewriter", "Articlewriter"],
    ["agents", "Agents"],
  ],
  robotics: [
    ["techx", "TechX Robotics"], ["worlds", "Worlds Qualification"],
    ["robotics", "Robotics"],
  ],
  leadership: [
    ["virtual-enterprise", "Virtual Enterprise"], ["eagle-scout", "Eagle Scout"],
    ["leadership", "Leadership"],
  ],
  pages: [
    ["pull", "Pull"], ["permit", "Driving Permit"], ["license", "Driver’s License"],
    ["sat-resources", "SAT Resources"], ["pages", "Pages"],
  ],
  contact: [
    ["email", "Email"], ["github", "GitHub"], ["linkedin", "LinkedIn"],
    ["resume", "Resume"], ["contact", "Contact"],
  ],
};

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/**
 * Wait until the camera flight settles (world transform stable ≥250ms), the
 * same helper graph-state-lift.spec.js uses.
 *
 * R-G1 made this load-bearing here. The node cards used to carry a perpetual
 * ±2px idle drift, which kept Playwright's "element is stable" check busy
 * until roughly when the camera stopped too. BRAND.md §6 bans infinite loops
 * (D-18 ratifies exactly two, and that was a third), so the drift is gone and
 * a card is "stable" the instant it renders — including mid-flight, where a
 * click lands on empty stage because the card has moved on. Wait for the
 * camera explicitly instead of relying on a garnish to do it.
 */
const settleCamera = (page) =>
  page.waitForFunction(
    () => {
      const el = document.querySelector(".g-world");
      if (!el || !el.style.transform) return false;
      const t = el.style.transform;
      if (el.__lastT === t) return performance.now() - el.__lastAt > 250;
      el.__lastT = t;
      el.__lastAt = performance.now();
      return false;
    },
    { timeout: 10_000 },
  );

async function clickNode(page, id) {
  const card = page.locator(`[data-id="${id}"] .card`);
  await settleCamera(page);
  try {
    await card.click({ timeout: 3000 });
  } catch {
    // occluded by chrome at this zoom — mouse-only recovery: drag-pan and retry
    await page.mouse.move(700, 450);
    await page.mouse.down();
    await page.mouse.move(880, 560, { steps: 5 });
    await page.mouse.up();
    await settleCamera(page);
    await card.click({ timeout: 3000 });
  }
}

test.describe("graph mode — Gate G3", () => {
  test("every entity reachable by mouse alone (legend chips + node clicks)", async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);
    await page.goto(HARNESS);
    await page.waitForTimeout(800);

    // root from fit view
    await clickNode(page, "oliver");
    await page.waitForTimeout(700);
    await expect(page.locator(".d-title")).toHaveText("Oliver Nguyen");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);

    for (const [group, members] of Object.entries(CRAWL)) {
      await page.locator(".legend .chip", { hasText: new RegExp(`^${group}$`, "i") }).click();
      await settleCamera(page);
      for (const [id, title] of members) {
        await clickNode(page, id);
        await page.waitForTimeout(650);
        await expect(page.locator(".d-title")).toHaveText(title);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    }
    expect(errors).toEqual([]);
  });

  test("prompt-bar intent routes a visible pulse then opens the dossier", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(HARNESS);
    await page.waitForTimeout(800);

    await page.click(".p-input");
    await page.type(".p-input", "week");
    await expect(page.locator(".p-suggest .sug.sel .sl")).toHaveText("Replay the week-long loop");

    const bead = page.waitForSelector(".bead", { timeout: 3000 });
    const routing = page.waitForSelector(".edge.routing", { timeout: 3000 });
    await page.keyboard.press("Enter");
    expect(await bead).toBeTruthy();      // jade bead element present
    expect(await routing).toBeTruthy();   // .routing class fires on the path
    // arrival flash on the target card (.node wrapper is 0×0 — check attached)
    await page.waitForSelector('[data-id="operator"].arrived', { state: "attached", timeout: 5000 });
    await expect(page.locator(".d-title")).toHaveText("Voice / Operator");
    expect(errors).toEqual([]);
  });

  test("never-trap: typing j in inputs types the letter, no motion", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(HARNESS);
    await page.waitForTimeout(800);
    const t0 = await page.$eval(".g-world", (el) => el.style.transform);

    await page.click(".p-input");
    await page.keyboard.type("j");
    expect(await page.inputValue(".p-input")).toBe("j");
    await page.keyboard.press("Escape");

    await page.keyboard.press("Meta+k");
    await expect(page.locator(".pal-input")).toBeFocused();
    await page.keyboard.type("j");
    expect(await page.inputValue(".pal-input")).toBe("j");
    await page.keyboard.press("Escape");

    const t1 = await page.$eval(".g-world", (el) => el.style.transform);
    expect(t1).toBe(t0); // camera never moved
    expect(errors).toEqual([]);
  });

  test("⌘K, / filter, tour and Esc cascade behave per USAGE table", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(HARNESS);
    await page.waitForTimeout(800);

    // ⌘K → run intent
    await page.keyboard.press("Meta+k");
    await expect(page.locator(".palette.open")).toBeVisible();
    await page.type(".pal-input", "robotics");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2200);
    await expect(page.locator(".d-title")).toHaveText("Robotics");

    // dossier open + filter open → Esc cascade: filter, then dossier, then fit
    await page.keyboard.press("/");
    await page.type(".f-input", "sat");
    await expect(page.locator(".g-stage")).toHaveClass(/filtering/);
    await page.keyboard.press("Escape");
    await expect(page.locator(".g-stage")).not.toHaveClass(/filtering/);
    await expect(page.locator(".dossier")).toHaveAttribute("aria-hidden", "false");
    await page.keyboard.press("Escape");
    await expect(page.locator(".dossier")).toHaveAttribute("aria-hidden", "true");

    // filter Enter flies to top match
    await page.keyboard.press("/");
    await page.type(".f-input", "driv");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(900);
    await expect(page.locator(".d-title")).toHaveText("Driving Permit");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // tour: manual start, arrows step, Esc ends
    await page.click(".chip.tour");
    await expect(page.locator(".t-step")).toHaveText("1/8");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".t-step")).toHaveText("2/8");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".t-step")).toHaveText("1/8");
    await page.keyboard.press("Escape");
    await expect(page.locator(".tourhud")).toHaveCount(0);

    // Tab cycles nodes
    await page.keyboard.press("Tab");
    await page.waitForTimeout(600);
    await expect(page.locator(".d-title")).toHaveText("Oliver Nguyen");
    expect(errors).toEqual([]);
  });

  test("guided tour autostarts after 6s idle; input cancels autostart", async ({ page }) => {
    test.setTimeout(60_000);
    const errors = watchErrors(page);
    // no ?still — autostart is gated off in still mode
    await page.goto("/graph-dev.html");
    await page.waitForTimeout(6800);
    await expect(page.locator(".tourhud")).toBeVisible();
    await page.keyboard.press("Escape");

    // reload, interact at 3s → no autostart
    await page.goto("/graph-dev.html");
    await page.waitForTimeout(3000);
    await page.mouse.click(700, 450);
    await page.waitForTimeout(4500);
    await expect(page.locator(".tourhud")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
