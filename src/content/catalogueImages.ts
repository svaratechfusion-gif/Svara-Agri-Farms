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

import { photos } from "./photos";

/**
 * The pack shot of every catalogue product, by key. The catalogue
 * (`products.ts`) refers to these keys only, so it stays plain data that
 * tools, tests and the database seed can read without loading images.
 */
export const catalogueImages = {
  moringaPouch: photos.productPouch,
  amla: {
    src: amla,
    alt: "The SVARA Amla Powder pouch beside whole and halved green amla fruit and a bowl of pale powder.",
  },
  apple: {
    src: apple,
    alt: "The SVARA Apple Powder pouch beside red apples and a bowl of pale powder.",
  },
  beetroot: {
    src: beetroot,
    alt: "The SVARA Beetroot Powder pouch beside whole and sliced beetroot and a bowl of deep red powder.",
  },
  carrot: {
    src: carrot,
    alt: "The SVARA Carrot Powder pouch beside fresh carrots and a bowl of orange powder.",
  },
  garlic: {
    src: garlic,
    alt: "The SVARA Garlic Powder pouch beside garlic bulbs and cloves and a bowl of cream powder.",
  },
  hibiscusFlower: {
    src: hibiscusFlower,
    alt: "The SVARA Hibiscus Flower Powder pouch beside red hibiscus flowers and petals and a bowl of crimson powder.",
  },
  hibiscusLeaf: {
    src: hibiscusLeaf,
    alt: "The SVARA Hibiscus Leaf Powder pouch beside hibiscus leaves and red flowers and a bowl of green powder.",
  },
  ginger: {
    src: ginger,
    alt: "The SVARA Ginger Powder pouch beside ginger roots and a bowl of golden powder.",
  },
  neem: {
    src: neem,
    alt: "The SVARA Neem Powder pouch beside neem leaves and fruit and a bowl of green powder.",
  },
  onion: {
    src: onion,
    alt: "The SVARA Onion Powder pouch beside red onions and a bowl of pale pink powder.",
  },
  rawBanana: {
    src: rawBanana,
    alt: "The SVARA Raw Banana Powder pouch beside green bananas and a bowl of pale powder.",
  },
} satisfies Record<string, { src: StaticImageData; alt: string }>;

export type CatalogueImageKey = keyof typeof catalogueImages;
