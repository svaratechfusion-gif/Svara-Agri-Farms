import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { CART_BUTTON, orderable } from "./support/catalogue";

/**
 * Cart → Proceed to order → customer details → Place order on WhatsApp →
 * the order confirmation. WhatsApp is the order channel: the order gets an ID,
 * WhatsApp opens with it, the cart is emptied and the confirmation shows the
 * order as placed. WhatsApp itself is not visited — new tabs to wa.me get a
 * stand-in page, and we read the URL they were given.
 */

test.skip(!orderable, "No size has a price and is available yet.");

const CART_KEY = "svara.cart.v1";
const NOT_AVAILABLE =
  "This product is no longer available to order. Please remove it from your cart before continuing.";
const SUBMITTED_KEY = "svara.submitted-order.v1";
const ORDER_ID = /^SVARA-\d{8}-[0-9A-HJKMNP-TV-Z]{6}$/;
// The confirmation thanks the customer; it never claims payment or a settled delivery.
const FALSE_CLAIMS =
  /payment (received|successful|confirmed)|\bpaid\b|delivery (is )?(confirmed|scheduled)|delivered/i;

const DETAILS = {
  "Full name": "Lakshmi Venkata Subramanya Rao",
  "Mobile number": "98765 43210",
  Address:
    "Flat 4B, Sri Lakshmi Nilayam Apartments\n12-34/5 Temple Street, near Gandhi Circle, Rayachoti Road",
  City: "Kadapa",
  "PIN code": "516001",
};

const SUCCESS_HEADING = "Thank you for your order!";
const SUCCESS_MESSAGE =
  "Your order has been received successfully. Our team will contact you shortly to confirm your order and delivery details.";

const headerCount = (page: Page) => page.getByRole("button", { name: CART_BUTTON }).first();
const placeOrder = (page: Page) => page.getByRole("button", { name: /Place order on WhatsApp/ });
const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });
const successHeading = (page: Page) => page.getByRole("heading", { name: SUCCESS_HEADING });
const storedCartLines = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '{"lines":[]}').lines,
    CART_KEY,
  );
const storedOrder = (page: Page) =>
  page.evaluate((key) => window.sessionStorage.getItem(key), SUBMITTED_KEY);

async function seedCart(page: Page, lines: unknown[]) {
  await page.addInitScript(
    ([key, value]) => {
      if (!window.sessionStorage.getItem("seeded")) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.setItem("seeded", "1");
      }
    },
    [CART_KEY, JSON.stringify({ lines })] as const,
  );
}

async function fillDetails(page: Page, overrides: Partial<typeof DETAILS> = {}) {
  for (const [name, value] of Object.entries({ ...DETAILS, ...overrides })) {
    await field(page, name).fill(value);
  }
  await page.getByRole("combobox", { name: "State", exact: true }).selectOption("Andhra Pradesh");
}

/** Records every WhatsApp link the page opens, without visiting WhatsApp. */
async function watchTabs(context: BrowserContext) {
  const opened: string[] = [];
  await context.route("https://wa.me/**", (route) => {
    opened.push(route.request().url());
    return route.fulfill({ contentType: "text/html", body: "<title>WhatsApp</title>" });
  });
  return opened;
}

const TWO_PRODUCTS = [
  { productSlug: "moringa-powder", variantId: "moringa-powder-100g", quantity: 2 },
  { productSlug: "carrot-powder", variantId: "carrot-powder-250g", quantity: 1 },
];

