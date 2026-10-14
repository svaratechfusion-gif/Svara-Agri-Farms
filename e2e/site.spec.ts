import { expect, test, type Page } from "@playwright/test";

import { NOTHING_ORDERABLE, orderable } from "./support/catalogue";

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

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

for (const route of ROUTES) {
  test(`${route} renders one h1, no errors and no horizontal overflow`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(route, { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    const missingAlt = await page.locator("img:not([alt])").count();
    expect(missingAlt).toBe(0);
    expect(errors).toEqual([]);
  });
}

test("home page carries canonical, Open Graph and structured data", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /.+/);
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe("Organization");
});

test("the official logo is used in the header", async ({ page }) => {
  await page.goto("/");
  // The home link is named "SVARA Farms — home"; the seal inside it is decorative.
  const logo = page.locator("header a[aria-label^='SVARA Farms'] img").first();
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute("src", /svara-farms-logo/);
});

test("the seal sits at the true centre of the header and is enlarged", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const seal = page.locator("header a[aria-label^='SVARA Farms'] > span");
  const box = await seal.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThanOrEqual(1);
  // Layout size (unaffected by the entrance scale) — the seal is enlarged and round.
  const size = await seal.evaluate((element) => [
    (element as HTMLElement).offsetWidth,
    (element as HTMLElement).offsetHeight,
  ]);
  expect(size[0]).toBeGreaterThanOrEqual(56);
  expect(size[0]).toBe(size[1]);
});

test("actions share the leaf silhouette", async ({ page }) => {
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  const addToCart = page.getByRole("button", { name: "Add to cart" });
  await expect(addToCart).toHaveClass(/leaf-btn--primary/);
  const radii = await addToCart.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.borderTopLeftRadius, style.borderTopRightRadius];
  });
  // Rounded shoulder and pointed tip: the two top corners must differ.
  expect(radii[0]).not.toBe(radii[1]);
});

