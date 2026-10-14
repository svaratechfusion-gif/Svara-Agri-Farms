import { describe, expect, it } from "vitest";

import raw from "@/content/mascot.avatar.json";

import {
  MASCOT_STATES,
  AvatarDefinitionError,
  mascotDefinition,
  validateDefinition,
} from "../definition";
import { blinkInterval, DOUBLE_BLINK_CHANCE, nextBlinkDelay, nextStepIndex } from "../playback";

const clone = () => JSON.parse(JSON.stringify(raw));

describe("SVARA avatar definition", () => {
  it("loads and validates the shipped definition", () => {
    expect(mascotDefinition.ok).toBe(true);
  });

  it("defines every semantic state as an animation", () => {
    const definition = validateDefinition(raw);
    for (const state of MASCOT_STATES) {
      expect(definition.animations[state]).toBeDefined();
    }
  });

  it("is SVARA's own character, not the Cloudee reference", () => {
    const definition = validateDefinition(raw);
    expect(definition.name).toBe("SVARA");
    expect(definition.colors.body).toBe("#173C27");
    expect(Object.keys(definition.expressions)).not.toContain("angry-left");
  });

  it("plays welcome, curious, greeting, excited and goodbye once, and loops the rest", () => {
    const definition = validateDefinition(raw);
    const once = MASCOT_STATES.filter(
      (state) => definition.animations[state].playbackMode === "once",
    );
    expect(once.sort()).toEqual(["curious", "excited", "goodbye", "greeting", "welcome"]);
  });

  it("rejects a timeline step that references an unknown expression", () => {
    const broken = clone();
    broken.animations.idle.steps[0].expression = "missing";
    expect(() => validateDefinition(broken)).toThrow(/unknown expression "missing"/);
  });

  it("rejects a definition missing one of SVARA's states", () => {
    const broken = clone();
    delete broken.animations.sleeping;
    expect(() => validateDefinition(broken)).toThrow(AvatarDefinitionError);
  });

  it("rejects an unsupported schema and malformed eyes", () => {
    expect(() => validateDefinition({ ...clone(), schemaVersion: 2 })).toThrow(/schema/);
    const broken = clone();
    broken.expressions.calm.eyes.left.width = "wide";
    expect(() => validateDefinition(broken)).toThrow(/numeric width/);
  });
});

describe("SVARA timeline playback", () => {
  const definition = validateDefinition(raw);

  it("advances through a loop and wraps to the first step", () => {
    const idle = definition.animations.idle;
    expect(nextStepIndex(idle, 0)).toBe(1);
    expect(nextStepIndex(idle, idle.steps.length - 1)).toBe(0);
  });

  it("ends a one-shot timeline after its last step", () => {
    const greeting = definition.animations.greeting;
    expect(nextStepIndex(greeting, greeting.steps.length - 1)).toBeNull();
  });

  it("occasionally double-blinks, but never three times in a row", () => {
    const blink = definition.animations.idle.blink;
    const low = () => DOUBLE_BLINK_CHANCE / 2;
    expect(nextBlinkDelay(blink, false, low)).toEqual({ delay: 170, double: true });
    expect(nextBlinkDelay(blink, true, low).double).toBe(false);
    expect(nextBlinkDelay(blink, false, () => 0.99).double).toBe(false);
  });

  it("keeps blink intervals within the schedule's bounds", () => {
    const blink = definition.animations.idle.blink;
    expect(blinkInterval(blink, () => 0)).toBe(blink.minIntervalMs);
    expect(blinkInterval(blink, () => 1)).toBe(blink.maxIntervalMs);
    expect(blinkInterval({ enabled: true }, () => 0.5)).toBe(4800);
  });
});
