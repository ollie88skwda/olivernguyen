// /pull — restyled onto the sakura brand ladder (legacy restyle lane, plan 16).
// Durable gate for the lane's definition of done: name flow, scheduler with
// mocked supabase rows (pill / chips / progress / banner / empty), POST
// failure toast + rollback, error state + retry, both ladders, 375px,
// coarse-pointer tap targets, horizontal overflow, reduced motion, and a
// computed-style audit that the brand tokens actually land (no legacy
// navy/gold, no shadows, no gradients, no off-book radii).
//
// The REST reads are mocked so the assertions are deterministic; the realtime
// websocket still connects to real supabase like the pre-restyle page did.
// Screenshots land in e2e/__shots__/ (gitignored review artefacts).
import { test, expect } from "@playwright/test";

const SHOT = "e2e/__shots__/pull";

// First four upcoming Saturdays, as the page computes them.
function upcomingSaturdays(n = 4) {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() + (((6 - d.getDay() + 7) % 7) || 7));
  while (out.length < n) {
    out.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 7);
  }
  return out;
}

// rows: [weekend, player, amount]
function pickRows(saturdays) {
  return [
    { player: "Testy", weekend: saturdays[0], amount: 500 },
    { player: "alice", weekend: saturdays[0], amount: 100 },
    { player: "bob", weekend: saturdays[0], amount: 20 },
    { player: "alice", weekend: saturdays[1], amount: 5000 },
    { player: "carl", weekend: saturdays[1], amount: 500 },
    { player: "Testy", weekend: saturdays[3], amount: 5000 },
  ].map((r, i) => ({
    id: `row-${i}`,
    created_at: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
    ...r,
  }));
}

