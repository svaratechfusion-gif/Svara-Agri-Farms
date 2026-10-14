import { describe, expect, it } from "vitest";

import { MASCOT_NOTES, notesFor } from "@/content/mascot-notes";
import { journeyStages } from "@/content/journey";

import { GAZE_LIMITS, gazeTowards, REST_GAZE } from "../gaze";
import { canInterrupt, MOOD_PRIORITY, RESTING } from "../moodPriority";
import { mayShowNote, NOTE_RULES } from "../noteRules";

describe("SVARA gaze", () => {
  const centre = { x: 1000, y: 800 };

  it("stays bounded however far the pointer goes", () => {
    const gaze = gazeTowards(centre, { x: -5000, y: -5000 });
    expect(Math.abs(gaze.eyeX)).toBeLessThanOrEqual(GAZE_LIMITS.eyeX);
    expect(Math.abs(gaze.eyeY)).toBeLessThanOrEqual(GAZE_LIMITS.eyeY);
    expect(Math.abs(gaze.lean)).toBeLessThanOrEqual(GAZE_LIMITS.lean);
  });

  it("looks and leans towards the pointer's side", () => {
    const left = gazeTowards(centre, { x: 200, y: 800 });
    expect(left.eyeX).toBeLessThan(0);
    expect(left.lean).toBeLessThan(0);
    const above = gazeTowards(centre, { x: 1000, y: 100 });
    expect(above.eyeY).toBeLessThan(0);
    expect(above.eyeX).toBeCloseTo(0);
  });

  it("is only 'near' when the pointer is close, and rests when it is on SVARA", () => {
    expect(gazeTowards(centre, { x: 1100, y: 800 }).near).toBe(true);
    expect(gazeTowards(centre, { x: 500, y: 800 }).near).toBe(false);
    expect(gazeTowards(centre, centre)).toEqual(REST_GAZE);
  });

  it("deflects less for a nearby target than a distant one", () => {
    const close = gazeTowards(centre, { x: 950, y: 800 });
    const far = gazeTowards(centre, { x: 400, y: 800 });
    expect(Math.abs(close.eyeX)).toBeLessThan(Math.abs(far.eyeX));
  });
});

describe("SVARA mood priority", () => {
  it("lets real cart outcomes interrupt ambient explaining, not the reverse", () => {
    const now = 1000;
    expect(canInterrupt({ mood: "explaining", until: now + 3000 }, "excited", now)).toBe(true);
    expect(canInterrupt({ mood: "excited", until: now + 3000 }, "explaining", now)).toBe(false);
    expect(canInterrupt({ mood: "excited", until: now + 3000 }, "greeting", now)).toBe(false);
  });

  it("lets anything through once a mood's protection has expired", () => {
    expect(canInterrupt({ mood: "excited", until: 500 }, "explaining", 1000)).toBe(true);
    expect(canInterrupt(RESTING, "sleeping", 0)).toBe(true);
  });

  it("ranks cart outcomes above interaction above ambience above rest", () => {
    expect(MOOD_PRIORITY.excited).toBeGreaterThan(MOOD_PRIORITY.greeting);
    expect(MOOD_PRIORITY.greeting).toBeGreaterThan(MOOD_PRIORITY.explaining);
    expect(MOOD_PRIORITY.explaining).toBeGreaterThan(MOOD_PRIORITY.idle);
  });
});

describe("SVARA note rules", () => {
  const base = {
    anchor: "#ritual-heading",
    now: 10_000,
    shown: new Set<string>(),
    quietUntil: 0,
    blocked: false,
    hidden: false,
  };

  it("shows a fresh section's note when nothing is in the way", () => {
    expect(mayShowNote(base)).toBe(true);
  });

  it("never repeats a section's note during the same page view", () => {
    expect(mayShowNote({ ...base, shown: new Set(["#ritual-heading"]) })).toBe(false);
  });

  it("keeps a quiet gap between notes, longer after a dismissal", () => {
    expect(mayShowNote({ ...base, quietUntil: base.now + 1 })).toBe(false);
    expect(NOTE_RULES.dismissedGapMs).toBeGreaterThan(NOTE_RULES.gapMs);
  });

  it("stays out of the way while the panel, menu or cart is open, or SVARA is hidden", () => {
    expect(mayShowNote({ ...base, blocked: true })).toBe(false);
    expect(mayShowNote({ ...base, hidden: true })).toBe(false);
  });
});

describe("SVARA note map", () => {
  const allNotes = MASCOT_NOTES.flatMap((entry) => entry.notes);

  it("keeps every note to one short line (8–18 words)", () => {
    for (const { note } of allNotes) {
      const words = note.split(/\s+/).filter((word) => /\w/.test(word)).length;
      expect(words, note).toBeGreaterThanOrEqual(8);
      expect(words, note).toBeLessThanOrEqual(18);
    }
  });

  it("anchors each page's notes to distinct sections", () => {
    for (const { route, notes } of MASCOT_NOTES) {
      const anchors = notes.map((note) => note.anchor);
      expect(new Set(anchors).size, route).toBe(anchors.length);
    }
  });

  it("points each journey stage at the real next stage", () => {
    const journey = notesFor("/journey");
    const grow = journey.find((note) => note.anchor === "#stage-grow");
    expect(grow?.note).toContain(journeyStages[1].title.toLowerCase());
  });

  it("matches exact routes before prefixes, and leaves the cart and purchase areas alone", () => {
    expect(notesFor("/products").map((n) => n.anchor)).toEqual(["#range-preview-heading"]);
    expect(notesFor("/products/moringa-powder").map((n) => n.anchor)).toEqual(["#process-heading"]);
    expect(notesFor("/field-notes/the-journey-of-a-leaf")[0]?.anchor).toBe("#note-body");
    expect(notesFor("/no-such-page")).toEqual([]);
    const anchors = allNotes.map((note) => note.anchor).join(" ");
    expect(anchors).not.toMatch(/available|cart/);
  });
});
