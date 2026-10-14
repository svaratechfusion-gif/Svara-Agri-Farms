import type { StaticImageData } from "next/image";

import amla from "@/assets/products/amla-powder.webp";
import apple from "@/assets/products/apple-powder.webp";
import beetroot from "@/assets/products/beetroot-powder.webp";
import carrot from "@/assets/products/carrot-powder.webp";
import garlic from "@/assets/products/garlic-powder.webp";
import hibiscusFlower from "@/assets/products/hibiscus-flower-powder.webp";
import hibiscusLeaf from "@/assets/products/hibiscus-leaf-powder.webp";
import ginger from "@/assets/products/ginger-powder.webp";
import neem from "@/assets/products/neem-powder.webp";
import onion from "@/assets/products/onion-powder.webp";
import rawBanana from "@/assets/products/raw-banana-powder.webp";

export interface RangeItem {
  id: string;
  name: string;
  /** What the pack is made from — shown as the card's one line. */
  ingredient: string;
  /** Tint for the sun arc behind the pouch, taken from the pack's own band. */
  tone: "earth" | "forest";
  image: StaticImageData;
  alt: string;
}

/**
 * Packs in preparation beyond Moringa. Each image is the supplied packshot for
 * that ingredient, used unaltered (transparent edges kept). They are shown as
 * a preview only: no price, size, availability, product page or cart action
 * exists for them until the business confirms the data.
 *
 * The packs print claims ("100% Natural", "No Additives", "Rich in
 * Nutrients") and "NET WT. 100 g". None is repeated in site copy or data.
 * Known artwork faults (to fix in the source artwork, not here): the Amla
 * pack's tagline reads "NATURAL WE LNESS"; the Hibiscus Flower tagline has a
 * malformed letter in "WELLNESS".
 */
export const range: readonly RangeItem[] = [
  {
    id: "beetroot",
    name: "Beetroot Powder",
    ingredient: "Beetroot",
    tone: "earth",
    image: beetroot,
    alt: "The SVARA Beetroot Powder pouch beside whole and sliced beetroot and a bowl of deep red powder.",
  },
  {
    id: "carrot",
    name: "Carrot Powder",
    ingredient: "Carrot",
    tone: "earth",
    image: carrot,
    alt: "The SVARA Carrot Powder pouch beside fresh carrots and a bowl of orange powder.",
  },
  {
    id: "apple",
    name: "Apple Powder",
    ingredient: "Apple",
    tone: "earth",
    image: apple,
    alt: "The SVARA Apple Powder pouch beside red apples and a bowl of pale powder.",
  },
  {
    id: "garlic",
    name: "Garlic Powder",
    ingredient: "Garlic",
    tone: "forest",
    image: garlic,
    alt: "The SVARA Garlic Powder pouch beside garlic bulbs and cloves and a bowl of cream powder.",
  },
  {
    id: "onion",
    name: "Onion Powder",
    ingredient: "Red onion",
    tone: "earth",
    image: onion,
    alt: "The SVARA Onion Powder pouch beside red onions and a bowl of pale pink powder.",
  },
  {
    id: "ginger",
    name: "Ginger Powder",
    ingredient: "Ginger root",
    tone: "earth",
    image: ginger,
    alt: "The SVARA Ginger Powder pouch beside ginger roots and a bowl of golden powder.",
  },
  {
    id: "neem",
    name: "Neem Powder",
    ingredient: "Neem leaf",
    tone: "forest",
    image: neem,
    alt: "The SVARA Neem Powder pouch beside neem leaves and fruit and a bowl of green powder.",
  },
  {
    id: "raw-banana",
    name: "Raw Banana Powder",
    ingredient: "Green banana",
    tone: "forest",
    image: rawBanana,
    alt: "The SVARA Raw Banana Powder pouch beside green bananas and a bowl of pale powder.",
  },
  {
    id: "hibiscus-leaf",
    name: "Hibiscus Leaf Powder",
    ingredient: "Hibiscus leaf",
    tone: "forest",
    image: hibiscusLeaf,
    alt: "The SVARA Hibiscus Leaf Powder pouch beside hibiscus leaves and red flowers and a bowl of green powder.",
  },
  {
    id: "hibiscus-flower",
    name: "Hibiscus Flower Powder",
    ingredient: "Hibiscus flower",
    tone: "earth",
    image: hibiscusFlower,
    alt: "The SVARA Hibiscus Flower Powder pouch beside red hibiscus flowers and petals and a bowl of crimson powder.",
  },
  {
    id: "amla",
    name: "Amla Powder",
    ingredient: "Amla (Indian gooseberry)",
    tone: "forest",
    image: amla,
    alt: "The SVARA Amla Powder pouch beside whole and halved green amla fruit and a bowl of pale powder.",
  },
];
