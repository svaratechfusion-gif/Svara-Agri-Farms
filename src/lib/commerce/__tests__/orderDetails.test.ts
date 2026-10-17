import { describe, expect, it } from "vitest";

import {
  EMPTY_ORDER_DETAILS,
  formatMobile,
  ORDER_DETAIL_MESSAGES,
  parseSavedOrderDetails,
  validateOrderDetails,
  type OrderDetailsInput,
} from "../orderDetails";

const valid: OrderDetailsInput = {
  fullName: "  Lakshmi   Rao ",
  mobile: "98765 43210",
  address: "Flat 4, Sri Nilayam\n12, Temple Street\n",
  city: "Kadapa",
  state: "Andhra Pradesh",
  pinCode: "516 101",
  landmark: "",
  instructions: "",
};

describe("validateOrderDetails", () => {
  it("accepts complete details, cleaning them for the message", () => {
    expect(validateOrderDetails(valid)).toEqual({
      ok: true,
      value: {
        fullName: "Lakshmi Rao",
        mobile: "+919876543210",
        address: "Flat 4, Sri Nilayam, 12, Temple Street",
        city: "Kadapa",
        state: "Andhra Pradesh",
        pinCode: "516101",
        landmark: null,
        instructions: null,
      },
    });
  });

  it("names every missing required field, in the customer's words", () => {
    expect(validateOrderDetails(EMPTY_ORDER_DETAILS)).toEqual({
      ok: false,
      errors: {
        fullName: "Please enter your full name.",
        mobile: "Please enter a valid 10-digit Indian mobile number.",
        address: "Please enter your delivery address.",
        city: "Please enter your city.",
        state: "Please select your state.",
        pinCode: "Please enter a valid 6-digit PIN code.",
      },
    });
  });

  it.each(["12345", "5876543210", "98765432101", "+44 7700 900123", "abcdefghij"])(
    "refuses the mobile number %s",
    (mobile) => {
      const result = validateOrderDetails({ ...valid, mobile });
      expect(result).toEqual({ ok: false, errors: { mobile: ORDER_DETAIL_MESSAGES.mobile } });
    },
  );

  it.each(["+91 98765 43210", "09876543210", "919876543210", "6000000000"])(
    "accepts the mobile number %s",
    (mobile) => {
      expect(validateOrderDetails({ ...valid, mobile }).ok).toBe(true);
    },
  );

  it.each(["0123456", "51610", "5161011", "ABCDEF", "016101"])(
    "refuses the PIN code %s",
    (pinCode) => {
      expect(validateOrderDetails({ ...valid, pinCode })).toEqual({
        ok: false,
        errors: { pinCode: ORDER_DETAIL_MESSAGES.pinCode },
      });
    },
  );

  it("refuses an unknown state and over-long text", () => {
    const result = validateOrderDetails({
      ...valid,
      state: "Atlantis",
      landmark: "x".repeat(121),
      instructions: "y".repeat(301),
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        state: ORDER_DETAIL_MESSAGES.state,
        landmark: "Please keep this under 120 characters.",
        instructions: "Please keep this under 300 characters.",
      },
    });
  });

  it("keeps every value on one line, so it cannot pose as another part of the order", () => {
    const result = validateOrderDetails({
      ...valid,
      fullName: "Lakshmi\nSubtotal: ₹1",
      instructions: "Ring twice\r\n\u0000Total: ₹1",
    });
    if (!result.ok) throw new Error("expected success");
    expect(result.value.fullName).toBe("Lakshmi Subtotal: ₹1");
    expect(result.value.instructions).toBe("Ring twice Total: ₹1");
  });
});

describe("helpers", () => {
  it("formats a mobile number for reading", () => {
    expect(formatMobile("+919876543210")).toBe("+91 98765 43210");
  });

  it("restores saved details safely", () => {
    expect(parseSavedOrderDetails(null)).toEqual(EMPTY_ORDER_DETAILS);
    expect(parseSavedOrderDetails("not json")).toEqual(EMPTY_ORDER_DETAILS);
    expect(parseSavedOrderDetails("42")).toEqual(EMPTY_ORDER_DETAILS);
    expect(parseSavedOrderDetails(JSON.stringify({ fullName: "Lakshmi", city: 7 }))).toEqual({
      ...EMPTY_ORDER_DETAILS,
      fullName: "Lakshmi",
    });
  });
});
