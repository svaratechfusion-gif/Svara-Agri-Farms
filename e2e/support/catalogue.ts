import { products } from "../../src/content/products";

/**
 * The first size that can actually be ordered (a price, and available), if
 * any. Today's catalogue has none, so tests that add to the cart wait for it.
 */
export const orderable = products
  .flatMap((product) => product.variants.map((variant) => ({ product, variant })))
  .find(({ variant }) => variant.price !== null && variant.availability === "available");

export const NOTHING_ORDERABLE =
  "No size has a price and is available yet, so nothing can be added.";

/** The header's cart control, desktop or mobile ("… 2 items — open cart"). */
export const CART_BUTTON = /\d+ items? — open cart/;
