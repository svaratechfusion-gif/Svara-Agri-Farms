/**
 * Order IDs, e.g. SVARA-20261018-7K3QX9: the date the order was placed (in
 * India), then six random characters. The characters are Crockford base32 —
 * no I, L, O or U — so an ID reads aloud and types back without confusion.
 * Six of them give about a billion IDs a day, so two orders on the same day
 * will not share one.
 *
 * An ID is made only once an order has passed every check, at the moment it
 * is placed; it is the customer's reference for that order, in WhatsApp and
 * on the confirmation.
 */

const PREFIX = "SVARA";
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const SUFFIX_LENGTH = 6;
const ORDER_TIME_ZONE = "Asia/Kolkata";

export const ORDER_ID_PATTERN = /^SVARA-\d{8}-[0-9A-HJKMNP-TV-Z]{6}$/;

/** The order's date as YYYYMMDD, in India. */
export function orderDate(now: Date): string {
  // en-CA writes dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ORDER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replaceAll("-", "");
}

const secureRandomBytes = (count: number): Uint8Array =>
  crypto.getRandomValues(new Uint8Array(count));

export function newOrderId(
  now: Date = new Date(),
  randomBytes: (count: number) => Uint8Array = secureRandomBytes,
): string {
  // 256 is a multiple of 32, so every character is equally likely.
  const suffix = Array.from(randomBytes(SUFFIX_LENGTH), (byte) => ALPHABET[byte % 32]).join("");
  return `${PREFIX}-${orderDate(now)}-${suffix}`;
}
