import { site } from "@/content/site";
import { whatsappUrl } from "@/lib/contact/whatsapp";

import { formatMoney } from "./money";
import { newOrderId } from "./orderId";
import type { ResolvedCart } from "./orderLines";
import {
  formatMobile,
  validateOrderDetails,
  type OrderDetailErrors,
  type OrderDetails,
  type OrderDetailsInput,
} from "./orderDetails";
import { priceOrder, type CommerceRules } from "./pricing";
import type { SubmittedOrder } from "./submittedOrder";

/**
 * The WhatsApp order: the customer's details and the cart, written out as a
 * message the customer sends to the team themselves. It is built only from a
 * cart already resolved against the catalogue (`resolveCart`), so every name,
 * size and price is the catalogue's — never what was stored in the browser —
 * and only from a cart that can be ordered as it stands: nothing unavailable,
 * no price the customer has not accepted.
 *
 * The order's ID heads the message, so the chat and the site's confirmation
 * name the same order. Nothing is sent to the website; the team confirms
 * availability, delivery and payment in the chat.
 */

const NOT_PROVIDED = "Not provided";

/** The message, or null when the cart cannot be ordered as it stands. */
export function whatsappOrderMessage(
  cart: ResolvedCart,
  details: OrderDetails,
  rules: CommerceRules,
  orderId: string,
): string | null {
  if (!cart.orderable || !cart.subtotal) return null;
  const priced = priceOrder(cart.subtotal, details.pinCode, rules);
  if (!priced.ok) return null;
  const { totals } = priced;

  const items = cart.lines.map((line, index) =>
    [
      `${index + 1}. ${line.productName}`,
      `   Size: ${line.weightGrams} g`,
      `   Quantity: ${line.quantity}`,
      `   Unit Price: ${formatMoney(line.unitPrice!)}`,
      `   Line Total: ${formatMoney(line.lineTotal!)}`,
    ].join("\n"),
  );

  // Delivery and tax appear only once the business configures them.
  const charges = [
    totals.deliveryCharge
      ? `Delivery charges: ${formatMoney(totals.deliveryCharge)}`
      : "Delivery charges, if any, to be confirmed.",
    ...(totals.tax
      ? [`Tax${totals.taxIncluded ? " (included)" : ""}: ${formatMoney(totals.tax)}`]
      : []),
  ];
  const totalLine = totals.deliveryCharge
    ? `Total: ${formatMoney(totals.total)}`
    : `Total before delivery: ${formatMoney(totals.total)}`;

  return [
    `Hello ${site.name},`,
    "",
    `ORDER ID: ${orderId}`,
    "",
    "I would like to place an order.",
    "",
    "CUSTOMER DETAILS",
    "----------------",
    `Name: ${details.fullName}`,
    `Mobile: ${formatMobile(details.mobile)}`,
    `Address: ${details.address}`,
    `City: ${details.city}`,
    `State: ${details.state}`,
    `PIN Code: ${details.pinCode}`,
    `Landmark: ${details.landmark ?? NOT_PROVIDED}`,
    `Delivery Instructions: ${details.instructions ?? NOT_PROVIDED}`,
    "",
    "ORDER DETAILS",
    "-------------",
    items.join("\n\n"),
    "",
    `Subtotal: ${formatMoney(totals.subtotal)}`,
    "",
    ...charges,
    "",
    totalLine,
    "",
    "Please confirm availability and delivery details.",
    "",
    "Thank you,",
    site.name,
  ].join("\n");
}

/** The wa.me link that opens WhatsApp with the order written in, or null. */
export function whatsappOrderUrl(
  cart: ResolvedCart,
  details: OrderDetails,
  rules: CommerceRules,
  orderId: string,
): string | null {
  const message = whatsappOrderMessage(cart, details, rules, orderId);
  return message === null ? null : whatsappUrl(message);
}

export type PreparedOrder =
  | {
      ok: true;
      message: string;
      /** The placed order, with its ID and the WhatsApp link. */
      order: SubmittedOrder;
    }
  | {
      ok: false;
      /** The cart cannot be ordered as it stands (empty, unavailable, unaccepted price). */
      cartBlocked: boolean;
      errors: OrderDetailErrors;
    };

/**
 * Everything "Place order on WhatsApp" decides, in one place: the details are
 * checked, the cart must be orderable as resolved against the catalogue, and
 * only then is an order ID made and the WhatsApp link written. A failed
 * preparation makes no ID and no link.
 */
export function prepareWhatsAppOrder(
  cart: ResolvedCart,
  input: OrderDetailsInput,
  rules: CommerceRules,
  now: Date = new Date(),
  makeOrderId: (now: Date) => string = newOrderId,
): PreparedOrder {
  const details = validateOrderDetails(input);
  const errors = details.ok ? {} : details.errors;
  if (!cart.orderable || !details.ok) return { ok: false, cartBlocked: !cart.orderable, errors };
  const priced = cart.subtotal ? priceOrder(cart.subtotal, details.value.pinCode, rules) : null;
  if (!priced?.ok) return { ok: false, cartBlocked: true, errors };

  const orderId = makeOrderId(now);
  const message = whatsappOrderMessage(cart, details.value, rules, orderId);
  if (message === null) return { ok: false, cartBlocked: true, errors };
  return {
    ok: true,
    message,
    order: {
      orderId,
      submittedAt: now.toISOString(),
      customer: details.value,
      // An orderable cart has a price for every line.
      lines: cart.lines.map((line) => ({
        key: `${line.productSlug}:${line.variantId}`,
        productName: line.productName,
        sku: line.sku,
        weightGrams: line.weightGrams,
        variantLabel: line.variantLabel,
        quantity: line.quantity,
        unitPrice: line.unitPrice!,
        lineTotal: line.lineTotal!,
      })),
      totals: priced.totals,
      whatsappUrl: whatsappUrl(message),
    },
  };
}
