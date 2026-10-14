/**
 * Cursor curiosity: SVARA notices when the pointer settles on something the
 * visitor can use — a link or a button — not every twitch of the mouse.
 * Pure rules, unit-tested; the motion hook supplies the pointer.
 */
export const CURIOSITY = {
  /** The pointer must rest on the same control this long. */
  dwellMs: 700,
  /** At most one curious look in this span, so it stays a moment, not a tic. */
  cooldownMs: 15_000,
} as const;

export function mayBeCurious(now: number, lastCuriousAt: number | null): boolean {
  return lastCuriousAt === null || now - lastCuriousAt >= CURIOSITY.cooldownMs;
}
