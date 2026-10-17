import { describe, expect, it } from "vitest";

import { catalogue, inr } from "@/content/products";

import { cartReducer } from "../cart";
import {
  EMPTY_ORDER_DETAILS,
  validateOrderDetails,
  type OrderDetails,
  type OrderDetailsInput,
} from "../orderDetails";
import { currentPrices, resolveCart } from "../orderLines";
import { NO_RULES, type CommerceRules } from "../pricing";
import { prepareWhatsAppOrder, whatsappOrderMessage, whatsappOrderUrl } from "../whatsappOrder";
import { fixtureCatalogue } from "./fixtures";

const line = (productSlug: string, grams: 100 | 250, quantity: number) => ({
  productSlug,
  variantId: `${productSlug}-${grams}g`,
  quantity,
});

const parsed = validateOrderDetails({
  fullName: "Lakshmi Rao",
  mobile: "9876543210",
  address: "12, Temple Street",
  city: "Kadapa",
  state: "Andhra Pradesh",
  pinCode: "516101",
  landmark: "Near the old banyan tree",
  instructions: "Call before delivery",
});
if (!parsed.ok) throw new Error("fixture details are invalid");
const details: OrderDetails = parsed.value;
const ID = "SVARA-20261018-7K3QX9";

describe("the WhatsApp order message", () => {
  it("holds the customer's details and the whole cart, priced from the catalogue", () => {
    const cart = resolveCart(
      { lines: [line("moringa-powder", 100, 2), line("carrot-powder", 250, 1)] },
      catalogue,
    );
    expect(whatsappOrderMessage(cart, details, NO_RULES, ID)).toBe(
      [
        "Hello SVARA Agri Farms,",
        "",
        "ORDER ID: SVARA-20261018-7K3QX9",
        "",
        "I would like to place an order.",
        "",
        "CUSTOMER DETAILS",
        "----------------",
        "Name: Lakshmi Rao",
        "Mobile: +91 98765 43210",
        "Address: 12, Temple Street",
        "City: Kadapa",
        "State: Andhra Pradesh",
        "PIN Code: 516101",
        "Landmark: Near the old banyan tree",
        "Delivery Instructions: Call before delivery",
        "",
        "ORDER DETAILS",
        "-------------",
        "1. SVARA Moringa Powder",
        "   Size: 100 g",
        "   Quantity: 2",
        "   Unit Price: ₹250",
        "   Line Total: ₹500",
        "",
        "2. Carrot Powder",
        "   Size: 250 g",
        "   Quantity: 1",
        "   Unit Price: ₹350",
        "   Line Total: ₹350",
        "",
        "Subtotal: ₹850",
        "",
        "Delivery charges, if any, to be confirmed.",
        "",
        "Total before delivery: ₹850",
        "",
        "Please confirm availability and delivery details.",
        "",
        "Thank you,",
        "SVARA Agri Farms",
      ].join("\n"),
    );
  });

  it("says “Not provided” for an empty landmark or instructions", () => {
    const cart = resolveCart({ lines: [line("ginger-powder", 250, 3)] }, catalogue);
    const message = whatsappOrderMessage(
      cart,
      { ...details, landmark: null, instructions: null },
      NO_RULES,
      ID,
    )!;
    expect(message).toContain("Landmark: Not provided\nDelivery Instructions: Not provided");
    expect(message).toContain("   Quantity: 3\n   Unit Price: ₹350\n   Line Total: ₹1,050");
    expect(message).toContain("Subtotal: ₹1,050");
  });

  it("lists both sizes of one product as separate lines", () => {
    const message = whatsappOrderMessage(
      resolveCart(
        { lines: [line("amla-powder", 100, 3), line("amla-powder", 250, 10)] },
        catalogue,
      ),
      details,
      NO_RULES,
      ID,
    )!;
    expect(message).toContain("1. Amla Powder\n   Size: 100 g\n   Quantity: 3");
    expect(message).toContain("2. Amla Powder\n   Size: 250 g\n   Quantity: 10");
    expect(message).toContain("Subtotal: ₹4,250");
  });

  it("opens a chat with the business number, the message fully URL-encoded", () => {
    const cart = resolveCart({ lines: [line("ginger-powder", 250, 2)] }, catalogue);
    const url = whatsappOrderUrl(cart, details, NO_RULES, ID)!;
    expect(url.startsWith("https://wa.me/917780262442?text=")).toBe(true);
    expect(url.split("?text=")[1]).not.toMatch(/[\s₹—,:&#?+]/);
    expect(new URL(url).searchParams.get("text")).toBe(
      whatsappOrderMessage(cart, details, NO_RULES, ID),
    );
  });

  it("is never written for an empty cart, or one with something that cannot be ordered", () => {
    expect(
      whatsappOrderMessage(resolveCart({ lines: [] }, catalogue), details, NO_RULES, ID),
    ).toBeNull();
    // An unavailable size of an available product.
    for (const variantId of ["test-soon", "test-sold"]) {
      const cart = resolveCart(
        {
          lines: [
            { productSlug: "test-powder", variantId: "test-100g", quantity: 1 },
            { productSlug: "test-powder", variantId, quantity: 1 },
          ],
        },
        fixtureCatalogue,
      );
      expect(whatsappOrderUrl(cart, details, NO_RULES, ID)).toBeNull();
    }
    // A product that is in preparation, and one no longer in the catalogue.
    const later = resolveCart(
      { lines: [{ productSlug: "test-later", variantId: "test-later-100g", quantity: 1 }] },
      fixtureCatalogue,
    );
    expect(whatsappOrderMessage(later, details, NO_RULES, ID)).toBeNull();
    const gone = resolveCart({ lines: [line("gold-powder", 100, 1)] }, catalogue);
    expect(whatsappOrderMessage(gone, details, NO_RULES, ID)).toBeNull();
  });

  it("waits for a changed price to be accepted, then carries only the current price", () => {
    const stale = { lines: [{ ...line("ginger-powder", 100, 2), seenPriceMinor: 19_900 }] };
    expect(whatsappOrderMessage(resolveCart(stale, catalogue), details, NO_RULES, ID)).toBeNull();
    const accepted = cartReducer(stale, {
      type: "accept-prices",
      prices: currentPrices(resolveCart(stale, catalogue)),
    });
    const message = whatsappOrderMessage(resolveCart(accepted, catalogue), details, NO_RULES, ID)!;
    expect(message).toContain("Unit Price: ₹250\n   Line Total: ₹500");
    expect(message).not.toContain("₹199");
  });

  it("shows delivery and tax only once they are configured", () => {
    const rules: CommerceRules = {
      deliveryZones: [
        { id: "ap", label: "AP", pinCodePrefixes: ["516"], charge: inr(60), freeFrom: null },
      ],
      tax: null,
      minimumOrder: null,
    };
    const message = whatsappOrderMessage(
      resolveCart({ lines: [line("neem-powder", 100, 1)] }, catalogue),
      details,
      rules,
      ID,
    )!;
    expect(message).toContain("Delivery charges: ₹60");
    expect(message).toContain("Total: ₹310");
    expect(message).not.toContain("to be confirmed");
  });

  it("never claims the order is received, confirmed or paid", () => {
    const message = whatsappOrderMessage(
      resolveCart({ lines: [line("neem-powder", 250, 1)] }, catalogue),
      details,
      NO_RULES,
      ID,
    )!;
    expect(message).not.toMatch(
      /order (is )?(placed|confirmed|received)|\bpaid\b|payment (received|successful)|delivery confirmed/i,
    );
  });
});

describe("prepareWhatsAppOrder (what Place order on WhatsApp decides)", () => {
  const input: OrderDetailsInput = {
    fullName: "Lakshmi Rao",
    mobile: "9876543210",
    address: "12, Temple Street",
    city: "Kadapa",
    state: "Andhra Pradesh",
    pinCode: "516101",
    landmark: "Near the old banyan tree",
    instructions: "Call before delivery",
  };
  const twoLines = resolveCart(
    { lines: [line("moringa-powder", 100, 2), line("carrot-powder", 250, 1)] },
    catalogue,
  );

  const now = new Date("2026-10-18T08:30:00Z");
  const fixedId = () => ID;

  it("makes one order ID, heads the message with it, and keeps the order as placed", () => {
    let made = 0;
    const prepared = prepareWhatsAppOrder(twoLines, input, NO_RULES, now, () => {
      made += 1;
      return ID;
    });
    expect(made).toBe(1);
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.message).toBe(whatsappOrderMessage(twoLines, details, NO_RULES, ID));
    expect(prepared.message.split("\n").slice(0, 3)).toEqual([
      "Hello SVARA Agri Farms,",
      "",
      `ORDER ID: ${ID}`,
    ]);
    expect(prepared.order).toEqual({
      orderId: ID,
      submittedAt: "2026-10-18T08:30:00.000Z",
      customer: details,
      lines: [
        {
          key: "moringa-powder:moringa-powder-100g",
          productName: "SVARA Moringa Powder",
          sku: "SVARA-MORINGA-100",
          weightGrams: 100,
          variantLabel: "100 g pouch",
          quantity: 2,
          unitPrice: inr(250),
          lineTotal: inr(500),
        },
        {
          key: "carrot-powder:carrot-powder-250g",
          productName: "Carrot Powder",
          sku: "SVARA-CARROT-250",
          weightGrams: 250,
          variantLabel: "250 g pouch",
          quantity: 1,
          unitPrice: inr(350),
          lineTotal: inr(350),
        },
      ],
      totals: {
        subtotal: inr(850),
        deliveryCharge: null,
        tax: null,
        taxIncluded: false,
        total: inr(850),
        isFinal: false,
      },
      whatsappUrl: whatsappOrderUrl(twoLines, details, NO_RULES, ID),
    });
  });

  it("makes no order ID when the details or the cart fail", () => {
    let made = 0;
    const count = () => {
      made += 1;
      return ID;
    };
    prepareWhatsAppOrder(twoLines, EMPTY_ORDER_DETAILS, NO_RULES, now, count);
    prepareWhatsAppOrder(resolveCart({ lines: [] }, catalogue), input, NO_RULES, now, count);
    prepareWhatsAppOrder(
      resolveCart(
        { lines: [{ ...line("ginger-powder", 100, 1), seenPriceMinor: 19_900 }] },
        catalogue,
      ),
      input,
      NO_RULES,
      now,
      count,
    );
    expect(made).toBe(0);
  });

  it("never yields a link for invalid details, and names what is wrong", () => {
    const prepared = prepareWhatsAppOrder(
      twoLines,
      { ...input, mobile: "123", pinCode: "" },
      NO_RULES,
    );
    expect(prepared).toEqual({
      ok: false,
      cartBlocked: false,
      errors: {
        mobile: "Please enter a valid 10-digit Indian mobile number.",
        pinCode: "Please enter a valid 6-digit PIN code.",
      },
    });
    expect(prepareWhatsAppOrder(twoLines, EMPTY_ORDER_DETAILS, NO_RULES).ok).toBe(false);
  });

  it("never yields a link for an empty, unavailable, withdrawn or stale cart", () => {
    const carts = [
      resolveCart({ lines: [] }, catalogue),
      resolveCart(
        {
          lines: [
            { productSlug: "test-powder", variantId: "test-100g", quantity: 1 },
            { productSlug: "test-powder", variantId: "test-sold", quantity: 1 },
          ],
        },
        fixtureCatalogue,
      ),
      resolveCart(
        { lines: [{ productSlug: "test-later", variantId: "test-later-100g", quantity: 1 }] },
        fixtureCatalogue,
      ),
      resolveCart({ lines: [line("gold-powder", 100, 1)] }, catalogue),
      resolveCart(
        { lines: [{ ...line("ginger-powder", 100, 1), seenPriceMinor: 19_900 }] },
        catalogue,
      ),
    ];
    for (const cart of carts) {
      expect(prepareWhatsAppOrder(cart, input, NO_RULES)).toEqual({
        ok: false,
        cartBlocked: true,
        errors: {},
      });
    }
  });

  it("reports both a blocked cart and invalid details at once", () => {
    const prepared = prepareWhatsAppOrder(
      resolveCart({ lines: [] }, catalogue),
      EMPTY_ORDER_DETAILS,
      NO_RULES,
    );
    expect(prepared.ok).toBe(false);
    if (prepared.ok) return;
    expect(prepared.cartBlocked).toBe(true);
    expect(Object.keys(prepared.errors)).toHaveLength(6);
  });

  it("keeps the delivery charge with the order once a delivery rule applies", () => {
    const rules: CommerceRules = {
      deliveryZones: [
        { id: "ap", label: "AP", pinCodePrefixes: ["516"], charge: inr(60), freeFrom: null },
      ],
      tax: null,
      minimumOrder: null,
    };
    const prepared = prepareWhatsAppOrder(twoLines, input, rules, now, fixedId);
    expect(prepared).toMatchObject({
      ok: true,
      order: { totals: { deliveryCharge: inr(60), total: inr(910) } },
    });
  });
});
