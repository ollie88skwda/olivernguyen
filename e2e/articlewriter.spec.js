// /articlewriter — gate spec for the restyled article generator (legacy
// restyle lane /articlewriter). The generator lives on 127.0.0.1:8000 and is
// never running in the harness, so the POST is stubbed at the network level:
// that lets every state the lane must prove — empty, loading, success, error,
// copy — be exercised for real in the browser.
import { test, expect, devices } from "@playwright/test";

const GENERATOR_URL = "**/generate-article";

// A 375px, coarse-pointer phone profile (not just a narrow desktop window):
// §1's 44px tap target and the phone section gaps only exist under
// `(pointer: coarse)` / the 767px breakpoint, so they must be asserted with
// a real touch device emulation.
const PHONE = {
  viewport: { width: 375, height: 700 },
  isMobile: true,
  hasTouch: true,
  userAgent: devices["iPhone 13"].userAgent,
  colorScheme: "dark", // the other ladder — every state is checked in one theme
};

const SAMPLE_ARTICLE = `
  <h1>The Wing It Journal</h1>
  <p>A calm, curious guide to <strong>starting projects</strong> without a plan.</p>
  <h2>Why winging it works</h2>
  <ul>
    <li>Plans are guesses about the future.</li>
    <li>Curiosity outlasts motivation.</li>
  </ul>
  <p>Read more at <a href="https://example.com">example.com</a>.</p>
`;

test("empty state: form renders, no output yet", async ({ page }) => {
  await page.goto("/articlewriter", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Generate an Article", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Product name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate Article" })).toBeVisible();
  await expect(page.getByText("Generated Article")).toHaveCount(0);
});

test("loading and success states: stubbed generator returns an article, copy works", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route(GENERATOR_URL, async (route) => {
    await new Promise((r) => setTimeout(r, 300)); // keep the loading state visible
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ html_content: SAMPLE_ARTICLE }),
    });
  });
  await page.goto("/articlewriter", { waitUntil: "networkidle" });

  await page.getByLabel("Product name").fill("Wing It Journal");
  await page.getByRole("button", { name: "Generate Article" }).click();

  // Loading: explicit text + skeleton region, button disabled while busy.
  await expect(page.getByText("Generating article…")).toBeVisible();
  await expect(page.locator("[role='status'][aria-busy='true']")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate Article" })).toBeDisabled();

  // Success: the returned HTML is rendered on the page.
  await expect(page.getByRole("heading", { name: "Generated Article", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Wing It Journal" })).toBeVisible();
  await expect(page.getByText("Why winging it works")).toBeVisible();
  await expect(page.getByRole("link", { name: "example.com" })).toHaveAttribute("href", "https://example.com");

  // Copy: writes the raw HTML to the clipboard, confirms with an alert.
  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Article copied to clipboard!");
    dialog.accept();
  });
  await page.getByRole("button", { name: "Copy to Clipboard" }).click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain("<h1>The Wing It Journal</h1>");
});

test("failure state: generator unreachable shows the alert", async ({ page }) => {
  await page.route(GENERATOR_URL, (route) => route.abort("connectionrefused"));
  await page.goto("/articlewriter", { waitUntil: "networkidle" });

  await page.getByLabel("Product name").fill("Anything");
  await page.getByRole("button", { name: "Generate Article" }).click();

  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Couldn't generate the article");
  await expect(page.getByRole("heading", { name: "Generated Article" })).toHaveCount(0);
});

test.describe("375px coarse pointer", () => {
  test.use(PHONE);

  test("form and buttons clear the bar and meet tap size", async ({ page }) => {
    await page.goto("/articlewriter", { waitUntil: "networkidle" });

    const heading = page.getByRole("heading", { name: "Generate an Article" });
    await expect(heading).toBeVisible();
    // First readable element clears the fixed 64px chrome bar (R-I1 invariant).
    const box = await heading.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(64);

    const input = page.getByLabel("Product name");
    const generate = page.getByRole("button", { name: "Generate Article" });
    for (const el of [input, generate]) {
      const b = await el.boundingBox();
      expect(b.height).toBeGreaterThanOrEqual(44); // §1 tap target on coarse pointer
      expect(b.width).toBeGreaterThan(0);
    }
    // No horizontal overflow at 375px.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
