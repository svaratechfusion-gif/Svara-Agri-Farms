import { expect, test, type Page } from "@playwright/test";

import { products } from "../src/content/products";
import { CART_BUTTON } from "./support/catalogue";

/**
 * The cart and order-request flow against today's real catalogue, in which
 * no size has a price yet — so nothing can be added or ordered, and every
 * page must say so honestly. The full ordering path is in order-flow.spec.ts
 * and runs once a size can be ordered.
 */

const CART_KEY = "svara.cart.v1";
const [moringa] = products;
const nothingOrderable = products.every((product) =>
  product.variants.every((v) => v.price === null || v.availability !== "available"),
);
const FALSE_CLAIMS = /payment successful|order confirmed|\bpaid\b/i;

const headerCount = (page: Page) => page.getByRole("button", { name: CART_BUTTON }).first();

async function seedCart(page: Page, lines: unknown[]) {
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
    CART_KEY,
    JSON.stringify({ lines }),
  ] as const);
}

test.describe("with today's catalogue", () => {
  test.skip(!nothingOrderable, "A size can now be ordered: order-flow.spec.ts covers it.");

  test("a size that cannot be ordered cannot be added, and says why", async ({ page }) => {
    await page.goto(`/products/${moringa.slug}`, { waitUntil: "networkidle" });
    const add = page.getByRole("button", { name: "Add to cart" });
    await expect(add).toBeDisabled();
    await expect(page.getByRole("button", { name: "Buy now" })).toBeDisabled();
    await expect(
      page.getByText(
        /100 g pouch: Not open for orders yet — ordering opens once its price is confirmed\./,
      ),
    ).toBeVisible();
    await expect(headerCount(page)).toHaveAccessibleName(/\b0 items/);
  });

  test("the shop does not call anything available to order", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const sections = page.getByRole("navigation", { name: "Shop sections" });
    await expect(sections.getByRole("link", { name: /Coming soon/ })).toBeVisible();
    await expect(sections.getByText("Available to order")).toHaveCount(0);
    await expect(page.getByText(/kept on this device/)).toHaveCount(0);
  });

  test("an empty cart points to the shop and home", async ({ page }) => {
    await page.goto("/cart", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
    await page.getByRole("link", { name: "Explore products" }).click();
    await page.waitForURL("**/shop");
  });

  test("an old cart line that can no longer be ordered blocks the request until removed", async ({
    page,
  }) => {
    await seedCart(page, [
      { productSlug: moringa.slug, variantId: moringa.variants[0].id, quantity: 2 },
    ]);
    await page.goto("/cart", { waitUntil: "networkidle" });
    await expect(headerCount(page)).toHaveAccessibleName(/\b2 items/);
    await expect(
      page.getByRole("alert").filter({ hasText: "can no longer be ordered" }),
    ).toBeVisible();
    await expect(
      page.locator("main").getByRole("note").filter({ hasText: "Coming soon" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Proceed to order" })).toBeDisabled();
    await expect(page.getByRole("link", { name: "Proceed to order" })).toHaveCount(0);

    await expect(page.getByRole("link", { name: "Proceed to order" })).toHaveCount(0);

    await page.getByRole("button", { name: /^Remove/ }).click();
    await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
    await expect(headerCount(page)).toHaveAccessibleName(/\b0 items/);
  });

  test("the drawer shows the same truth, and leads to the cart page", async ({ page }) => {
    await seedCart(page, [
      { productSlug: moringa.slug, variantId: moringa.variants[0].id, quantity: 1 },
    ]);
    await page.goto("/journey", { waitUntil: "networkidle" });
    await headerCount(page).click();
    const drawer = page.getByRole("dialog", { name: "Your cart" });
    await expect(drawer).toContainText("Coming soon — cannot be ordered right now");
    await expect(drawer).toContainText("Product subtotal");
    await expect(drawer).toContainText("review your cart to continue");
    await drawer.getByRole("link", { name: "Review your order" }).click();
    await page.waitForURL("**/cart");
    await expect(drawer).toBeHidden();
  });
});

test("there is no checkout form: the old addresses lead to the cart", async ({ context }) => {
  for (const old of ["/checkout", "/checkout/confirmation"]) {
    // A fresh tab for each address, so neither visit starts on the cart.
    const page = await context.newPage();
    await page.goto(old, { waitUntil: "load" });
    // Read the page itself: after a redirect to a cached page, Firefox's driver
    // can keep waiting for a navigation the browser has already finished.
    const shown = () =>
      page.evaluate(() => ({
        path: location.pathname,
        headings: [...document.querySelectorAll("main h2")].map((h) => h.textContent?.trim()),
        text: document.querySelector("main")?.textContent ?? "",
      }));
    await expect
      .poll(async () => (await shown()).headings, { message: old })
      .toContain("Your cart is empty.");
    const { path, text } = await shown();
    expect(path, old).toBe("/cart");
    expect(text).not.toMatch(FALSE_CLAIMS);
    await page.close();
  }
});

test("each step of the order shows its title", async ({ page }) => {
  for (const [path, title] of [["/cart", "Your cart."]]) {
    await page.goto(path, { waitUntil: "load" });
    const heading = page.getByRole("heading", { level: 1, name: title });
    await expect(heading, path).toBeVisible();
    await expect
      .poll(
        () =>
          heading.evaluate((el) =>
            Number(getComputedStyle(el.querySelector("span") ?? el).opacity),
          ),
        { message: path },
      )
      .toBe(1);
  }
});

test("no page claims a payment or a confirmed order", async ({ page }) => {
  for (const path of ["/cart", "/shop", `/products/${moringa.slug}`]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator("main"), path).not.toContainText(FALSE_CLAIMS);
  }
});

test.describe("the order-request endpoint", () => {
  const valid = {
    lines: [{ productSlug: moringa.slug, variantId: moringa.variants[0].id, quantity: 1 }],
    delivery: {
      fullName: "Test Customer",
      phone: "9876543210",
      addressLine1: "1 Main Road",
      locality: "Kodur",
      city: "Kadapa",
      state: "Andhra Pradesh",
      pinCode: "516101",
    },
  };

  test("refuses honestly while saving is switched off", async ({ page, baseURL }) => {
    test.skip(process.env.ORDER_REQUESTS_STORE === "file", "Saving is switched on here.");
    await page.goto("/cart");
    const response = await page.request.post("/api/order-requests", {
      headers: { Origin: baseURL!, "Idempotency-Key": "e2e-key-0123456789ab" },
      data: valid,
    });
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "not-accepting" });
    expect(response.headers()["cache-control"]).toBe("no-store");
  });

  test("refuses other sites and anything but JSON", async ({ request, baseURL }) => {
    const elsewhere = await request.post("/api/order-requests", {
      headers: { Origin: "https://example.com", "Idempotency-Key": "e2e-key-0123456789ab" },
      data: valid,
    });
    expect(elsewhere.status()).toBe(403);
    const noOrigin = await request.post("/api/order-requests", { data: valid });
    expect(noOrigin.status()).toBe(403);
    const text = await request.post("/api/order-requests", {
      headers: { Origin: baseURL!, "Content-Type": "text/plain" },
      data: "hello",
    });
    expect(text.status()).toBe(415);
    expect((await request.get("/api/order-requests")).status()).toBe(405);
  });
});

test("SVARA stays off the cart and order pages", async ({ page }) => {
  for (const path of ["/cart"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(".mascot-companion"), path).toBeHidden();
  }
});

test("the cart still works when the browser refuses storage", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/cart", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
  await page.goto(`/products/${moringa.slug}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
