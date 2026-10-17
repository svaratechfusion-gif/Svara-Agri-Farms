import { describe, expect, it, vi } from "vitest";

import {
  notificationsFor,
  orderNotifier,
  sendNotifications,
  type OrderNotifier,
} from "../notifications";
import type { OrderRequest } from "../orderRequest";

const order = { reference: "SVF-261014-AAAAAA" } as OrderRequest;

describe("order notifications", () => {
  it("has no channel connected, so nothing is sent", () => {
    expect(orderNotifier).toBeNull();
  });

  it("knows what each status should announce, and to whom", () => {
    const kinds = (status: Parameters<typeof notificationsFor>[0]) =>
      notificationsFor(status, order).map((n) => `${n.kind}:${n.audience}`);
    expect(kinds("requested")).toEqual([
      "order-request-received:customer",
      "team-new-order-request:team",
    ]);
    expect(kinds("confirmed")).toEqual(["order-confirmed:customer"]);
    expect(kinds("paid")).toEqual(["payment-received:customer", "payment-received:team"]);
    expect(kinds("shipped")).toEqual(["order-shipped:customer"]);
    expect(kinds("delivered")).toEqual(["order-delivered:customer"]);
    expect(kinds("payment-pending")).toEqual([]);
  });

  it("sends each one, and a failure is logged without stopping the rest", async () => {
    const sent: string[] = [];
    const notifier: OrderNotifier = {
      send: vi.fn(async (n) => {
        if (n.audience === "customer") throw new Error("SMS down");
        sent.push(n.kind);
      }),
    };
    const logError = vi.fn();
    await sendNotifications(notifier, notificationsFor("requested", order), logError);
    expect(sent).toEqual(["team-new-order-request"]);
    expect(logError).toHaveBeenCalledWith(
      "Notification order-request-received for SVF-261014-AAAAAA failed",
      expect.any(Error),
    );
  });

  it("does nothing without a notifier", async () => {
    const logError = vi.fn();
    await sendNotifications(null, notificationsFor("requested", order), logError);
    expect(logError).not.toHaveBeenCalled();
  });
});
