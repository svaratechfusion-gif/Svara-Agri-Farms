/**
 * Real website events SVARA may react to. Emitters live where the event truly
 * happens (the cart, the journey); the companion listens. Nothing here is
 * simulated — an event is dispatched only after the thing it names occurred.
 */
export type MascotEvent =
  | { type: "cart-added"; quantity: number }
  | { type: "cart-not-saved" }
  | { type: "journey-in-view" };

const EVENT_NAME = "svara:mascot";

export function emitMascotEvent(event: MascotEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<MascotEvent>(EVENT_NAME, { detail: event }));
}

/** Subscribes to SVARA events; returns the unsubscribe function. */
export function onMascotEvent(listener: (event: MascotEvent) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<MascotEvent>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
