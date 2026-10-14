import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CURIOSITY, mayBeCurious } from "../curiosity";
import { mascotDefinition, type MascotState } from "../definition";
import { createMoodController, timelineDurationMs, type Clock } from "../moodController";
import { INTERACTION_PRIORITY, MOOD_PRIORITY } from "../moodPriority";
import {
  hasBeenWelcomed,
  markWelcomed,
  mayWelcome,
  resetWelcomeMemory,
  subscribeWelcome,
  WELCOME,
  welcomedServerSnapshot,
} from "../welcome";

/** A controllable clock: timers fire only when the test advances time. */
function fakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; run: () => void }>();
  const clock: Clock = {
    now: () => now,
    setTimeout: (run, ms) => {
      const id = nextId++;
      timers.set(id, { at: now + ms, run });
      return id;
    },
    clearTimeout: (id) => {
      if (id !== undefined) timers.delete(id);
    },
  };
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      now = due[1].at;
      due[1].run();
    }
    now = end;
  };
  return { clock, advance, pending: () => timers.size };
}

function setup() {
  const time = fakeClock();
  const seen: MascotState[] = [];
  const controller = createMoodController((mood) => seen.push(mood), time.clock);
  return { ...time, seen, controller };
}

describe("SVARA mood priority", () => {
  it("follows the agreed order: error > cart > interaction > welcome > context > curiosity > rest", () => {
    const order: MascotState[] = [
      "error",
      "excited",
      "greeting",
      "welcome",
      "explaining",
      "curious",
      "idle",
    ];
    order.slice(1).forEach((lower, index) => {
      expect(MOOD_PRIORITY[order[index]]).toBeGreaterThan(MOOD_PRIORITY[lower]);
    });
    expect(MOOD_PRIORITY.sleeping).toBe(MOOD_PRIORITY.idle);
    expect(MOOD_PRIORITY.listening).toBe(MOOD_PRIORITY.greeting);
  });
});

describe("SVARA mood controller", () => {
  it("plays a timed mood, then returns to idle by itself", () => {
    const { controller, advance, seen } = setup();
    expect(controller.request("curious", 2000)).toBe(true);
    expect(controller.current()).toBe("curious");
    advance(1999);
    expect(controller.current()).toBe("curious");
    advance(1);
    expect(controller.current()).toBe("idle");
    expect(seen).toEqual(["curious", "idle"]);
  });

  it("never lets a delayed welcome overwrite a cart celebration", () => {
    const { controller, advance } = setup();
    controller.request("excited", 4000);
    advance(1400); // the welcome's delay elapses mid-celebration
    expect(controller.request("welcome", 3000)).toBe(false);
    expect(controller.current()).toBe("excited");
    advance(2600);
    expect(controller.current()).toBe("idle");
    // Once SVARA is free, the welcome (still owed) can play.
    expect(controller.request("welcome", 3000)).toBe(true);
  });

  it("ranks a chat answer as interaction: it outranks the greeting's protection and section notes, not the cart", () => {
    const { controller } = setup();
    controller.request("greeting", 2000);
    // An answer wears "explaining", but it answers the visitor directly.
    expect(controller.request("explaining", 6000, { priority: INTERACTION_PRIORITY })).toBe(true);
    // An ambient section note cannot cut the answer short.
    expect(controller.request("explaining", 6000)).toBe(false);
    expect(controller.request("curious", 2000)).toBe(false);
    // A real cart moment still wins, and the answer cannot take it back.
    expect(controller.request("excited", 4000)).toBe(true);
    expect(controller.request("explaining", 6000, { priority: INTERACTION_PRIORITY })).toBe(false);
    expect(controller.current()).toBe("excited");
  });

  it("lets the welcome take the stage from a section note, but not from curiosity's betters", () => {
    const { controller } = setup();
    controller.request("explaining", 6000);
    expect(controller.request("welcome", 3000)).toBe(true);
    expect(controller.request("explaining", 6000)).toBe(false);
    expect(controller.request("curious", 2000)).toBe(false);
    expect(controller.request("error", 4200)).toBe(true);
  });

  it("does not let cursor curiosity interrupt a real event", () => {
    const { controller } = setup();
    controller.request("excited", 4000);
    expect(controller.request("curious", 2000)).toBe(false);
    controller.request("error", 4200);
    expect(controller.request("excited", 4000)).toBe(false);
  });

  it("keeps held moods until released, and release only ends the named mood", () => {
    const { controller, advance } = setup();
    controller.request("listening", 60_000, { held: true });
    advance(120_000);
    expect(controller.current()).toBe("listening");
    controller.release("greeting");
    expect(controller.current()).toBe("listening");
    controller.release("listening");
    expect(controller.current()).toBe("idle");
  });

  it("lets anything wake SVARA from sleep", () => {
    const { controller } = setup();
    controller.request("sleeping", 0, { held: true });
    expect(controller.request("curious", 2000)).toBe(true);
  });

  it("keeps exactly one timer, and leaves none behind when disposed", () => {
    const { controller, pending } = setup();
    controller.request("curious", 2000);
    controller.request("explaining", 6000);
    controller.request("welcome", 3000);
    expect(pending()).toBe(1);
    controller.dispose();
    expect(pending()).toBe(0);
  });

  it("ends one-shots on the fallback timer even if their timeline never reports (reduced motion)", () => {
    const { controller, advance } = setup();
    controller.request("welcome", 3200);
    advance(3200);
    expect(controller.current()).toBe("idle");
  });
});

