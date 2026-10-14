import { describe, expect, it } from "vitest";

import { products } from "@/content/products";

import { canAddToCart, MAX_LINES, resolveCart } from "../orderLines";
import { fixtureCatalogue } from "./fixtures";

const line = (variantId: string, quantity = 1, productSlug = "test-powder") => ({
  productSlug,
  variantId,
  quantity,
});

describe("canAddToCart", () => {
  it("allows only sizes with a price that are available", () => {
    expect(canAddToCart(fixtureCatalogue, "test-powder", "test-100g")).toBe(true);
    expect(canAddToCart(fixtureCatalogue, "test-powder", "test-soon")).toBe(false);
    expect(canAddToCart(fixtureCatalogue, "test-powder", "test-sold")).toBe(false);
    expect(canAddToCart(fixtureCatalogue, "nope", "test-100g")).toBe(false);
  });

  it("allows nothing from today's real catalogue: no size has a price yet", () => {
    products.forEach((product) =>
      product.variants.forEach((variant) =>
        expect(canAddToCart(products, product.slug, variant.id)).toBe(
          variant.price !== null && variant.availability === "available",
        ),
      ),
    );
  });
});

describe("resolveCart", () => {
  it("prices every line from the catalogue and totals them", () => {
    const resolved = resolveCart(
      { lines: [line("test-100g", 2), line("test-250g", 1)] },
      fixtureCatalogue,
    );
    expect(resolved.issues).toEqual([]);
    expect(resolved.orderable).toBe(true);
    expect(resolved.itemCount).toBe(3);
    expect(resolved.lines.map((l) => l.lineTotal?.amountMinor)).toEqual([49_800, 54_900]);
    expect(resolved.subtotal).toEqual({ amountMinor: 104_700, currency: "INR" });
  });

  it("flags lines that can no longer be ordered, and blocks the order", () => {
    const resolved = resolveCart(
      { lines: [line("test-100g"), line("test-soon"), line("gone", 1, "missing-product")] },
      fixtureCatalogue,
    );
    expect(resolved.orderable).toBe(false);
    expect(resolved.issues).toEqual([
      { productSlug: "test-powder", variantId: "test-soon", reason: "not-purchasable" },
      { productSlug: "missing-product", variantId: "gone", reason: "unknown-product" },
    ]);
    // Unknown lines are left out; unorderable ones stay visible so they can be removed.
    expect(resolved.lines.map((l) => l.variantId)).toEqual(["test-100g", "test-soon"]);
    expect(resolved.lines[1].purchasable).toBe(false);
    // The subtotal counts only what can be ordered.
    expect(resolved.subtotal).toEqual({ amountMinor: 24_900, currency: "INR" });
  });

  it("is not orderable when empty, or with too many lines", () => {
    expect(resolveCart({ lines: [] }, fixtureCatalogue).orderable).toBe(false);
    const many = Array.from({ length: MAX_LINES + 1 }, () => line("test-100g"));
    expect(resolveCart({ lines: many }, fixtureCatalogue).orderable).toBe(false);
  });

  it("has no subtotal when nothing in it can be priced", () => {
    expect(resolveCart({ lines: [line("test-soon")] }, fixtureCatalogue).subtotal).toBeNull();
  });
});
