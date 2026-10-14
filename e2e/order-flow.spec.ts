import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { products } from "../src/content/products";
import { formatMoney, multiplyMoney } from "../src/lib/commerce/money";
import { CART_BUTTON } from "./support/catalogue";

/**
 * The whole cart → delivery details → order request path, as a customer
 * takes it. It needs a size that can actually be ordered (a price, and
 * available) and the server's order store switched on, so it runs only then:
 *
 *   ORDER_REQUESTS_STORE=file ORDER_REQUESTS_DIR=… npx playwright test e2e/order-flow.spec.ts
 */

const orderable = products
  .flatMap((product) => product.variants.map((variant) => ({ product, variant })))
  .find(({ variant }) => variant.price !== null && variant.availability === "available");
const storeDir =
  process.env.ORDER_REQUESTS_STORE === "file" ? process.env.ORDER_REQUESTS_DIR : undefined;

test.skip(!orderable, "No size has a price and is available yet.");
test.skip(!storeDir, "Saving order requests is switched off (ORDER_REQUESTS_STORE).");

const headerCount = (page: Page) => page.getByRole("button", { name: CART_BUTTON }).first();
const money = (quantity: number) => formatMoney(multiplyMoney(orderable!.variant.price!, quantity));

async function fill(page: Page, details: Record<string, string>) {
  for (const [label, value] of Object.entries(details)) {
    const field = page.getByLabel(new RegExp(`^${label}`));
    if (label.startsWith("State")) await field.selectOption(value);
    else await field.fill(value);
  }
}

const DETAILS = {
  "Full name": "Lakshmi Rao",
  "Phone number": "98765 43210",
  "Address line 1": "12, Temple Street",
  "Locality or village": "Kodur",
  "City or town": "Kadapa",
  "State or union territory": "Andhra Pradesh",
  "PIN code": "516101",
};

test("a customer adds, adjusts, enters details and sends an order request", async ({ page }) => {
  test.setTimeout(120_000);
  const { product, variant } = orderable!;

  // Add from the product page.
  await page.goto(`/products/${product.slug}`, { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: new RegExp(variant.label) }).check({ force: true });
  await page
    .getByRole("group", { name: "Quantity" })
    .getByRole("button", { name: "Increase quantity" })
    .click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status").filter({ hasText: "added to your cart" })).toContainText(
    `2 × ${product.name}`,
  );
  await expect(headerCount(page)).toHaveAccessibleName(/\b2 items/);

  // It survives a refresh.
  await page.reload({ waitUntil: "networkidle" });
  await expect(headerCount(page)).toHaveAccessibleName(/\b2 items/);

  // The cart page: quantities and subtotal.
  await page.goto("/cart", { waitUntil: "networkidle" });
  const summary = page.getByRole("region", { name: /Summary/ });
  await expect(summary).toContainText(money(2));
  const quantity = page.getByRole("group", { name: new RegExp(`Quantity of ${product.name}`) });
  await quantity.getByRole("button", { name: "Increase quantity" }).click();
  await expect(summary).toContainText(money(3));
  await quantity.getByRole("button", { name: "Decrease quantity" }).click();
  await expect(summary).toContainText(money(2));
  await expect(summary).toContainText("Product subtotal");
  await expect(headerCount(page)).toHaveAccessibleName(/\b2 items/);

  await page.getByRole("link", { name: "Proceed to delivery details" }).click();
  await page.waitForURL("**/checkout");

  // Nothing filled in: every required field explains itself, and the summary takes focus.
  await page.getByRole("button", { name: "Submit order request" }).click();
  const problems = page.getByRole("alert").filter({ hasText: "Please check these details" });
  await expect(problems).toBeFocused();
  await expect(page.getByLabel(/^Full name/)).toHaveAttribute("aria-invalid", "true");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations.map((v) => v.id)).toEqual([]);

  // A bad phone number and PIN are caught; what was typed is kept.
  await fill(page, { ...DETAILS, "Phone number": "12345", "PIN code": "0123" });
  await page.getByRole("button", { name: "Submit order request" }).click();
  await expect(page.getByLabel(/^Phone number/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel(/^PIN code/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel(/^Full name/)).toHaveValue("Lakshmi Rao");

  // The server fails once: nothing is claimed, cart and details stay.
  await fill(page, DETAILS);
  await page.route("**/api/order-requests", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: '{"ok":false,"error":"save-failed"}',
    }),
  );
  await page.getByRole("button", { name: "Submit order request" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "could not be saved" })).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(headerCount(page)).toHaveAccessibleName(/\b2 items/);
  await expect(page.getByLabel(/^City or town/)).toHaveValue("Kadapa");
  await page.unroute("**/api/order-requests");

  // A double click sends one request.
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/order-requests") && request.method() === "POST")
      posts.push(request.url());
  });
  const submit = page.getByRole("button", { name: "Submit order request" });
  await submit.dblclick();
  await page.waitForURL("**/checkout/confirmation");
  expect(posts).toHaveLength(1);

  // The confirmation: received, pending, nothing paid.
  const main = page.locator("main");
  await expect(
    page.getByRole("heading", { name: "Thank you for choosing SVARA Farms!" }),
  ).toBeFocused();
  await expect(main).toContainText("Your order request has been received.");
  await expect(main).toContainText("No payment has been collected at this stage.");
  await expect(main).toContainText("Pending confirmation");
  await expect(main).toContainText("Not collected");
  await expect(main).toContainText(money(2));
  await expect(main).toContainText("516101");
  await expect(main).not.toContainText(/payment successful|order confirmed|\bpaid\b/i);
  const reference = (await page.locator("dd.font-mono").innerText()).trim();
  expect(reference).toMatch(/^SVF-\d{6}-[2-9A-HJKMNP-Z]{6}$/);

  // Saved on the server, exactly once, priced from the catalogue.
  const saved = await readdir(path.join(storeDir!, "requests"));
  expect(saved).toContain(`${reference}.json`);
  const record = JSON.parse(
    await readFile(path.join(storeDir!, "requests", `${reference}.json`), "utf8"),
  );
  expect(record).toMatchObject({
    status: "pending-confirmation",
    payment: { status: "not-collected" },
    lines: [{ productSlug: product.slug, variantId: variant.id, quantity: 2 }],
    productSubtotal: multiplyMoney(variant.price!, 2),
    delivery: { phone: "+919876543210", state: "Andhra Pradesh" },
  });

  // The cart was cleared only after that save.
  await expect(headerCount(page)).toHaveAccessibleName(/\b0 items/);
  await page.reload({ waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "Thank you for choosing SVARA Farms!" }),
  ).toBeVisible();
});
