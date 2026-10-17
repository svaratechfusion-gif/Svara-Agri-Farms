import { describe, expect, it } from "vitest";

import {
  cartReducer,
  clampQuantity,
  countItems,
  EMPTY_CART,
  isRepeatAdd,
  MAX_QUANTITY_PER_LINE,
  parseStoredCart,
  planAdd,
  REPEAT_ADD_WINDOW_MS,
} from "../cart";

const SLUG = "moringa-powder";
const VARIANT = "moringa-powder-100g";

describe("clampQuantity", () => {
  it("keeps quantities within the allowed range", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-4)).toBe(1);
    expect(clampQuantity(3)).toBe(3);
    expect(clampQuantity(99)).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("truncates fractions and rejects non-finite numbers", () => {
    expect(clampQuantity(2.9)).toBe(2);
    expect(clampQuantity(Number.NaN)).toBe(1);
    expect(clampQuantity(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("cartReducer", () => {
  it("adds a new line without mutating the previous cart", () => {
    const before = EMPTY_CART;
    const after = cartReducer(before, {
      type: "add",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 2,
    });

    expect(after.lines).toEqual([{ productSlug: SLUG, variantId: VARIANT, quantity: 2 }]);
    expect(before.lines).toHaveLength(0);
    expect(after).not.toBe(before);
  });

  it("merges quantities when the same variant is added twice", () => {
    const once = cartReducer(EMPTY_CART, {
      type: "add",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 2,
    });
    const twice = cartReducer(once, {
      type: "add",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 3,
    });

    expect(twice.lines).toHaveLength(1);
    expect(twice.lines[0].quantity).toBe(5);
    expect(once.lines[0].quantity).toBe(2);
  });

  it("caps merged quantities at the per-line maximum", () => {
    const cart = cartReducer(EMPTY_CART, {
      type: "add",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 8,
    });
    const next = cartReducer(cart, {
      type: "add",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 8,
    });
    expect(next.lines[0].quantity).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("keeps different variants on separate lines", () => {
    const cart = [
      { type: "add", productSlug: SLUG, variantId: VARIANT, quantity: 1 },
      { type: "add", productSlug: SLUG, variantId: "moringa-powder-250g", quantity: 1 },
    ] as const;
    const result = cart.reduce(cartReducer, EMPTY_CART);
    expect(result.lines).toHaveLength(2);
  });

  it("sets, removes and clears lines", () => {
    const added = cartReducer(EMPTY_CART, {
      type: "add",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 1,
    });
    const updated = cartReducer(added, {
      type: "set-quantity",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 4,
    });
    expect(updated.lines[0].quantity).toBe(4);

    const untouched = cartReducer(updated, {
      type: "set-quantity",
      productSlug: "other",
      variantId: "x",
      quantity: 9,
    });
    expect(untouched.lines[0].quantity).toBe(4);

    const removed = cartReducer(updated, { type: "remove", productSlug: SLUG, variantId: VARIANT });
    expect(removed.lines).toHaveLength(0);

    expect(cartReducer(updated, { type: "clear" })).toBe(EMPTY_CART);
  });

  it("replaces the cart wholesale", () => {
    const replacement = { lines: [{ productSlug: SLUG, variantId: VARIANT, quantity: 3 }] };
    expect(cartReducer(EMPTY_CART, { type: "replace", cart: replacement })).toBe(replacement);
  });
});

describe("countItems", () => {
  it("sums quantities across lines", () => {
    expect(countItems(EMPTY_CART)).toBe(0);
    expect(
      countItems({
        lines: [
          { productSlug: SLUG, variantId: VARIANT, quantity: 2 },
          { productSlug: SLUG, variantId: "moringa-powder-250g", quantity: 3 },
        ],
      }),
    ).toBe(5);
  });
});

describe("parseStoredCart", () => {
  it("returns an empty cart for missing or malformed data", () => {
    expect(parseStoredCart(null)).toEqual(EMPTY_CART);
    expect(parseStoredCart("not json")).toEqual(EMPTY_CART);
    expect(parseStoredCart("42")).toEqual(EMPTY_CART);
    expect(parseStoredCart("null")).toEqual(EMPTY_CART);
    expect(parseStoredCart(JSON.stringify({ lines: "nope" }))).toEqual(EMPTY_CART);
  });

  it("drops invalid lines and clamps quantities from untrusted storage", () => {
    const raw = JSON.stringify({
      lines: [
        { productSlug: SLUG, variantId: VARIANT, quantity: 500 },
        { productSlug: SLUG, quantity: 1 },
        { productSlug: 1, variantId: VARIANT, quantity: 1 },
        null,
        "line",
      ],
    });
    expect(parseStoredCart(raw)).toEqual({
      lines: [{ productSlug: SLUG, variantId: VARIANT, quantity: MAX_QUANTITY_PER_LINE }],
    });
  });
});

describe("the price a customer has seen", () => {
  it("is remembered on add, and refreshed when the same size is added again", () => {
    const first = cartReducer(EMPTY_CART, {
      type: "add",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 1,
      seenPriceMinor: 19_900,
    });
    expect(first.lines[0].seenPriceMinor).toBe(19_900);
    const again = cartReducer(first, {
      type: "add",
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 1,
      seenPriceMinor: 24_900,
    });
    expect(again.lines[0]).toEqual({
      productSlug: SLUG,
      variantId: VARIANT,
      quantity: 2,
      seenPriceMinor: 24_900,
    });
    expect(first.lines[0].seenPriceMinor).toBe(19_900);
  });

  it("is updated only for the accepted lines", () => {
    const cart = {
      lines: [
        { productSlug: SLUG, variantId: VARIANT, quantity: 1, seenPriceMinor: 100 },
        { productSlug: SLUG, variantId: "other", quantity: 1, seenPriceMinor: 200 },
      ],
    };
    const next = cartReducer(cart, {
      type: "accept-prices",
      prices: [{ productSlug: SLUG, variantId: VARIANT, priceMinor: 150 }],
    });
    expect(next.lines.map((line) => line.seenPriceMinor)).toEqual([150, 200]);
    expect(cart.lines[0].seenPriceMinor).toBe(100);
  });

  it("survives storage, and a malformed one is dropped rather than trusted", () => {
    const raw = JSON.stringify({
      lines: [
        { productSlug: SLUG, variantId: VARIANT, quantity: 1, seenPriceMinor: 24_900 },
        { productSlug: SLUG, variantId: "b", quantity: 1, seenPriceMinor: -5 },
        { productSlug: SLUG, variantId: "c", quantity: 1, seenPriceMinor: "24900" },
        { productSlug: SLUG, variantId: "d", quantity: 1, extra: "ignored" },
      ],
    });
    expect(parseStoredCart(raw).lines).toEqual([
      { productSlug: SLUG, variantId: VARIANT, quantity: 1, seenPriceMinor: 24_900 },
      { productSlug: SLUG, variantId: "b", quantity: 1 },
      { productSlug: SLUG, variantId: "c", quantity: 1 },
      { productSlug: SLUG, variantId: "d", quantity: 1 },
    ]);
  });
});

describe("planAdd and repeated adds", () => {
  const cartWith = (quantity: number) => ({
    lines: [{ productSlug: SLUG, variantId: VARIANT, quantity }],
  });

  it("adds everything while there is room", () => {
    expect(planAdd(EMPTY_CART, SLUG, VARIANT, 3)).toEqual({ result: "added", adds: 3 });
    expect(planAdd(cartWith(7), SLUG, VARIANT, 3)).toEqual({ result: "added", adds: 3 });
  });

  it("adds only up to the per-line limit, then nothing", () => {
    expect(planAdd(cartWith(8), SLUG, VARIANT, 5)).toEqual({ result: "capped", adds: 2 });
    expect(planAdd(cartWith(MAX_QUANTITY_PER_LINE), SLUG, VARIANT, 1)).toEqual({
      result: "full",
      adds: 0,
    });
  });

  it("treats an identical add within a moment as a double click", () => {
    const last = { key: "a", at: 1_000 };
    expect(isRepeatAdd(null, "a", 1_100)).toBe(false);
    expect(isRepeatAdd(last, "a", 1_000 + REPEAT_ADD_WINDOW_MS - 1)).toBe(true);
    expect(isRepeatAdd(last, "a", 1_000 + REPEAT_ADD_WINDOW_MS)).toBe(false);
    expect(isRepeatAdd(last, "b", 1_100)).toBe(false);
  });
});
