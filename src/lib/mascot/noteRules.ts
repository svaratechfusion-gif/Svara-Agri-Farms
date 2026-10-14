/**
 * When SVARA may show a section note. Pure, so the frequency rules are tested
 * directly: one note at a time, each section's note once per page view, a
 * quiet gap between notes (longer after the visitor dismisses one), and never
 * while the panel or another dialog is open.
 */
export const NOTE_RULES = {
  /** A section must stay in the reading band this long before its note appears. */
  dwellMs: 900,
  /** How long a note stays before it fades on its own. */
  visibleMs: 6500,
  /** Minimum quiet time between two notes. */
  gapMs: 9000,
  /** Quiet time after the visitor dismisses a note. */
  dismissedGapMs: 30000,
} as const;

export interface NoteContext {
  anchor: string;
  now: number;
  /** Anchors already noted during this page view. */
  shown: ReadonlySet<string>;
  /** Earliest time the next note may appear. */
  quietUntil: number;
  /** The companion panel, the menu or the cart is open. */
  blocked: boolean;
  /** The companion is hidden (e.g. over the hero on small screens). */
  hidden: boolean;
}

export function mayShowNote({
  anchor,
  now,
  shown,
  quietUntil,
  blocked,
  hidden,
}: NoteContext): boolean {
  return !blocked && !hidden && now >= quietUntil && !shown.has(anchor);
}
