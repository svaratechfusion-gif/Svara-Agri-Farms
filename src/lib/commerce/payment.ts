import type { Money } from "./types";

/**
 * Payment — the boundary a gateway will attach to. NO provider is connected:
 * nothing here takes, simulates or records a payment, and `paymentProvider`
 * is null. Order requests are saved with payment `not-collected`.
 *
 * How a provider attaches (see README, "Payment"):
 *   1. After an order request is saved, the server calls `createPayment`
 *      for its reference and server-computed total, and the browser
 *      continues with what that returns (e.g. a hosted checkout).
 *   2. The provider calls a webhook route. `verifyWebhook` checks its
 *      signature against the raw body with a server-only secret; anything
 *      unsigned or mis-signed is null and changes nothing.
 *   3. `nextPaymentState` decides what a verified event may change. Only a
 *      verified `paid` event, for the right order and the exact amount,
 *      makes an order paid. A browser redirect back to the site proves
 *      nothing and is never passed here.
 */

/** A payment attempt's state, as reported by a verified provider event. */
export type PaymentAttemptStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

/** An order's payment state: nothing collected yet, or its latest attempt. */
export type PaymentState = "not-collected" | PaymentAttemptStatus;

/** A provider event whose signature the server has already verified. */
export interface VerifiedPaymentEvent {
  /** The provider's unique ID for this event, so replays can be ignored. */
  eventId: string;
  providerPaymentId: string;
  orderReference: string;
  status: PaymentAttemptStatus;
  amount: Money;
}

export interface PaymentProvider {
  readonly id: string;
  /**
   * Starts a payment for a saved order request. `idempotencyKey` makes a
   * retried call return the same payment instead of creating another.
   */
  createPayment(
    order: { reference: string; amount: Money },
    idempotencyKey: string,
  ): Promise<{ providerPaymentId: string; checkout: Readonly<Record<string, string>> }>;
  /** The event, if the signature on `rawBody` is genuine; otherwise null. */
  verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedPaymentEvent | null>;
}

/** No gateway is configured. Replace only with a real, verified integration. */
export const paymentProvider: PaymentProvider | null = null;

export type PaymentDecision =
  | { changed: true; state: PaymentState }
  | {
      changed: false;
      state: PaymentState;
      reason: "wrong-order" | "amount-mismatch" | "already-paid" | "no-change";
    };

const sameMoney = (a: Money, b: Money) =>
  a.amountMinor === b.amountMinor && a.currency === b.currency;

/**
 * What a verified event may change about one order's payment. `paid` is
 * final here (refunds are a separate flow); a failed, cancelled or expired
 * attempt can be followed by a new `pending` one, so a customer can retry.
 */
export function nextPaymentState(
  order: { reference: string; total: Money; payment: PaymentState },
  event: VerifiedPaymentEvent,
): PaymentDecision {
  const current = order.payment;
  if (event.orderReference !== order.reference) {
    return { changed: false, state: current, reason: "wrong-order" };
  }
  if (current === "paid") return { changed: false, state: current, reason: "already-paid" };
  if (event.status === "paid" && !sameMoney(event.amount, order.total)) {
    return { changed: false, state: current, reason: "amount-mismatch" };
  }
  if (event.status === current) return { changed: false, state: current, reason: "no-change" };
  return { changed: true, state: event.status };
}

/** Whether money has been received for this order. Only a verified `paid` counts. */
export function isPaid(order: { payment: { status: PaymentState } }): boolean {
  return order.payment.status === "paid";
}