test("field notes can be filtered by subject", async ({ page }) => {
  await page.goto("/field-notes", { waitUntil: "networkidle" });
  const filters = page.getByRole("group", { name: "Filter field notes by subject" });
  await filters.getByRole("button", { name: /The Kitchen/ }).click();
  await expect(filters.getByRole("button", { name: /The Kitchen/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("heading", { name: "A spoonful in the kitchen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "On shade" })).toHaveCount(0);
});

test("the shade comparison responds to the keyboard", async ({ page }) => {
  await page.goto("/journey", { waitUntil: "networkidle" });
  const slider = page.getByRole("slider", { name: /Compare fresh leaves/ });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("51");
});

test("adding to the cart updates the count and opens the drawer", async ({ page }) => {
  test.skip(!orderable, NOTHING_ORDERABLE);
  const { product, variant } = orderable!;
  await page.goto(`/products/${product.slug}`, { waitUntil: "networkidle" });
  const purchase = page.locator("form").filter({ hasText: "Add to cart" });

  await purchase.getByRole("radio", { name: new RegExp(variant.label) }).check({ force: true });
  await purchase.getByRole("button", { name: "Increase quantity" }).click();
  await purchase.getByRole("button", { name: "Add to cart" }).click();
  await expect(purchase.getByText(/added to your cart/)).toContainText(
    `2 × ${product.name}, ${variant.label}`,
  );

  // The header hides while reading downward; scrolling up reveals it again.
  // (A real scroll rather than a wheel event, which mobile WebKit cannot emulate.)
  await page.evaluate(() => window.scrollBy(0, -400));
  await page.getByRole("button", { name: /2 items — open cart/ }).click();
  const drawer = page.getByRole("dialog", { name: "Your cart" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText(variant.label);
  await expect(drawer.getByRole("link", { name: "Review cart & order" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  await page.reload({ waitUntil: "load" });
  await expect(page.getByRole("button", { name: /2 items — open cart/ })).toBeVisible();
});

test("journey stage indicator reflects scroll position", async ({ page, isMobile }) => {
  test.skip(isMobile, "The pinned stage is a desktop experience.");
  await page.goto("/journey", { waitUntil: "networkidle" });
  const indicator = page.getByRole("navigation", { name: "Journey stages" });

  await page.locator("#stage-mill").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -window.innerHeight * 0.2));
  await expect(indicator.locator('[aria-current="step"]')).toContainText("05");
});

test("mobile navigation opens and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Menu button is shown below the desktop breakpoint.");
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Site navigation" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Field Notes" }).click();
  await expect(page).toHaveURL(/\/field-notes$/);
  await expect(menu).toBeHidden();
});

test("journey leaflets on the vein select their stage", async ({ page, isMobile }) => {
  test.skip(isMobile, "The pinned stage controls are a desktop experience.");
  await page.goto("/journey", { waitUntil: "networkidle" });
  const indicator = page.getByRole("navigation", { name: "Journey stages" });
  await page.locator("#stage-harvest").scrollIntoViewIfNeeded();
  await indicator.getByRole("button", { name: "Stage 04: Shade Dry" }).click();
  await expect(indicator.locator('[aria-current="step"]')).toContainText("04", { timeout: 5000 });
  await expect(indicator.getByRole("button", { name: "Previous stage" })).toBeEnabled();
});

test("journey stages can be chosen with the keyboard alone", async ({ page, isMobile }) => {
  test.skip(isMobile, "The pinned stage controls are a desktop experience.");
  await page.goto("/journey", { waitUntil: "networkidle" });
  const indicator = page.getByRole("navigation", { name: "Journey stages" });
  await page.locator("#stage-harvest").scrollIntoViewIfNeeded();
  const mill = indicator.getByRole("button", { name: "Stage 05: Mill" });
  await mill.focus();
  await expect(mill).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(indicator.locator('[aria-current="step"]')).toContainText("05", { timeout: 5000 });
});

test("the product page carries a labelled botanical diagram", async ({ page }) => {
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  await expect(page.getByRole("img", { name: /Line drawing of a moringa leaf/ })).toBeAttached();
  await expect(page.getByText("Anatomy of the ingredient.")).toBeVisible();
});

test("the chapter vein navigates the homepage story", async ({ page, isMobile }) => {
  test.skip(isMobile, "The chapter vein is shown on wide screens only.");
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#ritual-heading").scrollIntoViewIfNeeded();
  const chapters = page.getByRole("navigation", { name: "Chapters" });
  await chapters.getByRole("button", { name: "Chapter 07: The Product" }).click();
  await expect(chapters.locator('[aria-current="step"]')).toHaveAttribute(
    "aria-label",
    "Chapter 07: The Product",
    { timeout: 5000 },
  );
});

test("the floating leaf shows the real moringa leaf, annotated", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const specimen = page.locator("figure", { hasText: "Specimen — Moringa oleifera" });
  await specimen.scrollIntoViewIfNeeded();
  await expect(specimen.getByRole("img", { name: /compound moringa leaf/ })).toBeVisible();
  await expect(specimen.locator(".floating-leaf__label")).toHaveCount(3);
});

test("the product card shows the whole pouch, standing above its card", async ({ page }) => {
  await page.goto("/products", { waitUntil: "networkidle" });
  const card = page.locator(".showcase-card");
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole("link", { name: "View product" })).toBeVisible();
  const cardTop = (await card.boundingBox())!.y;
  const pouchTop = (await card.locator('img[src*="svara-moringa-pouch"]').boundingBox())!.y;
  expect(pouchTop).toBeLessThan(cardTop);
});

test("the hero stages the cream pouch in front of the farm", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator("section", { has: page.locator("#hero-heading") });
  await expect(hero.getByRole("img", { name: /SVARA Moringa Leaf Powder pouch/ })).toBeVisible();
  await expect(hero.getByRole("img", { name: /Harvesters gathering leaves/ })).toBeVisible();
});

test("the product-led spread centres the whole cream pouch", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const stage = page.locator(".ritual-stage");
  await stage.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const pouch = stage.getByRole("img", { name: /SVARA Moringa Leaf Powder pouch/ });
  await expect(pouch).toBeVisible();
  const [stageBox, pouchBox] = [await stage.boundingBox(), await pouch.boundingBox()];
  expect(pouchBox!.y).toBeGreaterThanOrEqual(stageBox!.y - 1);
  expect(pouchBox!.y + pouchBox!.height).toBeLessThanOrEqual(stageBox!.y + stageBox!.height + 1);
  const section = page.locator("section", { has: page.locator("#ritual-heading") });
  await expect(section.getByText("To be confirmed")).toBeVisible();
});

