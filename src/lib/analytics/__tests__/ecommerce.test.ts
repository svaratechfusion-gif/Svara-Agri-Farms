import { describe, expect, it } from "vitest";

import { fixtureCatalogue } from "@/lib/commerce/__tests__/fixtures";
import { catalogue, STANDARD_PRICES } from "@/content/products";

import { analyticsItem, analyticsItems, ecommerceFor } from "../ecommerce";

const moringa = catalogue.find((product) => product.slug === "moringa-powder")!;

describe("analyticsItem", () => {
  it("describes a size from the catalogue in GA4's item shape", () => {
    const variant = moringa.variants.find((entry) => entry.weightGrams === 250)!;
    expect(
      analyticsItem({ productSlug: moringa.slug, variantId: variant.id, quantity: 2 }),
    ).toEqual({
      item_id: moringa.id,
      item_name: moringa.name,
      item_category: moringa.ingredient,
      item_variant: "250 g",
      price: STANDARD_PRICES[250].amountMinor / 100,
      quantity: 2,
      currency: "INR",
    });
  });

  it("returns null for a product or size the catalogue does not know", () => {
    expect(analyticsItem({ productSlug: "nope", variantId: "x", quantity: 1 })).toBeNull();
    expect(
      analyticsItem({ productSlug: moringa.slug, variantId: "moringa-powder-999g", quantity: 1 }),
    ).toBeNull();
  });

  it("leaves out the price of a size that has none yet", () => {
    const product = { ...fixtureCatalogue[0] };
    const unpriced = { ...product, variants: [{ ...product.variants[0], price: null }] };
    const item = analyticsItem(
      { productSlug: unpriced.slug, variantId: unpriced.variants[0].id, quantity: 1 },
      [unpriced],
    );
    expect(item).not.toBeNull();
    expect(item).not.toHaveProperty("price");
    expect(item).not.toHaveProperty("currency");
  });
});

describe("analyticsItems / ecommerceFor", () => {
  const lines = moringa.variants.map((variant, index) => ({
    productSlug: moringa.slug,
    variantId: variant.id,
    quantity: index + 1,
  }));

  it("keeps known lines and drops unknown ones", () => {
    const items = analyticsItems([...lines, { productSlug: "gone", variantId: "x", quantity: 1 }]);
    expect(items.map((item) => item.item_variant)).toEqual(["100 g", "250 g"]);
  });

  it("totals the value in rupees from paise, without float drift", () => {
    const ecommerce = ecommerceFor(analyticsItems(lines));
    const expected =
      (STANDARD_PRICES[100].amountMinor + 2 * STANDARD_PRICES[250].amountMinor) / 100;
    expect(ecommerce).toMatchObject({ currency: "INR", value: expected });
    expect(ecommerce.items).toHaveLength(2);
  });

  it("values an empty list at zero", () => {
    expect(ecommerceFor([])).toEqual({ currency: "INR", value: 0, items: [] });
  });
});
