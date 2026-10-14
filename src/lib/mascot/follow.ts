/**
 * SVARA's physical cursor-following — every tunable in one place, and the
 * pure maths that uses them (unit-tested; the hook only wires it to the DOM).
 *
 * Offsets are CSS px from SVARA's resting spot in the bottom-right corner;
 * negative x is left, negative y is up.
 */
export const FOLLOW_CONFIG = {
  /** How far SVARA may travel from rest: left, up (and a little right/down). */
  maxLeft: 300,
  maxUp: 220,
  maxRight: 0,
  maxDown: 0,
  /** Share of the pointer's distance SVARA tries to cover — it trails, never sits under the cursor. */
  strength: 0.42,
  /** Spring constants (per second²) and damping (per second). */
  stiffness: 70,
  damping: 13,
  /** Within this radius of SVARA's resting centre, it stays home and just looks curious. */
  homeRadius: 130,
  /** After the pointer stops this long, SVARA drifts back to rest. */
  returnDelayMs: 1800,
  /** Below these, the spring counts as settled and the frame loop stops. */
  settleDistance: 0.4,
  settleSpeed: 4,
  /** Lean into the direction of travel: degrees per (px/s), capped. */
  tiltPerSpeed: 0.012,
  maxTilt: 8,
  /** Stretch along travel at speed (fraction per px/s), capped. */
  stretchPerSpeed: 0.00006,
  maxStretch: 0.05,
  /** A frame longer than this (tab switch, jank) is clamped so the spring stays stable. */
  maxStepMs: 48,
  /** Reduced motion: no following, no settling — SVARA stays still at rest. */
  reducedMotion: "off",
} as const;

export interface Vec {
  x: number;
  y: number;
}

export interface SpringState {
  position: Vec;
  velocity: Vec;
}

export const AT_REST: SpringState = { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Where SVARA should head for a pointer at `pointer`, given its resting
 * centre `home` (both viewport px). Bounded, trailing, and home when the
 * pointer is close — so SVARA never ends up under the cursor or a control.
 */
export function targetFor(pointer: Vec, home: Vec, config = FOLLOW_CONFIG): Vec {
  const dx = pointer.x - home.x;
  const dy = pointer.y - home.y;
  if (Math.hypot(dx, dy) <= config.homeRadius) return { x: 0, y: 0 };
  return {
    x: clamp(dx * config.strength, -config.maxLeft, config.maxRight),
    y: clamp(dy * config.strength, -config.maxUp, config.maxDown),
  };
}

/** One step of a damped spring towards `target`; `dtMs` is clamped for stability. */
export function stepSpring(
  state: SpringState,
  target: Vec,
  dtMs: number,
  config = FOLLOW_CONFIG,
): SpringState {
  const dt = Math.min(Math.max(dtMs, 0), config.maxStepMs) / 1000;
  const ax = config.stiffness * (target.x - state.position.x) - config.damping * state.velocity.x;
  const ay = config.stiffness * (target.y - state.position.y) - config.damping * state.velocity.y;
  // Semi-implicit Euler: velocity first, then position — stable at these constants.
  const vx = state.velocity.x + ax * dt;
  const vy = state.velocity.y + ay * dt;
  return {
    velocity: { x: vx, y: vy },
    position: { x: state.position.x + vx * dt, y: state.position.y + vy * dt },
  };
}

export function isSettled(state: SpringState, target: Vec, config = FOLLOW_CONFIG): boolean {
  return (
    Math.hypot(target.x - state.position.x, target.y - state.position.y) < config.settleDistance &&
    Math.hypot(state.velocity.x, state.velocity.y) < config.settleSpeed
  );
}

export interface Pose {
  /** Lean into travel, degrees. */
  tilt: number;
  /** Stretch along travel (scale on the travel axis), 1 = none. */
  stretch: number;
}

/** The body's pose for a velocity: lean into the direction of travel, a little stretch at speed. */
export function poseFor(velocity: Vec, config = FOLLOW_CONFIG): Pose {
  const speed = Math.hypot(velocity.x, velocity.y);
  return {
    tilt: clamp(velocity.x * config.tiltPerSpeed, -config.maxTilt, config.maxTilt),
    stretch: 1 + Math.min(config.maxStretch, speed * config.stretchPerSpeed),
  };
}
