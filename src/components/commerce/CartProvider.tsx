"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { products } from "@/content/products";
import { emitMascotEvent } from "@/lib/mascot/events";
import { countItems } from "@/lib/commerce/cart";
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

/** False during server rendering and hydration, true once the device's cart can be read. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/** `added`, or why it was not: the size cannot be ordered right now. */
export type AddResult = "added" | "unavailable";

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  isOpen: boolean;
  /** False when this device cannot keep the cart (e.g. storage blocked). */
  isPersistent: boolean;
  addItem: (productSlug: string, variantId: string, quantity: number) => AddResult;
  setQuantity: (productSlug: string, variantId: string, quantity: number) => void;
  removeItem: (productSlug: string, variantId: string) => void;
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

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) cartStore.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback(
    (productSlug: string, variantId: string, quantity: number): AddResult => {
      if (!canAddToCart(products, productSlug, variantId)) return "unavailable";
      const saved = cartStore.dispatch({ type: "add", productSlug, variantId, quantity });
      emitMascotEvent({ type: "cart-added", quantity });
      if (!saved) emitMascotEvent({ type: "cart-not-saved" });
      return "added";
    },
    [],
  );
  const setQuantity = useCallback((productSlug: string, variantId: string, quantity: number) => {
    cartStore.dispatch({ type: "set-quantity", productSlug, variantId, quantity });
  }, []);
  const removeItem = useCallback((productSlug: string, variantId: string) => {
    cartStore.dispatch({ type: "remove", productSlug, variantId });
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
      clearCart,
      openCart,
      closeCart,
    }),
    [cart, isOpen, isPersistent, addItem, setQuantity, removeItem, clearCart, openCart, closeCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
