import { describe, expect, it } from "vitest";

import { products } from "@/content/products";
import { range } from "@/content/range";

import { AVAILABILITY_LABEL } from "../availability";
import { buildRoadmap, IN_PREPARATION, MILESTONE_SCALES } from "../roadmap";
import type { Product } from "../types";

const roadmap = buildRoadmap(products, range);

describe("the product roadmap", () => {
  it("begins with the real product, linked to its own page", () => {
    const [moringa] = products;
    expect(roadmap.featured.slug).toBe(moringa.slug);
    expect(roadmap.featured.name).toBe(moringa.name);
    expect(roadmap.featured.href).toBe(`/products/${moringa.slug}`);
  });

  it("states the featured product's availability exactly as the catalogue does", () => {
    const labels = [
      ...new Set(products[0].variants.map((v) => AVAILABILITY_LABEL[v.availability])),
    ];
    expect(roadmap.featured.availability).toEqual(labels);
  });

  it("says sizes are to be confirmed while any size is provisional", () => {
    expect(roadmap.featured.sizesProvisional).toBe(
      products[0].variants.some((variant) => variant.isProvisional),
    );
  });

  it("follows with every pack in preparation, in catalogue order, none of them orderable", () => {
    expect(roadmap.milestones.map((m) => m.id)).toEqual(range.map((item) => item.id));
    roadmap.milestones.forEach((milestone) => {
      expect(milestone.status).toBe(IN_PREPARATION);
      expect(milestone).not.toHaveProperty("href");
    });
  });

  it("alternates sides, starting with the image on the left", () => {
    expect(roadmap.milestones.map((m) => m.side)).toEqual(
      range.map((_, index) => (index % 2 === 0 ? "left" : "right")),
    );
  });

  it("varies the composition so no two neighbours share a size", () => {
    roadmap.milestones.slice(1).forEach((milestone, index) => {
      expect(milestone.scale).not.toBe(roadmap.milestones[index].scale);
    });
    roadmap.milestones.forEach((m) => expect(MILESTONE_SCALES).toContain(m.scale));
  });

  it("numbers the stops after the featured product", () => {
    expect(roadmap.featured.step).toBe("01");
    expect(roadmap.milestones[0].step).toBe("02");
    expect(roadmap.milestones.at(-1)?.step).toBe(String(range.length + 1).padStart(2, "0"));
  });

  it("refuses to build without a product to begin with", () => {
    expect(() => buildRoadmap([] as readonly Product[], range)).toThrow(/at least one product/);
  });
});
