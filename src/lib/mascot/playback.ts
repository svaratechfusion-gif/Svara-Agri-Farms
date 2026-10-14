"use client";

import { useEffect, useRef, useState } from "react";

import type { AvatarDefinition, BlinkSchedule, Timeline } from "./definition";

/** The step after `index`, or `null` when a `once` timeline has finished. */
export function nextStepIndex(timeline: Timeline, index: number): number | null {
  const next = index + 1;
  if (next < timeline.steps.length) return next;
  return timeline.playbackMode === "loop" ? 0 : null;
}

/** A blink interval within the schedule's bounds; `random` is injectable for tests. */
export function blinkInterval(blink: BlinkSchedule, random: () => number = Math.random): number {
  const min = blink.minIntervalMs ?? 3400;
  const max = Math.max(min, blink.maxIntervalMs ?? 6200);
  return Math.round(min + (max - min) * random());
}

/** Chance that a blink is followed at once by a second, as people often do. */
export const DOUBLE_BLINK_CHANCE = 0.16;
const DOUBLE_BLINK_GAP_MS = 170;

/**
 * The wait before the next blink: usually a scheduled interval, occasionally
 * a quick second blink — never three in a row.
 */
export function nextBlinkDelay(
  blink: BlinkSchedule,
  justDoubled: boolean,
  random: () => number = Math.random,
): { delay: number; double: boolean } {
  if (!justDoubled && random() < DOUBLE_BLINK_CHANCE) {
    return { delay: DOUBLE_BLINK_GAP_MS, double: true };
  }
  return { delay: blinkInterval(blink, random), double: false };
}

export interface PlaybackFrame {
  expression: string;
  transitionMs: number;
  blinking: boolean;
}

interface PlaybackOptions {
  definition: AvatarDefinition;
  animation: string;
  /** Hold the first step still: no timeline, no blinking. */
  reducedMotion: boolean;
  onAnimationEnd?: (animation: string) => void;
}

/**
 * Plays one timeline: each step shows its expression (eased over
 * `transitionMs`), holds, then advances; `once` timelines report their end.
 * Blinks run on their own timer. Exactly one timeline timer and one blink
 * timer exist per mascot; both are cleared when the animation changes or the
 * component unmounts.
 */
export function useTimelinePlayback({
  definition,
  animation,
  reducedMotion,
  onAnimationEnd,
}: PlaybackOptions): PlaybackFrame {
  const timeline = definition.animations[animation];
  const first = timeline?.steps[0];
  const [frame, setFrame] = useState<PlaybackFrame>(() => ({
    expression: first?.expression ?? Object.keys(definition.expressions)[0],
    transitionMs: 0,
    blinking: false,
  }));
  const endRef = useRef(onAnimationEnd);
  useEffect(() => {
    endRef.current = onAnimationEnd;
  }, [onAnimationEnd]);

  useEffect(() => {
    if (!timeline) return;
    let stepTimer: number | undefined;
    let cancelled = false;

    const show = (index: number) => {
      if (cancelled) return;
      const step = timeline.steps[index];
      setFrame((current) => ({
        ...current,
        expression: step.expression,
        transitionMs: step.transition === "instant" || reducedMotion ? 0 : step.transitionMs,
      }));
      if (reducedMotion) return;
      stepTimer = window.setTimeout(() => {
        const next = nextStepIndex(timeline, index);
        if (next === null) endRef.current?.(animation);
        else show(next);
      }, step.transitionMs + step.holdMs);
    };
    show(0);

    return () => {
      cancelled = true;
      window.clearTimeout(stepTimer);
    };
  }, [timeline, animation, reducedMotion]);

  useEffect(() => {
    if (!timeline || reducedMotion || !timeline.blink.enabled) return;
    const blink = timeline.blink;
    let timer: number | undefined;
    let cancelled = false;
    const schedule = (delay: number, justDoubled: boolean) => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setFrame((current) => ({ ...current, blinking: true }));
        timer = window.setTimeout(() => {
          if (cancelled) return;
          setFrame((current) => ({ ...current, blinking: false }));
          const next = nextBlinkDelay(blink, justDoubled);
          schedule(next.delay, next.double);
        }, blink.durationMs ?? 260);
      }, delay);
    };
    schedule(blink.initialDelayMs ?? 2400, false);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setFrame((current) => (current.blinking ? { ...current, blinking: false } : current));
    };
  }, [timeline, reducedMotion]);

  return frame;
}
