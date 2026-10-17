import { describe, expect, it } from "vitest";

import { findProductSync, findVariant, isPurchasable, localProductRepository } from "../catalog";
import type { Availability, Product, ProductVariant } from "../types";
import { fixtureCatalogue } from "./fixtures";

describe("localProductRepository", () => {
  it("lists products and finds one by slug", async () => {
    const all = await localProductRepository.findAll();
    expect(all.length).toBeGreaterThan(0);
    expect(await localProductRepository.findBySlug("moringa-powder")).toMatchObject({
      slug: "moringa-powder",
    });
    expect(await localProductRepository.findBySlug("missing")).toBeNull();
  });
});

describe("findProductSync / findVariant", () => {
  it("resolves products and variants, returning null when unknown", () => {
    const product = findProductSync("moringa-powder");
    expect(product).not.toBeNull();
    expect(findProductSync("nope")).toBeNull();
    if (!product) return;
    expect(findVariant(product, product.variants[0].id)).toBe(product.variants[0]);
    expect(findVariant(product, "nope")).toBeNull();
  });
});

describe("isPurchasable", () => {
  const price = { amountMinor: 100, currency: "INR" as const };
  const size = (overrides: Partial<ProductVariant>): ProductVariant => ({
    ...fixtureCatalogue[0].variants[0],
    ...overrides,
  });
  const product = (availability: Availability): Product => ({
    ...fixtureCatalogue[0],
    availability,
  });

  it("requires a price and availability, for the size and the product", () => {
    expect(isPurchasable(product("available"), size({ price, availability: "available" }))).toBe(
      true,
    );
    expect(
      isPurchasable(product("available"), size({ price: null, availability: "available" })),
    ).toBe(false);
    expect(isPurchasable(product("available"), size({ price, availability: "coming-soon" }))).toBe(
      false,
    );
    for (const state of ["coming-soon", "in-preparation", "sold-out"] as const) {
      expect(isPurchasable(product(state), size({ price, availability: "available" }))).toBe(false);
    }
  });
});
