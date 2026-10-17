import { describe, expect, it } from "vitest";

import { commerceRules } from "@/content/commerce";
import { inr } from "@/content/products";

import {
  cartTotals,
  deliveryZoneFor,
  NO_RULES,
  priceOrder,
  type CommerceRules,
  type DeliveryZone,
} from "../pricing";

const zones: DeliveryZone[] = [
  { id: "ap", label: "AP", pinCodePrefixes: ["51", "52"], charge: inr(80), freeFrom: inr(1000) },
  { id: "kdp", label: "Kadapa", pinCodePrefixes: ["516"], charge: inr(40), freeFrom: null },
];

describe("the business's rules", () => {
  it("are not configured: no delivery charge, tax or minimum is invented", () => {
    expect(commerceRules).toEqual(NO_RULES);
  });
});

describe("priceOrder", () => {
  it("adds nothing it does not know, and says the total is not final", () => {
    expect(priceOrder(inr(498), "516101", NO_RULES)).toEqual({
      ok: true,
      totals: {
        subtotal: inr(498),
        deliveryCharge: null,
        tax: null,
        taxIncluded: false,
        total: inr(498),
        isFinal: false,
      },
    });
  });

  it("charges the most specific zone, free above its threshold", () => {
    const rules: CommerceRules = { ...NO_RULES, deliveryZones: zones };
    expect(deliveryZoneFor("516101", zones)?.id).toBe("kdp");
    expect(deliveryZoneFor("520001", zones)?.id).toBe("ap");
    expect(deliveryZoneFor("110001", zones)).toBeNull();
    const kadapa = priceOrder(inr(498), "516101", rules);
    expect(kadapa.ok && kadapa.totals.deliveryCharge).toEqual(inr(40));
    const free = priceOrder(inr(1000), "520001", rules);
    expect(free.ok && free.totals.deliveryCharge).toEqual(inr(0));
    expect(priceOrder(inr(498), "110001", rules)).toEqual({ ok: false, reason: "not-deliverable" });
    // Before a PIN code is known nothing is charged or refused.
    const cart = priceOrder(inr(498), null, rules);
    expect(cart.ok && cart.totals.deliveryCharge).toBeNull();
  });

  it("adds tax on top, or shows tax already inside the prices", () => {
    const added = priceOrder(inr(1000), null, {
      ...NO_RULES,
      tax: { label: "GST", rateBasisPoints: 500, pricesIncludeTax: false },
    });
    expect(added.ok && [added.totals.tax, added.totals.total]).toEqual([inr(50), inr(1050)]);
    const included = priceOrder(inr(1050), null, {
      ...NO_RULES,
      tax: { label: "GST", rateBasisPoints: 500, pricesIncludeTax: true },
    });
    expect(
      included.ok && [included.totals.tax, included.totals.total, included.totals.taxIncluded],
    ).toEqual([inr(50), inr(1050), true]);
  });

  it("refuses an order below the minimum", () => {
    expect(priceOrder(inr(100), null, { ...NO_RULES, minimumOrder: inr(300) })).toEqual({
      ok: false,
      reason: "below-minimum",
      minimum: inr(300),
    });
  });

  it("is final only when both delivery and tax are configured", () => {
    const rules: CommerceRules = {
      deliveryZones: zones,
      tax: { label: "GST", rateBasisPoints: 0, pricesIncludeTax: true },
      minimumOrder: null,
    };
    const priced = priceOrder(inr(498), "516101", rules);
    expect(priced.ok && priced.totals.isFinal).toBe(true);
  });
});

describe("cartTotals", () => {
  it("prices nothing without a subtotal", () => {
    expect(cartTotals(null, NO_RULES)).toBeNull();
    expect(cartTotals(inr(10), NO_RULES)?.ok).toBe(true);
  });
});