test("the ingredient and green chapters render their supplied images", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  for (const selector of ["#ingredient-heading", "#green-heading"]) {
    const section = page.locator("section", { has: page.locator(selector) });
    await section.scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          section.locator("img").evaluateAll((images) =>
            images
              // Only the layout in use: the film (desktop) or the row (phones).
              .filter((image) => (image as HTMLElement).offsetParent !== null)
              .every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
          ),
        { timeout: 10_000 },
      )
      .toBe(true);
    expect(await section.locator("img").count()).toBeGreaterThan(0);
  }
  const ingredient = page.locator("section", { has: page.locator("#ingredient-heading") });
  await expect(
    ingredient.getByRole("img", { name: /mound of fine green moringa powder/ }),
  ).toBeVisible();
  const green = page.locator("section", { has: page.locator("#green-heading") });
  await expect(green.locator('img[src*="powder-swoosh"]')).toBeAttached();
});

test("the products page shows the uncropped cream pouch", async ({ page }) => {
  await page.goto("/products", { waitUntil: "networkidle" });
  const pouch = page.locator('img[src*="svara-moringa-pouch"]').first();
  await expect(pouch).toBeVisible();
  await expect(pouch).toHaveCSS("object-fit", "contain");
});

test("the wider range previews each pack with its own ingredient and no price", async ({
  page,
}) => {
  await page.goto("/products", { waitUntil: "networkidle" });
  const grid = page.getByRole("list", { name: "Also in preparation." });
  await grid.scrollIntoViewIfNeeded();
  await expect(grid.getByRole("listitem")).toHaveCount(11);
  for (const name of [
    "Beetroot",
    "Carrot",
    "Apple",
    "Garlic",
    "Onion",
    "Ginger",
    "Neem",
    "Raw Banana",
    "Hibiscus Leaf",
    "Hibiscus Flower",
    "Amla",
  ]) {
    await expect(
      grid.getByRole("img", { name: new RegExp(`SVARA ${name} Powder pouch`) }),
    ).toBeAttached();
  }
  await expect(grid.getByText("In preparation")).toHaveCount(11);
  await expect(grid.getByRole("button")).toHaveCount(0);
  await expect(grid.getByText(/₹|price/i)).toHaveCount(0);
});

test("each journey stage carries its own process icon", async ({ page }) => {
  await page.goto("/journey", { waitUntil: "networkidle" });
  const stages = page.locator("[data-journey-stage]");
  await expect(stages).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) {
    await expect(stages.nth(index).locator("svg[aria-hidden=true]").first()).toBeAttached();
  }
});

test("the ingredient film scrubs from leaf to powder and back", async ({ page, isMobile }) => {
  test.skip(isMobile, "The pinned film runs on wide screens; phones see the static row.");
  await page.goto("/", { waitUntil: "networkidle" });
  const film = page.locator(".ingredient-film");
  const scrollTo = (fraction: number) =>
    film.evaluate((element, f) => {
      const rect = element.getBoundingClientRect();
      window.scrollTo(0, rect.top + window.scrollY + f * (rect.height - window.innerHeight));
    }, fraction);
  await scrollTo(0.9);
  await expect(film).toHaveAttribute("data-step", "2");
  await scrollTo(0.45);
  await expect(film).toHaveAttribute("data-step", "1");
  await scrollTo(0.05);
  await expect(film).toHaveAttribute("data-step", "0");
});

