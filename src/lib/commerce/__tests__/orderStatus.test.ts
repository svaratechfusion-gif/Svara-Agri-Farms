import { describe, expect, it } from "vitest";

import {
  canTransition,
  INITIAL_ORDER_STATUS,
  isTerminal,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_NOTE,
  ORDER_STATUSES,
  transitionOrder,
  type OrderStatus,
} from "../orderStatus";

const ALLOWED: [OrderStatus, OrderStatus][] = [
  ["requested", "confirmed"],
  ["requested", "cancelled"],
  ["confirmed", "payment-pending"],
  ["confirmed", "cancelled"],
  ["payment-pending", "paid"],
  ["payment-pending", "failed"],
  ["payment-pending", "cancelled"],
  ["paid", "processing"],
  ["processing", "shipped"],
  ["shipped", "delivered"],
];

describe("the order lifecycle", () => {
  it("starts every order as requested", () => {
    expect(INITIAL_ORDER_STATUS).toBe("requested");
  });

  it("allows exactly the lifecycle's steps, and nothing else", () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        const expected = ALLOWED.some(([a, b]) => a === from && b === to);
        expect(canTransition(from, to), `${from} → ${to}`).toBe(expected);
      }
    }
  });

  it("ends at delivered, cancelled or failed", () => {
    expect(ORDER_STATUSES.filter(isTerminal)).toEqual(["delivered", "cancelled", "failed"]);
  });

  it("marks an order paid only after a verified payment", () => {
    expect(
      transitionOrder({ status: "payment-pending", paymentStatus: "pending" }, "paid"),
    ).toEqual({ ok: false, reason: "payment-not-verified" });
    expect(
      transitionOrder({ status: "payment-pending", paymentStatus: "not-collected" }, "paid"),
    ).toEqual({ ok: false, reason: "payment-not-verified" });
    expect(transitionOrder({ status: "payment-pending", paymentStatus: "paid" }, "paid")).toEqual({
      ok: true,
      status: "paid",
    });
  });

  it("goes no further than awaiting payment while no payment can be verified", () => {
    let status: OrderStatus = INITIAL_ORDER_STATUS;
    for (const next of ["confirmed", "payment-pending"] as const) {
      const step = transitionOrder({ status, paymentStatus: "not-collected" }, next);
      expect(step).toEqual({ ok: true, status: next });
      status = next;
    }
    expect(transitionOrder({ status, paymentStatus: "not-collected" }, "paid").ok).toBe(false);
    expect(transitionOrder({ status, paymentStatus: "not-collected" }, "shipped")).toEqual({
      ok: false,
      reason: "not-allowed",
    });
  });

  it("describes every status to customers without claiming payment early", () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_LABEL[status]).toBeTruthy();
      expect(ORDER_STATUS_NOTE[status]).toBeTruthy();
    }
    expect(ORDER_STATUS_NOTE.requested).toContain("No payment has been taken");
  });
});
