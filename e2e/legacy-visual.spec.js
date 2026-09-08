// Gate 1 (plan §6): legacy page BODIES must be pixel-identical before/after the
// chrome swap. Chrome itself (top bar, sidebar, grain, scroll pill — old AND
// new) is hidden in every run, so the diff isolates exactly what must not
// change: the page body under it. Baselines were captured on the old chrome
// (commit 4531b14a state); the spec re-passes after I-1.5 replaces the chrome.
//
// Refresh baselines (only when a legacy-page change is INTENDED):
//   npx playwright test e2e/legacy-visual.spec.js --update-snapshots
import { test, expect } from "@playwright/test";

const HIDE_CHROME_CSS = `
  /* old chrome */
  .grain, .top-bar, .sidebar, .scroll-station,
  /* new chrome (I-1.5+) */
  .site-chrome { display: none !important; }
`;

const PAGES = ["/pull", "/permit", "/college"];

for (const route of PAGES) {
  test(`legacy body frozen: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: HIDE_CHROME_CSS });
    // Let framer-motion entrances and font loading settle.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot(`legacy${route.replace(/\//g, "-")}.png`, {
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    });
  });
}
