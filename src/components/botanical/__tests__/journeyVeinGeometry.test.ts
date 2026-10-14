import { describe, expect, it } from "vitest";

import {
  midribPath,
  midribY,
  nodeFractions,
  stagePosition,
  traceAtPosition,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  veinNodes,
} from "../journeyVeinGeometry";

describe("journey vein geometry", () => {
  it("keeps the midrib inside the view box", () => {
    for (let x = 24; x <= 976; x += 4) {
      const y = midribY(x);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(VIEW_HEIGHT);
    }
  });

  it("draws one continuous path from start to end", () => {
    const path = midribPath();
    expect(path.startsWith("M24.0 ")).toBe(true);
    expect(path).toContain(" L976 ");
    expect(path.match(/M/g)).toHaveLength(1);
  });

  it("spaces stage nodes evenly, in order, on the curve", () => {
    const nodes = veinNodes(6);
    expect(nodes).toHaveLength(6);
    const gaps = nodes.slice(1).map((node, index) => node.x - nodes[index].x);
    gaps.forEach((gap) => expect(gap).toBeCloseTo(gaps[0], 6));
    nodes.forEach((node) => {
      expect(node.y).toBeCloseTo(midribY(node.x), 6);
      expect(node.left).toBeCloseTo((node.x / VIEW_WIDTH) * 100, 6);
      expect(node.top).toBeCloseTo((node.y / VIEW_HEIGHT) * 100, 6);
    });
  });

  it("alternates labels below and above the vein", () => {
    expect(veinNodes(4).map((node) => node.side)).toEqual(["below", "above", "below", "above"]);
  });

  it("centres a single node and handles an empty journey", () => {
    expect(veinNodes(1)[0].left).toBeCloseTo(50, 0);
    expect(veinNodes(0)).toEqual([]);
  });
});

describe("journey trace", () => {
  const fractions = nodeFractions(6);
  const centres = [100, 400, 700, 1000, 1300, 1600];

  it("places node fractions in order, inside the path", () => {
    fractions
      .slice(1)
      .forEach((fraction, index) => expect(fraction).toBeGreaterThan(fractions[index]));
    expect(fractions[0]).toBeGreaterThan(0);
    expect(fractions[5]).toBeLessThan(1);
  });

  it("reads the stage position from measured centres and the reading line", () => {
    expect(stagePosition(centres, 50)).toBe(0);
    expect(stagePosition(centres, 700)).toBeCloseTo(2, 6);
    expect(stagePosition(centres, 850)).toBeCloseTo(2.5, 6);
    expect(stagePosition(centres, 5000)).toBe(5);
    expect(stagePosition([], 300)).toBe(0);
  });

  it("draws the vein exactly to a stage's node when that stage is on the line", () => {
    fractions.forEach((fraction, stage) =>
      expect(traceAtPosition(stagePosition(centres, centres[stage]), fractions)).toBeCloseTo(
        fraction,
        6,
      ),
    );
  });

  it("eases between nodes and clamps at both ends", () => {
    const between = traceAtPosition(1.5, fractions);
    expect(between).toBeGreaterThan(fractions[1]);
    expect(between).toBeLessThan(fractions[2]);
    expect(traceAtPosition(-3, fractions)).toBeCloseTo(fractions[0], 6);
    expect(traceAtPosition(9, fractions)).toBeCloseTo(fractions[5], 6);
    expect(traceAtPosition(1, [])).toBe(0);
  });
});
