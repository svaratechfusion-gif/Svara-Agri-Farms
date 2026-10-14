"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { observeScrollProgress, prefersReducedMotion } from "@/lib/motion/scrollProgress";

interface TiltStageProps {
  children: ReactNode;
  /** Maximum tilt in degrees — kept low so the official artwork stays legible. */
  maxTilt?: number;
  /** Draw a soft contact shadow beneath the object. */
  shadow?: boolean;
  /** Rise and settle as the stage scrolls into view (uses `--progress`). */
  rise?: boolean;
  className?: string;
}

/**
 * Gives a photograph physical presence: it tilts a few degrees toward the
 * pointer in perspective, with a contact shadow that answers the tilt. Only
 * fine pointers (mouse, pen) drive it; touch and reduced motion get a still,
 * flat image. Transforms only — no layout work.
 */
export function TiltStage({
  children,
  maxTilt = 4,
  shadow = true,
  rise = false,
  className = "",
}: TiltStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  // The rise follows scroll on every device (it is gated in CSS for reduced motion).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !rise || prefersReducedMotion()) return;
    return observeScrollProgress(stage, { mode: "through" });
  }, [rise]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    let target = { x: 0, y: 0 };
    const apply = () => {
      frame = 0;
      stage.style.setProperty("--tilt-x", `${(-target.y * maxTilt).toFixed(2)}deg`);
      stage.style.setProperty("--tilt-y", `${(target.x * maxTilt).toFixed(2)}deg`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      target = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
      };
      schedule();
    };
    const onLeave = () => {
      target = { x: 0, y: 0 };
      schedule();
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [maxTilt]);

  return (
    <div ref={stageRef} className={`tilt-stage relative ${className}`}>
      {/* Tilt and rise are separate layers so their transforms never collide. */}
      <div className="tilt-object relative z-10">
        <div className={rise ? "product-rise" : undefined}>{children}</div>
      </div>
      {shadow && (
        <span
          aria-hidden="true"
          className="tilt-shadow pointer-events-none absolute inset-x-[8%] -bottom-6 h-10 rounded-[50%] bg-[radial-gradient(closest-side,rgb(24_32_25/0.22),transparent)]"
        />
      )}
    </div>
  );
}
