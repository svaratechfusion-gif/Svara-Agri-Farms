import { describe, expect, it } from "vitest";

import {
  FLOW_CONFIG,
  flowSizes,
  resolveFlow,
  type FlowLevel,
  type FlowPlacement,
} from "../flowLayout";

const level: FlowLevel = { rotate: -30, ratio: 0.52, width: 89.5, height: 160, left: 5, top: -30 };
const base: FlowPlacement = { ingredient: "beetroot", align: "start" };

describe("resolveFlow", () => {
  it("defaults to the standard height, reaching no neighbour, drifting with scroll", () => {
    const layout = resolveFlow(base, level);
    expect(layout.style["--flow-scale"]).toBe("1");
    expect(layout.style["--flow-above"]).toBe("0");
    expect(layout.style["--flow-below"]).toBe("0");
    expect(layout.reveal).toBe(true);
    expect(layout.parallax).toBe(String(FLOW_CONFIG.drift));
  });

  it("levels the art into a frame shaped like the levelled content", () => {
    const { style } = resolveFlow(base, level);
    expect(style["--flow-ratio"]).toBe("0.52");
    expect(style["--flow-rotate"]).toBe("-30deg");
    expect(style["--flow-img-w"]).toBe("89.5%");
    expect(style["--flow-img-h"]).toBe("160%");
    expect(style["--flow-img-l"]).toBe("5%");
    expect(style["--flow-img-t"]).toBe("-30%");
  });

  it("keeps every divider within a family of heights", () => {
    expect(resolveFlow({ ...base, scale: 0.1 }, level).style["--flow-scale"]).toBe("0.8");
    expect(resolveFlow({ ...base, scale: 9 }, level).style["--flow-scale"]).toBe("1.2");
  });

  it("mirrors art that flows in from the end edge, and lets that be overridden", () => {
    expect(resolveFlow(base, level).mirror).toBe(false);
    expect(resolveFlow({ ...base, align: "end" }, level).mirror).toBe(true);
    expect(resolveFlow({ ...base, align: "end", mirror: false }, level).mirror).toBe(false);
  });

  it("maps overlap names to shares of the section padding, always inside it", () => {
    const layout = resolveFlow({ ...base, overlap: { above: "soft", below: "deep" } }, level);
    expect(layout.style["--flow-above"]).toBe(String(FLOW_CONFIG.overlap.soft));
    expect(layout.style["--flow-below"]).toBe(String(FLOW_CONFIG.overlap.deep));
    Object.values(FLOW_CONFIG.overlap).forEach((share) => expect(share).toBeLessThan(1));
  });

  it("reveals without drift, or stays entirely still, on request", () => {
    const reveal = resolveFlow({ ...base, motion: "reveal" }, level);
    expect(reveal.reveal).toBe(true);
    expect(reveal.parallax).toBeUndefined();
    const still = resolveFlow({ ...base, motion: "none" }, level);
    expect(still.reveal).toBe(false);
    expect(still.parallax).toBeUndefined();
  });

  it("blends the band from one neighbour's ground to the next", () => {
    const layout = resolveFlow({ ...base, from: "ivory", to: "ivory-deep" }, level);
    expect(layout.style["--flow-from"]).toBe("var(--color-ivory)");
    expect(layout.style["--flow-to"]).toBe("var(--color-ivory-deep)");
    expect(resolveFlow({ ...base, from: "forest" }, level).style["--flow-to"]).toBe(
      "var(--color-forest)",
    );
    expect(resolveFlow(base, level).style["--flow-from"]).toBe("transparent");
  });
});

describe("flowSizes", () => {
  it("requests the image box's share of the viewport", () => {
    expect(flowSizes({ width: 89.5 })).toBe("(min-width: 64rem) 50vw, 83vw");
    expect(flowSizes({ width: 106.44 }, 1.2)).toBe("(min-width: 64rem) 71vw, 118vw");
  });
});
