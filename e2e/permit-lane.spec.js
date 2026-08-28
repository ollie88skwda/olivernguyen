import { test, expect } from "@playwright/test";

const CASES = [
  { theme: "light", mode: "graph", width: 1440, coarse: false },
  { theme: "dark", mode: "graph", width: 1440, coarse: false },
  { theme: "light", mode: "terminal", width: 1440, coarse: false },
  { theme: "dark", mode: "terminal", width: 1440, coarse: false },
  { theme: "light", mode: "graph", width: 375, coarse: true },
  { theme: "dark", mode: "graph", width: 375, coarse: true },
  { theme: "light", mode: "terminal", width: 375, coarse: true },
  { theme: "dark", mode: "terminal", width: 375, coarse: true },
];

const EXPECTED_HREFS = [
  "http://share.aceable.com/6z9QCp",
  "https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/instruction-permits/",
  "https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/instruction-permits/",
  "https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/dl-id-online-app-edl-44/",
  "https://www.dmv.ca.gov/portal/file/federal-non-compliant-dl-id-card-documents-list-pdf/",
  "https://www.dmv.ca.gov/portal/driver-education-and-safety/educational-materials/sample-driver-license-dl-knowledge-tests/",
];

const EXPECTED_HEADINGS = [
  "1: Driver's ed",
  "2: Other stuff",
  "3: The knowledge test",
  "4: Congrats!",
];

const EXPECTED_KICKERS = ["01", "02", "03", "04"];
const EXPECTED_ACCENT = {
  light: "rgb(168, 58, 104)",
  dark: "rgb(255, 183, 209)",
};
const EXPECTED_BORDER = {
  light: "rgb(226, 201, 212)",
  dark: "rgb(58, 36, 48)",
};

async function assertPermit(page, { theme, mode, coarse }) {
  await expect(page.locator("main.sakura.permit")).toBeVisible();
  await expect(page.getByText("California DMV · Permit Guide", { exact: true })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page.locator("html")).toHaveAttribute("data-mode", mode);

  const expectedBackground = theme === "dark" ? "rgb(24, 15, 20)" : "rgb(250, 241, 245)";
  await expect.poll(() => page.locator("main.sakura.permit").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(expectedBackground);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "How to get your permit (for high schoolers)",
  );
  const sectionHeadings = page.getByRole("heading", { level: 2 });
  await expect(sectionHeadings).toHaveCount(EXPECTED_HEADINGS.length);
  for (let i = 0; i < EXPECTED_HEADINGS.length; i += 1) {
    await expect(sectionHeadings.nth(i)).toHaveAccessibleName(EXPECTED_HEADINGS[i]);
  }
  await expect(page.locator(".pm-section > .on-section-head > .on-label")).toHaveText(EXPECTED_KICKERS);
  await expect(page.locator(".pm-section > .on-section-head > .on-label > [aria-hidden='true']")).toHaveText(EXPECTED_KICKERS);
  await expect(page.locator("ol.pm-steps")).toHaveCount(1);
  await expect(page.locator("ol.pm-steps li")).toHaveCount(23);
  const image = page.locator("img[alt='dmv permit requirements']");
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator("img:not([alt='dmv permit requirements'])")).toHaveCount(0);

  const links = page.locator(".pm-guide a");
  await expect(links).toHaveCount(EXPECTED_HREFS.length);
  const linkData = await links.evaluateAll((elements) =>
    elements.map((element) => ({
      href: element.href,
      target: element.target,
      rel: element.rel,
      visible: Boolean(element.getBoundingClientRect().width && element.getBoundingClientRect().height),
    })),
  );
  expect(linkData.map(({ href }) => href)).toEqual(EXPECTED_HREFS);
  expect(linkData.every(({ target, rel, visible }) => target === "_blank" && rel.includes("noopener") && rel.includes("noreferrer") && visible)).toBe(true);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByRole("heading", { name: "Congrats!" })).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 0));

  if (coarse) {
    await expect.poll(() => page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const sizes = await page.locator(".pm-guide .on-prose a").evaluateAll((elements) =>
      elements.map((element) => {
        const { width, height } = element.getBoundingClientRect();
        return { width, height };
      }),
    );
    expect(sizes.length).toBeGreaterThan(0);
    for (const { width, height } of sizes) {
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    }
  }

  const firstLink = links.first();
  const shotLink = page.locator(".pm-shot-link");
  const restingUnderline = await firstLink.evaluate((element) => getComputedStyle(element).textDecorationColor);
  expect(restingUnderline).toBe(EXPECTED_BORDER[theme]);
  if (!coarse) {
    const linkColor = await firstLink.evaluate((element) => getComputedStyle(element).color);
    await firstLink.hover();
    await expect
      .poll(() => firstLink.evaluate((element) => getComputedStyle(element).textDecorationColor))
      .toBe(linkColor);

    const restingBorder = await shotLink.evaluate((element) => getComputedStyle(element).borderTopColor);
    await shotLink.hover();
    await expect
      .poll(() => shotLink.evaluate((element) => getComputedStyle(element).borderTopColor))
      .toBe(EXPECTED_ACCENT[theme]);
    expect(restingBorder).not.toBe(EXPECTED_ACCENT[theme]);
  }
  await firstLink.scrollIntoViewIfNeeded();
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    if (await firstLink.evaluate((element) => document.activeElement === element)) break;
  }
  await expect(firstLink).toBeFocused();
  await expect
    .poll(() => firstLink.evaluate((element) => getComputedStyle(element).outlineStyle))
    .not.toBe("none");
  await expect(firstLink).toHaveCSS("border-radius", "3px");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(shotLink).toBeFocused();
  await expect
    .poll(() => shotLink.evaluate((element) => getComputedStyle(element).outlineStyle))
    .not.toBe("none");
  await expect(shotLink).toHaveCSS("border-radius", "0px");
}

for (const testCase of CASES) {
  const label = `${testCase.theme}-${testCase.mode}-${testCase.coarse ? "phone-coarse" : "desktop"}`;
  test(`/permit ${label}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: { width: testCase.width, height: testCase.coarse ? 812 : 900 },
      isMobile: testCase.coarse,
      hasTouch: testCase.coarse,
      colorScheme: testCase.theme,
    });
    const page = await context.newPage();
    try {
      await page.goto(`/permit?theme=${testCase.theme}&mode=${testCase.mode}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await assertPermit(page, testCase);
      await page.screenshot({ path: `/tmp/permit-${label}.png`, fullPage: true });
    } finally {
      await context.close();
    }
  });
}

test("/permit stays static and complete under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/permit?theme=dark&mode=terminal", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await assertPermit(page, { theme: "dark", mode: "terminal", coarse: false });

  await expect.poll(() => page.locator("main.sakura.permit").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await expect.poll(() => page.locator(".pm-guide a").first().evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
  await expect.poll(() => page.locator(".pm-shot-link").evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
});
