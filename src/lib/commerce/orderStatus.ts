import type { PaymentState } from "./payment";

/**
 * An order's lifecycle. Requests start `requested`; the team confirms them,
 * then asks for payment. `paid` is reached only through a verified payment
 * (see `payment.ts`), never by hand — so while no payment provider is
 * connected, an order can go no further than `payment-pending`.
 *
 *   requested → confirmed → payment-pending → paid → processing → shipped → delivered
 *   cancelled (before payment) and failed (payment given up) end an order early.
 */
export const ORDER_STATUSES = [
  "requested",
  "confirmed",
  "payment-pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const INITIAL_ORDER_STATUS = "requested" satisfies OrderStatus;

const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["payment-pending", "cancelled"],
  "payment-pending": ["paid", "failed", "cancelled"],
  // Cancelling after payment needs a refund flow, which does not exist yet.
  paid: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  failed: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT[from].includes(to);
}

export function isTerminal(status: OrderStatus): boolean {
  return NEXT[status].length === 0;
}

export type TransitionResult =
  { ok: true; status: OrderStatus } | { ok: false; reason: "not-allowed" | "payment-not-verified" };

/** Moves an order on, refusing impossible steps and an unverified `paid`. */
export function transitionOrder(
  order: { status: OrderStatus; paymentStatus: PaymentState },
  to: OrderStatus,
): TransitionResult {
  if (!canTransition(order.status, to)) return { ok: false, reason: "not-allowed" };
  if (to === "paid" && order.paymentStatus !== "paid") {
    return { ok: false, reason: "payment-not-verified" };
  }
  return { ok: true, status: to };
}

/** What each status means to the customer. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  requested: "Request received",
  confirmed: "Confirmed",
  "payment-pending": "Awaiting payment",
  paid: "Paid",
  processing: "Being prepared",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Not completed",
};

export const ORDER_STATUS_NOTE: Record<OrderStatus, string> = {
  requested:
    "Our team will contact you to confirm availability, delivery charges and payment. No payment has been taken.",
  confirmed: "Your order is confirmed. Our team will share how to pay.",
  "payment-pending": "Your order is confirmed and waiting for payment.",
  paid: "Payment received.",
  processing: "Your order is being prepared.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered.",
  cancelled: "This order was cancelled.",
  failed: "This order could not be completed.",
};
