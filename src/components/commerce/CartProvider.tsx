"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { catalogue } from "@/content/products";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics/events";
import { emitMascotEvent } from "@/lib/mascot/events";
import {
  countItems,
  isRepeatAdd,
  planAdd,
  type LastAdd,
  type SeenPrice,
} from "@/lib/commerce/cart";
import { findProductSync, findVariant } from "@/lib/commerce/catalog";
import { CART_STORAGE_KEY, createCartStore } from "@/lib/commerce/cartStore";
import { canAddToCart } from "@/lib/commerce/orderLines";
import type { Cart } from "@/lib/commerce/types";

const cartStore = createCartStore(() => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
});

const noSubscription = () => () => undefined;

/** The cart on this device right now, outside React (e.g. for analytics). */
export function readCart(): Cart {
  return cartStore.getSnapshot();
}

/** How many of this size the cart holds right now (0 if none). */
function quantityInCart(productSlug: string, variantId: string): number {
  return (
    cartStore
      .getSnapshot()
      .lines.find((line) => line.productSlug === productSlug && line.variantId === variantId)
      ?.quantity ?? 0
  );
}

/** False during server rendering and hydration, true once the device's cart can be read. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/**
 * What happened: `added`; `capped` (only enough to reach the per-line limit);
 * `full` (the line is already at the limit); `repeat` (an identical add a
 * moment ago — a double click — so nothing more); `unavailable` (the size
 * cannot be ordered right now).
 */
export type AddResult = "added" | "capped" | "full" | "repeat" | "unavailable";

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  isOpen: boolean;
  /** False when this device cannot keep the cart (e.g. storage blocked). */
  isPersistent: boolean;
  addItem: (productSlug: string, variantId: string, quantity: number) => AddResult;
  setQuantity: (productSlug: string, variantId: string, quantity: number) => void;
  removeItem: (productSlug: string, variantId: string) => void;
  /** Records that the customer has read these (changed) prices. */
  acceptPrices: (prices: readonly SeenPrice[]) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within <CartProvider>");
  return value;
}

interface CartProviderProps {
  children: ReactNode;
}

/**
 * Client-side cart state: what the customer has chosen, kept on this device.
 * Only sizes that can be ordered right now (priced and available) can be
 * added; prices, totals and availability are always re-read from the
 * catalogue (`lib/commerce/orderLines.ts`), and checked again by the server
 * when an order request is sent.
 */
export function CartProvider({ children }: CartProviderProps) {
  const cart = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const isPersistent = useSyncExternalStore(noSubscription, cartStore.canPersist, () => true);
  const [isOpen, setIsOpen] = useState(false);
  const lastAdd = useRef<LastAdd | null>(null);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) cartStore.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback(
    (productSlug: string, variantId: string, quantity: number): AddResult => {
      if (!canAddToCart(catalogue, productSlug, variantId)) return "unavailable";
      const key = `${productSlug}:${variantId}:${quantity}`;
      const now = Date.now();
      if (isRepeatAdd(lastAdd.current, key, now)) return "repeat";
      lastAdd.current = { key, at: now };

      const plan = planAdd(cartStore.getSnapshot(), productSlug, variantId, quantity);
      if (plan.result === "full") return "full";
      const product = findProductSync(productSlug);
      const seenPriceMinor = product
        ? findVariant(product, variantId)?.price?.amountMinor
        : undefined;
      const saved = cartStore.dispatch({
        type: "add",
        productSlug,
        variantId,
        quantity: plan.adds,
        seenPriceMinor,
      });
      trackAddToCart(productSlug, variantId, plan.adds);
      emitMascotEvent({ type: "cart-added", quantity: plan.adds });
      if (!saved) emitMascotEvent({ type: "cart-not-saved" });
      return plan.result;
    },
    [],
  );
  const setQuantity = useCallback((productSlug: string, variantId: string, quantity: number) => {
    const before = quantityInCart(productSlug, variantId);
    cartStore.dispatch({ type: "set-quantity", productSlug, variantId, quantity });
    const change = quantityInCart(productSlug, variantId) - before;
    if (change > 0) trackAddToCart(productSlug, variantId, change);
    if (change < 0) trackRemoveFromCart(productSlug, variantId, -change);
  }, []);
  const removeItem = useCallback((productSlug: string, variantId: string) => {
    const removed = quantityInCart(productSlug, variantId);
    cartStore.dispatch({ type: "remove", productSlug, variantId });
    trackRemoveFromCart(productSlug, variantId, removed);
  }, []);
  const acceptPrices = useCallback((prices: readonly SeenPrice[]) => {
    cartStore.dispatch({ type: "accept-prices", prices });
  }, []);
  const clearCart = useCallback(() => {
    cartStore.dispatch({ type: "clear" });
  }, []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount: countItems(cart),
      isOpen,
      isPersistent,
      addItem,
      setQuantity,
      removeItem,
      acceptPrices,
      clearCart,
      openCart,
      closeCart,
    }),
    [
      cart,
      isOpen,
      isPersistent,
      addItem,
      setQuantity,
      removeItem,
      acceptPrices,
      clearCart,
      openCart,
      closeCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
