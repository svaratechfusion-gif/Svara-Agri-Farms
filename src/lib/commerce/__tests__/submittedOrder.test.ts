import { describe, expect, it } from "vitest";

import { catalogue } from "@/content/products";

import { resolveCart } from "../orderLines";
import { NO_RULES } from "../pricing";
import {
  createSubmittedOrderStore,
  parseSubmittedOrder,
  SUBMITTED_ORDER_KEY,
  type SubmittedOrder,
} from "../submittedOrder";
import { prepareWhatsAppOrder } from "../whatsappOrder";

function placedOrder(): SubmittedOrder {
  const cart = resolveCart(
    { lines: [{ productSlug: "neem-powder", variantId: "neem-powder-250g", quantity: 2 }] },
    catalogue,
  );
  const prepared = prepareWhatsAppOrder(
    cart,
    {
      fullName: "Lakshmi Rao",
      mobile: "9876543210",
      address: "12, Temple Street",
      city: "Kadapa",
      state: "Andhra Pradesh",
      pinCode: "516101",
      landmark: "",
      instructions: "",
    },
    NO_RULES,
    new Date("2026-10-18T08:30:00Z"),
    () => "SVARA-20261018-7K3QX9",
  );
  if (!prepared.ok) throw new Error("fixture order did not prepare");
  return prepared.order;
}

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  };
}

describe("the placed-order copy", () => {
  it("survives being stored and read back exactly", () => {
    const order = placedOrder();
    expect(parseSubmittedOrder(JSON.stringify(order))).toEqual(order);
  });

  it("refuses anything malformed or tampered with", () => {
    const order = placedOrder();
    const broken: unknown[] = [
      null,
      "not json",
      [],
      { ...order, orderId: "SVARA-123" },
      { ...order, orderId: "SVARA-20261018-ILOU00" },
      { ...order, submittedAt: "yesterday" },
      { ...order, lines: [] },
      { ...order, lines: [{ ...order.lines[0], quantity: 0 }] },
      { ...order, lines: [{ ...order.lines[0], unitPrice: { amountMinor: -1, currency: "INR" } }] },
      { ...order, totals: { ...order.totals, total: null } },
      { ...order, customer: { ...order.customer, fullName: "" } },
      { ...order, whatsappUrl: "javascript:alert(1)" },
      { ...order, whatsappUrl: "https://example.com/?text=hi" },
    ];
    for (const value of broken) {
      const raw = typeof value === "string" ? value : JSON.stringify(value);
      expect(parseSubmittedOrder(raw)).toBeNull();
    }
    expect(parseSubmittedOrder(null)).toBeNull();
  });

  it("is kept for the session, and read back the same on every visit", () => {
    const storage = memoryStorage();
    const store = createSubmittedOrderStore(() => storage);
    expect(store.read()).toBeNull();
    const order = placedOrder();
    store.save(order);
    expect(storage.getItem(SUBMITTED_ORDER_KEY)).toBe(JSON.stringify(order));
    // A refresh: a new store over the same session storage.
    const afterRefresh = createSubmittedOrderStore(() => storage).read();
    expect(afterRefresh).toEqual(order);
    expect(afterRefresh?.orderId).toBe(store.read()?.orderId);
  });

  it("is still shown for this visit when the browser refuses storage", () => {
    const refusing = createSubmittedOrderStore(() => {
      throw new Error("SecurityError");
    });
    const order = placedOrder();
    refusing.save(order);
    expect(refusing.read()).toEqual(order);
  });
});