test("journey frames cut in with their own scene and stay in step", async ({ page, isMobile }) => {
  test.skip(isMobile, "The pinned frame is shown on wide screens only.");
  await page.goto("/journey", { waitUntil: "networkidle" });
  const stage = page.locator("#stage-mill");
  await stage.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    window.scrollTo(0, rect.top + window.scrollY + rect.height / 2 - window.innerHeight * 0.525);
  });
  await expect(page.locator('.journey-frame[data-stage="mill"]')).toHaveAttribute(
    "data-state",
    "active",
  );
  await expect(page.locator('.journey-frame[data-stage="pack"]')).toHaveAttribute(
    "data-state",
    "future",
  );
  await expect(page.locator('.journey-frame[data-stage="grow"]')).toHaveAttribute(
    "data-state",
    "past",
  );
});

test("the shop separates what can be ordered from what is in preparation", async ({ page }) => {
  await page.goto("/shop", { waitUntil: "networkidle" });
  const sections = page.getByRole("navigation", { name: "Shop sections" });
  await sections.getByRole("link", { name: /In preparation/ }).click();
  await expect(page).toHaveURL(/#in-preparation$/);
  const preparation = page.locator("#in-preparation");
  await expect(preparation.getByRole("listitem")).toHaveCount(11);
  await expect(preparation.getByRole("button")).toHaveCount(0);
  await expect(
    page.locator("#available").getByRole("button", { name: /Add to cart/ }),
  ).toBeVisible();
});

test("a field note reads through to related notes and the next chapter", async ({ page }) => {
  await page.goto("/field-notes/the-journey-of-a-leaf", { waitUntil: "networkidle" });
  await expect(page.locator("article blockquote")).toContainText("begin with the land");
  const more = page.getByRole("navigation", { name: "More field notes" });
  await expect(more.getByRole("listitem")).toHaveCount(2);
  const door = page.locator("a.next-chapter");
  await door.scrollIntoViewIfNeeded();
  await door.click();
  await expect(page).toHaveURL(/\/field-notes\/why-we-begin-with-the-land$/);
});

test("the product page tells how it is made, in six stages", async ({ page }) => {
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  const sequence = page.locator(".process-sequence");
  await sequence.scrollIntoViewIfNeeded();
  await expect(sequence.getByRole("listitem")).toHaveCount(6);
  await expect(sequence.getByRole("heading", { name: "Shade Dry" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Also in preparation." })).toBeAttached();
});

test("chapter doors lead from page to page", async ({ page }) => {
  await page.goto("/farm", { waitUntil: "networkidle" });
  const door = page.locator("a.next-chapter");
  await door.scrollIntoViewIfNeeded();
  await expect(door).toContainText("Follow the journey of a leaf");
  await door.click();
  await expect(page).toHaveURL(/\/journey$/);
});

test("the people gestures follow the scroll, forwards and back", async ({ page, isMobile }) => {
  test.skip(isMobile, "The held frame runs on wide screens; phones see each gesture's picture.");
  await page.goto("/journey", { waitUntil: "networkidle" });
  const story = page.locator(".gesture-story");
  const scrollTo = (fraction: number) =>
    story.evaluate((element, f) => {
      const rect = element.getBoundingClientRect();
      window.scrollTo(0, rect.top + window.scrollY + f * (rect.height - window.innerHeight));
    }, fraction);
  await scrollTo(0.85);
  await expect(story).toHaveAttribute("data-active", "2");
  await scrollTo(0.4);
  await expect(story).toHaveAttribute("data-active", "1");
  await scrollTo(0.02);
  await expect(story).toHaveAttribute("data-active", "0");
});

test("our story tells its chapters in their own compositions", async ({ page }) => {
  await page.goto("/our-story", { waitUntil: "networkidle" });
  for (const name of [/Nature/, /Human care/, /Patience over speed/, /Beginning with moringa/]) {
    await expect(page.getByRole("heading", { name }).first()).toBeAttached();
  }
  // Every pack is listed; phones show four of them to keep the pouch clear.
  await expect(page.locator('ul[aria-label="Packs in preparation"] > li')).toHaveCount(11);
  await expect(page.locator(".expanding-scene img")).toHaveCount(1);
});

test("SVARA opens, greets with real places to go and closes with focus returned", async ({
  page,
}) => {
  await page.goto("/journey", { waitUntil: "networkidle" });
  // On small screens SVARA waits until the hero has scrolled away.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  const launcher = page.getByRole("button", { name: /Open SVARA/ });
  await launcher.click();
  const panel = page.getByRole("dialog", { name: "Hello, I’m SVARA." });
  await expect(panel).toBeVisible();
  await expect(page.locator(".mascot-launcher svg.mascot")).toHaveAttribute(
    "data-state",
    /greeting|idle|listening/,
  );
  await expect(panel.getByRole("log")).toContainText("I'm SVARA, your little guide");
  await expect(panel.getByRole("list", { name: "Quick replies" }).getByRole("button")).toHaveText([
    "Explore the farm",
    "Discover powders",
    "Take me shopping",
  ]);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
  await expect(page.locator(".mascot-launcher svg.mascot")).toHaveAttribute(
    "data-state",
    /goodbye|idle/,
  );
});

test("SVARA stays clear of purchase controls on small screens", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Only small screens hide the companion on purchase pages.");
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: /Open SVARA/ })).toBeHidden();
  await page.goto("/", { waitUntil: "networkidle" });
  // Away over the hero, back once the visitor scrolls on.
  await expect(page.getByRole("button", { name: /Open SVARA/ })).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await expect(page.getByRole("button", { name: /Open SVARA/ })).toBeVisible();
});

