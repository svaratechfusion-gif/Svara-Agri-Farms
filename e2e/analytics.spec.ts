import { expect, test, type Page } from "@playwright/test";

import { CART_BUTTON, orderable } from "./support/catalogue";

/**
 * Analytics: what the site pushes to the Google Tag Manager dataLayer along
 * the real funnel — page views on client-side navigation (each page once),
 * the ecommerce events, the WhatsApp order as the conversion with nothing
 * about the customer in it, and SVARA's WhatsApp link. Locally GTM itself is
 * not loaded (see src/lib/analytics/config.ts); the dataLayer is.
 */

test.skip(!orderable, "No size has a price and is available yet.");

type Entry = Record<string, unknown> & { event: string };

/** The site's own events, in order (GTM's internal `gtm.*` events left out). */
const events = (page: Page) =>
  page.evaluate(() =>
    ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []).filter(
      (entry): entry is Entry =>
        typeof entry === "object" &&
        entry !== null &&
        "event" in entry &&
        !String((entry as Entry).event).startsWith("gtm."),
    ),
  );

const named = async (page: Page, name: string) =>
  (await events(page)).filter((entry) => entry.event === name);

const pageViews = async (page: Page) =>
  (await named(page, "page_view")).map((entry) => entry.page_path);

test.beforeEach(async ({ page, context }) => {
  // A returning visitor: no first-visit welcome over the controls.
  await page.addInitScript(() => window.sessionStorage.setItem("svara:mascot-welcomed", "1"));
  // WhatsApp itself is never visited; new tabs get a stand-in page.
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>WhatsApp</title>" }),
  );
});

test("GTM and GA4 are installed once each, and not loaded on a local host", async ({ page }) => {
  const gtmRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("googletagmanager.com")) gtmRequests.push(request.url());
  });
  const response = await page.goto("/", { waitUntil: "networkidle" });
  const html = await response!.text();
  // One noscript iframe in the markup (the RSC payload repeats its props as data).
  expect(
    html.match(
      /<iframe[^>]*src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-5PKWRX73"/g,
    ),
  ).toHaveLength(1);
  expect(await page.locator("script#google-tag-manager").count()).toBe(1);
  // GA4: one gtag snippet, for the one measurement ID.
  expect(await page.locator("script#google-analytics").count()).toBe(1);
  expect(html.match(/gtag\('config',"G-[A-Z0-9]+"\)/g)).toEqual([`gtag('config',"G-7X6NW0X8MJ")`]);
  expect(await page.evaluate(() => typeof (window as { gtag?: unknown }).gtag)).toBe("undefined");
  expect(gtmRequests).toEqual([]);
});

test("each page counts one page_view, including client-side navigation", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect.poll(() => pageViews(page)).toEqual(["/"]);

  const footer = page.getByRole("contentinfo");
  const visit = async (link: string, path: string) => {
    await footer.getByRole("link", { name: link, exact: true }).click();
    await page.waitForURL(`**${path}`);
  };
  await visit("All Products", "/products");
  await visit("Moringa Powder", "/products/moringa-powder");
  await visit("Shop", "/shop");
  await page.goto("/cart", { waitUntil: "networkidle" }); // a full load starts a fresh count
  await expect.poll(() => pageViews(page)).toEqual(["/cart"]);
  await visit("Our Story", "/our-story");
  await expect.poll(() => pageViews(page)).toEqual(["/cart", "/our-story"]);

  // Every view carries its own page's address and title.
  const [, story] = await named(page, "page_view");
  expect(story.page_location).toBe(page.url());
  expect(story.page_title).toBe(await page.title());

  // A moment later there is still exactly one per page.
  await page.waitForTimeout(500);
  expect(await pageViews(page)).toEqual(["/cart", "/our-story"]);
});

test("view_item follows its page_view, again on every return to the product", async ({ page }) => {
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  const footer = page.getByRole("contentinfo");
  await footer.getByRole("link", { name: "Shop", exact: true }).click();
  await page.waitForURL("**/shop");
  // Next.js may keep the product page mounted in the background: coming back still counts.
  await footer.getByRole("link", { name: "Moringa Powder", exact: true }).click();
  await page.waitForURL("**/products/moringa-powder");
  await expect
    .poll(async () =>
      (await events(page))
        .filter((entry) => entry.event === "page_view" || entry.event === "view_item")
        .map((entry) => `${entry.event} ${entry.page_path ?? ""}`.trim()),
    )
    .toEqual([
      "page_view /products/moringa-powder",
      "view_item",
      "page_view /shop",
      "page_view /products/moringa-powder",
      "view_item",
    ]);
});

test("view_cart counts each visit to the cart, including a return by client-side navigation", async ({
  page,
}) => {
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  const purchase = page.locator("form").filter({ hasText: "Add to cart" }).first();
  await purchase.getByRole("button", { name: "Add to cart" }).click();
  const review = page.getByRole("link", { name: "Review your order" });
  await expect(page.getByRole("button", { name: CART_BUTTON }).first()).toHaveAccessibleName(
    /\b1 item/,
  );
  // The header hides while reading downward; scrolling up reveals it again.
  const openCart = async () => {
    await page.evaluate(() => window.scrollBy(0, -400));
    await page.getByRole("button", { name: CART_BUTTON }).first().click();
  };
  await openCart();
  await review.click();
  await page.waitForURL("**/cart");
  await expect.poll(async () => (await named(page, "view_cart")).length).toBe(1);

  await page.getByRole("contentinfo").getByRole("link", { name: "Shop", exact: true }).click();
  await page.waitForURL("**/shop");
  await openCart();
  await review.click();
  await page.waitForURL("**/cart");
  await expect.poll(async () => (await named(page, "view_cart")).length).toBe(2);
  await page.waitForTimeout(500);
  expect(await named(page, "view_cart")).toHaveLength(2);
});

