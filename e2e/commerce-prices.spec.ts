import { expect, test, type Page } from "@playwright/test";

import { STANDARD_PRICES } from "../src/content/products";
import { formatMoney } from "../src/lib/commerce/money";

/**
 * Today's real catalogue: every product open for ordering at ₹250 (100 g)
 * and ₹350 (250 g), read from one table. These run with or without an order
 * store; with none (the default), placing a request must say so honestly.
 */

const WHATSAPP = "https://wa.me/917780262442";
const P100 = formatMoney(STANDARD_PRICES[100]);
const P250 = formatMoney(STANDARD_PRICES[250]);

const purchaseForm = (page: Page) =>
  page.locator("form").filter({ hasText: "Add to cart" }).first();

/** The message a WhatsApp link pre-fills, decoded. */
async function whatsappText(link: ReturnType<Page["getByRole"]>) {
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/917780262442(\?text=|$)/);
  return new URL(href!).searchParams.get("text");
}

test("the prices are ₹250 for 100 g and ₹350 for 250 g, and follow the chosen size", async ({
  page,
}) => {
  expect([P100, P250]).toEqual(["₹250", "₹350"]);
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  const form = purchaseForm(page);
  await expect(form.getByRole("radio", { name: /100 g pouch.*₹250/ })).toBeChecked();
  await expect(form.getByRole("radio", { name: /250 g pouch.*₹350/ })).not.toBeChecked();
  await expect(page.locator("main")).not.toContainText(/Price TBC|Price to be announced/);
  await form.getByRole("radio", { name: /250 g pouch/ }).check({ force: true });
  await expect(page.locator("main").getByText("₹350", { exact: true }).first()).toBeVisible();
});

test("prices carry from the product to the cart and its WhatsApp order, totalled correctly", async ({
  page,
}) => {
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  const form = purchaseForm(page);
  await form.getByRole("radio", { name: /250 g pouch/ }).check({ force: true });
  await form.getByRole("button", { name: "Increase quantity" }).click();
  await form.getByRole("button", { name: "Add to cart" }).click();
  await expect(form.getByRole("status").filter({ hasText: "added" })).toContainText(
    "2 × SVARA Moringa Powder, 250 g pouch",
  );

  await page.goto("/products", { waitUntil: "networkidle" });
  const ginger = page.getByRole("listitem").filter({ hasText: "Ginger Powder" });
  await ginger.getByRole("button", { name: "Add to cart" }).click();
  await expect(ginger.getByRole("status").filter({ hasText: "added" })).toContainText(
    "1 × Ginger Powder, 100 g pouch",
  );

  await page.goto("/cart", { waitUntil: "networkidle" });
  const summary = page.getByRole("region", { name: /Summary/ });
  await expect(summary).toHaveAccessibleName("Summary · 3 items");
  await expect(summary).toContainText("250 g pouch × 2 · ₹350 each");
  await expect(summary).toContainText("100 g pouch × 1 · ₹250 each");
  await expect(summary).toContainText("₹700");
  await expect(summary).toContainText(/Subtotal\s*₹950/);

  // Quantity changes re-total at once.
  await page
    .getByRole("group", { name: /Quantity of Ginger Powder/ })
    .getByRole("button", { name: "Increase quantity" })
    .click();
  await expect(summary).toContainText(/Subtotal\s*₹1,200/);

  // The order page shows the same lines and subtotal.
  await page.getByRole("link", { name: "Proceed to order" }).click();
  await page.waitForURL("**/order");
  const order = page.getByRole("region", { name: "Your order" });
  await expect(order).toContainText("250 g pouch × 2 · ₹350 each");
  await expect(order).toContainText("100 g pouch × 2 · ₹250 each");
  await expect(order).toContainText(/Subtotal\s*₹1,200/);
});

test("Buy now takes the chosen size straight to the cart", async ({ page }) => {
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  await purchaseForm(page).getByRole("button", { name: "Buy now" }).click();
  await page.waitForURL("**/cart");
  await expect(page.getByRole("region", { name: /Summary · 1 item/ })).toContainText("₹250");
});

test("asking on WhatsApp names the product, the size and the quantity", async ({ page }) => {
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  const form = purchaseForm(page);
  const ask = form.getByRole("link", { name: /Ask about this product on WhatsApp/ });
  await expect(ask).toHaveAttribute("target", "_blank");
  await expect(ask).toHaveAttribute("rel", /noopener/);
  expect(await whatsappText(ask)).toBe(
    "Hi SVARA Agri Farms, I'm interested in SVARA Moringa Powder — 100 g. I'd like to know more about availability and ordering.",
  );
  await form.getByRole("radio", { name: /250 g pouch/ }).check({ force: true });
  await form.getByRole("button", { name: "Increase quantity" }).click();
  // Encoded in the URL (no raw spaces or dashes), exact once decoded.
  expect(await ask.getAttribute("href")).toContain("%E2%80%94%20250%20g%20%C3%97%202");
  expect(await whatsappText(ask)).toBe(
    "Hi SVARA Agri Farms, I'm interested in SVARA Moringa Powder — 250 g × 2. I'd like to know more about availability and ordering.",
  );
});

test("WhatsApp is offered from the footer and SVARA's panel, not as another floating button", async ({
  page,
  isMobile,
}) => {
  await page.goto("/journey", { waitUntil: "networkidle" });
  const footer = page.getByRole("contentinfo");
  expect(await whatsappText(footer.getByRole("link", { name: /WhatsApp/ }))).toBe(
    "Hi SVARA Agri Farms, I have a question.",
  );
  // Every WhatsApp link on the page leads to the same number.
  for (const href of await page
    .locator('a[href*="wa.me"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href?.startsWith(`${WHATSAPP}?text=`) || href === WHATSAPP).toBe(true);
  }
  test.skip(isMobile, "SVARA's panel is covered by the mascot specs on phones.");
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.getByRole("button", { name: /Open SVARA/ }).click();
  const panel = page.getByRole("dialog", { name: /Hello, I.m SVARA/ });
  await expect(panel.getByRole("link", { name: /Chat with our team on WhatsApp/ })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/917780262442\?text=/,
  );
});
