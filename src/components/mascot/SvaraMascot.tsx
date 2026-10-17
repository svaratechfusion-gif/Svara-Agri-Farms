"use client";

import { Component, type ReactNode } from "react";

import {
  mascotDefinition,
  type MascotState,
  type AvatarDefinition,
  type Expression,
  type EyeShape,
} from "@/lib/mascot/definition";
import { useTimelinePlayback } from "@/lib/mascot/playback";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

import { MascotArt } from "./MascotArt";

const FALLBACK_EYE: EyeShape = { width: 15, height: 38, x: 0, y: 0, angle: 0 };
const FALLBACK_EXPRESSION: Expression = {
  head: { x: 0, y: 0, z: 0 },
  eyes: { left: FALLBACK_EYE, right: FALLBACK_EYE, spacing: 20 },
  perspective: 1,
  motion: { eyes: "none", body: "none" },
};

export interface SvaraMascotProps {
  /** The semantic state to play (see `MASCOT_STATES`). */
  state?: MascotState;
  /** Rendered width in CSS pixels; height follows the 200:224 artboard. */
  size?: number;
  /** Accessible name. Pass `decorative` instead when a nearby label already names SVARA. */
  ariaLabel?: string;
  decorative?: boolean;
  className?: string;
  /** Called when a one-shot state (greeting, excited, goodbye) finishes. */
  onStateEnd?: (state: MascotState) => void;
}

function LiveMascot({
  definition,
  state,
  size,
  label,
  className,
  onStateEnd,
}: {
  definition: AvatarDefinition;
  state: MascotState;
  size: number;
  label?: string;
  className: string;
  onStateEnd?: (state: MascotState) => void;
}) {
  const reducedMotion = useReducedMotion();
  const frame = useTimelinePlayback({
    definition,
    animation: state,
    reducedMotion,
    onAnimationEnd: onStateEnd ? () => onStateEnd(state) : undefined,
  });
  return (
    <MascotArt
      expression={definition.expressions[frame.expression] ?? FALLBACK_EXPRESSION}
      transitionMs={frame.transitionMs}
      blinking={frame.blinking}
      state={state}
      size={size}
      label={label}
      className={className}
    />
  );
}

/** Catches a renderer failure and shows SVARA still, so a fault never blanks the page. */
class MascotBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * SVARA, SVARA Agri Farms' botanical companion: a seed-shaped character with a
 * moringa-leaf crest, rendered as SVG and animated from the avatar definition
 * in `src/content/mascot.avatar.json`. Pure CSS transforms; no animation library.
 */
export function SvaraMascot({
  state = "idle",
  size = 64,
  ariaLabel = "SVARA, the SVARA Agri Farms companion",
  decorative = false,
  className = "",
  onStateEnd,
}: SvaraMascotProps) {
  const label = decorative ? undefined : ariaLabel;
  const fallback = (
    <MascotArt
      expression={FALLBACK_EXPRESSION}
      transitionMs={0}
      blinking={false}
      state="idle"
      size={size}
      label={label}
      className={`mascot--static ${className}`}
    />
  );
  if (!mascotDefinition.ok) return fallback;
  return (
    <MascotBoundary fallback={fallback}>
      <LiveMascot
        definition={mascotDefinition.definition}
        state={state}
        size={size}
        label={label}
        className={className}
        onStateEnd={onStateEnd}
      />
    </MascotBoundary>
  );
}
