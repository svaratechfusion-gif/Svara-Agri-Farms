import type { CommerceRules } from "@/lib/commerce/pricing";

/**
 * Delivery, tax and minimum-order rules — business data, like prices.
 *
 * NONE IS CONFIGURED. Until they are, the site calculates no delivery charge
 * and no tax, refuses no PIN code, and tells customers the team will confirm
 * delivery charges and payment. Do not fill these in with guesses: a set rule
 * is shown to customers and saved on every order.
 *
 * Examples of the shape (not real values):
 *   deliveryZones: [{ id: "ap", label: "Andhra Pradesh", pinCodePrefixes: ["51", "52", "53"],
 *                     charge: inr(…), freeFrom: inr(…) }],
 *   tax: { label: "GST", rateBasisPoints: …, pricesIncludeTax: true },
 *   minimumOrder: inr(…),
 */
export const commerceRules: CommerceRules = {
  deliveryZones: null,
  tax: null,
  minimumOrder: null,
};
