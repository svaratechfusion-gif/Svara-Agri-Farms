import { useId, type CSSProperties } from "react";

import type { MascotState, Expression, EyeShape } from "@/lib/mascot/definition";

/** Where the face sits in the 200 × 224 artboard. */
const FACE = { x: 100, y: 126 } as const;
/** Eyes are drawn a touch larger than the definition units, to read at 48–64 px. */
const EYE_SCALE = 1.18;
/** Head angles in the definition are degrees; these map them to a 2D face shift and roll. */
const TURN_TO_PX = 0.55;
const NOD_TO_PX = 0.45;
const ROLL_SCALE = 0.45;
/** The eyes lead and the head follows: gaze changes take this share of a step's transition. */
const EYES_LEAD = 0.55;

/** The seed silhouette — fuller below, gently tapered above. Unchanged from 1.0. */
const SEED =
  "M100 52C140 52 170 92 170 136C170 178 140 204 100 204C60 204 30 178 30 136C30 92 60 52 100 52Z";

function eyeStyle(
  eye: EyeShape,
  side: -1 | 1,
  spacing: number,
  transitionMs: number,
): CSSProperties {
  const width = eye.width * EYE_SCALE;
  const height = eye.height * EYE_SCALE;
  const cx = FACE.x + side * (spacing / 2 + width / 2) + eye.x;
  return {
    transform: `translate(${cx}px, ${FACE.y + eye.y}px) rotate(${eye.angle}deg) scale(${width}, ${height})`,
    transitionDuration: `${Math.round(transitionMs * EYES_LEAD)}ms`,
  };
}

export interface MascotArtProps {
  expression: Expression;
  transitionMs: number;
  blinking: boolean;
  state: MascotState;
  size: number;
  label?: string;
  className: string;
}

/**
 * SVARA, drawn. Volume comes from real per-pixel lighting, not painted
 * gradients: the seed's own alpha is blurred into a height map and lit by an
 * upper-left key light through `feDiffuseLighting` + `feSpecularLighting`
 * (filter `sculpt`). Around that: a subsurface glow where light passes through
 * the lower body, a harvest-gold rim on the shaded edge, two-layer contact
 * shadows (tight occlusion + soft ambient), inset eye sockets and glossy eyes
 * with two catchlights, and a crest whose stem and leaflets move separately.
 */
