/**
 * Formats and limits the database enforces. Each copies a rule from
 * `src/lib/commerce` (named beside it) so drizzle-kit can load the schema
 * without the browser catalogue; `__tests__/schemaRules.test.ts` fails if a
 * copy drifts from its source.
 */

/** `REFERENCE_PATTERN` in `lib/commerce/orderRequest.ts`. */
export const ORDER_REFERENCE_PATTERN = "^SVF-\\d{6}-[2-9A-HJKMNP-Z]{6}$";

/** What `normalizePhone` in `lib/commerce/delivery.ts` produces. */
export const PHONE_PATTERN = "^\\+91[6-9][0-9]{9}$";

/** `MIN_QUANTITY` and `MAX_QUANTITY_PER_LINE` in `lib/commerce/cart.ts`. */
export const MIN_LINE_QUANTITY = 1;
export const MAX_LINE_QUANTITY = 10;

/** Hex SHA-256, as the order-request store hashes submission keys. */
export const SHA256_HEX_PATTERN = "^[0-9a-f]{64}$";

/** Variant IDs in `content/products.ts`, e.g. `moringa-powder-100g`. */
export const VARIANT_ID_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";
