import { describe, expect, it } from "vitest";

import { catalogue, products } from "@/content/products";

import { AVAILABILITY_LABEL, productAvailability, sizeAvailability } from "../availability";
import { buildRoadmap, MILESTONE_SCALES } from "../roadmap";
import type { FeaturedProduct } from "../types";

const range = catalogue.filter((product) => !product.hasProductPage);
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
      ...new Set(
        products[0].variants.map((v) => AVAILABILITY_LABEL[sizeAvailability(products[0], v)]),
      ),
    ];
    expect(roadmap.featured.availability).toEqual(labels);
  });

  it("says sizes are to be confirmed while any size is provisional", () => {
    expect(roadmap.featured.sizesProvisional).toBe(
      products[0].variants.some((variant) => variant.isProvisional),
    );
  });

  it("follows with every other pack, in catalogue order, each with its catalogue state", () => {
    expect(roadmap.milestones.map((m) => m.id)).toEqual(range.map((item) => item.id));
    roadmap.milestones.forEach((milestone, index) => {
      expect(milestone.status).toBe(AVAILABILITY_LABEL[productAvailability(range[index])]);
      expect(milestone).not.toHaveProperty("href");
    });
    // Today every one of them is available.
    expect(new Set(roadmap.milestones.map((m) => m.status))).toEqual(new Set(["Available"]));
    expect(roadmap.widerOrderable).toBe(true);
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
    expect(() => buildRoadmap([] as readonly FeaturedProduct[], range)).toThrow(
      /at least one product/,
    );
  });
});
