import type { MascotState } from "./definition";

/**
 * Who may interrupt whom — the one ranking every mood request goes through,
 * highest first:
 *
 *   6  real errors (the cart could not be saved)
 *   5  real purchase outcomes (added to the cart)
 *   4  direct interaction with SVARA (open, listen, choose, close)
 *   3  the first-visit welcome
 *   2  section and route context (a note, the journey in view)
 *   1  cursor curiosity
 *   0  rest (idle, sleeping)
 *
 * `thinking` and `searching` stay at interaction level for when a real
 * operation is connected; nothing requests them today.
 */
export const MOOD_PRIORITY: Readonly<Record<MascotState, number>> = {
  idle: 0,
  sleeping: 0,
  curious: 1,
  explaining: 2,
  welcome: 3,
  greeting: 4,
  listening: 4,
  happy: 4,
  goodbye: 4,
  thinking: 4,
  searching: 4,
  excited: 5,
  error: 6,
};

/**
 * The rank of anything the visitor does directly with SVARA. A chat answer
 * wears an ordinary expression ("explaining") but is requested at this rank,
 * so an ambient note cannot cut it short — and a cart moment still can.
 */
export const INTERACTION_PRIORITY = MOOD_PRIORITY.listening;

export interface ActiveMood {
  mood: MascotState;
  /** Until this time (ms) the mood is protected from lower-priority requests. */
  until: number;
  /** The rank it was requested at, when that differs from the mood's own. */
  priority?: number;
}

export const RESTING: ActiveMood = { mood: "idle", until: 0 };

/** Whether `next` (at `nextPriority`, its own rank by default) may replace the active mood at `now`. */
export function canInterrupt(
  active: ActiveMood,
  next: MascotState,
  now: number,
  nextPriority: number = MOOD_PRIORITY[next],
): boolean {
  return now >= active.until || nextPriority >= (active.priority ?? MOOD_PRIORITY[active.mood]);
}