test("cart → details → WhatsApp → confirmation, under one order ID, with the cart emptied", async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  const opened = await watchTabs(context);
  await seedCart(page, TWO_PRODUCTS);

  await page.goto("/cart", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Proceed to order" }).click();
  await page.waitForURL("**/order");

  // The order is in view beside the form: sizes, quantities, unit prices, totals.
  const summary = page.getByRole("region", { name: "Your order" });
  await expect(summary).toContainText("SVARA Moringa Powder");
  await expect(summary).toContainText("100 g pouch × 2 · ₹250 each");
  await expect(summary).toContainText("₹500");
  await expect(summary).toContainText("250 g pouch × 1 · ₹350 each");
  await expect(summary).toContainText(/Subtotal\s*₹850/);
  await expect(summary).toContainText(/Delivery\s*To be confirmed/);
  await expect(summary).toContainText(/Total before delivery\s*₹850/);

  // Nothing filled in: every required field explains itself, and WhatsApp stays closed.
  await placeOrder(page).click();
  const problems = page.getByRole("alert").filter({ hasText: "Please check these details" });
  await expect(problems).toBeFocused();
  for (const message of [
    "Please enter your full name.",
    "Please enter a valid 10-digit Indian mobile number.",
    "Please enter your delivery address.",
    "Please enter your city.",
    "Please select your state.",
    "Please enter a valid 6-digit PIN code.",
  ]) {
    await expect(problems).toContainText(message);
  }
  await expect(field(page, "Full name")).toHaveAttribute("aria-invalid", "true");
  expect(opened).toEqual([]);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations.map((v) => v.id)).toEqual([]);

  // A malformed mobile number and PIN code are refused; what was typed stays.
  await fillDetails(page, { "Mobile number": "12345", "PIN code": "01234" });
  await placeOrder(page).click();
  await expect(field(page, "Mobile number")).toHaveAttribute("aria-invalid", "true");
  await expect(field(page, "PIN code")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#order-mobile-error")).toHaveText(
    "Please enter a valid 10-digit Indian mobile number.",
  );
  await expect(page.locator("#order-pinCode-error")).toHaveText(
    "Please enter a valid 6-digit PIN code.",
  );
  await expect(field(page, "Full name")).toHaveValue(DETAILS["Full name"]);
  expect(opened).toEqual([]);
  await expect(successHeading(page)).toHaveCount(0);

  // Back to the cart and forward again: the cart and the typed details are kept.
  await page.getByRole("link", { name: "Back to cart" }).click();
  await page.waitForURL("**/cart");
  await expect(headerCount(page)).toHaveAccessibleName(/\b3 items/);
  await page.getByRole("link", { name: "Proceed to order" }).click();
  await page.waitForURL("**/order");
  await expect(field(page, "City")).toHaveValue("Kadapa");
  await expect(page.getByRole("combobox", { name: "State" })).toHaveValue("Andhra Pradesh");

  // Valid details: WhatsApp opens, once, with everything written in.
  await field(page, "Mobile number").fill(DETAILS["Mobile number"]);
  await field(page, "PIN code").fill(DETAILS["PIN code"]);
  await field(page, "Landmark (optional)").fill("Opposite the old banyan tree");
  const [tab] = await Promise.all([context.waitForEvent("page"), placeOrder(page).click()]);
  const url = tab.url();
  await tab.close();
  expect(url).toMatch(/^https:\/\/wa\.me\/917780262442\?text=/);
  expect(url.split("?text=")[1]).not.toMatch(/[\s₹—&#]/);
  const message = new URL(url).searchParams.get("text")!;
  const orderId = message.split("\n")[2].replace("ORDER ID: ", "");
  expect(orderId).toMatch(ORDER_ID);
  expect(message).toBe(
    [
      "Hello SVARA Agri Farms,",
      "",
      `ORDER ID: ${orderId}`,
      "",
      "I would like to place an order.",
      "",
      "CUSTOMER DETAILS",
      "----------------",
      "Name: Lakshmi Venkata Subramanya Rao",
      "Mobile: +91 98765 43210",
      "Address: Flat 4B, Sri Lakshmi Nilayam Apartments, 12-34/5 Temple Street, near Gandhi Circle, Rayachoti Road",
      "City: Kadapa",
      "State: Andhra Pradesh",
      "PIN Code: 516001",
      "Landmark: Opposite the old banyan tree",
      "Delivery Instructions: Not provided",
      "",
      "ORDER DETAILS",
      "-------------",
      "1. SVARA Moringa Powder",
      "   Size: 100 g",
      "   Quantity: 2",
      "   Unit Price: ₹250",
      "   Line Total: ₹500",
      "",
      "2. Carrot Powder",
      "   Size: 250 g",
      "   Quantity: 1",
      "   Unit Price: ₹350",
      "   Line Total: ₹350",
      "",
      "Subtotal: ₹850",
      "",
      "Delivery charges, if any, to be confirmed.",
      "",
      "Total before delivery: ₹850",
      "",
      "Please confirm availability and delivery details.",
      "",
      "Thank you,",
      "SVARA Agri Farms",
    ].join("\n"),
  );

  // The confirmation: the same order ID, the order exactly as placed, nothing more claimed.
  await page.waitForURL("**/order/confirmation");
  await expect(successHeading(page)).toBeFocused();
  const main = page.locator("main");
  await expect(main).toContainText(SUCCESS_MESSAGE);
  await expect(page.locator("#order-id")).toHaveText(orderId);
  await expect(main).toContainText("Your order details have also been prepared in WhatsApp.");
  await expect(main).not.toContainText(FALSE_CLAIMS);
  const placed = page.getByRole("region", { name: "Order summary" });
  await expect(placed.getByRole("listitem")).toHaveCount(2);
  await expect(placed).toContainText("SVARA Moringa Powder");
  await expect(placed).toContainText("100 g pouch × 2 · ₹250 each");
  await expect(placed).toContainText("₹500");
  await expect(placed).toContainText("Carrot Powder");
  await expect(placed).toContainText("250 g pouch × 1 · ₹350 each");
  await expect(placed).toContainText(/Subtotal\s*₹850/);
  await expect(placed).toContainText(/Delivery\s*To be confirmed/);
  await expect(placed).toContainText(/Total before delivery\s*₹850/);
  await expect(page.getByRole("region", { name: "Delivering to" })).toContainText(
    "Lakshmi Venkata Subramanya Rao",
  );
  expect(opened).toEqual([url]);

  // The cart is empty — in the header and on the device.
  await expect(headerCount(page)).toHaveAccessibleName(/\b0 items/);
  expect(await storedCartLines(page)).toEqual([]);

  // Continue shopping and View products come first; WhatsApp is a quiet text link.
  await expect(main.getByRole("link", { name: "Continue shopping" })).toHaveAttribute(
    "href",
    "/shop",
  );
  await expect(main.getByRole("link", { name: "View products" })).toHaveAttribute(
    "href",
    "/products",
  );
  await expect(main.getByRole("link", { name: /Open WhatsApp again/ })).toHaveCount(0);

  // Reopening WhatsApp: the very same link, the same order ID.
  const again = main.getByRole("link", { name: /Open the WhatsApp message again/ });
  await expect(again).toHaveAttribute("href", url);
  await expect(again).toHaveAttribute("target", "_blank");
  const [reopened] = await Promise.all([context.waitForEvent("page"), again.click()]);
  expect(reopened.url()).toBe(url);
  await reopened.close();
  expect(opened).toEqual([url, url]);

  // A refresh: the same order, the same ID — nothing new is made.
  await page.reload({ waitUntil: "load" });
  await expect(page.locator("#order-id")).toHaveText(orderId);
  await expect(placed.getByRole("listitem")).toHaveCount(2);
  expect(JSON.parse((await storedOrder(page))!).orderId).toBe(orderId);
  expect(opened).toEqual([url, url]);

  // Back leads past the order form to the cart — empty, and it stays empty.
  await page.goBack();
  await page.waitForURL("**/cart");
  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
  await page.goForward();
  await page.waitForURL("**/order/confirmation");
  await expect(page.locator("#order-id")).toHaveText(orderId);
  await page.locator("main").getByRole("link", { name: "Continue shopping" }).click();
  await page.waitForURL("**/shop");
  await expect(headerCount(page)).toHaveAccessibleName(/\b0 items/);
  await page.goto("/cart", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
  await page.goto("/order", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
  expect(await storedCartLines(page)).toEqual([]);
  expect(opened).toEqual([url, url]);
});

test("a confirmation with no order placed in this session shows no order", async ({ page }) => {
  await page.goto("/order/confirmation", { waitUntil: "load" });
  await expect(page.getByRole("heading", { name: "No recent order to show." })).toBeVisible();
  await expect(successHeading(page)).toHaveCount(0);
  await expect(page.locator("#order-id")).toHaveCount(0);
});

test("invalid details make no order: no ID, WhatsApp closed, the cart kept", async ({
  page,
  context,
}) => {
  const opened = await watchTabs(context);
  await seedCart(page, TWO_PRODUCTS);
  await page.goto("/order", { waitUntil: "networkidle" });
  await fillDetails(page, { "Mobile number": "12345" });
  await placeOrder(page).click();
  await expect(field(page, "Mobile number")).toHaveAttribute("aria-invalid", "true");
  expect(opened).toEqual([]);
  expect(await storedOrder(page)).toBeNull();
  expect(await storedCartLines(page)).toHaveLength(2);
  await expect(headerCount(page)).toHaveAccessibleName(/\b3 items/);
  await expect(page).toHaveURL(/\/order$/);
});

test("a changed price blocks the order until it is accepted, then only the new price is sent", async ({
  page,
  context,
}) => {
  const opened = await watchTabs(context);
  await seedCart(page, [{ ...TWO_PRODUCTS[0], seenPriceMinor: 19_900 }]);
  await page.goto("/order", { waitUntil: "networkidle" });
  await fillDetails(page);
  const notice = page.locator("aside").getByRole("alert");
  await expect(notice).toContainText("Price updated");
  await expect(notice).toContainText("SVARA Moringa Powder, 100 g — was ₹199, now ₹250");

  await placeOrder(page).click();
  await expect(notice).toBeFocused();
  expect(opened).toEqual([]);
  await expect(successHeading(page)).toHaveCount(0);
  expect(await storedOrder(page)).toBeNull();
  expect(await storedCartLines(page)).toHaveLength(1);

  await page.getByRole("button", { name: "Accept updated prices" }).click();
  await expect(notice).toHaveCount(0);
  const [tab] = await Promise.all([context.waitForEvent("page"), placeOrder(page).click()]);
  const message = new URL(tab.url()).searchParams.get("text")!;
  expect(message).toContain("Unit Price: ₹250\n   Line Total: ₹500");
  expect(message).not.toContain("₹199");
  await page.waitForURL("**/order/confirmation");
  await expect(page.getByRole("region", { name: "Order summary" })).toContainText(
    "100 g pouch × 2 · ₹250 each",
  );
});

test("an unavailable product or size blocks the order", async ({ page, context }) => {
  const opened = await watchTabs(context);
  await seedCart(page, [
    TWO_PRODUCTS[0],
    { productSlug: "moringa-powder", variantId: "moringa-powder-500g", quantity: 1 },
  ]);
  await page.goto("/order", { waitUntil: "networkidle" });
  await fillDetails(page);
  const notice = page.locator("aside").getByRole("alert");
  await expect(notice).toContainText(NOT_AVAILABLE);
  await placeOrder(page).click();
  await expect(notice).toBeFocused();
  expect(opened).toEqual([]);
  await expect(successHeading(page)).toHaveCount(0);
  expect(await storedOrder(page)).toBeNull();
  expect(await storedCartLines(page)).toHaveLength(2);
  await notice.getByRole("link", { name: "Review your cart" }).click();
  await page.waitForURL("**/cart");
});

test("with an empty cart there is no order form, only the way to the products", async ({
  page,
}) => {
  await page.goto("/order", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
  await expect(
    page.locator("main").getByRole("link", { name: "Explore products" }),
  ).toHaveAttribute("href", "/shop");
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(placeOrder(page)).toHaveCount(0);
});

test("SVARA never covers the form, the order or the button", async ({ page, isMobile }) => {
  await page.addInitScript(() => window.sessionStorage.setItem("svara:mascot-welcomed", "1"));
  await seedCart(page, TWO_PRODUCTS);
  await page.goto("/order", { waitUntil: "networkidle" });
  const companion = page.getByRole("button", { name: /Open SVARA/ });
  if (isMobile) {
    // Phones and tablets: the keyboard and the form take the screen; SVARA stays away.
    await expect(companion).toBeHidden();
    return;
  }
  for (const y of [0, 400, 900]) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(400);
    const mascot = await companion.boundingBox();
    if (!mascot) continue;
    for (const target of [
      page.locator("#order-form"),
      page.getByRole("region", { name: "Your order" }),
      placeOrder(page),
    ]) {
      const box = await target.boundingBox();
      if (!box) continue;
      const overlaps =
        mascot.x < box.x + box.width &&
        box.x < mascot.x + mascot.width &&
        mascot.y < box.y + box.height &&
        box.y < mascot.y + mascot.height;
      expect(overlaps, `scroll ${y}`).toBe(false);
    }
  }
  // Its note for this page waits rather than cover the order; it is in SVARA's panel.
  await page.locator("#order-heading").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(800);
  await companion.click();
  await expect(page.getByRole("dialog", { name: /Hello, I.m SVARA/ })).toContainText(
    /Almost there!|Once you.re ready, I.ll prepare your order for WhatsApp/,
  );
});

test.describe("the confirmation", () => {
  test.use({ reducedMotion: "reduce" });

  async function reachConfirmation(page: Page, context: BrowserContext) {
    await watchTabs(context);
    await seedCart(page, TWO_PRODUCTS);
    await page.goto("/order", { waitUntil: "networkidle" });
    await fillDetails(page);
    const [tab] = await Promise.all([context.waitForEvent("page"), placeOrder(page).click()]);
    await tab.close();
    await page.waitForURL("**/order/confirmation");
    await expect(successHeading(page)).toBeFocused();
  }

  test("is fully readable and accessible without motion", async ({
    page,
    context,
    browserName,
  }) => {
    await reachConfirmation(page, context);
    // Nothing animates: the mark is simply there, its tick fully drawn.
    const tick = page.locator(".order-success__tick");
    await expect(tick).toBeVisible();
    expect(
      await tick.evaluate((el) => ({
        animations: el.getAnimations().length,
        offset: getComputedStyle(el).strokeDashoffset,
      })),
    ).toEqual({ animations: 0, offset: "0px" });
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(audit.violations.map((v) => v.id)).toEqual([]);
    // Keyboard: from the heading, Tab reaches the WhatsApp link, then the two ways on.
    // (Safari moves between links with Option+Tab; plain Tab skips them.)
    const next = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await page.keyboard.press(next);
    await expect(page.getByRole("link", { name: /Open the WhatsApp message again/ })).toBeFocused();
    await page.keyboard.press(next);
    await expect(
      page.locator("main").getByRole("link", { name: "Continue shopping" }),
    ).toBeFocused();
    await page.keyboard.press(next);
    await expect(page.locator("main").getByRole("link", { name: "View products" })).toBeFocused();
  });

  for (const [width, height] of [
    [1440, 900],
    [1200, 800],
    [768, 1024],
    [390, 844],
  ] as const) {
    test(`fits at ${width}px, clear of SVARA`, async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Sets its own viewports.");
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => window.sessionStorage.setItem("svara:mascot-welcomed", "1"));
      await reachConfirmation(page, context);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      const main = page.locator("main");
      const companion = page.getByRole("button", { name: /Open SVARA/ });
      const mascot = (await companion.isVisible()) ? await companion.boundingBox() : null;
      for (const target of [
        successHeading(page),
        page.locator("#order-id"),
        page.getByRole("region", { name: "Order summary" }),
        page.getByRole("region", { name: "Delivering to" }),
        main.getByRole("link", { name: /Open the WhatsApp message again/ }),
        main.getByRole("link", { name: "Continue shopping" }),
        main.getByRole("link", { name: "View products" }),
      ]) {
        await target.scrollIntoViewIfNeeded();
        const box = (await target.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        if (mascot) {
          const now = (await companion.boundingBox())!;
          const overlaps =
            now.x < box.x + box.width &&
            box.x < now.x + now.width &&
            now.y < box.y + box.height &&
            box.y < now.y + now.height;
          expect(overlaps).toBe(false);
        }
      }
    });
  }
});
