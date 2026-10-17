import { describe, expect, it } from "vitest";

import { INDIAN_STATES, normalizePhone, validateDelivery, type DeliveryInput } from "../delivery";

const valid: DeliveryInput = {
  fullName: "  Lakshmi Rao ",
  phone: "98765 43210",
  email: "",
  addressLine1: "12, Temple Street",
  addressLine2: "",
  locality: "Kodur",
  city: "Kadapa",
  state: "Andhra Pradesh",
  pinCode: "516 101",
  instructions: "",
};

describe("validateDelivery", () => {
  it("accepts complete details and returns them cleaned", () => {
    const result = validateDelivery(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      fullName: "Lakshmi Rao",
      phone: "+919876543210",
      email: null,
      addressLine1: "12, Temple Street",
      addressLine2: null,
      locality: "Kodur",
      city: "Kadapa",
      state: "Andhra Pradesh",
      pinCode: "516101",
      instructions: null,
    });
  });

  it("reports every missing required field by name", () => {
    const result = validateDelivery({
      ...valid,
      fullName: " ",
      phone: "",
      addressLine1: "",
      locality: "",
      city: "",
      state: "",
      pinCode: "",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      // Address line 2, locality, email and instructions are optional.
      ["addressLine1", "city", "fullName", "phone", "pinCode", "state"].sort(),
    );
    expect(result.errors.fullName).toMatch(/enter your full name/i);
  });

  it.each(["12345", "5876543210", "98765432101", "+44 7700 900123", "phone"])(
    "rejects the phone number %s",
    (phone) => {
      const result = validateDelivery({ ...valid, phone });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.phone).toMatch(/10-digit Indian mobile/);
    },
  );

  it.each(["012345", "51610", "5161011", "ABCDEF"])("rejects the PIN code %s", (pinCode) => {
    const result = validateDelivery({ ...valid, pinCode });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.pinCode).toMatch(/6-digit PIN/);
  });

  it("only accepts a real state or union territory", () => {
    const result = validateDelivery({ ...valid, state: "Atlantis" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.state).toBeDefined();
    expect(INDIAN_STATES).toHaveLength(36);
  });

  it("checks optional fields only when given", () => {
    const bad = validateDelivery({ ...valid, email: "not-an-email" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors)).toEqual(["email"]);
    const good = validateDelivery({
      ...valid,
      email: " Lakshmi@Example.com ",
      addressLine2: "Near the well",
    });
    expect(good.ok && good.value.email).toBe("lakshmi@example.com");
    expect(good.ok && good.value.addressLine2).toBe("Near the well");
  });

  it("limits lengths and strips control characters", () => {
    const long = validateDelivery({ ...valid, instructions: "a".repeat(301) });
    expect(long.ok).toBe(false);
    const cleaned = validateDelivery({ ...valid, fullName: "Lakshmi\u0000 Rao" });
    expect(cleaned.ok && cleaned.value.fullName).toBe("Lakshmi Rao");
  });

  it("treats non-string input as missing, never throwing", () => {
    const result = validateDelivery({ ...valid, phone: 9876543210 as unknown as string });
    expect(result.ok).toBe(false);
  });
});

describe("normalizePhone", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+91 98765-43210", "+919876543210"],
    ["091 98765 43210", "+919876543210"],
    ["(0) 98765 43210", "+919876543210"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("returns null for anything that is not an Indian mobile number", () => {
    expect(normalizePhone("1234567890")).toBeNull();
  });
});
