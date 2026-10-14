import { describe, expect, it } from "vitest";

import {
  AT_REST,
  FOLLOW_CONFIG,
  isSettled,
  poseFor,
  stepSpring,
  targetFor,
  type SpringState,
  type Vec,
} from "../follow";

const home: Vec = { x: 1392, y: 852 };

function run(target: Vec, ms: number, from: SpringState = AT_REST): SpringState[] {
  const frames: SpringState[] = [];
  let state = from;
  for (let t = 0; t < ms; t += 16) {
    state = stepSpring(state, target, 16);
    frames.push(state);
  }
  return frames;
}

describe("SVARA follow target", () => {
  it("trails the pointer: covers only part of the distance", () => {
    const target = targetFor({ x: 1092, y: 852 }, home);
    expect(target.x).toBeCloseTo(-300 * FOLLOW_CONFIG.strength);
    expect(target.y).toBe(0);
  });

  it("never travels beyond the configured area", () => {
    const target = targetFor({ x: -4000, y: -4000 }, home);
    expect(target).toEqual({ x: -FOLLOW_CONFIG.maxLeft, y: -FOLLOW_CONFIG.maxUp });
    const below = targetFor({ x: 1600, y: 1400 }, home);
    expect(below.x).toBeLessThanOrEqual(FOLLOW_CONFIG.maxRight);
    expect(below.y).toBeLessThanOrEqual(FOLLOW_CONFIG.maxDown);
  });

  it("stays home while the pointer is close to SVARA", () => {
    expect(targetFor({ x: home.x - 60, y: home.y - 60 }, home)).toEqual({ x: 0, y: 0 });
  });
});

describe("SVARA spring", () => {
  const target: Vec = { x: -200, y: -120 };

  it("accelerates, arrives, and settles at the target", () => {
    const frames = run(target, 2000);
    const end = frames.at(-1)!;
    expect(isSettled(end, target)).toBe(true);
    // Early frames move faster than late ones: acceleration then deceleration.
    const step = (i: number) =>
      Math.hypot(
        frames[i + 1].position.x - frames[i].position.x,
        frames[i + 1].position.y - frames[i].position.y,
      );
    expect(step(3)).toBeGreaterThan(step(40));
  });

  it("overshoots only a little — weight, not wobble", () => {
    const frames = run(target, 2000);
    const furthest = Math.min(...frames.map((frame) => frame.position.x));
    expect(furthest).toBeLessThan(target.x); // it does overshoot…
    expect(target.x - furthest).toBeLessThan(Math.abs(target.x) * 0.08); // …by under 8 %.
  });

  it("returns to rest from wherever it is", () => {
    const away = run(target, 1500).at(-1)!;
    const back = run({ x: 0, y: 0 }, 2000, away).at(-1)!;
    expect(isSettled(back, { x: 0, y: 0 })).toBe(true);
  });

  it("stays stable when a frame is very long (tab switch, jank)", () => {
    const state = stepSpring(AT_REST, target, 5000);
    expect(Math.abs(state.position.x)).toBeLessThan(Math.abs(target.x));
    expect(Number.isFinite(state.position.y)).toBe(true);
  });
});

describe("SVARA pose", () => {
  it("leans into the direction of travel, within limits", () => {
    expect(poseFor({ x: -400, y: 0 }).tilt).toBeLessThan(0);
    expect(poseFor({ x: 400, y: 0 }).tilt).toBeGreaterThan(0);
    expect(Math.abs(poseFor({ x: -99999, y: 0 }).tilt)).toBe(FOLLOW_CONFIG.maxTilt);
  });

  it("stretches only a little, and not at all at rest", () => {
    expect(poseFor({ x: 0, y: 0 }).stretch).toBe(1);
    expect(poseFor({ x: 99999, y: 0 }).stretch).toBe(1 + FOLLOW_CONFIG.maxStretch);
  });
});
