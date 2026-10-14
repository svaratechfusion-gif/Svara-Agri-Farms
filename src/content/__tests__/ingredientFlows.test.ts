import { describe, expect, it } from "vitest";

import { flowArt, flowPlacements } from "../ingredientFlows";

const placements = Object.values(flowPlacements);

describe("ingredient flow placements", () => {
  it("only use artwork that exists", () => {
    placements.forEach((placement) => expect(flowArt).toHaveProperty(placement.ingredient));
  });

  it("alternate direction from one divider to the next", () => {
    placements.slice(1).forEach((placement, index) => {
      expect(placement.align).not.toBe(placements[index].align);
    });
  });

  it("never repeat an ingredient, so each transition has its own colour", () => {
    const ingredients = placements.map((placement) => placement.ingredient);
    expect(new Set(ingredients).size).toBe(ingredients.length);
  });

  it("register all eight supplied ingredients", () => {
    expect(Object.keys(flowArt).sort()).toEqual(
      ["amla", "apple", "beetroot", "carrot", "garlic", "ginger", "hibiscus", "moringa"].sort(),
    );
  });
});

describe("levelled artwork", () => {
  it("fits every frame: wide, shallow, and brought within 6° of level", () => {
    Object.values(flowArt).forEach(({ axis, level }) => {
      expect(level.ratio).toBeGreaterThan(0.4);
      expect(level.ratio).toBeLessThan(0.6);
      expect(Math.abs(axis + level.rotate)).toBeCloseTo(6, 5);
    });
  });
});
