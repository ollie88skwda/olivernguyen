// /emoji restyle gate (legacy restyle lane, fm/restyle-emoji).
//
// The page is mounted inside .sakura and rebuilt on the component library
// (BRAND.md contract in docs/redesign-research/16-legacy-restyle.md). This
// spec pins the toy's preserved behaviours — keyboard add path, count
// presets + custom count, drag, swatches, clear, download — and the brand's
// §1 hard requirements (44px tap targets on a coarse pointer, no horizontal
// overflow at 375px) in both ladders. Emoji glyphs render as content, so
// assertions are structural/behavioural, never pixel baselines.
import { test, expect } from "@playwright/test";

const isAllowedConsoleError = (msg) => {
  const url = msg.location()?.url ?? "";
  const text = msg.text();
  if (/\/api\//.test(url) && /Failed to load resource|404/.test(text)) return true;
  if (/\/api\//.test(text) && /404|Failed to load resource/.test(text)) return true;
  if (/^Warning: validateDOMNesting/.test(text)) return true;
  if (/^Warning: Using UNSAFE_componentWillMount/.test(text)) return true;
  return false;
};

const collectErrors = (page) => {
  const errors = { console: [], page: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error" && !isAllowedConsoleError(msg)) {
      errors.console.push(`${msg.text()} [${msg.location()?.url ?? ""}]`);
    }
  });
  page.on("pageerror", (err) => errors.page.push(String(err)));
  return errors;
};

