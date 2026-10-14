import { describe, expect, it } from "vitest";

import { findProductSync, findVariant, isPurchasable, localProductRepository } from "../catalog";
import { isPaid, PAYMENT_PROVIDER } from "../payment";

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
  const base = { id: "v", label: "v", isProvisional: false } as const;

  it("requires both a price and availability", () => {
    const price = { amountMinor: 100, currency: "INR" as const };
    expect(isPurchasable({ ...base, price, availability: "available" })).toBe(true);
    expect(isPurchasable({ ...base, price: null, availability: "available" })).toBe(false);
    expect(isPurchasable({ ...base, price, availability: "coming-soon" })).toBe(false);
  });
});

describe("payment", () => {
  it("is not connected, and a request is never treated as paid", () => {
    expect(PAYMENT_PROVIDER).toBeNull();
    expect(isPaid({ payment: { status: "not-collected" } })).toBe(false);
  });
});
