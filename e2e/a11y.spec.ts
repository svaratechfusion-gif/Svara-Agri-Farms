import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** WCAG 2.0 / 2.1 / 2.2, levels A and AA. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

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
  "/cart",
  "/checkout",
  "/checkout/confirmation",
  "/no-such-page",
];

// Every state is measured at rest: no fades or reveals mid-transition, so
// colour contrast is judged on the final colours.
test.use({ reducedMotion: "reduce" });

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(" "))
        .join(" | ")}`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

for (const route of ROUTES) {
  test(`axe: ${route} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await audit(page);
  });
}

test("axe: the open mobile menu is accessible", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The menu control is shown below the desktop breakpoint.");
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();
  await audit(page);
});

test("axe: the open cart with an item is accessible", async ({ page }) => {
  // Nothing can be added today (no prices yet), so the cart holds a stored line.
  await page.addInitScript(() =>
    window.localStorage.setItem(
      "svara.cart.v1",
      JSON.stringify({
        lines: [{ productSlug: "moringa-powder", variantId: "moringa-powder-250g", quantity: 2 }],
      }),
    ),
  );
  await page.goto("/products/moringa-powder", { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: /2 items — open cart/ })
    .first()
    .click();
  await expect(page.getByRole("dialog", { name: "Your cart" })).toBeVisible();
  await audit(page);
});

test.describe("with motion allowed", () => {
  // The pinned stage controls only exist when motion is allowed.
  test.use({ reducedMotion: "no-preference" });

  test("axe: the pinned journey controls are accessible", async ({ page, isMobile }) => {
    test.skip(isMobile, "The pinned stage controls are a desktop experience.");
    await page.goto("/journey", { waitUntil: "networkidle" });
    await page.locator("#stage-select").scrollIntoViewIfNeeded();
    await expect(page.getByRole("navigation", { name: "Journey stages" })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include('nav[aria-label="Journey stages"]')
      .withTags(WCAG_TAGS)
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
