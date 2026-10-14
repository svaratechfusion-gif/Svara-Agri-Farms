import rawDefinition from "@/content/mascot.avatar.json";

/**
 * SVARA's avatar definition, in the `bible-strong/avatar-definition` v1 shape
 * (expressions + timelines + blink). The JSON lives in `src/content/` so it
 * can be handed unchanged to `@bible-strong/avatar-react`'s `createAvatar`
 * if that runtime is adopted later (see `components/mascot/README.md`).
 */

export const MASCOT_STATES = [
  "idle",
  "welcome",
  "curious",
  "greeting",
  "listening",
  "thinking",
  "searching",
  "explaining",
  "happy",
  "excited",
  "sleeping",
  "error",
  "goodbye",
] as const;

export type MascotState = (typeof MASCOT_STATES)[number];

export interface EyeShape {
  width: number;
  height: number;
  x: number;
  y: number;
  angle: number;
}

export interface Expression {
  head: { x: number; y: number; z: number };
  eyes: { left: EyeShape; right: EyeShape; spacing: number };
  perspective: number;
  motion: { eyes: "none" | "slowDrift" | "shake"; body: "none" | "slowDrift" | "shake" };
}

export interface TimelineStep {
  expression: string;
  holdMs: number;
  transitionMs: number;
  transition: "smooth" | "instant";
}

export interface BlinkSchedule {
  enabled: boolean;
  initialDelayMs?: number;
  minIntervalMs?: number;
  maxIntervalMs?: number;
  durationMs?: number;
}

export interface Timeline {
  playbackMode: "loop" | "once";
  steps: readonly TimelineStep[];
  blink: BlinkSchedule;
  metadata?: { label?: string; description?: string; group?: string };
}

export interface AvatarDefinition {
  schema: string;
  schemaVersion: number;
  name: string;
  colors: { body: string; eyes: string };
  expressions: Record<string, Expression>;
  animations: Record<string, Timeline>;
}

export class AvatarDefinitionError extends Error {}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function checkEye(eye: unknown, where: string): void {
  const shape = eye as Partial<EyeShape> | null;
  if (
    !shape ||
    !["width", "height", "x", "y", "angle"].every((k) =>
      isNumber((shape as Record<string, unknown>)[k]),
    )
  ) {
    throw new AvatarDefinitionError(
      `${where}: eye shape must have numeric width, height, x, y and angle`,
    );
  }
}

/**
 * Validates the parts of the definition the renderer relies on and returns it
 * typed. Throws `AvatarDefinitionError` with the first problem found, so a
 * broken asset fails loudly in tests rather than rendering a half-avatar.
 */
export function validateDefinition(input: unknown): AvatarDefinition {
  const def = input as Partial<AvatarDefinition> | null;
  if (!def || def.schema !== "bible-strong/avatar-definition" || def.schemaVersion !== 1) {
    throw new AvatarDefinitionError("Unsupported avatar definition schema");
  }
  if (!def.expressions || !def.animations || !def.colors) {
    throw new AvatarDefinitionError("Definition is missing expressions, animations or colors");
  }
  for (const [key, expression] of Object.entries(def.expressions)) {
    checkEye(expression?.eyes?.left, `expression "${key}"`);
    checkEye(expression?.eyes?.right, `expression "${key}"`);
    if (!isNumber(expression.eyes.spacing)) {
      throw new AvatarDefinitionError(`expression "${key}": spacing must be a number`);
    }
  }
  for (const [key, timeline] of Object.entries(def.animations)) {
    if (!timeline?.steps?.length) {
      throw new AvatarDefinitionError(`animation "${key}" has no steps`);
    }
    for (const step of timeline.steps) {
      if (!(step.expression in def.expressions)) {
        throw new AvatarDefinitionError(
          `animation "${key}" references unknown expression "${step.expression}"`,
        );
      }
      if (!isNumber(step.holdMs) || !isNumber(step.transitionMs)) {
        throw new AvatarDefinitionError(`animation "${key}" has a step without timings`);
      }
    }
  }
  for (const state of MASCOT_STATES) {
    if (!(state in def.animations)) {
      throw new AvatarDefinitionError(`SVARA state "${state}" has no animation`);
    }
  }
  return def as AvatarDefinition;
}

export type DefinitionResult =
  { ok: true; definition: AvatarDefinition } | { ok: false; error: AvatarDefinitionError };

function load(): DefinitionResult {
  try {
    return { ok: true, definition: validateDefinition(rawDefinition) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AvatarDefinitionError ? error : new AvatarDefinitionError(String(error)),
    };
  }
}

/** Loaded once per module; a broken asset yields `ok: false` and the static fallback. */
export const mascotDefinition: DefinitionResult = load();