test("SVARA celebrates a real add to cart", async ({ page }) => {
  test.skip(!orderable, NOTHING_ORDERABLE);
  // A returning visitor in this session: the celebration alone, no owed welcome after it.
  await page.addInitScript(() => window.sessionStorage.setItem("svara:mascot-welcomed", "1"));
  await page.goto(`/products/${orderable!.product.slug}`, { waitUntil: "networkidle" });
  const mascot = page.locator(".mascot-launcher svg.mascot");
  await page
    .locator("form")
    .filter({ hasText: "Add to cart" })
    .getByRole("button", { name: "Add to cart" })
    .click();
  await expect(mascot).toHaveAttribute("data-state", "excited");
  await expect(mascot).toHaveAttribute("data-state", "idle", { timeout: 6000 });
});

test("Meet SVARA plays each mood on request", async ({ page }) => {
  await page.goto("/our-story", { waitUntil: "networkidle" });
  const stage = page.locator('section[aria-labelledby="meet-svara-heading"] svg.mascot');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-state", "idle");
  await page.getByRole("button", { name: "Thinking", exact: true }).click();
  await expect(stage).toHaveAttribute("data-state", "thinking");
  await expect(page.getByRole("button", { name: "Thinking", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Greeting", exact: true }).click();
  await expect(stage).toHaveAttribute("data-state", "greeting");
  // A one-shot mood settles back to idle on its own.
  await expect(stage).toHaveAttribute("data-state", "idle", { timeout: 6000 });
});

/** SVARA's launcher position relative to where it started. */
async function svaraOffset(page: import("@playwright/test").Page, from: { x: number; y: number }) {
  const box = (await page.locator(".mascot-launcher").boundingBox())!;
  return { dx: Math.round(box.x - from.x), dy: Math.round(box.y - from.y) };
}

async function svaraAtRest(page: import("@playwright/test").Page) {
  await page.addInitScript(() => window.sessionStorage.setItem("svara:mascot-welcomed", "1"));
  await page.goto("/our-story", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 2600));
  await page.waitForTimeout(800);
  return (await page.locator(".mascot-launcher").boundingBox())!;
}

test("SVARA physically follows the cursor, within bounds, and returns to rest", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Physical following is for fine pointers.");
  const rest = await svaraAtRest(page);
  await page.mouse.move(700, 300, { steps: 6 });
  await expect.poll(async () => (await svaraOffset(page, rest)).dx).toBeLessThan(-150);
  const moved = await svaraOffset(page, rest);
  expect(moved.dy).toBeLessThan(-100);
  // The far corner: never beyond the configured travel (300 left, 220 up).
  await page.mouse.move(2, 2, { steps: 6 });
  await page.waitForTimeout(900);
  const far = await svaraOffset(page, rest);
  expect(far.dx).toBeGreaterThanOrEqual(-301);
  expect(far.dy).toBeGreaterThanOrEqual(-221);
  // A pause: SVARA settles back home.
  await expect
    .poll(async () => svaraOffset(page, rest), { timeout: 5000 })
    .toEqual({ dx: 0, dy: 0 });
});

test("SVARA goes home when the pointer leaves the window or rests on a control", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Physical following is for fine pointers.");
  const rest = await svaraAtRest(page);
  await page.mouse.move(700, 300, { steps: 6 });
  await expect.poll(async () => (await svaraOffset(page, rest)).dx).toBeLessThan(-150);
  await page.evaluate(() =>
    document.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: null })),
  );
  await expect
    .poll(async () => svaraOffset(page, rest), { timeout: 3000 })
    .toEqual({ dx: 0, dy: 0 });

  await page.mouse.move(700, 300, { steps: 6 });
  await expect.poll(async () => (await svaraOffset(page, rest)).dx).toBeLessThan(-150);
  await page.getByRole("button", { name: "Thinking", exact: true }).hover();
  await expect
    .poll(async () => svaraOffset(page, rest), { timeout: 3000 })
    .toEqual({ dx: 0, dy: 0 });
});