export function MascotArt({
  expression,
  transitionMs,
  blinking,
  state,
  size,
  label,
  className,
}: MascotArtProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = (name: string) => `url(#${id}-${name})`;
  const { head, eyes, motion } = expression;
  const headMove = `${transitionMs}ms`;
  const face: CSSProperties = {
    transform: `translate(${head.y * TURN_TO_PX}px, ${head.x * NOD_TO_PX}px)`,
    transitionDuration: headMove,
  };
  // Built outside `className` so the formatter's class sorting cannot join them.
  const bodyClass =
    motion.body === "slowDrift" ? "mascot__body mascot__body--drift" : "mascot__body";
  const faceClass =
    motion.eyes === "slowDrift" ? "mascot__face mascot__face--drift" : "mascot__face";
  const roll: CSSProperties = {
    transform: `rotate(${head.z * ROLL_SCALE}deg)`,
    transitionDuration: headMove,
  };

  return (
    <svg
      viewBox="0 0 200 224"
      width={size}
      height={Math.round(size * 1.12)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-state={state}
      data-blinking={blinking ? "" : undefined}
      className={`mascot ${className}`}
    >
      <defs>
        <clipPath id={`${id}-seed`}>
          <path d={SEED} />
        </clipPath>
        {/* Base albedo: forest green, a little lighter towards the crown. */}
        <radialGradient id={`${id}-albedo`} cx="42%" cy="34%" r="74%">
          <stop offset="0%" stopColor="#3b7240" />
          <stop offset="55%" stopColor="#1d5531" />
          <stop offset="100%" stopColor="#103824" />
        </radialGradient>
        {/* Real lighting: height map from the silhouette, lit from the upper left. */}
        <filter
          id={`${id}-sculpt`}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="20" result="height" />
          <feDiffuseLighting
            in="height"
            surfaceScale="4.5"
            diffuseConstant="1"
            lightingColor="#fffaf0"
            result="diffuseRaw"
          >
            <feDistantLight azimuth="225" elevation="42" />
          </feDiffuseLighting>
          {/* Smooths the 8-bit height map's contour steps. */}
          <feGaussianBlur in="diffuseRaw" stdDeviation="2.2" result="diffuse" />
          <feSpecularLighting
            in="height"
            surfaceScale="4.5"
            specularConstant="0.7"
            specularExponent="30"
            lightingColor="#fff6dc"
            result="specularRaw"
          >
            <feDistantLight azimuth="225" elevation="55" />
          </feSpecularLighting>
          <feGaussianBlur in="specularRaw" stdDeviation="2.6" result="specular" />
          <feComposite
            in="SourceGraphic"
            in2="diffuse"
            operator="arithmetic"
            k1="0.95"
            k2="0.12"
            result="lit"
          />
          <feComposite in="specular" in2="SourceAlpha" operator="in" result="sheen" />
          <feComposite
            in="lit"
            in2="sheen"
            operator="arithmetic"
            k2="1"
            k3="0.42"
            result="sculpted"
          />
          <feComposite in="sculpted" in2="SourceAlpha" operator="in" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${id}-rim`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={`${id}-shadow`} x="-30%" y="-200%" width="160%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${id}-socket`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="0.09" />
        </filter>
        <radialGradient id={`${id}-eye`} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#2b3d2f" />
          <stop offset="45%" stopColor="#0f1a12" />
          <stop offset="100%" stopColor="#050a07" />
        </radialGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#4d6c32" />
          <stop offset="55%" stopColor="#7fa24b" />
          <stop offset="100%" stopColor="#b5d07a" />
        </linearGradient>
        <linearGradient id={`${id}-stem`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#3f5a2a" />
          <stop offset="100%" stopColor="#7d9c4c" />
        </linearGradient>
        <radialGradient id={`${id}-bead`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f3dca0" />
          <stop offset="60%" stopColor="#c5a15a" />
          <stop offset="100%" stopColor="#8a6a33" />
        </radialGradient>
      </defs>

      {/* Ground: soft ambient shadow, then tight contact occlusion. */}
      <g className="mascot__shadow">
        <ellipse
          cx="100"
          cy="210"
          rx="62"
          ry="9"
          fill="#0d1610"
          opacity="0.16"
          filter={ref("shadow")}
        />
        <ellipse
          cx="100"
          cy="206"
          rx="38"
          ry="4.5"
          fill="#0d1610"
          opacity="0.42"
          filter={ref("shadow")}
        />
      </g>

      <g className="mascot__float">
        <g className="mascot__breath">
          <g className="mascot__lean">
            <g className="mascot__roll" style={roll}>
              <g className={bodyClass}>
                <path d={SEED} fill={ref("albedo")} filter={ref("sculpt")} />
                <g clipPath={ref("seed")}>
                  {/* Subsurface: light passing through the lower body. */}
                  <ellipse
                    cx="96"
                    cy="196"
                    rx="54"
                    ry="22"
                    fill="#7fa64c"
                    opacity="0.32"
                    filter={ref("soft")}
                  />
                  {/* Harvest-gold rim on the shaded edge, soft then crisp. */}
                  <path
                    d="M152 96C170 118 174 150 160 176C150 192 132 202 114 204"
                    fill="none"
                    stroke="#e6c47a"
                    strokeWidth="7"
                    opacity="0.5"
                    filter={ref("rim")}
                  />
                  <path
                    d="M156 104C170 126 170 156 158 176"
                    fill="none"
                    stroke="#f1d79a"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                </g>
              </g>

              {/* The crest: the stem bends, each leaflet moves on its own beat. */}
              <g className="mascot__crest">
                <path
                  d="M100 56C99 46 101 37 106 28"
                  fill="none"
                  stroke={ref("stem")}
                  strokeWidth="3.6"
                  strokeLinecap="round"
                />
                <g className="mascot__leaflet mascot__leaflet--left">
                  <path d="M101 41C87 42 76 32 74 18C88 17 99 27 101 41Z" fill={ref("leaf")} />
                  <path
                    d="M101 41C93 34 83 25 76 19"
                    fill="none"
                    stroke="#f7f3e8"
                    strokeOpacity="0.5"
                    strokeWidth="0.9"
                  />
                  <path
                    d="M92 34 86 33M88 29 83 26"
                    stroke="#f7f3e8"
                    strokeOpacity="0.28"
                    strokeWidth="0.6"
                  />
                </g>
                <g className="mascot__leaflet mascot__leaflet--right">
                  <path d="M105 31C107 18 118 9 131 9C130 22 119 31 105 31Z" fill={ref("leaf")} />
                  <path
                    d="M105 31C112 24 121 15 129 10"
                    fill="none"
                    stroke="#f7f3e8"
                    strokeOpacity="0.5"
                    strokeWidth="0.9"
                  />
                  <path
                    d="M113 24 116 28M119 18 123 21"
                    stroke="#f7f3e8"
                    strokeOpacity="0.28"
                    strokeWidth="0.6"
                  />
                </g>
                <circle cx="100" cy="55" r="4.2" fill={ref("bead")} />
                <circle cx="98.6" cy="53.6" r="1.2" fill="#fff8e6" opacity="0.9" />
              </g>

              <g className={faceClass} style={face}>
                <g className="mascot__gaze">
                  {([-1, 1] as const).map((side) => (
                    <g
                      key={side}
                      className="mascot__eye"
                      style={eyeStyle(
                        side === -1 ? eyes.left : eyes.right,
                        side,
                        eyes.spacing,
                        transitionMs,
                      )}
                    >
                      {/* The socket: a soft inset the eye sits in. */}
                      <ellipse
                        cx="0"
                        cy="0.04"
                        rx="0.66"
                        ry="0.6"
                        fill="#071109"
                        opacity="0.4"
                        filter={ref("socket")}
                      />
                      <g className="mascot__blink">
                        <ellipse cx="0" cy="0" rx="0.5" ry="0.5" fill={ref("eye")} />
                        <ellipse
                          cx="-0.15"
                          cy="-0.24"
                          rx="0.13"
                          ry="0.075"
                          fill="#fffbf0"
                          opacity="0.92"
                        />
                        <ellipse
                          cx="0.17"
                          cy="0.2"
                          rx="0.05"
                          ry="0.03"
                          fill="#fffbf0"
                          opacity="0.55"
                        />
                      </g>
                    </g>
                  ))}
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
