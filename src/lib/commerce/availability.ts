import type { Availability, Product, ProductVariant } from "./types";

/** Customer-facing wording for each availability state. */
export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Available",
  "coming-soon": "Coming soon",
  "in-preparation": "In preparation",
  "sold-out": "Sold out",
};

/** One sentence explaining what the state means for the customer. */
export const AVAILABILITY_NOTE: Record<Availability, string> = {
  available: "Available to order.",
  "coming-soon": "Not open for orders yet — ordering opens once its price is confirmed.",
  "in-preparation":
    "We are still preparing this pack. It cannot be ordered yet; sizes and prices will be shared when it is ready.",
  "sold-out": "None to order right now.",
};

/**
 * How a size can be described to a customer right now. A product that is not
 * available makes all its sizes share its state, and an "available" size
 * without a price is only coming soon.
 */
export function sizeAvailability(product: Product, variant: ProductVariant): Availability {
  if (product.availability !== "available") return product.availability;
  if (variant.availability === "available" && variant.price === null) return "coming-soon";
  return variant.availability;
}

/**
 * How the product reads as a whole: available if any size can be ordered,
 * otherwise its own state (or its sizes' shared state).
 */
export function productAvailability(product: Product): Availability {
  const states = product.variants.map((variant) => sizeAvailability(product, variant));
  if (states.includes("available")) return "available";
  return product.availability === "available" ? (states[0] ?? "coming-soon") : product.availability;
}

/** Said of a cart line, and of the cart, when something in it can no longer be ordered. */
export const NO_LONGER_AVAILABLE =
  "This product is no longer available to order. Please remove it from your cart before continuing.";
