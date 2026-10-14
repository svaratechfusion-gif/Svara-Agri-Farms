import { afterEach, describe, expect, it, vi } from "vitest";

import { computeProgress, observeScrollProgress } from "../scrollProgress";

const VIEWPORT = 1000;

describe("computeProgress", () => {
  it("through: runs from entering the bottom to leaving the top", () => {
    expect(computeProgress("through", VIEWPORT, 500, VIEWPORT)).toBe(0);
    expect(computeProgress("through", 250, 500, VIEWPORT)).toBe(0.5);
    expect(computeProgress("through", -500, 500, VIEWPORT)).toBe(1);
  });

  it("exit: runs while the element scrolls off the top", () => {
    expect(computeProgress("exit", 0, 800, VIEWPORT)).toBe(0);
    expect(computeProgress("exit", -400, 800, VIEWPORT)).toBe(0.5);
    expect(computeProgress("exit", -1600, 800, VIEWPORT)).toBe(1);
  });

  it("track: spans a tall section's sticky distance", () => {
    expect(computeProgress("track", 0, 3000, VIEWPORT)).toBe(0);
    expect(computeProgress("track", -1000, 3000, VIEWPORT)).toBe(0.5);
    expect(computeProgress("track", -2000, 3000, VIEWPORT)).toBe(1);
  });

  it("anchor: measures how far the element has crossed a viewport line", () => {
    expect(computeProgress("anchor", 500, 1000, VIEWPORT, 0.5)).toBe(0);
    expect(computeProgress("anchor", 0, 1000, VIEWPORT, 0.5)).toBe(0.5);
    expect(computeProgress("anchor", -800, 1000, VIEWPORT, 0.5)).toBe(1);
  });

  it("clamps and survives zero-height elements", () => {
    expect(computeProgress("exit", -10, 0, VIEWPORT)).toBe(1);
    expect(computeProgress("track", 50, VIEWPORT, VIEWPORT)).toBe(0);
  });
});

describe("observeScrollProgress", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("writes --progress, reports changes and cleans up listeners", () => {
    const listeners = new Map<string, () => void>();
    let frameCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("window", {
      innerHeight: VIEWPORT,
      addEventListener: vi.fn((type: string, cb: () => void) => listeners.set(type, cb)),
      removeEventListener: vi.fn((type: string) => listeners.delete(type)),
    });
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frameCallback = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    let top = 250;
    const style = new Map<string, string>();
    const element = {
      getBoundingClientRect: () => ({ top, height: 500 }),
      style: {
        setProperty: (name: string, value: string) => style.set(name, value),
        removeProperty: (name: string) => style.delete(name),
      },
    } as unknown as HTMLElement;
    const onProgress = vi.fn();

    const stop = observeScrollProgress(element, { mode: "through", onProgress });
    expect(listeners.has("scroll")).toBe(true);
    (frameCallback as FrameRequestCallback | null)?.(0);
    expect(style.get("--progress")).toBe("0.5000");
    expect(onProgress).toHaveBeenLastCalledWith(0.5);

    // An unchanged position does not re-write or re-notify.
    listeners.get("scroll")?.();
    (frameCallback as FrameRequestCallback | null)?.(0);
    expect(onProgress).toHaveBeenCalledTimes(1);

    top = -500;
    listeners.get("scroll")?.();
    (frameCallback as FrameRequestCallback | null)?.(0);
    expect(style.get("--progress")).toBe("1.0000");

    stop();
    expect(style.has("--progress")).toBe(false);
    expect(listeners.has("scroll")).toBe(false);
  });
});
