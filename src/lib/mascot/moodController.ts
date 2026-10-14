import type { MascotState, Timeline } from "./definition";
import { canInterrupt, RESTING, type ActiveMood } from "./moodPriority";

/**
 * The one place SVARA's mood is decided. Every source — the welcome, cart
 * events, the panel, section notes, cursor curiosity, inactivity — asks
 * through `request`; the priority table (`moodPriority.ts`) settles conflicts,
 * so no two components can fight over the mood.
 *
 * Pure apart from an injectable clock, so the rules are unit-tested with a
 * fake one. Exactly one settle timer exists at a time; `dispose` clears it.
 */

export interface Clock {
  now(): number;
  setTimeout(callback: () => void, ms: number): number;
  clearTimeout(id: number | undefined): void;
}

export interface MoodController {
  /**
   * Asks for `mood`. Refused (returns false) while a higher-priority mood is
   * still protected. A granted mood is protected for `holdMs` and, unless it
   * is `held`, returns to idle when that time is up. `priority` ranks the
   * request by its source rather than its mood (a chat answer is interaction).
   */
  request(
    mood: MascotState,
    holdMs: number,
    options?: { held?: boolean; priority?: number },
  ): boolean;
  /** Ends `mood` early (a one-shot finished, the pointer left the panel). No-op if another mood is active. */
  release(mood: MascotState): void;
  current(): MascotState;
  dispose(): void;
}

export function createMoodController(
  onChange: (mood: MascotState) => void,
  clock: Clock,
): MoodController {
  let active: ActiveMood = RESTING;
  let timer: number | undefined;

  const rest = () => {
    clock.clearTimeout(timer);
    timer = undefined;
    active = RESTING;
    onChange("idle");
  };

  return {
    request(mood, holdMs, options = {}) {
      const now = clock.now();
      if (!canInterrupt(active, mood, now, options.priority)) return false;
      clock.clearTimeout(timer);
      timer = undefined;
      active = { mood, until: now + holdMs, priority: options.priority };
      onChange(mood);
      if (!options.held && mood !== "idle") {
        timer = clock.setTimeout(() => {
          timer = undefined;
          if (active.mood === mood) rest();
        }, holdMs);
      }
      return true;
    },
    release(mood) {
      if (active.mood === mood) rest();
    },
    current: () => active.mood,
    dispose() {
      clock.clearTimeout(timer);
      timer = undefined;
    },
  };
}

/** How long a `once` timeline takes to play through (transitions plus holds). */
export function timelineDurationMs(timeline: Pick<Timeline, "steps">): number {
  return timeline.steps.reduce((total, step) => total + step.transitionMs + step.holdMs, 0);
}

/** A browser clock for the controller. */
export const browserClock: Clock = {
  now: () => Date.now(),
  setTimeout: (callback, ms) => window.setTimeout(callback, ms),
  clearTimeout: (id) => window.clearTimeout(id),
};
