import Image from "next/image";
import type { CSSProperties } from "react";

import { flowArt, type FlowIngredient } from "@/content/ingredientFlows";
import { resolveFlow, type FlowPlacement } from "@/lib/flow/flowLayout";

interface IngredientFlowDividerProps extends FlowPlacement<FlowIngredient> {
  className?: string;
}

/**
 * A transition between sections drawn by an ingredient's own powder: the
 * supplied splash, levelled and centred on the page at a standard height,
 * crossing a little from one section into the next. Purely decorative — hidden from assistive technology and never
 * hit-testable, so it cannot obscure or intercept anything.
 *
 * Motion comes from the shared infrastructure: MotionRoot reveals it once
 * (`data-reveal="flow"`) and the scroll loop drifts it a little
 * (`data-parallax`). Both are CSS-gated, so with reduced motion or without
 * JavaScript the art simply sits in place — and before its reveal it is
 * already partly visible, so it never depends on an animation finishing. Place `<MotionRoot />` on the page.
 *
 * Layout and tunables: `lib/flow/flowLayout.ts`. Placements: `content/ingredientFlows.ts`.
 */
export function IngredientFlowDivider({
  className = "",
  ...placement
}: IngredientFlowDividerProps) {
  const { src, level } = flowArt[placement.ingredient];
  const layout = resolveFlow(placement, level);
  return (
    <div
      aria-hidden="true"
      data-flow={placement.ingredient}
      data-align={placement.align}
      data-mirror={layout.mirror ? "" : undefined}
      data-reveal={layout.reveal ? "flow" : undefined}
      data-parallax={layout.parallax}
      className={`ingredient-flow ${className}`}
      style={layout.style as CSSProperties}
    >
      <div className="ingredient-flow__art" data-flow-art="">
        <div
          className="ingredient-flow__drift"
          data-parallax-target={layout.parallax ? "" : undefined}
        >
          <div className="ingredient-flow__image">
            <Image src={src} alt="" fill sizes={layout.sizes} className="object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
