import type { OrderRequest } from "./orderRequest";
import type { OrderStatus } from "./orderStatus";

/**
 * Order notifications — extension points only. NO channel (email, SMS,
 * WhatsApp) is connected, so nothing is sent and nothing claims to have
 * been. `orderNotifier` is null; connect one by implementing `OrderNotifier`.
 *
 * Sending never decides whether an order was saved: it runs after the save,
 * and a failure is logged, not shown to the customer as an order failure.
 */

export type NotificationKind =
  | "order-request-received"
  | "team-new-order-request"
  | "order-confirmed"
  | "payment-received"
  | "order-shipped"
  | "order-delivered";

export interface OrderNotification {
  kind: NotificationKind;
  audience: "customer" | "team";
  order: OrderRequest;
}

export interface OrderNotifier {
  send(notification: OrderNotification): Promise<void>;
}

/** No notification channel is configured. */
export const orderNotifier: OrderNotifier | null = null;

const FOR_STATUS: Partial<Record<OrderStatus, readonly [NotificationKind, "customer" | "team"][]>> =
  {
    requested: [
      ["order-request-received", "customer"],
      ["team-new-order-request", "team"],
    ],
    confirmed: [["order-confirmed", "customer"]],
    paid: [
      ["payment-received", "customer"],
      ["payment-received", "team"],
    ],
    shipped: [["order-shipped", "customer"]],
    delivered: [["order-delivered", "customer"]],
  };

/** The notifications an order reaching `status` should send. */
export function notificationsFor(status: OrderStatus, order: OrderRequest): OrderNotification[] {
  return (FOR_STATUS[status] ?? []).map(([kind, audience]) => ({ kind, audience, order }));
}

/** Sends each notification; never throws. Logs the kind and reference only. */
export async function sendNotifications(
  notifier: OrderNotifier | null,
  notifications: readonly OrderNotification[],
  logError: (message: string, detail?: unknown) => void,
): Promise<void> {
  if (!notifier) return;
  for (const notification of notifications) {
    try {
      await notifier.send(notification);
    } catch (error) {
      logError(
        `Notification ${notification.kind} for ${notification.order.reference} failed`,
        error,
      );
    }
  }
}
