import { cartReducer, EMPTY_CART, parseStoredCart, type CartAction } from "./cart";
import type { Cart } from "./types";

export const CART_STORAGE_KEY = "svara.cart.v1";

type Listener = () => void;

/**
 * A tiny external store for the cart, consumed with `useSyncExternalStore`.
 * Persists to localStorage when available and stays in sync across tabs.
 */
export function createCartStore(storage: () => Storage | null) {
  let state: Cart = EMPTY_CART;
  let loaded = false;
  const listeners = new Set<Listener>();

  function load(): void {
    if (loaded) return;
    loaded = true;
    try {
      state = parseStoredCart(storage()?.getItem(CART_STORAGE_KEY) ?? null);
    } catch {
      state = EMPTY_CART;
    }
  }

  /** Saves the cart; `false` when storage is unavailable or refuses the write. */
  function persist(): boolean {
    try {
      const target = storage();
      if (!target) return false;
      target.setItem(CART_STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      // Persistence is a convenience; the in-memory cart keeps working.
      return false;
    }
  }

  function emit(): void {
    listeners.forEach((listener) => listener());
  }

  let persistable: boolean | null = null;

  return {
    /** Whether this device keeps the cart between visits (checked once). */
    canPersist(): boolean {
      if (persistable === null) {
        try {
          const target = storage();
          if (!target) throw new Error("no storage");
          const probe = `${CART_STORAGE_KEY}.probe`;
          target.setItem(probe, "1");
          target.removeItem(probe);
          persistable = true;
        } catch {
          persistable = false;
        }
      }
      return persistable;
    },
    getSnapshot(): Cart {
      load();
      return state;
    },
    getServerSnapshot(): Cart {
      return EMPTY_CART;
    },
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Applies the action; returns whether the result was saved on this device. */
    dispatch(action: CartAction): boolean {
      load();
      state = cartReducer(state, action);
      const saved = persist();
      emit();
      return saved;
    },
    /** Re-reads storage, e.g. after another tab changed the cart. */
    reload(): void {
      loaded = false;
      load();
      emit();
    },
  };
}

export type CartStore = ReturnType<typeof createCartStore>;
