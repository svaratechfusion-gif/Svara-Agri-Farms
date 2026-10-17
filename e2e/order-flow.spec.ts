import { readdir } from "node:fs/promises";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { formatMoney, multiplyMoney } from "../src/lib/commerce/money";
import { CART_BUTTON, orderable } from "./support/catalogue";

/**
 * The whole path as a customer takes it today: product → size → cart →
 * Proceed to order → delivery details → Place order on WhatsApp, with the
 * details and the order written into the WhatsApp message under an order ID,
 * then the confirmation. No payment is taken or claimed — the team confirms
 * availability, delivery and payment in the chat. (The order page and the
 * confirmation are covered in depth by order-details.spec.ts.) The order
 * endpoint's own defences are tested at the end.
 */

const storeDir =
  process.env.ORDER_REQUESTS_STORE === "file" ? process.env.ORDER_REQUESTS_DIR : undefined;

test.skip(!orderable, "No size has a price and is available yet.");

const headerCount = (page: Page) => page.getByRole("button", { name: CART_BUTTON }).first();
const FALSE_CLAIMS =
  /payment (received|successful|confirmed)|\bpaid\b|delivery (is )?(confirmed|scheduled)|delivered/i;
const proceed = (page: Page) => page.getByRole("link", { name: "Proceed to order" });
const proceedBlocked = (page: Page) => page.getByRole("button", { name: "Proceed to order" });

test("a customer chooses sizes, reviews the cart, adds details and orders via WhatsApp", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  // WhatsApp itself is not visited: the new tab gets a stand-in page.
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>WhatsApp</title>" }),
  );

  // Moringa, 250 g × 2, from its page; a double click adds once.
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  const purchase = page.locator("form").filter({ hasText: "Add to cart" }).first();
  await purchase.getByRole("radio", { name: /250 g pouch/ }).check({ force: true });
  await purchase.getByRole("button", { name: "Increase quantity" }).click();
  await purchase.getByRole("button", { name: "Add to cart" }).dblclick();
  await expect(
    purchase.getByRole("status").filter({ hasText: "added to your cart" }),
  ).toContainText("2 × SVARA Moringa Powder, 250 g pouch");
  await expect(headerCount(page)).toHaveAccessibleName(/\b2 items/);

  // Ginger, 100 g × 1, and Carrot, 100 g × 1, from their cards.
  await page.goto("/products", { waitUntil: "networkidle" });
  for (const name of ["Ginger Powder", "Carrot Powder"]) {
    await page
      .getByRole("listitem")
      .filter({ hasText: name })
      .getByRole("button", { name: "Add to cart" })
      .click();
  }
  await expect(headerCount(page)).toHaveAccessibleName(/\b4 items/);

  // It survives a refresh.
  await page.reload({ waitUntil: "networkidle" });
  await expect(headerCount(page)).toHaveAccessibleName(/\b4 items/);

  // The cart: image, name, size, quantity, unit price and line total for each line.
  await page.goto("/cart", { waitUntil: "networkidle" });
  const items = page.locator("main ul").first().getByRole("listitem");
  await expect(items).toHaveCount(3);
  const moringa = items.filter({ hasText: "SVARA Moringa Powder" });
  await expect(moringa).toContainText("250 g pouch");
  await expect(moringa).toContainText("₹700");
  await expect(moringa).toContainText("₹350 each");
  await expect(moringa.getByRole("group", { name: /Quantity of/ })).toContainText("2");
  const summary = page.getByRole("region", { name: /Summary/ });
  await expect(summary).toContainText(/Subtotal\s*₹1,200/);

  // Change a quantity, remove a line: the totals follow at once.
  await items
    .filter({ hasText: "Ginger Powder" })
    .getByRole("button", { name: "Increase quantity" })
    .click();
  await expect(summary).toContainText(/Subtotal\s*₹1,450/);
  await items
    .filter({ hasText: "Carrot Powder" })
    .getByRole("button", { name: /^Remove/ })
    .click();
  await expect(items).toHaveCount(2);
  await expect(summary).toContainText(/Subtotal\s*₹1,200/);
  await expect(headerCount(page)).toHaveAccessibleName(/\b4 items/);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations.map((v) => v.id)).toEqual([]);

  // On to the order page: the same order, then the details, then WhatsApp.
  await proceed(page).click();
  await page.waitForURL("**/order");
  await expect(page.getByRole("region", { name: "Your order" })).toContainText(
    /Total before delivery\s*₹1,200/,
  );
  const field = (name: string) => page.getByRole("textbox", { name, exact: true });
  await field("Full name").fill("Lakshmi Rao");
  await field("Mobile number").fill("98765 43210");
  await field("Address").fill("12, Temple Street");
  await field("City").fill("Kadapa");
  await page.getByRole("combobox", { name: "State", exact: true }).selectOption("Telangana");
  await field("PIN code").fill("500001");
  const place = page.getByRole("button", { name: /Place order on WhatsApp/ });
  await place.focus();
  const [whatsapp] = await Promise.all([
    context.waitForEvent("page"),
    page.keyboard.press("Enter"),
  ]);
  const message = new URL(whatsapp.url()).searchParams.get("text")!;
  await whatsapp.close();
  expect(message).toContain("Name: Lakshmi Rao\nMobile: +91 98765 43210");
  expect(message).toContain(
    "1. SVARA Moringa Powder\n   Size: 250 g\n   Quantity: 2\n   Unit Price: ₹350\n   Line Total: ₹700",
  );
  expect(message).toContain(
    "2. Ginger Powder\n   Size: 100 g\n   Quantity: 2\n   Unit Price: ₹250\n   Line Total: ₹500",
  );
  expect(message).not.toContain("Carrot");
  expect(message).toContain("Subtotal: ₹1,200");

  // The order is placed: its confirmation, under the same ID, and an empty cart.
  const orderId = message.match(/^ORDER ID: (SVARA-\d{8}-\w{6})$/m)![1];
  await page.waitForURL("**/order/confirmation");
  await expect(page.locator("#order-id")).toHaveText(orderId);
  await expect(page.locator("main")).not.toContainText(FALSE_CLAIMS);
  await expect(headerCount(page)).toHaveAccessibleName(/\b0 items/);
});

