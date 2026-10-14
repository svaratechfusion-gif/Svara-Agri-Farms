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

export type CartAction =
  | { type: "add"; productSlug: string; variantId: string; quantity: number }
  | { type: "set-quantity"; productSlug: string; variantId: string; quantity: number }
  | { type: "remove"; productSlug: string; variantId: string }
  | { type: "replace"; cart: Cart }
  | { type: "clear" };

/** Pure, immutable cart reducer — every action returns a new Cart. */
export function cartReducer(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case "add": {
      const existing = cart.lines.find((line) =>
        isSameLine(line, action.productSlug, action.variantId),
      );
      if (!existing) {
        return {
          lines: [
            ...cart.lines,
            {
              productSlug: action.productSlug,
              variantId: action.variantId,
              quantity: clampQuantity(action.quantity),
            },
          ],
        };
      }
      return {
        lines: cart.lines.map((line) =>
          line === existing
            ? { ...line, quantity: clampQuantity(line.quantity + action.quantity) }
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
    case "replace":
      return action.cart;
    case "clear":
      return EMPTY_CART;
  }
}

export function countItems(cart: Cart): number {
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
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
        .map((line) => ({ ...line, quantity: clampQuantity(line.quantity) })),
    };
  } catch {
    return EMPTY_CART;
  }
}
