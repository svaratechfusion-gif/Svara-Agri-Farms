import type { OrderRequest } from "./orderRequest";

/**
 * Payment — not part of the site yet. No gateway is connected and nothing
 * here takes, simulates or records a payment.
 *
 * Where it will attach: after an order request is saved (`pending-confirmation`,
 * payment `not-collected`) and the team has confirmed availability and delivery
 * charges, a provider (Razorpay, Stripe, UPI…) would start a payment for that
 * request and, on the provider's verified callback, move `payment.status`
 * on. The cart, delivery details and request creation stay as they are.
 */
export const PAYMENT_PROVIDER = null;

/** Whether any money has been taken for this request. Always false today. */
export function isPaid(order: Pick<OrderRequest, "payment">): boolean {
  return order.payment.status !== "not-collected";
}