test("while roaming SVARA never intercepts the page, and stops animating once settled", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Physical following is for fine pointers.");
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    (window as unknown as { __frames: number }).__frames = 0;
    window.requestAnimationFrame = (callback) => {
      (window as unknown as { __frames: number }).__frames += 1;
      return original(callback);
    };
  });
  const rest = await svaraAtRest(page);
  await page.mouse.move(700, 300, { steps: 6 });
  await expect.poll(async () => (await svaraOffset(page, rest)).dx).toBeLessThan(-150);
  const companion = page.locator(".mascot-companion");
  await expect(companion).toHaveAttribute("data-roaming", "");
  // What lies under SVARA's centre is the page, not SVARA.
  const underneath = await page.locator(".mascot-launcher").evaluate((launcher) => {
    const box = launcher.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return hit ? launcher.closest(".mascot-companion")!.contains(hit) : false;
  });
  expect(underneath).toBe(false);
  // Once home and still, no animation frames keep running.
  await expect
    .poll(async () => svaraOffset(page, rest), { timeout: 5000 })
    .toEqual({ dx: 0, dy: 0 });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => (window as unknown as { __frames: number }).__frames);
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => (window as unknown as { __frames: number }).__frames);
  expect(after - before).toBeLessThan(3);
});

test("SVARA holds still at home while its panel is open", async ({ page, isMobile }) => {
  test.skip(isMobile, "Physical following is for fine pointers.");
  const rest = await svaraAtRest(page);
  await page.getByRole("button", { name: /Open SVARA/ }).click();
  await page.mouse.move(700, 300, { steps: 6 });
  await page.waitForTimeout(900);
  expect(await svaraOffset(page, rest)).toEqual({ dx: 0, dy: 0 });
});

