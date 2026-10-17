import { describe, expect, it } from "vitest";

import { catalogue } from "@/content/products";

import { cartReducer } from "../cart";
import {
  canAddToCart,
  currentPrices,
  MAX_LINES,
  onlyPricesChanged,
  resolveCart,
} from "../orderLines";
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

  it("allows every size in today's real catalogue, now that each has a price and is available", () => {
    catalogue.forEach((product) =>
      product.variants.forEach((variant) =>
        expect(canAddToCart(catalogue, product.slug, variant.id)).toBe(true),
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

  it("explains a price change since the customer saw it, and blocks until accepted", () => {
    const resolved = resolveCart(
      {
        lines: [
          { ...line("test-100g", 2), seenPriceMinor: 19_900 },
          { ...line("test-250g"), seenPriceMinor: 54_900 },
        ],
      },
      fixtureCatalogue,
    );
    expect(resolved.issues).toEqual([
      { productSlug: "test-powder", variantId: "test-100g", reason: "price-changed" },
    ]);
    expect(resolved.orderable).toBe(false);
    expect(onlyPricesChanged(resolved)).toBe(true);
    expect(resolved.lines[0]).toMatchObject({
      previousUnitPrice: { amountMinor: 19_900, currency: "INR" },
      unitPrice: { amountMinor: 24_900, currency: "INR" },
      lineTotal: { amountMinor: 49_800, currency: "INR" },
    });
    expect(resolved.lines[1].previousUnitPrice).toBeNull();
    // The summary already shows today's prices.
    expect(resolved.subtotal).toEqual({ amountMinor: 104_700, currency: "INR" });

    const accepted = cartReducer(
      { lines: [{ ...line("test-100g", 2), seenPriceMinor: 19_900 }] },
      { type: "accept-prices", prices: currentPrices(resolved) },
    );
    expect(resolveCart(accepted, fixtureCatalogue).orderable).toBe(true);
  });

  it("treats a line with no remembered price (an older cart) as unchanged", () => {
    const resolved = resolveCart({ lines: [line("test-100g")] }, fixtureCatalogue);
    expect(resolved.orderable).toBe(true);
    expect(onlyPricesChanged(resolved)).toBe(false);
  });

  it("does not call an unavailable size a price change", () => {
    const resolved = resolveCart(
      { lines: [{ ...line("test-soon"), seenPriceMinor: 100 }] },
      fixtureCatalogue,
    );
    expect(resolved.issues.map((issue) => issue.reason)).toEqual(["not-purchasable"]);
    expect(onlyPricesChanged(resolved)).toBe(false);
    expect(currentPrices(resolved)).toEqual([]);
  });

  it("has no subtotal when nothing in it can be priced", () => {
    expect(resolveCart({ lines: [line("test-soon")] }, fixtureCatalogue).subtotal).toBeNull();
  });
});
