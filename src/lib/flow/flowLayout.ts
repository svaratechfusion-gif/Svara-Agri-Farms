/**
 * Ingredient flow dividers — the tunables and the pure layout maths behind
 * `IngredientFlowDivider` (unit-tested; the component only renders the result).
 *
 * A divider is a band in the page flow with a centred ingredient sweep, about
 * a third of a desktop viewport tall. The artwork is levelled (rotated so the
 * powder sweep runs across the page) into a frame whose width follows its
 * height (see styles/flow.css). The frame may reach a little into the padding
 * of the sections above and below (`overlap`), never further, so the powder
 * crosses the boundary without covering text or controls.
 */
export const FLOW_CONFIG = {
  /** How far the art may reach into a neighbour, as a share of its section padding. */
  overlap: { none: 0, soft: 0.45, deep: 0.75 },
  /** Multiplier on the standard divider height, clamped so dividers stay a family. */
  minScale: 0.8,
  maxScale: 1.2,
  /**
   * Widest the frame gets, as a share of the viewport: on desktop the height
   * cap (23.5rem ÷ the flattest ratio, 0.48) keeps it under ~55vw; on phones
   * the 92vw cap applies. Used only for the image `sizes` hint.
   */
  desktopFrameVw: 55,
  mobileFrameVw: 92,
  /** Scroll drift: a fraction of the frame's height, either side of centre. */
  drift: 0.02,
} as const;

export type FlowAlign = "start" | "end";
export type FlowOverlap = keyof typeof FLOW_CONFIG.overlap;
export type FlowTone = "ivory" | "ivory-deep" | "forest" | "transparent";
/** reveal + drift (default) · reveal only · still. Reduced motion is always still. */
export type FlowMotion = "drift" | "reveal" | "none";

/**
 * How one artwork is levelled into its frame, measured from its alpha:
 * `rotate` (deg, CSS) brings the sweep near level; `ratio` is the levelled
 * content's height ÷ width (the frame's shape); `width`/`height`/`left`/`top`
 * place the unrotated image box in the frame, as percentages of the frame.
 */
export interface FlowLevel {
  rotate: number;
  ratio: number;
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface FlowPlacement<Ingredient extends string = string> {
  ingredient: Ingredient;
  /** The edge the sweep flows in from: `start` as supplied, `end` mirrored. */
  align: FlowAlign;
  /** Multiplies the standard divider height; clamped to FLOW_CONFIG's range. */
  scale?: number;
  overlap?: { above?: FlowOverlap; below?: FlowOverlap };
  /** Flip horizontally. Defaults to `align === "end"`; the art itself is unchanged. */
  mirror?: boolean;
  motion?: FlowMotion;
  /** Background at the top and bottom of the band, to blend with neighbours. */
  from?: FlowTone;
  to?: FlowTone;
}

export interface FlowLayout {
  mirror: boolean;
  reveal: boolean;
  /** Value for MotionRoot's `data-parallax`, or undefined when still. */
  parallax: string | undefined;
  sizes: string;
  style: Record<`--${string}`, string>;
}

const TONES: Record<FlowTone, string> = {
  ivory: "var(--color-ivory)",
  "ivory-deep": "var(--color-ivory-deep)",
  forest: "var(--color-forest)",
  transparent: "transparent",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const percent = (value: number) => `${value}%`;

/** Image `sizes`: the image box is `level.width` % of the frame. */
export function flowSizes(level: Pick<FlowLevel, "width">, scale = 1): string {
  const box = (frameVw: number) => Math.ceil((frameVw * scale * level.width) / 100);
  return `(min-width: 64rem) ${box(FLOW_CONFIG.desktopFrameVw)}vw, ${box(FLOW_CONFIG.mobileFrameVw)}vw`;
}

export function resolveFlow(placement: FlowPlacement, level: FlowLevel): FlowLayout {
  const scale = clamp(placement.scale ?? 1, FLOW_CONFIG.minScale, FLOW_CONFIG.maxScale);
  const above = FLOW_CONFIG.overlap[placement.overlap?.above ?? "none"];
  const below = FLOW_CONFIG.overlap[placement.overlap?.below ?? "none"];
  const mirror = placement.mirror ?? placement.align === "end";
  const motion = placement.motion ?? "drift";
  return {
    mirror,
    reveal: motion !== "none",
    parallax: motion === "drift" ? String(FLOW_CONFIG.drift) : undefined,
    sizes: flowSizes(level, scale),
    style: {
      "--flow-scale": String(scale),
      "--flow-ratio": String(level.ratio),
      "--flow-rotate": `${level.rotate}deg`,
      "--flow-img-w": percent(level.width),
      "--flow-img-h": percent(level.height),
      "--flow-img-l": percent(level.left),
      "--flow-img-t": percent(level.top),
      "--flow-above": String(above),
      "--flow-below": String(below),
      "--flow-from": TONES[placement.from ?? "transparent"],
      "--flow-to": TONES[placement.to ?? placement.from ?? "transparent"],
    },
  };
}
