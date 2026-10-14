import { useId } from "react";

import {
  COMPOUND_LEAFLETS,
  COMPOUND_RACHIS,
  LEAFLET_MIDRIB,
  LEAFLET_OUTLINE,
  rachisX,
} from "./geometry";

export interface LeafCallout {
  /** Number shown on the drawing; the legend lives in HTML beside it. */
  number: string;
  x: number;
  y: number;
}

interface MoringaLeafProps {
  /**
   * `drawing` — the whole compound leaf in fine line;
   * `fallen` — one leaflet has come loose and rests below (used by the 404).
   */
  variant?: "drawing" | "fallen";
  callouts?: readonly LeafCallout[];
  /** Accessible description; omit to keep the drawing decorative. */
  title?: string;
  className?: string;
}

/** The leaflet that has fallen in the `fallen` variant: pair index, side. */
const FALLEN = { pair: 1, side: "left" } as const;

/**
 * A botanical line drawing of one moringa leaf: a gently bowed rachis with
 * paired obovate leaflets and a single terminal leaflet. Drawn from the same
 * leaflet geometry as every other mark on the site.
 */
export function MoringaLeaf({
  variant = "drawing",
  callouts = [],
  title,
  className = "",
}: MoringaLeafProps) {
  const id = useId();
  const leafletId = `${id}-leaflet`;
  const decorative = !title;

  return (
    <svg
      viewBox="0 0 240 400"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : `${id}-title`}
      focusable="false"
      className={`h-auto w-full overflow-visible ${className}`}
    >
      {title && <title id={`${id}-title`}>{title}</title>}
      <defs>
        <g id={leafletId}>
          <path
            d={LEAFLET_OUTLINE}
            fill="var(--leaf-fill, none)"
            vectorEffect="non-scaling-stroke"
          />
          <path d={LEAFLET_MIDRIB} strokeOpacity={0.6} vectorEffect="non-scaling-stroke" />
        </g>
      </defs>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <path d={COMPOUND_RACHIS} />
        {COMPOUND_LEAFLETS.map((leaflet, pairIndex) => {
          const x = rachisX(leaflet.y);
          return (["right", "left"] as const).map((side) => {
            const isFallen =
              variant === "fallen" && pairIndex === FALLEN.pair && side === FALLEN.side;
            if (isFallen) return null;
            const transform =
              side === "right"
                ? `translate(${x} ${leaflet.y}) rotate(${-leaflet.angle}) scale(${leaflet.scale})`
                : `translate(${x} ${leaflet.y}) scale(-1 1) rotate(${-leaflet.angle}) scale(${leaflet.scale})`;
            return (
              <use key={`${pairIndex}-${side}`} href={`#${leafletId}`} transform={transform} />
            );
          });
        })}
        <use
          href={`#${leafletId}`}
          transform={`translate(${rachisX(40)} 40) rotate(-88) scale(2.1)`}
        />
        {variant === "fallen" && (
          <g transform="translate(38 386) rotate(-168) scale(2.6)">
            <use href={`#${leafletId}`} className="leaflet-fall" />
          </g>
        )}
      </g>
      {callouts.map((callout) => (
        <g key={callout.number} transform={`translate(${callout.x} ${callout.y})`}>
          <circle r="9" fill="var(--color-forest)" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-ivory)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {callout.number}
          </text>
        </g>
      ))}
    </svg>
  );
}