test("a section note appears once, can be dismissed, and reopens in the panel", async ({
  page,
  isMobile,
}) => {
  // On phones SVARA is still tucked away near the top, so use the farm's next section.
  const [anchor, text] = isMobile
    ? ["#landscape-heading", "The seasons decide"]
    : ["#monograph-heading", "open rows of red soil"];
  // A returning visitor in this session: no welcome greeting competing with the note.
  await page.addInitScript(() => window.sessionStorage.setItem("svara:mascot-welcomed", "1"));
  await page.goto("/farm", { waitUntil: "networkidle" });
  const toMonograph = () =>
    page.evaluate((selector) => {
      const heading = document.querySelector(selector)!;
      window.scrollTo(
        0,
        heading.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45,
      );
    }, anchor);
  await toMonograph();
  const note = page.locator(".mascot-note");
  await expect(note).toContainText(text, { timeout: 4000 });
  await expect(page.locator(".mascot-launcher svg.mascot")).toHaveAttribute(
    "data-state",
    "explaining",
  );
  await note.getByRole("button", { name: "Dismiss SVARA’s note" }).click();
  await expect(note).toHaveCount(0);
  // Back to the same section: no repeat.
  await page.evaluate(() => window.scrollBy(0, -500));
  await toMonograph();
  await page.waitForTimeout(1500);
  await expect(note).toHaveCount(0);
  // The note is still there to read, inside SVARA's panel.
  await page.getByRole("button", { name: /Open SVARA/ }).click();
  await expect(page.getByRole("dialog", { name: "Hello, I’m SVARA." })).toContainText(text);
});

test("no note bubble opens over SVARA's own panel", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await page.getByRole("button", { name: /Open SVARA/ }).click();
  await page.evaluate(() => {
    const heading = document.querySelector("#leaf-heading")!;
    window.scrollTo(
      0,
      heading.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45,
    );
  });
  await page.waitForTimeout(1600);
  await expect(page.locator(".mascot-note")).toHaveCount(0);
});

test("the header marks the current page with its botanical vein", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop navigation is shown from the xl breakpoint.");
  await page.goto("/our-story", { waitUntil: "networkidle" });
  const current = page.locator("header nav[aria-label=Primary] a[aria-current=page]");
  await expect(current).toHaveText("Our Story");
});

test("unknown routes return the not-found page", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("off the farm");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("all content is visible without animation", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const hidden = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
          (element) => getComputedStyle(element).opacity === "0",
        ).length,
    );
    expect(hidden).toBe(0);
    await page.goto("/journey", { waitUntil: "load" });
    // No cursor following with reduced motion: SVARA does not move.
    const start = (await page.locator(".mascot-launcher").boundingBox())!;
    await page.mouse.move(600, 300, { steps: 6 });
    await page.waitForTimeout(700);
    const end = (await page.locator(".mascot-launcher").boundingBox())!;
    expect(Math.round(end.x - start.x)).toBe(0);
    // No cursor tracking with reduced motion: SVARA's gaze stays at rest.
    await page.mouse.move(40, 400, { steps: 4 });
    await page.waitForTimeout(400);
    expect(
      await page
        .locator(".mascot-companion")
        .evaluate((el) => el.style.getPropertyValue("--mascot-gx")),
    ).toBe("");
    // SVARA holds its pose: no keyframe animation runs on the character.
    const mascotAnimations = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll<SVGElement>(".mascot *"))
          .map((element) => getComputedStyle(element).animationName)
          .filter((name) => name && name !== "none").length,
    );
    expect(mascotAnimations).toBe(0);
    // The pinned ingredient film gives way to its static row.
    await expect(page.locator(".ingredient-film").first()).toBeAttached();
    await expect(page.locator(".ingredient-film").first()).toBeHidden();
  });
});

test("scroll reveals mark sections as revealed", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const heading = page.locator("#ritual-heading");
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveAttribute("data-revealed", "");
});
