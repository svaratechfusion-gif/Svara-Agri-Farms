import type { CatalogueImageKey } from "./catalogueImages";

export interface RangeEntry {
  id: string;
  name: string;
  /** What the pack is made from — shown as the card's one line. */
  ingredient: string;
  /** Tint for the sun arc behind the pouch, taken from the pack's own band. */
  tone: "earth" | "forest";
  /** Key of its pack shot in `catalogueImages.ts`. */
  image: CatalogueImageKey;
}

/**
 * Source data for the packs beyond Moringa, read only by `products.ts`, which
 * turns each into a catalogue entry (in preparation, provisional 100 g /
 * 250 g sizes, no price). Each image is the supplied packshot for that
 * ingredient (transparent edges kept). To change a pack's availability or
 * price, edit `products.ts`, not this file.
 *
 * The pack shots were retouched on 2026-10-18 (README → Packaging claims
 * review): the printed "NET WT. 100 g" (both sizes are sold) and the
 * unverified claims ("100% Natural", "No Additives", "Rich in Nutrients")
 * were removed, and "NATURAL WE LNESS" on Amla and Hibiscus Flower now reads
 * "NATURAL WELLNESS". Still on the artwork, awaiting the designer's files:
 * the SVARA seal on every pack still reads "ORGANIC • HEALTHY • TRUSTED",
 * "100% ORGANIC" and "TRUELY INDIAN" (README → Packaging claims review).
 */
export const range: readonly RangeEntry[] = [
  {
    id: "beetroot-powder",
    name: "Beetroot Powder",
    ingredient: "Beetroot",
    tone: "earth",
    image: "beetroot",
  },
  {
    id: "carrot-powder",
    name: "Carrot Powder",
    ingredient: "Carrot",
    tone: "earth",
    image: "carrot",
  },
  {
    id: "apple-powder",
    name: "Apple Powder",
    ingredient: "Apple",
    tone: "earth",
    image: "apple",
  },
  {
    id: "garlic-powder",
    name: "Garlic Powder",
    ingredient: "Garlic",
    tone: "forest",
    image: "garlic",
  },
  {
    id: "onion-powder",
    name: "Onion Powder",
    ingredient: "Red onion",
    tone: "earth",
    image: "onion",
  },
  {
    id: "ginger-powder",
    name: "Ginger Powder",
    ingredient: "Ginger root",
    tone: "earth",
    image: "ginger",
  },
  {
    id: "neem-powder",
    name: "Neem Powder",
    ingredient: "Neem leaf",
    tone: "forest",
    image: "neem",
  },
  {
    id: "raw-banana-powder",
    name: "Raw Banana Powder",
    ingredient: "Green banana",
    tone: "forest",
    image: "rawBanana",
  },
  {
    id: "hibiscus-leaf-powder",
    name: "Hibiscus Leaf Powder",
    ingredient: "Hibiscus leaf",
    tone: "forest",
    image: "hibiscusLeaf",
  },
  {
    id: "hibiscus-flower-powder",
    name: "Hibiscus Flower Powder",
    ingredient: "Hibiscus flower",
    tone: "earth",
    image: "hibiscusFlower",
  },
  {
    id: "amla-powder",
    name: "Amla Powder",
    ingredient: "Amla (Indian gooseberry)",
    tone: "forest",
    image: "amla",
  },
];
