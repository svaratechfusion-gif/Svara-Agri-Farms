import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { products } from "@/content/products";
import { AVAILABILITY_LABEL } from "@/lib/commerce/availability";
import { MAX_QUANTITY_PER_LINE, MIN_QUANTITY } from "@/lib/commerce/cart";
import { normalizePhone } from "@/lib/commerce/delivery";
import { REFERENCE_PATTERN } from "@/lib/commerce/orderRequest";
import { INITIAL_ORDER_STATUS, ORDER_STATUSES, type OrderStatus } from "@/lib/commerce/orderStatus";
import type { PaymentState } from "@/lib/commerce/payment";
import type { Availability, CurrencyCode } from "@/lib/commerce/types";
import {
  AVAILABILITY_VALUES,
  CURRENCY_VALUES,
  ORDER_REQUEST_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
} from "@/server/db/schema/enums";
import {
  MAX_LINE_QUANTITY,
  MIN_LINE_QUANTITY,
  ORDER_REFERENCE_PATTERN,
  PHONE_PATTERN,
  SHA256_HEX_PATTERN,
  VARIANT_ID_PATTERN,
} from "@/server/db/schema/rules";

// Compile-time: the database value sets and the site's types are the same.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const availabilityMatches: Same<(typeof AVAILABILITY_VALUES)[number], Availability> = true;
const currencyMatches: Same<(typeof CURRENCY_VALUES)[number], CurrencyCode> = true;
const paymentMatches: Same<(typeof PAYMENT_STATUS_VALUES)[number], PaymentState> = true;
const statusMatches: Same<(typeof ORDER_REQUEST_STATUS_VALUES)[number], OrderStatus> = true;

describe("database rules mirror the site's commerce rules", () => {
  it("keeps the same availability, currency and payment values", () => {
    expect([availabilityMatches, currencyMatches, paymentMatches]).toEqual([true, true, true]);
    expect([...AVAILABILITY_VALUES].sort()).toEqual(Object.keys(AVAILABILITY_LABEL).sort());
  });

  it("has exactly the site's order statuses, in lifecycle order", () => {
    expect(statusMatches).toBe(true);
    expect([...ORDER_REQUEST_STATUS_VALUES]).toEqual([...ORDER_STATUSES]);
    expect(ORDER_REQUEST_STATUS_VALUES).toContain(INITIAL_ORDER_STATUS);
  });

  it("uses the same order reference pattern", () => {
    expect(ORDER_REFERENCE_PATTERN).toBe(REFERENCE_PATTERN.source);
  });

  it("accepts exactly the phone numbers normalizePhone produces", () => {
    const phone = new RegExp(PHONE_PATTERN);
    for (const raw of ["9876543210", "+91 98765 43210", "09876543210", "6000000000"]) {
      const normalised = normalizePhone(raw);
      expect(normalised).not.toBeNull();
      expect(phone.test(normalised!)).toBe(true);
    }
    expect(phone.test("9876543210")).toBe(false);
    expect(phone.test("+915876543210")).toBe(false);
  });

  it("uses the cart's quantity limits", () => {
    expect([MIN_LINE_QUANTITY, MAX_LINE_QUANTITY]).toEqual([MIN_QUANTITY, MAX_QUANTITY_PER_LINE]);
  });

  it("accepts the submission-key hashes the order store writes", () => {
    const hash = createHash("sha256").update("any-key").digest("hex");
    expect(new RegExp(SHA256_HEX_PATTERN).test(hash)).toBe(true);
  });

  it("accepts every product slug and variant ID in the catalogue", () => {
    const id = new RegExp(VARIANT_ID_PATTERN);
    for (const product of products) {
      expect(id.test(product.slug)).toBe(true);
      for (const variant of product.variants) expect(id.test(variant.id)).toBe(true);
    }
  });
});
