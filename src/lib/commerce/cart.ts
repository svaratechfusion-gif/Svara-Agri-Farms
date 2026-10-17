import type { Cart, CartLine } from "./types";

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY_PER_LINE = 10;

export const EMPTY_CART: Cart = { lines: [] };

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY_PER_LINE, Math.max(MIN_QUANTITY, Math.trunc(quantity)));
}

function isSameLine(line: CartLine, productSlug: string, variantId: string): boolean {
  return line.productSlug === productSlug && line.variantId === variantId;
}

/** The price a customer has now seen for one size, in paise. */
export interface SeenPrice {
  productSlug: string;
  variantId: string;
  priceMinor: number;
}

export type CartAction =
  | {
      type: "add";
      productSlug: string;
      variantId: string;
      quantity: number;
      /** The unit price shown when adding, if the size has one. */
      seenPriceMinor?: number;
    }
  | { type: "set-quantity"; productSlug: string; variantId: string; quantity: number }
  | { type: "remove"; productSlug: string; variantId: string }
  /** The customer has read the current prices: remember them as seen. */
  | { type: "accept-prices"; prices: readonly SeenPrice[] }
  | { type: "replace"; cart: Cart }
  | { type: "clear" };

/** Pure, immutable cart reducer — every action returns a new Cart. */
export function cartReducer(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case "add": {
      const existing = cart.lines.find((line) =>
        isSameLine(line, action.productSlug, action.variantId),
      );
      const seen =
        action.seenPriceMinor === undefined ? {} : { seenPriceMinor: action.seenPriceMinor };
      if (!existing) {
        return {
          lines: [
            ...cart.lines,
            {
              productSlug: action.productSlug,
              variantId: action.variantId,
              quantity: clampQuantity(action.quantity),
              ...seen,
            },
          ],
        };
      }
      // Adding again happens from the product page, so its price is now the one seen.
      return {
        lines: cart.lines.map((line) =>
          line === existing
            ? { ...line, quantity: clampQuantity(line.quantity + action.quantity), ...seen }
            : line,
        ),
      };
    }
    case "set-quantity":
      return {
        lines: cart.lines.map((line) =>
          isSameLine(line, action.productSlug, action.variantId)
            ? { ...line, quantity: clampQuantity(action.quantity) }
            : line,
        ),
      };
    case "remove":
      return {
        lines: cart.lines.filter((line) => !isSameLine(line, action.productSlug, action.variantId)),
      };
    case "accept-prices":
      return {
        lines: cart.lines.map((line) => {
          const accepted = action.prices.find((price) =>
            isSameLine(line, price.productSlug, price.variantId),
          );
          return accepted ? { ...line, seenPriceMinor: accepted.priceMinor } : line;
        }),
      };
    case "replace":
      return action.cart;
    case "clear":
      return EMPTY_CART;
  }
}

export function countItems(cart: Cart): number {
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
}

export function isPriceMinor(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.productSlug === "string" &&
    typeof candidate.variantId === "string" &&
    typeof candidate.quantity === "number" &&
    Number.isFinite(candidate.quantity)
  );
}

/**
 * Validates untrusted persisted data (e.g. localStorage). Invalid lines are
 * dropped and quantities clamped, so a tampered store can never break the UI.
 */
export function parseStoredCart(raw: string | null): Cart {
  if (!raw) return EMPTY_CART;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_CART;
    const lines = (parsed as { lines?: unknown }).lines;
    if (!Array.isArray(lines)) return EMPTY_CART;
    return {
      lines: lines
        .filter(isCartLine)
        .map(({ productSlug, variantId, quantity, seenPriceMinor }) => ({
          productSlug,
          variantId,
          quantity: clampQuantity(quantity),
          // A malformed remembered price is dropped, never trusted.
          ...(isPriceMinor(seenPriceMinor) ? { seenPriceMinor } : {}),
        })),
    };
  } catch {
    return EMPTY_CART;
  }
}

/**
 * What adding `quantity` of a size does to this cart: all of it, part of it
 * (the line reaches the limit), or nothing (the line is already full).
 */
export function planAdd(
  cart: Cart,
  productSlug: string,
  variantId: string,
  quantity: number,
): { result: "added" | "capped" | "full"; adds: number } {
  const current =
    cart.lines.find((line) => isSameLine(line, productSlug, variantId))?.quantity ?? 0;
  const room = MAX_QUANTITY_PER_LINE - current;
  const wanted = clampQuantity(quantity);
  if (room <= 0) return { result: "full", adds: 0 };
  if (wanted > room) return { result: "capped", adds: room };
  return { result: "added", adds: wanted };
}

/** A second identical add this soon is a double click, not a wish for more. */
export const REPEAT_ADD_WINDOW_MS = 800;

export interface LastAdd {
  key: string;
  at: number;
}

export function isRepeatAdd(last: LastAdd | null, key: string, now: number): boolean {
  return last !== null && last.key === key && now - last.at < REPEAT_ADD_WINDOW_MS;
}
