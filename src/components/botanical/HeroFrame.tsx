interface HeroFrameProps {
  /** Field annotations pinned to the frame's top edge, left to right. */
  annotations?: readonly string[];
  /** `hero` clears the fixed header; `section` sits mid-page, inset evenly. */
  placement?: "hero" | "section";
}

const PLACEMENT = {
  hero: "top-[calc(var(--header-height)+0.75rem)] bottom-[calc(var(--gutter-page)/2)]",
  section: "top-[calc(var(--gutter-page)/2)] bottom-[clamp(3rem,10vh,6rem)]",
} as const;

/**
 * The botanical frame for full-bleed photography: a single hairline leaf
 * plate inset from the edges, with field annotations set into its top rule.
 * It frames the landscape without covering it.
 */
export function HeroFrame({ annotations = [], placement = "hero" }: HeroFrameProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-[calc(var(--gutter-page)/2)] leaf-plate border border-ivory/30 ${PLACEMENT[placement]}`}
    >
      {annotations.length > 0 && (
        <div className="absolute -top-[0.6rem] right-[clamp(2.5rem,8vw,7rem)] flex gap-2">
          {annotations.map((annotation) => (
            <span key={annotation} className="seed bg-forest-deep/70 text-ivory/90">
              {annotation}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
