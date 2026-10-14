/**
 * The SVARA leaflet, drawn once and reused everywhere.
 *
 * A moringa leaflet is obovate: narrow at its base, broad and rounded at the
 * tip, never heart-shaped and never sharply pointed. Paths are drawn with the
 * base at the origin pointing along +x, so a leaflet can be placed on any
 * stem with a single translate/rotate.
 */

/** Outline of one leaflet, base at (0,0), tip at (22,0). */
export const LEAFLET_OUTLINE =
  "M0 0C3.5-3.8 9-6 15.5-5.6C20-5.3 22-2.7 22 0C22 2.7 20 5.3 15.5 5.6C9 6 3.5 3.8 0 0Z";

/** The leaflet's midrib, slightly bowed like a real vein. */
export const LEAFLET_MIDRIB = "M0.5 0C7-0.45 14-0.45 20.5 0";

/** Secondary veins branching forward from the midrib. */
export const LEAFLET_VEINS = "M6 -0.25L9.5-3.6M6 0.25L9.5 3.6M11.5-0.3L15-4M11.5 0.3L15 4";

/** Pairs of leaflets along the compound leaf drawing: y, size and angle (degrees). */
export const COMPOUND_LEAFLETS: readonly { y: number; scale: number; angle: number }[] = [
  { y: 306, scale: 2.05, angle: 24 },
  { y: 262, scale: 2.2, angle: 26 },
  { y: 218, scale: 2.2, angle: 28 },
  { y: 174, scale: 2.05, angle: 30 },
  { y: 132, scale: 1.85, angle: 33 },
  { y: 92, scale: 1.6, angle: 38 },
];

/** The rachis (leaf stem) of the compound leaf drawing, bottom to top. */
export const COMPOUND_RACHIS = "M118 352C117 262 122 160 127 40";

/** x position on the rachis at a given y (the stem bows gently to the right). */
export function rachisX(y: number): number {
  const t = (352 - y) / (352 - 40);
  return 118 + t * 9;
}