test("a changed price must be accepted in the cart before ordering", async ({ page }) => {
  const { product, variant } = orderable!;
  const current = variant.price!;
  const earlier = { ...current, amountMinor: current.amountMinor + 1_000 };
  await page.addInitScript(
    ([line]) => localStorage.setItem("svara.cart.v1", JSON.stringify({ lines: [line] })),
    [
      {
        productSlug: product.slug,
        variantId: variant.id,
        quantity: 2,
        seenPriceMinor: earlier.amountMinor,
      },
    ],
  );
  await page.goto("/cart", { waitUntil: "networkidle" });
  const notice = page.locator("main").getByRole("alert");
  await expect(notice).toContainText("Price updated");
  await expect(page.locator("main")).toContainText(
    `Price updated — was ${formatMoney(earlier)}, now ${formatMoney(current)}`,
  );
  await expect(proceedBlocked(page)).toBeDisabled();
  await expect(proceed(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Accept updated prices" }).click();
  await expect(notice).toHaveCount(0);
  await expect(proceed(page)).toHaveAttribute("href", "/order");
});

test("something no longer sold must be removed before ordering", async ({ page }) => {
  const { product, variant } = orderable!;
  await page.addInitScript(
    (lines) => localStorage.setItem("svara.cart.v1", JSON.stringify({ lines })),
    [
      { productSlug: product.slug, variantId: variant.id, quantity: 1 },
      { productSlug: "moringa-powder", variantId: "moringa-powder-500g", quantity: 1 },
    ],
  );
  await page.goto("/cart", { waitUntil: "networkidle" });
  const notice =
    "This product is no longer available to order. Please remove it from your cart before continuing.";
  await expect(page.locator("main").getByRole("alert")).toContainText(notice);
  await expect(proceedBlocked(page)).toBeDisabled();
  await page
    .getByRole("button", { name: /Remove the product that is no longer available/ })
    .click();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  await expect(proceed(page)).toHaveAttribute("href", "/order");
});

test("an empty cart offers the products, not an order", async ({ page }) => {
  await page.goto("/cart", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
  await expect(
    page.locator("main").getByRole("link", { name: "Explore products" }),
  ).toHaveAttribute("href", "/shop");
  await expect(page.getByText(/Proceed to order/)).toHaveCount(0);
});

test("the old checkout addresses lead back to the cart", async ({ context }) => {
  for (const old of ["/checkout", "/checkout/confirmation"]) {
    // A fresh tab for each address, so neither visit starts on the cart.
    const page = await context.newPage();
    const response = await page.goto(old, { waitUntil: "load" });
    // The cart may come from the browser cache after revalidation: 304 is a good answer too.
    expect(response && (response.ok() || response.status() === 304), old).toBe(true);
    // Read the page itself: after a redirect to a cached page, Firefox's driver
    // can keep waiting for a navigation the browser has already finished.
    await expect
      .poll(() => page.evaluate(() => document.querySelector("main h2") !== null), { message: old })
      .toBe(true);
    expect(
      await page.evaluate(() => ({
        path: location.pathname,
        fields: document.querySelectorAll("main input:not([type=hidden]), main textarea").length,
      })),
      old,
    ).toEqual({ path: "/cart", fields: 0 });
    await page.close();
  }
});

test.describe("the order endpoint cannot be tricked", () => {
  // Each probe comes from its own address, so the rate limit (tested last) stays out of the way.
  let address = 0;
  const send = (
    page: Page,
    baseURL: string | undefined,
    body: unknown,
    key: string,
    client = `198.51.100.${++address}`,
  ) =>
    page.request.post(`${baseURL}/api/order-requests`, {
      headers: {
        Origin: baseURL!,
        "Content-Type": "application/json",
        "Idempotency-Key": key,
        "X-Real-IP": client,
      },
      data: body,
    });
  const delivery = {
    fullName: "Lakshmi Rao",
    phone: "9876543210",
    email: "",
    addressLine1: "12, Temple Street",
    addressLine2: "",
    locality: "",
    city: "Kadapa",
    state: "Andhra Pradesh",
    pinCode: "516101",
    instructions: "",
  };

  test("prices, products, sizes and quantities come from the server", async ({ page, baseURL }) => {
    test.skip(!storeDir, "Saving order requests is switched off (ORDER_REQUESTS_STORE).");
    const { product, variant } = orderable!;
    const line = { productSlug: product.slug, variantId: variant.id, quantity: 1 };
    const run = Date.now().toString(36);

    // A browser that claims a lower price is told the price changed; nothing is saved.
    const cheap = await send(
      page,
      baseURL,
      { lines: [{ ...line, seenPriceMinor: 100, unitPrice: 100 }], delivery, total: 100 },
      `tamper-price-${run}-0001`,
    );
    expect(cheap.status()).toBe(409);
    expect(await cheap.json()).toMatchObject({ ok: false, error: "price-changed" });

    for (const [name, tampered, status] of [
      ["quantity 11", { ...line, quantity: 11 }, 400],
      ["quantity 0", { ...line, quantity: 0 }, 400],
      ["fractional quantity", { ...line, quantity: 1.5 }, 400],
      ["unknown product", { ...line, productSlug: "gold-powder" }, 409],
      ["unknown size", { ...line, variantId: "moringa-powder-5kg" }, 409],
      [
        // Every real product is available today; unavailable ones are refused in unit tests.
        "size of another product",
        { ...line, productSlug: "moringa-powder", variantId: "beetroot-powder-100g" },
        409,
      ],
    ] as const) {
      const response = await send(
        page,
        baseURL,
        { lines: [{ ...tampered, seenPriceMinor: variant.price!.amountMinor }], delivery },
        `tamper-${name.replace(/\W/g, "")}-${run}`,
      );
      expect(response.status(), name).toBe(status);
      expect((await response.json()).ok, name).toBe(false);
    }

    // An honest request, with extra "total" and "price" fields, is priced by the server alone.
    const honest = await send(
      page,
      baseURL,
      {
        lines: [{ ...line, quantity: 2, seenPriceMinor: variant.price!.amountMinor, price: 1 }],
        delivery,
        totals: { total: { amountMinor: 1, currency: "INR" } },
      },
      `honest-${run}-000001`,
    );
    expect(honest.status()).toBe(201);
    const { order } = await honest.json();
    expect(order.totals.total).toEqual(multiplyMoney(variant.price!, 2));
    expect(order.lines[0].unitPrice).toEqual(variant.price);

    // Replaying the same submission returns the same order, saved once.
    const replay = await send(
      page,
      baseURL,
      { lines: [{ ...line, quantity: 2, seenPriceMinor: variant.price!.amountMinor }], delivery },
      `honest-${run}-000001`,
    );
    expect(replay.status()).toBe(200);
    expect((await replay.json()).order.reference).toBe(order.reference);
    const saved = await readdir(path.join(storeDir!, "requests"));
    expect(saved.filter((file) => file === `${order.reference}.json`)).toHaveLength(1);
  });

  test("a client is limited to a few requests a minute, whatever it says it is", async ({
    page,
    baseURL,
  }) => {
    const client = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await page.request.post(`${baseURL}/api/order-requests`, {
        headers: {
          Origin: baseURL!,
          "Content-Type": "application/json",
          "X-Real-IP": client,
          // A spoofed first X-Forwarded-For entry does not make it someone else.
          "X-Forwarded-For": `10.0.0.${attempt}, ${client}`,
        },
        data: { nope: true },
      });
      statuses.push(response.status());
    }
    // Refused for what they are (400, or 503 while saving is off) — but not yet limited.
    expect(statuses.slice(0, 5).every((status) => status === 400 || status === 503)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});
