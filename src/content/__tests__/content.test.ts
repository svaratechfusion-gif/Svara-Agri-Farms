import { describe, expect, it } from "vitest";

import { fieldNotes, findFieldNote, readingMinutes } from "../field-notes";
import { journeyStages, leafSequence } from "../journey";
import { photos } from "../photos";
import { products } from "../products";

const photoKeys = new Set(Object.keys(photos));

/**
 * Guards against fabricated specifics creeping into copy. Numbers with units,
 * percentages, certifications and health language need verified data first.
 */
const UNVERIFIED_CLAIM =
  /\d+\s?(%|°|mesh|hrs?|hours|acres?|years|microns?)|certif|organic|clinical|cure|immun|detox|award/i;

function allCopy(): string[] {
  return [
    ...journeyStages.flatMap((stage) => [stage.headline, stage.description, stage.caption]),
    ...leafSequence.map((step) => step.note),
    ...fieldNotes.flatMap((note) => [note.title, note.excerpt, ...note.body]),
    ...products.flatMap((product) => [
      product.tagline,
      product.description,
      ...product.details.flatMap((detail) => [detail.title, detail.body]),
      ...product.howToUse,
    ]),
  ];
}

describe("content integrity", () => {
  it("references only photographs that exist", () => {
    const referenced = [
      ...journeyStages.map((stage) => stage.photo),
      ...fieldNotes.map((note) => note.photo),
      ...products.flatMap((product) => [
        ...product.gallery,
        ...product.details.map((d) => d.photo),
      ]),
    ];
    referenced.forEach((key) => expect(photoKeys.has(key)).toBe(true));
  });

  it("gives every photograph meaningful alt text", () => {
    Object.values(photos).forEach((photo) => expect(photo.alt.length).toBeGreaterThan(20));
  });

  it("has six journey stages numbered in order", () => {
    expect(journeyStages.map((stage) => stage.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ]);
  });

  it("uses unique slugs", () => {
    const slugs = [...fieldNotes.map((note) => note.slug), ...products.map((p) => p.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("does not present unverified claims", () => {
    allCopy().forEach((copy) => expect(copy).not.toMatch(UNVERIFIED_CLAIM));
  });

  it("never shows an invented price", () => {
    products.forEach((product) =>
      product.variants
        .filter((variant) => variant.isProvisional)
        .forEach((variant) => expect(variant.price).toBeNull()),
    );
  });
});

describe("field note helpers", () => {
  it("finds notes by slug and estimates reading time", () => {
    const note = findFieldNote(fieldNotes[0].slug);
    expect(note).toBe(fieldNotes[0]);
    expect(findFieldNote("missing")).toBeNull();
    expect(readingMinutes(fieldNotes[0])).toBeGreaterThanOrEqual(1);
  });
});