test("the funnel pushes GA4 ecommerce events, and the WhatsApp order holds nothing personal", async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });

  // view_item: the product, at the size the page opens on.
  await expect.poll(async () => (await named(page, "view_item")).length).toBe(1);
  const [viewItem] = await named(page, "view_item");
  expect(viewItem.ecommerce).toMatchObject({
    currency: "INR",
    items: [{ item_id: "moringa-powder", item_variant: "100 g", quantity: 1, currency: "INR" }],
  });

  // select_item: the customer chooses 250 g.
  const purchase = page.locator("form").filter({ hasText: "Add to cart" }).first();
  await purchase.getByRole("radio", { name: /250 g pouch/ }).check({ force: true });
  const [selectItem] = await named(page, "select_item");
  expect(selectItem.ecommerce).toMatchObject({
    item_list_name: "Product page",
    items: [{ item_id: "moringa-powder", item_variant: "250 g" }],
  });

  // add_to_cart: 2 × 250 g, valued from the catalogue.
  await purchase.getByRole("button", { name: "Increase quantity" }).click();
  await purchase.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: CART_BUTTON }).first()).toHaveAccessibleName(
    /\b2 items/,
  );
  const [addToCart] = await named(page, "add_to_cart");
  const unit = (addToCart.ecommerce as { items: { price: number }[] }).items[0].price;
  expect(unit).toBeGreaterThan(0);
  expect(addToCart.ecommerce).toMatchObject({
    currency: "INR",
    value: unit * 2,
    items: [{ item_variant: "250 g", quantity: 2, price: unit }],
  });

  // view_cart, once; a quantity change and a removal are cart events, not views.
  await page.goto("/cart", { waitUntil: "networkidle" });
  await expect.poll(async () => (await named(page, "view_cart")).length).toBe(1);
  const items = page.locator("main ul").first().getByRole("listitem");
  await items.first().getByRole("button", { name: "Increase quantity" }).click();
  await expect
    .poll(async () => (await named(page, "add_to_cart")).map((entry) => entry.ecommerce))
    .toEqual([expect.objectContaining({ items: [expect.objectContaining({ quantity: 1 })] })]);
  await items.first().getByRole("button", { name: "Decrease quantity" }).click();
  await expect.poll(async () => (await named(page, "remove_from_cart")).length).toBe(1);
  expect(await named(page, "view_cart")).toHaveLength(1);

  // The conversion: a valid order handed to WhatsApp.
  await page.getByRole("link", { name: "Proceed to order" }).click();
  await page.waitForURL("**/order");
  const field = (name: string) => page.getByRole("textbox", { name, exact: true });
  await field("Full name").fill("Lakshmi Rao");
  await field("Mobile number").fill("98765 43210");
  await field("Address").fill("12, Temple Street");
  await field("City").fill("Kadapa");
  await page.getByRole("combobox", { name: "State", exact: true }).selectOption("Telangana");
  await field("PIN code").fill("500001");
  const [whatsapp] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: /Place order on WhatsApp/ }).click(),
  ]);
  await whatsapp.close();
  await page.waitForURL("**/order/confirmation");

  const [started] = await named(page, "whatsapp_order_started");
  expect(started).toMatchObject({
    item_count: 1,
    total_quantity: 2,
    cart_value: unit * 2,
    currency: "INR",
    product_ids: "moringa-powder",
    product_names: "SVARA Moringa Powder",
    selected_sizes: "250 g",
    ecommerce: { currency: "INR", value: unit * 2 },
  });

  // Nothing about the customer anywhere in the dataLayer, and no purchase.
  const everything = JSON.stringify(
    await page.evaluate(() => (window as unknown as { dataLayer: unknown[] }).dataLayer),
  );
  for (const personal of ["Lakshmi", "98765", "43210", "Temple", "Kadapa", "500001", "wa.me"]) {
    expect(everything).not.toContain(personal);
  }
  const names = (await events(page)).map((entry) => entry.event);
  expect(names).not.toContain("purchase");
  expect(names.filter((name) => name === "whatsapp_order_started")).toHaveLength(1);
});

test("SVARA's WhatsApp link counts as mascot_whatsapp_click", async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(isMobile, "SVARA's panel is covered by the mascot specs on phones.");
  await page.goto("/journey", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.getByRole("button", { name: /Open SVARA/ }).click();
  const panel = page.getByRole("dialog", { name: /Hello, I.m SVARA/ });
  expect(await named(page, "mascot_whatsapp_click")).toEqual([]); // opening is not a click on WhatsApp
  const [whatsapp] = await Promise.all([
    context.waitForEvent("page"),
    panel.getByRole("link", { name: /Chat with our team on WhatsApp/ }).click(),
  ]);
  await whatsapp.close();
  expect(await named(page, "mascot_whatsapp_click")).toEqual([
    { event: "mascot_whatsapp_click", mascot_location: "panel", page_path: "/journey" },
  ]);
});