describe("one-shot timings", () => {
  it("measures a timeline from its steps", () => {
    expect(
      timelineDurationMs({
        steps: [
          { expression: "calm", holdMs: 400, transitionMs: 100, transition: "smooth" },
          { expression: "calm", holdMs: 300, transitionMs: 200, transition: "smooth" },
        ],
      }),
    ).toBe(1000);
  });

  it("gives the welcome long enough to be noticed, without lingering", () => {
    if (!mascotDefinition.ok) throw mascotDefinition.error;
    const welcome = timelineDurationMs(mascotDefinition.definition.animations.welcome);
    expect(welcome).toBeGreaterThanOrEqual(2500);
    expect(welcome).toBeLessThanOrEqual(4500);
    // The eyes lead: the welcome opens on the bright, wide-eyed pose.
    expect(mascotDefinition.definition.animations.welcome.steps[0].expression).toBe("bright-wide");
  });
});

describe("first-visit welcome", () => {
  function memoryStore(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial));
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
  }
  const throwing = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };

  beforeEach(() => resetWelcomeMemory());
  afterEach(() => resetWelcomeMemory());

  it("is owed to a new session and spent once marked", () => {
    const store = memoryStore();
    expect(hasBeenWelcomed(store)).toBe(false);
    markWelcomed(store);
    expect(hasBeenWelcomed(store)).toBe(true);
    expect(store.getItem(WELCOME.storageKey)).toBe("1");
  });

  it("is not owed again within the same session", () => {
    expect(hasBeenWelcomed(memoryStore({ [WELCOME.storageKey]: "1" }))).toBe(true);
  });

  it("survives a storage that throws: owed once, then remembered in memory", () => {
    expect(hasBeenWelcomed(throwing)).toBe(false);
    expect(() => markWelcomed(throwing)).not.toThrow();
    expect(hasBeenWelcomed(throwing)).toBe(true);
    expect(hasBeenWelcomed(null)).toBe(true);
  });

  it("notifies subscribers when spent, and never renders a welcome on the server", () => {
    let calls = 0;
    const unsubscribe = subscribeWelcome(() => calls++);
    markWelcomed(memoryStore());
    unsubscribe();
    markWelcomed(memoryStore());
    expect(calls).toBe(1);
    expect(welcomedServerSnapshot()).toBe(true);
  });

  it("waits until SVARA is on screen, the tab is visible and the panel is closed", () => {
    const ready = { pending: true, onScreen: true, pageVisible: true, panelOpen: false };
    expect(mayWelcome(ready)).toBe(true);
    expect(mayWelcome({ ...ready, pending: false })).toBe(false);
    expect(mayWelcome({ ...ready, onScreen: false })).toBe(false);
    expect(mayWelcome({ ...ready, pageVisible: false })).toBe(false);
    expect(mayWelcome({ ...ready, panelOpen: true })).toBe(false);
  });
});

describe("cursor curiosity", () => {
  it("allows one curious look per cooldown", () => {
    expect(mayBeCurious(1000, null)).toBe(true);
    expect(mayBeCurious(1000 + CURIOSITY.cooldownMs - 1, 1000)).toBe(false);
    expect(mayBeCurious(1000 + CURIOSITY.cooldownMs, 1000)).toBe(true);
  });
});
