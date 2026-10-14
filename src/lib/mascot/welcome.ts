import { SCRIPT } from "./chat/script";

/**
 * The first-visit welcome: once per browser session, and only once it has
 * actually been seen.
 *
 * The session is marked when the welcome *starts playing* — not when the page
 * mounts — so a welcome that could not be shown (SVARA tucked away over a
 * phone's hero, a background tab, a purchase page on a small screen, a
 * higher-priority moment) is kept for later rather than spent unseen. React
 * Strict Mode's double effects cannot spend it either: nothing is written
 * until the welcome runs. Only a "1" is stored; nothing about the visitor.
 */
export const WELCOME = {
  storageKey: "svara:mascot-welcomed",
  /** After the page's own entrance, so SVARA never competes with the hero. */
  delayMs: 1400,
  /** When SVARA comes into view later (phones), a shorter beat is enough. */
  revealDelayMs: 600,
  /** The conversation's own greeting, so the bubble and the panel say the same hello. */
  note: SCRIPT.hello.text,
  /** Long enough to read and pick a quick reply. */
  visibleMs: 14_000,
} as const;

type SessionStore = Pick<Storage, "getItem" | "setItem">;

/** If sessionStorage is unavailable, the welcome is remembered for this page's lifetime. */
let welcomedInMemory = false;

/** The session store, or null where it is unavailable (privacy modes, blocked storage). */
export function sessionStore(): SessionStore | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function hasBeenWelcomed(store: SessionStore | null): boolean {
  if (welcomedInMemory) return true;
  try {
    return store?.getItem(WELCOME.storageKey) === "1";
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

export function markWelcomed(store: SessionStore | null): void {
  welcomedInMemory = true;
  try {
    store?.setItem(WELCOME.storageKey, "1");
  } catch {
    // Storage refused (quota, privacy mode): the in-memory flag still holds.
  }
  listeners.forEach((listener) => listener());
}

/**
 * `useSyncExternalStore` bindings: subscribe, the client snapshot, and the
 * server snapshot ("already welcomed", so the server never renders a welcome
 * and hydration never disagrees).
 */
export function subscribeWelcome(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const welcomedSnapshot = (): boolean => hasBeenWelcomed(sessionStore());
export const welcomedServerSnapshot = (): boolean => true;

export interface WelcomeConditions {
  /** Not yet welcomed this session. */
  pending: boolean;
  /** SVARA is on screen (past the hero on small screens, not hidden on a purchase page). */
  onScreen: boolean;
  /** The tab is visible. */
  pageVisible: boolean;
  /** The visitor has SVARA's panel open: they are already talking to it. */
  panelOpen: boolean;
}

/** Whether the welcome may be scheduled now (the mood priority decides the rest). */
export function mayWelcome({ pending, onScreen, pageVisible, panelOpen }: WelcomeConditions) {
  return pending && onScreen && pageVisible && !panelOpen;
}

/** Test seam: forget the in-memory fallback. */
export function resetWelcomeMemory(): void {
  welcomedInMemory = false;
}
