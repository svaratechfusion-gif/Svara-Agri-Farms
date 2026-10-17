import { expect, test, type Locator, type Page } from "@playwright/test";

import { catalogue } from "../src/content/products";
import { orderable } from "./support/catalogue";

/**
 * The commerce pages at phone, tablet, laptop and desktop widths: nothing
 * scrolls sideways, touch targets are large enough, and nothing (the
 * companion included) sits on top of the controls a customer needs.
 * Viewports are set here, so this runs once (desktop project).
 */

const WIDTHS = [390, 768, 1200, 1440] as const;
const MIN_TARGET = 44;
const [moringa] = catalogue;

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Sets its own viewports.");
});

async function noSidewaysScroll(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label}: horizontal overflow`).toBeLessThanOrEqual(1);
}

/** The control is on screen, large enough to tap, and the topmost thing at its centre. */
async function reachable(control: Locator, label: string) {
  await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox();
  expect(box, `${label}: on screen`).not.toBeNull();
  expect(box!.height, `${label}: tap height`).toBeGreaterThanOrEqual(MIN_TARGET);
  const onTop = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit !== null && (element === hit || element.contains(hit));
  });
  expect(onTop, `${label}: not covered`).toBe(true);
}

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 844 : 900 } });

    test("the shop and product page fit, and say what can be ordered", async ({ page }) => {
      await page.goto("/shop", { waitUntil: "networkidle" });
      await noSidewaysScroll(page, "shop");
      const sections = page.getByRole("navigation", { name: "Shop sections" });
      expect(await sections.evaluate((nav) => getComputedStyle(nav).position)).toBe("static");
      await page.goto(`/products/${moringa.slug}`, { waitUntil: "networkidle" });
      await noSidewaysScroll(page, "product");
      const purchase = page.locator("form").filter({ hasText: "Add to cart" }).first();
      for (const size of moringa.variants) {
        await expect(purchase.getByRole("radio", { name: new RegExp(size.label) })).toBeAttached();
      }
      await reachable(purchase.getByRole("button", { name: "Add to cart" }), "Add to cart");
      await reachable(
        purchase.getByRole("link", { name: /Ask about this product on WhatsApp/ }),
        "WhatsApp",
      );
    });

    test("the cart's controls are easy to reach, and the companion stays away", async ({
      page,
    }) => {
      await page.addInitScript(([value]) => window.localStorage.setItem("svara.cart.v1", value), [
        JSON.stringify({
          lines: [{ productSlug: moringa.slug, variantId: moringa.variants[0].id, quantity: 2 }],
        }),
      ] as const);
      await page.goto("/cart", { waitUntil: "networkidle" });
      await noSidewaysScroll(page, "cart");
      await reachable(page.getByRole("button", { name: /^Remove/ }), "Remove");
      // A link once the line can be ordered, a disabled button until then.
      await reachable(
        page
          .getByRole("link", { name: "Proceed to order" })
          .or(page.getByRole("button", { name: "Proceed to order" })),
        "Proceed to order",
      );
      await expect(page.getByRole("button", { name: /Open SVARA/ })).toBeHidden();
    });

    test("an empty cart fits, and leads back to the products", async ({ page }) => {
      await page.goto("/cart", { waitUntil: "networkidle" });
      await noSidewaysScroll(page, "empty cart");
      await reachable(
        page.locator("main").getByRole("link", { name: "Explore products" }),
        "Explore products",
      );
    });

    test("the cart and the order page fit, with every field and the WhatsApp button usable", async ({
      page,
    }) => {
      test.skip(!orderable, "No size can be ordered yet.");
      const { product, variant } = orderable!;
      await page.addInitScript(([value]) => window.localStorage.setItem("svara.cart.v1", value), [
        JSON.stringify({
          lines: [{ productSlug: product.slug, variantId: variant.id, quantity: 1 }],
        }),
      ] as const);
      await page.goto("/cart", { waitUntil: "networkidle" });
      await noSidewaysScroll(page, "cart");
      await reachable(page.getByRole("button", { name: "Increase quantity" }), "Increase quantity");
      await expect(page.getByRole("region", { name: /Summary/ })).toContainText("Subtotal");
      const proceed = page.getByRole("link", { name: "Proceed to order" });
      await reachable(proceed, "Proceed to order");
      await expect(page.getByRole("button", { name: /Open SVARA/ })).toBeHidden();

      // The order page: every field reachable, long text wraps, the button wholly on screen.
      await proceed.click();
      await page.waitForURL("**/order");
      await noSidewaysScroll(page, "order");
      const width = page.viewportSize()!.width;
      for (const name of ["Full name", "Mobile number", "Address", "City", "PIN code"]) {
        await reachable(page.getByRole("textbox", { name, exact: true }), name);
      }
      await reachable(page.getByRole("combobox", { name: "State", exact: true }), "State");
      const address = page.getByRole("textbox", { name: "Address", exact: true });
      await address.fill(
        "Flat 4B, Sri Lakshmi Venkateswara Nilayam Residential Apartments, 12-34/5 Temple Street, near the Gandhi Circle bus stop, Rayachoti Road",
      );
      expect(
        await address.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        "address wraps",
      ).toBe(true);
      await noSidewaysScroll(page, "order with a long address");
      const summary = page.getByRole("region", { name: "Your order" });
      const summaryBox = (await summary.boundingBox())!;
      expect(summaryBox.x).toBeGreaterThanOrEqual(0);
      expect(summaryBox.x + summaryBox.width).toBeLessThanOrEqual(width);
      const place = page.getByRole("button", { name: /Place order on WhatsApp/ });
      await reachable(place, "Place order on WhatsApp");
      const box = (await place.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    });
  });
}
