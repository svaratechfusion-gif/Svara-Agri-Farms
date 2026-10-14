import { expect, test, type Page } from "@playwright/test";

import { NOTHING_ORDERABLE, orderable } from "./support/catalogue";

const WELCOMED_KEY = "svara:mascot-welcomed";
const WELCOME_NOTE = "Hey there! 🌱 I'm SVARA";
const ROUTES = [
  "/",
  "/farm",
  "/journey",
  "/products",
  "/products/moringa-powder",
  "/our-story",
  "/field-notes",
  "/field-notes/the-journey-of-a-leaf",
  "/shop",
];

const mascot = (page: Page) => page.locator(".mascot-launcher svg.mascot");

/** Records every mood SVARA takes from now on, in order, on `window.__moods`. */
async function recordMoods(page: Page) {
  await page.evaluate(() => {
    const svg = document.querySelector(".mascot-launcher svg.mascot")!;
    const log: string[] = [svg.getAttribute("data-state")!];
    (window as unknown as { __moods: string[] }).__moods = log;
    new MutationObserver(() => {
      const state = svg.getAttribute("data-state")!;
      if (log.at(-1) !== state) log.push(state);
    }).observe(svg, { attributes: true, attributeFilter: ["data-state"] });
  });
}
const moods = (page: Page) =>
  page.evaluate(() => (window as unknown as { __moods: string[] }).__moods);

/** A client-side navigation through a real link (the footer's), not a page load. */
async function navigateTo(page: Page, href: string) {
  // The link's own click (still Next's client-side navigation), run in the
  // page: on a cold server Playwright's Firefox driver can hold every locator
  // on a phantom pending navigation of the previous page.
  await page.evaluate((target) => {
    document.querySelector<HTMLAnchorElement>(`footer a[href="${target}"]`)!.click();
  }, href);
  await page.waitForURL(`**${href}`);
}

const scrollPastHero = (page: Page) =>
  page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));

test.describe("first-visit welcome", () => {
  test("plays an excited welcome once, with its note, then rests", async ({ page, isMobile }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    if (isMobile) await scrollPastHero(page);
    await expect(mascot(page)).toHaveAttribute("data-state", "welcome", { timeout: 8000 });
    await expect(page.locator(".mascot-note")).toContainText(WELCOME_NOTE);
    expect(await page.evaluate((key) => sessionStorage.getItem(key), WELCOMED_KEY)).toBe("1");
    await expect(mascot(page)).not.toHaveAttribute("data-state", "welcome", { timeout: 6000 });
  });

  test("does not replay on navigation, on a reload, or across routes", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    if (isMobile) await scrollPastHero(page);
    await expect(mascot(page)).toHaveAttribute("data-state", "welcome", { timeout: 8000 });
    await expect(mascot(page)).not.toHaveAttribute("data-state", "welcome", { timeout: 6000 });

    await recordMoods(page);
    await navigateTo(page, "/our-story");
    if (isMobile) await scrollPastHero(page);
    await page.waitForTimeout(2600);
    expect(await moods(page)).not.toContain("welcome");

    await page.goto("/farm", { waitUntil: "networkidle" });
    if (isMobile) await scrollPastHero(page);
    await recordMoods(page);
    await page.waitForTimeout(2600);
    expect(await moods(page)).not.toContain("welcome");
  });

  test("on phones it waits until SVARA is actually on screen", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Only small screens tuck SVARA away over the hero.");
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2600);
    // Hidden over the hero: the welcome is kept, not spent unseen.
    expect(await page.evaluate((key) => sessionStorage.getItem(key), WELCOMED_KEY)).toBeNull();
    await scrollPastHero(page);
    await expect(mascot(page)).toHaveAttribute("data-state", "welcome", { timeout: 3000 });
  });

  test("a welcome never overwrites a cart celebration", async ({ page, isMobile }) => {
    test.skip(isMobile, "Small screens keep SVARA off purchase pages.");
    test.skip(!orderable, NOTHING_ORDERABLE);
    await page.goto(`/products/${orderable!.product.slug}`, { waitUntil: "networkidle" });
    await recordMoods(page);
    await page
      .locator("form")
      .filter({ hasText: "Add to cart" })
      .getByRole("button", { name: "Add to cart" })
      .click();
    await expect(mascot(page)).toHaveAttribute("data-state", "excited");
    // However the timing falls, the celebration runs to its end: SVARA goes
    // from excited to rest — never straight into a welcome.
    await expect(mascot(page)).not.toHaveAttribute("data-state", "excited", { timeout: 8000 });
    await page.waitForTimeout(2500);
    const log = await moods(page);
    expect(log[log.indexOf("excited") + 1]).toBe("idle");
  });

  test("opening SVARA counts as the hello: no separate welcome after it", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/journey", { waitUntil: "domcontentloaded" });
    if (isMobile) await scrollPastHero(page);
    await page.getByRole("button", { name: /Open SVARA/ }).click();
    await recordMoods(page);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(3000);
    expect(await moods(page)).not.toContain("welcome");
  });

  test("a blocked sessionStorage does not break the page", async ({ page, isMobile }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "sessionStorage", {
        get() {
          throw new Error("storage blocked");
        },
      });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    if (isMobile) await scrollPastHero(page);
    await expect(page.locator("h1")).toBeVisible();
    await expect(mascot(page)).toHaveAttribute("data-state", "welcome", { timeout: 8000 });
    // Remembered in memory for the rest of the visit.
    await expect(mascot(page)).not.toHaveAttribute("data-state", "welcome", { timeout: 6000 });
    await recordMoods(page);
    await navigateTo(page, "/our-story");
    await page.waitForTimeout(2600);
    expect(await moods(page)).not.toContain("welcome");
    expect(errors).toEqual([]);
  });
});

