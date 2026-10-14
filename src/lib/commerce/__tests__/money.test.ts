import { describe, expect, it } from "vitest";

import { formatMoney, multiplyMoney, sumMoney } from "../money";

const inr = (amountMinor: number) => ({ amountMinor, currency: "INR" as const });

describe("formatMoney", () => {
  it("formats minor units as Indian rupees", () => {
    expect(formatMoney(inr(125000))).toBe("₹1,250");
    expect(formatMoney(inr(4999))).toBe("₹49.99");
  });
});

describe("multiplyMoney", () => {
  it("returns a new value without mutating the input", () => {
    const unit = inr(1000);
    expect(multiplyMoney(unit, 3)).toEqual(inr(3000));
    expect(unit.amountMinor).toBe(1000);
  });
});

describe("sumMoney", () => {
  it("adds known amounts", () => {
    expect(sumMoney([inr(100), inr(250)])).toEqual(inr(350));
  });

  it("returns null when empty or when any amount is unknown", () => {
    expect(sumMoney([])).toBeNull();
    expect(sumMoney([inr(100), null])).toBeNull();
  });

  it("refuses to add different currencies", () => {
    const usd = { amountMinor: 100, currency: "USD" } as unknown as ReturnType<typeof inr>;
    expect(() => sumMoney([inr(100), usd])).toThrow(/different currencies/);
  });
});
