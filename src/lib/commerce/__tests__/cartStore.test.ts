import { describe, expect, it, vi } from "vitest";

import { EMPTY_CART } from "../cart";
import { CART_STORAGE_KEY, createCartStore } from "../cartStore";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

describe("createCartStore", () => {
  it("loads a persisted cart lazily and serves an empty server snapshot", () => {
    const storage = memoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({
        lines: [{ productSlug: "a", variantId: "b", quantity: 2 }],
      }),
    });
    const store = createCartStore(() => storage);

    expect(store.getServerSnapshot()).toBe(EMPTY_CART);
    expect(store.getSnapshot().lines).toHaveLength(1);
  });

  it("persists dispatched changes and notifies subscribers", () => {
    const storage = memoryStorage();
    const store = createCartStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    expect(store.dispatch({ type: "add", productSlug: "a", variantId: "b", quantity: 1 })).toBe(
      true,
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.getItem(CART_STORAGE_KEY) ?? "{}").lines).toHaveLength(1);

    unsubscribe();
    store.dispatch({ type: "clear" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps working when storage is unavailable or throws", () => {
    const throwing = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    } as Storage;
    const store = createCartStore(() => throwing);
    expect(store.getSnapshot()).toBe(EMPTY_CART);
    // The change still applies in memory, but the store reports it was not saved.
    expect(store.dispatch({ type: "add", productSlug: "a", variantId: "b", quantity: 1 })).toBe(
      false,
    );
    expect(store.getSnapshot().lines).toHaveLength(1);

    const noStorage = createCartStore(() => null);
    expect(noStorage.dispatch({ type: "add", productSlug: "a", variantId: "b", quantity: 1 })).toBe(
      false,
    );
    expect(noStorage.getSnapshot().lines).toHaveLength(1);
  });

  it("says whether this device can keep the cart", () => {
    expect(createCartStore(() => memoryStorage()).canPersist()).toBe(true);
    expect(createCartStore(() => null).canPersist()).toBe(false);
    const refusing = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    } as Storage;
    expect(createCartStore(() => refusing).canPersist()).toBe(false);
  });

  it("reloads from storage when another tab changes it", () => {
    const storage = memoryStorage();
    const store = createCartStore(() => storage);
    expect(store.getSnapshot().lines).toHaveLength(0);

    storage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ lines: [{ productSlug: "a", variantId: "b", quantity: 4 }] }),
    );
    const listener = vi.fn();
    store.subscribe(listener);
    store.reload();

    expect(listener).toHaveBeenCalled();
    expect(store.getSnapshot().lines[0].quantity).toBe(4);
  });
});
