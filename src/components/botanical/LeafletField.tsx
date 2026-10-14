"use client";

import { useEffect, useRef } from "react";

import { observeScrollProgress, prefersReducedMotion } from "@/lib/motion/scrollProgress";

import { LEAFLET_OUTLINE } from "./geometry";

interface LeafletFieldProps {
  /** How many leaflets drift through the frame — kept deliberately small. */
  count?: number;
  /** Ink of the leaflets (CSS colour). */
  color?: string;
  className?: string;
}

interface Mote {
  x: number;
  y: number;
  size: number;
  angle: number;
  spin: number;
  drift: number;
  phase: number;
  alpha: number;
}

const MAX_PIXEL_RATIO = 1.5;
const POINTER_RADIUS = 140;
const FULL_DENSITY_WIDTH = 1100;

function createMotes(count: number, width: number, height: number): Mote[] {
  return Array.from({ length: count }, (_, index) => {
    const depth = 0.4 + ((index * 37) % 60) / 100;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: 5 + depth * 9,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.004,
      drift: 0.12 + depth * 0.22,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.18 + depth * 0.32,
    };
  });
}

/**
 * A few leaflets drifting on slow, organic paths (Canvas 2D — no extra WebGL
 * context). They lean away from the pointer, rise as the section scrolls
 * away, pause whenever off-screen or the tab is hidden, and are not rendered
 * at all with reduced motion. Purely decorative.
 */
export function LeafletField({
  count = 18,
  color = "rgb(247 243 232)",
  className = "",
}: LeafletFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || prefersReducedMotion()) return;

    const leaflet = new Path2D(LEAFLET_OUTLINE);
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    let width = 0;
    let height = 0;
    let motes: Mote[] = [];
    let scroll = 0;
    const pointer = { x: -9999, y: -9999 };
    let frame = 0;
    let visible = false;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Fewer leaflets on small screens: the density, not the count, stays constant.
      const scaled = Math.max(6, Math.round(count * Math.min(1, width / FULL_DENSITY_WIDTH)));
      if (motes.length === 0) motes = createMotes(scaled, width, height);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      const t = time / 1000;
      for (const mote of motes) {
        mote.y -= mote.drift * (1 + scroll * 2.5);
        mote.x += Math.sin(t * 0.35 + mote.phase) * 0.25;
        mote.angle += mote.spin + Math.sin(t * 0.5 + mote.phase) * 0.002;
        const dx = mote.x - pointer.x;
        const dy = mote.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < POINTER_RADIUS && distance > 0) {
          const push = (1 - distance / POINTER_RADIUS) * 0.9;
          mote.x += (dx / distance) * push;
          mote.y += (dy / distance) * push;
        }
        if (mote.y < -20) {
          mote.y = height + 20;
          mote.x = Math.random() * width;
        }
        ctx.save();
        ctx.globalAlpha = mote.alpha * (1 - scroll * 0.85);
        ctx.translate(mote.x, mote.y);
        ctx.rotate(mote.angle);
        ctx.scale(mote.size / 22, mote.size / 22);
        ctx.fill(leaflet);
        ctx.restore();
      }
    };

    const loop = (time: number) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };
    const sync = () => {
      const run = visible && document.visibilityState === "visible";
      if (run && !frame) frame = requestAnimationFrame(loop);
      if (!run && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    resize();
    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    onScreen.observe(canvas);
    const stopScroll = observeScrollProgress(canvas, {
      mode: "exit",
      onProgress: (progress) => {
        scroll = progress;
      },
    });
    const host = canvas.parentElement ?? canvas;
    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    host.addEventListener("pointermove", onPointer);
    host.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", sync);

    return () => {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      onScreen.disconnect();
      stopScroll();
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [count, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