const setColor = async (page, color) => {
  await page.locator('.emoji-swatch-color-input[type="color"]').evaluate((input, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, color);
};

test.describe("/emoji — sakura restyle", () => {
  for (const theme of ["light", "dark"]) {
    test(`renders clean in ${theme} ladder`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(`/emoji?theme=${theme}`, { waitUntil: "networkidle" });
      await expect(page.locator(".emoji-page.sakura")).toBeVisible();
      // fishbowl content asset loads (its white background is stripped at runtime)
      await expect(page.locator(".emoji-fishbowl")).toBeVisible();
      expect(errors.console).toEqual([]);
      expect(errors.page).toEqual([]);
    });
  }

  test("keyboard path: type + return adds items; Enter on empty adds none", async ({ page }) => {
    await page.goto("/emoji?theme=light");
    const input = page.getByLabel("emoji or text");
    await input.fill("🐠");
    await input.press("Enter");
    await expect(page.locator(".emoji-item")).toHaveCount(67); // default count
    // Enter with an empty field is a no-op
    await input.press("Enter");
    await expect(page.locator(".emoji-item")).toHaveCount(67);
    // focus returns to the input after add
    await expect(input).toBeFocused();
  });

  test("count presets select; custom count controls the next add", async ({ page }) => {
    await page.goto("/emoji?theme=light");
    const preset41 = page.getByLabel("41 emojis");
    await preset41.click();
    await expect(preset41).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("emoji or text").fill("x");
    await page.getByLabel("emoji or text").press("Enter");
    await expect(page.locator(".emoji-item")).toHaveCount(41);

    // custom count clamps to 1..MAX_COUNT and blur normalises empty
    const count = page.getByLabel("custom count");
    await count.fill("3");
    await page.getByLabel("emoji or text").fill("y");
    await page.getByLabel("emoji or text").press("Enter");
    await expect(page.locator(".emoji-item")).toHaveCount(44); // 41 + 3
    await count.fill("500");
    await count.blur();
    await expect(count).toHaveValue("200");
  });

  test("drag moves an item via pointer events", async ({ page }) => {
    await page.goto("/emoji?theme=light");
    // a single item — scatter positions can overlap, so a one-item canvas
    // guarantees the grab target is the item under test
    await page.getByLabel("custom count").fill("1");
    await page.getByLabel("emoji or text").fill("⭐");
    await page.getByLabel("emoji or text").press("Enter");
    const item = page.locator(".emoji-item").first();
    await expect(item).toHaveCount(1);
    const before = await item.boundingBox();
    expect(before).not.toBeNull();
    const cx = before.x + before.width / 2;
    const cy = before.y + before.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 60, { steps: 5 });
    await page.mouse.up();
    const after = await item.boundingBox();
    expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
  });

  test("custom color keeps emoji legible in both theme ladders", async ({ page }) => {
    for (const theme of ["light", "dark"]) {
      await page.goto(`/emoji?theme=${theme}`);
      await setColor(page, "#777777");
      const canvas = page.locator(".emoji-canvas");
      await expect(canvas).toHaveCSS("background-color", "rgb(119, 119, 119)");
      await page.getByLabel("custom count").fill("1");
      await page.getByLabel("emoji or text").fill("🐠");
      await page.getByLabel("emoji or text").press("Enter");
      const item = page.locator(".emoji-item");
      await expect(item).toHaveCSS("color", "rgb(0, 0, 0)");
      const contrast = await page.evaluate(() => {
        const rgb = (value) => value.match(/\d+/g).map(Number).map((channel) => channel / 255);
        const luminance = (value) => rgb(value).reduce(
          (sum, channel, index) => sum + (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index],
          0,
        );
        const background = luminance(getComputedStyle(document.querySelector(".emoji-canvas")).backgroundColor);
        const foreground = luminance(getComputedStyle(document.querySelector(".emoji-item")).color);
        return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("swatches switch the canvas background; custom picker remains reachable", async ({ page }) => {
    await page.goto("/emoji?theme=light");
    const canvas = page.locator(".emoji-canvas");
    await expect(canvas).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.getByRole("radiogroup", { name: "background color" }).getByRole("radio")).toHaveCount(3);
    await page.getByLabel("black background").click();
    await expect(canvas).toHaveCSS("background-color", "rgb(19, 19, 19)");
    await page.getByLabel("chrome purple background").click();
    await expect(canvas).toHaveCSS("background-color", "rgb(9, 36, 65)");
    await page.getByLabel("white background").click();
    await expect(canvas).toHaveCSS("background-color", "rgb(255, 255, 255)");
    // the custom picker is a native color input inside the round swatch
    await expect(page.locator('.emoji-swatch-color-input[type="color"]')).toBeVisible();
  });

  test("clear starts disabled, works after items exist, and re-disables", async ({ page }) => {
    await page.goto("/emoji?theme=light");
    const clear = page.getByRole("button", { name: "Clear" });
    await expect(clear).toBeDisabled();
    await page.getByLabel("emoji or text").fill("🍀");
    await page.getByLabel("emoji or text").press("Enter");
    await expect(page.locator(".emoji-item")).toHaveCount(67);
    await expect(clear).toBeEnabled();
    await clear.click();
    await expect(page.locator(".emoji-item")).toHaveCount(0);
    await expect(clear).toBeDisabled();
  });

  test("download button produces a PNG", async ({ page }) => {
    await page.goto("/emoji?theme=light");
    await page.getByLabel("emoji or text").fill("🐟");
    await page.getByLabel("emoji or text").press("Enter");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("fishbowl.png");
  });

  test("fishbowl loading path remains reachable", async ({ page }) => {
    let release;
    const blocked = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("**/fishbowl.jpg", (route) => blocked.then(() => route.continue()));
    await page.goto("/emoji?theme=light", { waitUntil: "domcontentloaded" });
    const image = page.locator(".emoji-fishbowl");
    await expect.poll(() => image.evaluate((element) => element.complete)).toBe(false);
    release();
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  });

  test("fishbowl error path leaves the canvas without the asset", async ({ page }) => {
    await page.route("**/fishbowl.jpg", (route) => route.abort());
    await page.goto("/emoji?theme=light", { waitUntil: "domcontentloaded" });
    const image = page.locator(".emoji-fishbowl");
    await expect.poll(() => image.evaluate((element) => element.complete)).toBe(true);
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBe(0);
  });
});

test.describe("/emoji — phone (375px, coarse pointer)", () => {
  test.use({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  });

  test("touch drag works; controls meet §1 44px tap targets; nothing overflows horizontally", async ({ page }) => {
    await page.goto("/emoji?theme=light");
    for (const label of ["white background", "black background", "chrome purple background", "custom background color"]) {
      const box = await page.getByLabel(label).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    for (const label of ["67 emojis", "41 emojis", "25 emojis"]) {
      const box = await page.getByLabel(label).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const input = await page.getByLabel("emoji or text").boundingBox();
    expect(input.height).toBeGreaterThanOrEqual(44);
    // no horizontal overflow: canvas and controls fit inside the viewport
    const overflow = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      return [...document.querySelectorAll(".emoji-page *")].some(
        (el) => el.getBoundingClientRect().right > vw + 1,
      );
    });
    expect(overflow).toBe(false);
    // touch drag (real touch stream via CDP) still places an item
    await page.getByLabel("custom count").fill("1");
    await page.getByLabel("emoji or text").fill("🫧");
    await page.getByLabel("emoji or text").press("Enter");
    const item = page.locator(".emoji-item").first();
    await expect(item).toHaveCount(1);
    const before = await item.boundingBox();
    const cx = before.x + before.width / 2;
    const cy = before.y + before.height / 2;
    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 4; i++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx + i * 10, y: cy + i * 10 }] });
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const after = await item.boundingBox();
    expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
  });
});
