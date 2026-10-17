import { describe, expect, it } from "vitest";

import {
  isPaid,
  nextPaymentState,
  paymentProvider,
  type PaymentState,
  type VerifiedPaymentEvent,
} from "../payment";

const total = { amountMinor: 104_700, currency: "INR" as const };
const order = (payment: PaymentState) => ({ reference: "SVF-261014-AAAAAA", total, payment });
const event = (overrides: Partial<VerifiedPaymentEvent> = {}): VerifiedPaymentEvent => ({
  eventId: "evt_1",
  providerPaymentId: "pay_1",
  orderReference: "SVF-261014-AAAAAA",
  status: "paid",
  amount: total,
  ...overrides,
});

describe("payment", () => {
  it("has no provider connected", () => {
    expect(paymentProvider).toBeNull();
  });

  it("counts only a paid state as paid — never failed, pending or cancelled", () => {
    const states: PaymentState[] = ["not-collected", "pending", "failed", "cancelled", "expired"];
    for (const status of states) expect(isPaid({ payment: { status } })).toBe(false);
    expect(isPaid({ payment: { status: "paid" } })).toBe(true);
  });
});

describe("nextPaymentState", () => {
  it("marks an order paid only for its own reference and the exact amount", () => {
    expect(nextPaymentState(order("pending"), event())).toEqual({ changed: true, state: "paid" });
    expect(
      nextPaymentState(order("pending"), event({ orderReference: "SVF-261014-BBBBBB" })),
    ).toEqual({ changed: false, state: "pending", reason: "wrong-order" });
    expect(
      nextPaymentState(order("pending"), event({ amount: { amountMinor: 100, currency: "INR" } })),
    ).toEqual({ changed: false, state: "pending", reason: "amount-mismatch" });
  });

  it("never undoes a payment, nor processes a repeated event twice", () => {
    expect(nextPaymentState(order("paid"), event({ status: "failed" }))).toEqual({
      changed: false,
      state: "paid",
      reason: "already-paid",
    });
    expect(nextPaymentState(order("paid"), event())).toMatchObject({ changed: false });
    expect(nextPaymentState(order("failed"), event({ status: "failed" }))).toEqual({
      changed: false,
      state: "failed",
      reason: "no-change",
    });
  });

  it("records failed, cancelled and abandoned attempts, and allows a retry after them", () => {
    for (const status of ["failed", "cancelled", "expired"] as const) {
      expect(nextPaymentState(order("pending"), event({ status }))).toEqual({
        changed: true,
        state: status,
      });
      expect(nextPaymentState(order(status), event({ status: "pending" }))).toEqual({
        changed: true,
        state: "pending",
      });
    }
  });
});