test.describe("across the site", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => window.sessionStorage.setItem(key, "1"), WELCOMED_KEY);
  });

  test("every route renders the one shared SVARA, which survives client navigation", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    for (const route of ROUTES) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".mascot-companion")).toHaveCount(1);
      await expect(page.locator(".mascot-companion svg.mascot")).toHaveCount(1);
    }
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      (document.querySelector(".mascot-companion") as unknown as { __mark: number }).__mark = 7;
    });
    await navigateTo(page, "/our-story");
    expect(
      await page.evaluate(
        () =>
          (document.querySelector(".mascot-companion") as unknown as { __mark?: number }).__mark,
      ),
    ).toBe(7);
  });

  test("section notes still turn SVARA to explain after client navigation", async ({
    page,
    isMobile,
  }) => {
    const [anchor, text] = isMobile
      ? ["#landscape-heading", "The seasons decide"]
      : ["#monograph-heading", "open rows of red soil"];
    // Start where no note shows on arrival, so the quiet gap between notes is clear.
    await page.goto("/products", { waitUntil: "networkidle" });
    await navigateTo(page, "/farm");
    await page.evaluate((selector) => {
      const heading = document.querySelector(selector)!;
      window.scrollTo(
        0,
        heading.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45,
      );
    }, anchor);
    await expect(page.locator(".mascot-note")).toContainText(text, { timeout: 4000 });
    await expect(mascot(page)).toHaveAttribute("data-state", "explaining");
    // The expression is temporary: SVARA returns to rest on its own.
    await expect(mascot(page)).toHaveAttribute("data-state", "idle", { timeout: 9000 });
  });

  test("cursor following and curiosity keep working after client navigation", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Cursor behaviour needs a fine pointer.");
    await page.goto("/", { waitUntil: "networkidle" });
    await navigateTo(page, "/journey");
    await page.mouse.move(1300, 800);
    const rest = (await page.locator(".mascot-launcher").boundingBox())!;
    // Follow the pointer to a heading — text, not a control, so no curiosity yet.
    // Next keeps the previous route mounted but hidden; follow the visible heading.
    const heading = (await page.locator("h1:visible").boundingBox())!;
    await page.mouse.move(heading.x + 20, heading.y + heading.height / 2, { steps: 8 });
    await expect
      .poll(async () => (await page.locator(".mascot-launcher").boundingBox())!.x - rest.x)
      .toBeLessThan(-150);

    // Resting on a real control makes SVARA curious — once, then calm.
    const link = page.locator("main a[href]").first();
    await link.scrollIntoViewIfNeeded();
    // A section note outranks curiosity; let it finish so the hover is judged on its own.
    await expect(mascot(page)).toHaveAttribute("data-state", "idle", { timeout: 9000 });
    await page.mouse.move(5, 5);
    await link.hover();
    await expect(mascot(page)).toHaveAttribute("data-state", "curious", { timeout: 3000 });
    await expect(mascot(page)).toHaveAttribute("data-state", "idle", { timeout: 5000 });
    // Cooldown: hovering again straight away does not repeat it.
    await page.mouse.move(5, 5);
    await link.hover();
    await page.waitForTimeout(1500);
    await expect(mascot(page)).toHaveAttribute("data-state", "idle");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no mood moves SVARA — including the drifting ones", async ({ page }) => {
    await page.goto("/our-story", { waitUntil: "networkidle" });
    const moods = page.getByRole("list", { name: "Its moods" }).getByRole("button");
    const portrait = page.locator("section:has(#meet-svara-heading) svg.mascot");
    for (let index = 0; index < (await moods.count()); index += 1) {
      await moods.nth(index).click();
      // Every part keeps its own class, so the reduced-motion rules reach it.
      await expect(portrait.locator(".mascot__face")).toHaveCount(1);
      await expect(portrait.locator(".mascot__body")).toHaveCount(1);
      await page.waitForTimeout(150);
      const running = await portrait.evaluate(
        (svg) =>
          Array.from(svg.querySelectorAll("*")).flatMap((node) => node.getAnimations()).length,
      );
      expect(running, await moods.nth(index).innerText()).toBe(0);
    }
  });

  test("the welcome shows its excited pose without moving, then rests", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    if (isMobile) await scrollPastHero(page);
    await expect(mascot(page)).toHaveAttribute("data-state", "welcome", { timeout: 8000 });
    const running = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll(".mascot-launcher svg.mascot *")).flatMap((node) =>
          (node as SVGElement).getAnimations(),
        ).length,
    );
    expect(running).toBe(0);
    const launcher = (await page.locator(".mascot-launcher").boundingBox())!;
    await page.waitForTimeout(800);
    expect((await page.locator(".mascot-launcher").boundingBox())!.y).toBe(launcher.y);
    // Never stuck in the pose: the one-shot's own timer returns SVARA to idle.
    await expect(mascot(page)).toHaveAttribute("data-state", "idle", { timeout: 6000 });
  });
});