// Fake backend: GET serves `rows`; with persist, POST /api/pull/pick mutates
// `rows` so a reload proves the pick round-trips.
async function mockSupabase(page, rows, { persist = false } = {}) {
  await page.route("**/rest/v1/pull_picks*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rows) }),
  );
  if (persist) {
    await page.route("**/api/pull/pick", async (route) => {
      const body = route.request().postDataJSON();
      if (body.amount === null) {
        const i = rows.findIndex((r) => r.player === body.player && r.weekend === body.weekend);
        if (i >= 0) rows.splice(i, 1);
      } else {
        const i = rows.findIndex((r) => r.player === body.player && r.weekend === body.weekend);
        const row = {
          id: `live-${Date.now()}`,
          created_at: new Date().toISOString(),
          player: body.player,
          weekend: body.weekend,
          amount: body.amount,
        };
        if (i >= 0) rows[i] = row;
        else rows.push(row);
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
  }
}

async function noPageErrors(page) {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function gotoPull(page, theme = "light", waitUntil = "networkidle") {
  await page.goto(`/pull?theme=${theme}`, { waitUntil });
  await page.evaluate(() => document.fonts.ready);
}

async function enterName(page, name = "Testy") {
  await page.getByLabel("Who are you?").fill(name);
  await page.getByRole("button", { name: /enter pull/i }).click();
}

test("name screen renders clean, both ladders", async ({ page }) => {
  const errors = await noPageErrors(page);
  for (const theme of ["light", "dark"]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoPull(page, theme);
    await expect(page.getByRole("heading", { level: 1, name: "PULL." })).toBeVisible();
    await page.screenshot({ path: `${SHOT}-name-${theme}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoPull(page, "light");
  await page.screenshot({ path: `${SHOT}-name-375.png`, fullPage: true });
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("scheduler renders all states with mocked rows, both ladders", async ({ page }) => {
  const errors = await noPageErrors(page);
  const saturdays = upcomingSaturdays(4);
  for (const theme of ["light", "dark"]) {
    await mockSupabase(page, pickRows(saturdays));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoPull(page, theme);
    await page.evaluate(() => localStorage.removeItem("pull_player_name"));
    await page.reload({ waitUntil: "networkidle" });
    await enterName(page);

    // banner ranks by pool: W2 (5500) #1, W4 (5000) #2, W1 (620) #3
    await expect(page.getByRole("heading", { name: "Best Weekends So Far" })).toBeVisible();
    await expect(page.getByText("#1").first()).toBeVisible();

    // W1: committed pill + chips (mine accent) + progress
    const w1card = page.locator(".pull-grid-item").first();
    await expect(w1card.getByText("$500 committed")).toBeVisible(); // pill
    await expect(w1card.getByRole("progressbar")).toBeVisible();
    await expect(w1card.getByText("Testy $500")).toBeVisible();
    await expect(w1card.getByText("alice $100")).toBeVisible();

    // empty weekend
    await expect(page.locator(".pull-grid-item").nth(2).getByText("No picks yet")).toBeVisible();

    await page.screenshot({ path: `${SHOT}-scheduler-${theme}.png`, fullPage: true });
  }
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("expand → select a level → pill updates; persistence; change name", async ({ page }) => {
  const errors = await noPageErrors(page);
  const saturdays = upcomingSaturdays(4);
  const rows = pickRows(saturdays);
  await mockSupabase(page, rows, { persist: true }); // live fake backend
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoPull(page, "light");
  await enterName(page);

  const w3 = page.locator(".pull-grid-item").nth(2); // empty weekend
  await w3.getByRole("button").click(); // expand
  await expect(w3.getByRole("button", { name: /nothing stops me/i })).toBeVisible();
  await w3.getByRole("button", { name: /nothing stops me/i }).click();
  await expect(w3.getByText("$1M committed")).toBeVisible();

  // persistence: reload keeps the stored name and the saved pick round-trips
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Change" })).toBeVisible();
  await expect(page.getByText("$1M committed")).toBeVisible();

  // change name returns to the name screen
  await page.getByRole("button", { name: "Change" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "PULL." })).toBeVisible();

  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("error state + retry recovers", async ({ page }) => {
  // the intentional aborts log resource errors — filter them
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/ERR_FAILED/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  const saturdays = upcomingSaturdays(4);
  await page.route("**/rest/v1/pull_picks*", (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoPull(page, "light");
  await enterName(page);
  await expect(page.getByRole("alert")).toBeVisible();
  await page.screenshot({ path: `${SHOT}-error-light.png`, fullPage: true });

  await page.unroute("**/rest/v1/pull_picks*");
  await mockSupabase(page, pickRows(saturdays));
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("progressbar").first()).toBeVisible({ timeout: 10_000 });
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("POST failure toasts and rolls the optimistic row back", async ({ page }) => {
  // the intentional 500 logs a resource error — filter it
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/500/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  const saturdays = upcomingSaturdays(4);
  await mockSupabase(page, pickRows(saturdays));
  await page.route("**/api/pull/pick", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoPull(page, "light");
  await enterName(page);

  const w3 = page.locator(".pull-grid-item").nth(2);
  await w3.getByRole("button").click();
  await w3.getByRole("button", { name: /high priority/i }).click();

  await expect(page.getByText(/couldn't save your pick/i)).toBeVisible();
  await expect(w3.getByText("$5K committed")).toHaveCount(0); // optimistic row rolled back
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("POST failure with failed reconciliation restores prior state", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/ERR_FAILED|500/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  const saturdays = upcomingSaturdays(4);
  const rows = pickRows(saturdays);
  let reads = 0;
  await page.route("**/rest/v1/pull_picks*", (route) => {
    reads += 1;
    if (reads === 1) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(rows),
      });
    }
    return route.abort();
  });
  await page.route("**/api/pull/pick", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoPull(page, "light");
  await enterName(page);

  const w3 = page.locator(".pull-grid-item").nth(2);
  await w3.getByRole("button").click();
  await w3.getByRole("button", { name: /high priority/i }).click();

  await expect(page.getByText(/couldn't save your pick/i)).toBeVisible();
  await expect(w3.getByText("$5K committed")).toHaveCount(0);
  await expect(w3.getByText("No picks yet")).toBeVisible();
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("concurrent failed picks only roll back their own optimistic rows", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/ERR_FAILED|500/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  const saturdays = upcomingSaturdays(4);
  const rows = pickRows(saturdays);
  let reads = 0;
  await page.route("**/rest/v1/pull_picks*", (route) => {
    reads += 1;
    if (reads === 1) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(rows),
      });
    }
    return route.abort();
  });
  await page.route("**/api/pull/pick", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoPull(page, "light");
  await enterName(page);

  const w2 = page.locator(".pull-grid-item").nth(1);
  const w3 = page.locator(".pull-grid-item").nth(2);
  await w2.locator(".pull-card-toggle").click();
  await w3.locator(".pull-card-toggle").click();
  await w2.getByRole("button", { name: /high priority/i }).click();
  await w3.getByRole("button", { name: /high priority/i }).click();

  await expect(page.getByText(/couldn't save your pick/i).first()).toBeVisible();
  await expect(w2.getByText("$5K committed")).toHaveCount(0);
  await expect(w3.getByText("$5K committed")).toHaveCount(0);
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("rapid failed changes do not resurrect an earlier pick", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/ERR_FAILED|500/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  const saturdays = upcomingSaturdays(4);
  const rows = pickRows(saturdays);
  let reads = 0;
  await page.route("**/rest/v1/pull_picks*", (route) => {
    reads += 1;
    if (reads === 1) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(rows),
      });
    }
    return route.abort();
  });
  await page.route("**/api/pull/pick", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoPull(page, "light");
  await enterName(page);

  const w3 = page.locator(".pull-grid-item").nth(2);
  await w3.locator(".pull-card-toggle").click();
  await w3.getByRole("button", { name: /high priority/i }).click();
  await w3.locator(".pull-card-toggle").click();
  await w3.getByRole("button", { name: /nothing stops me/i }).click();

  await expect(page.getByText(/couldn't save your pick/i).first()).toBeVisible();
  await expect(w3.getByText("$5K committed")).toHaveCount(0);
  await expect(w3.getByText("$1M committed")).toHaveCount(0);
  await expect(w3.getByText("No picks yet")).toBeVisible();
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("successful reconciliation keeps another pending pick visible", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/500/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  const saturdays = upcomingSaturdays(4);
  const rows = pickRows(saturdays);
  let reads = 0;
  await page.route("**/rest/v1/pull_picks*", (route) => {
    reads += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(rows),
    });
  });
  await page.route("**/api/pull/pick", async (route) => {
    const body = route.request().postDataJSON();
    if (body.weekend === saturdays[1]) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoPull(page, "light");
  await enterName(page);

  const w2 = page.locator(".pull-grid-item").nth(1);
  const w3 = page.locator(".pull-grid-item").nth(2);
  await w2.locator(".pull-card-toggle").click();
  await w3.locator(".pull-card-toggle").click();
  await w2.getByRole("button", { name: /high priority/i }).click();
  await w3.getByRole("button", { name: /high priority/i }).click();

  await expect(page.getByText(/couldn't save your pick/i)).toBeVisible();
  await expect.poll(() => reads).toBeGreaterThanOrEqual(2);
  await expect(w3.getByText("$5K committed")).toBeVisible();
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test.describe("375px coarse pointer", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });

  test("no horizontal overflow; controls meet 44px tap targets", async ({ page }) => {
    const errors = await noPageErrors(page);
    const saturdays = upcomingSaturdays(4);
    await mockSupabase(page, pickRows(saturdays));
    await gotoPull(page, "light");
    await enterName(page);

    // no element pokes past the right edge
    const overflow = await page.evaluate(() =>
      Math.max(
        0,
        ...[...document.querySelectorAll("body *")].map(
          (e) => e.getBoundingClientRect().right - window.innerWidth,
        ),
      ),
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // expand a card and measure the disclosure + level-row tap targets
    const w3 = page.locator(".pull-grid-item").nth(2);
    await w3.getByRole("button").click();
    const heights = await page.evaluate(() => {
      const toggle = document.querySelector(".pull-card-toggle");
      const level = document.querySelector(".pull-level");
      return {
        toggle: toggle ? toggle.getBoundingClientRect().height : 0,
        level: level ? level.getBoundingClientRect().height : 0,
      };
    });
    expect(heights.toggle).toBeGreaterThanOrEqual(44);
    expect(heights.level).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);

    await page.screenshot({ path: `${SHOT}-scheduler-375.png`, fullPage: true });
    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });
});

test("reduced motion kills the page animations", async ({ page }) => {
  const errors = await noPageErrors(page);
  const saturdays = upcomingSaturdays(4);
  await mockSupabase(page, pickRows(saturdays));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoPull(page, "light");
  await enterName(page);

  const w3 = page.locator(".pull-grid-item").nth(2);
  await w3.getByRole("button").click();
  const anim = await page.evaluate(() => {
    const el = document.querySelector(".pull-card-expanded");
    return el ? getComputedStyle(el).animationName : "missing";
  });
  expect(anim).toBe("none");
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("loading state shows skeleton cards while picks fetch", async ({ page }) => {
  const errors = await noPageErrors(page);
  const saturdays = upcomingSaturdays(4);
  // the fetch effect starts at mount (the name screen fetches in the
  // background), so delay it past the name entry and skip networkidle
  await page.route("**/rest/v1/pull_picks*", async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(pickRows(saturdays)),
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoPull(page, "light", "domcontentloaded");
  await enterName(page);
  await expect(page.locator(".pull-loading-card").first()).toBeVisible();
  await expect(page.locator(".pull-loading")).toHaveAttribute("aria-busy", "true");
  await expect(page.locator(".pull-grid-item").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".pull-loading")).toHaveCount(0);
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});

test("brand values land on the page (computed styles, both ladders)", async ({ page }) => {
  const errors = await noPageErrors(page);
  const saturdays = upcomingSaturdays(4);
  await mockSupabase(page, pickRows(saturdays));
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const theme of ["light", "dark"]) {
    await gotoPull(page, theme);
    await page.evaluate(() => localStorage.removeItem("pull_player_name"));
    await page.reload({ waitUntil: "networkidle" });
    await enterName(page);
    await page.waitForSelector(".pull-card-toggle");
    // open a card so the commitment level rows exist for the audit
    await page.locator(".pull-grid-item").nth(2).getByRole("button").click();
    await page.waitForSelector(".pull-level");

    const audit = await page.evaluate(() => {
      const css = (sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el) : null;
      };
      const card = css(".on-card");
      const pill = css(".on-pill");
      const toggle = css(".pull-card-toggle");
      const level = css(".pull-level");
      const badge = css(".on-badge");
      const day = css(".pull-card-day");
      const label = css(".on-label");
      const title = css(".on-section-title");
      // any shadow / gradient / off-book radius anywhere in the page
      const offenders = [];
      document.querySelectorAll(".pull *").forEach((el) => {
        const s = getComputedStyle(el);
        if (s.boxShadow && s.boxShadow !== "none") {
          offenders.push(`${el.className} shadow:${s.boxShadow}`);
        }
        if (s.backgroundImage && s.backgroundImage !== "none") {
          offenders.push(`${el.className} bgimg:${s.backgroundImage}`);
        }
        const r = parseFloat(s.borderTopLeftRadius);
        if (r > 0 && r !== 3 && r !== 999) {
          offenders.push(`${el.className} radius:${s.borderTopLeftRadius}`);
        }
      });
      return {
        bodyBg: getComputedStyle(document.querySelector(".pull.sakura")).backgroundColor,
        cardRadius: card ? card.borderTopLeftRadius : null,
        cardShadow: card ? card.boxShadow : null,
        pillRadius: pill ? pill.borderTopLeftRadius : null,
        toggleRadius: toggle ? toggle.borderTopLeftRadius : null,
        levelRadius: level ? level.borderTopLeftRadius : null,
        badgeRadius: badge ? badge.borderTopLeftRadius : null,
        dayFont: day ? day.fontFamily : null,
        labelFont: label ? label.fontFamily : null,
        titleFont: title ? title.fontFamily : null,
        offenders,
      };
    });

    const ladder =
      theme === "light"
        ? { bg: "rgb(250, 241, 245)" } // #faf1f5
        : { bg: "rgb(24, 15, 20)" }; // #180f14
    expect(audit.bodyBg, `${theme} page bg`).toBe(ladder.bg);
    expect(audit.cardRadius, `${theme} card square`).toBe("0px");
    expect(audit.cardShadow, `${theme} no card shadow`).toBe("none");
    expect(audit.pillRadius, `${theme} pill round`).toBe("999px");
    expect(audit.toggleRadius, `${theme} toggle 3px`).toBe("3px");
    expect(audit.levelRadius, `${theme} level 3px`).toBe("3px");
    expect(audit.badgeRadius, `${theme} badge 3px`).toBe("3px");
    expect(audit.dayFont, `${theme} day mono body`).toContain("JetBrains Mono");
    expect(audit.labelFont, `${theme} label face`).toContain("Martian Mono");
    expect(audit.titleFont, `${theme} display face`).toContain("Familjen Grotesk");
    expect(audit.offenders, `${theme} unmapped shadows/gradients/radii`).toEqual([]);
  }
  expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
});
