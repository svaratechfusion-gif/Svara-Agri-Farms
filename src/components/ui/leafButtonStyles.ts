/**
 * The SVARA Leaf Button System — shared class composition.
 *
 * Every action on the site is drawn from one botanical silhouette (see
 * `.leaf-btn` in globals.css): an elongated blade whose two opposite corners
 * stay softly pointed, like a moringa leaflet. Variants change only colour
 * and weight, never the shape, so the language stays consistent.
 */

export const LEAF_BUTTON_VARIANTS = ["primary", "secondary", "outline"] as const;
export const LEAF_BUTTON_SIZES = ["sm", "md", "lg"] as const;
export const LEAF_BUTTON_TONES = ["auto", "light"] as const;

export type LeafButtonVariant = (typeof LEAF_BUTTON_VARIANTS)[number];
export type LeafButtonSize = (typeof LEAF_BUTTON_SIZES)[number];
/** `auto` follows the nearest `[data-surface]`; `light` forces the on-dark treatment. */
export type LeafButtonTone = (typeof LEAF_BUTTON_TONES)[number];

export interface LeafButtonStyle {
  variant?: LeafButtonVariant;
  size?: LeafButtonSize;
  tone?: LeafButtonTone;
  fullWidth?: boolean;
  className?: string;
}

/** Builds the class list for any leaf button, whether it renders as a link or a button. */
export function leafButtonClasses({
  variant = "primary",
  size = "md",
  tone = "auto",
  fullWidth = false,
  className = "",
}: LeafButtonStyle = {}): string {
  return [
    "leaf-btn",
    `leaf-btn--${variant}`,
    `leaf-btn--${size}`,
    tone === "light" ? "leaf-btn--on-dark" : "",
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Class list for the understated textual variant (D). */
export function leafLinkClasses({
  tone = "auto",
  className = "",
}: Pick<LeafButtonStyle, "tone" | "className"> = {}): string {
  return ["leaf-link", tone === "light" ? "leaf-link--on-dark" : "", className]
    .filter(Boolean)
    .join(" ");
}
