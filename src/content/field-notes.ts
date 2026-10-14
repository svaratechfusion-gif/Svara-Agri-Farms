import type { PhotoKey } from "./photos";

export type FieldNoteCategory = "The Farm" | "The Process" | "The People" | "The Kitchen";

export interface FieldNote {
  slug: string;
  number: string;
  category: FieldNoteCategory;
  title: string;
  excerpt: string;
  photo: PhotoKey;
  body: readonly string[];
}

/**
 * Field Notes are short, observational essays. They describe what can be seen
 * on the farm; they do not carry statistics, dates or health claims.
 */
export const fieldNotes: readonly FieldNote[] = [
  {
    slug: "the-journey-of-a-leaf",
    number: "01",
    category: "The Process",
    title: "The journey of a leaf",
    excerpt:
      "From the branch to the basket, from the shade to the mill — following a single moringa leaf from our farm to the pouch on your shelf.",
    photo: "harvestersField",
    body: [
      "Every pouch of SVARA Moringa Powder starts in the same place: a single leaf on a moringa tree, growing in a row on our farm.",
      "In the morning the leaves are gathered by hand. They go into woven baskets and are carried from the trees to a table where they are sorted on cloth — stems and anything that does not belong set aside.",
      "From there the leaves move into the shade. They are spread across trays in an airy shelter, out of direct sun, and left to dry in their own time. Only when they are dry are they milled into powder and packed.",
      "None of these steps is complicated. What matters is that each one is done with attention. That is the whole idea behind SVARA: begin with the land, and carry its care all the way to your home.",
    ],
  },
  {
    slug: "why-we-begin-with-the-land",
    number: "02",
    category: "The Farm",
    title: "Why we begin with the land",
    excerpt:
      "Before there is a product, there is soil, water and season. A note on starting at the beginning.",
    photo: "farmRowsCanopy",
    body: [
      "It is tempting to begin a brand with a product. We chose to begin with a farm.",
      "A moringa tree does not hurry. It answers to the soil it grows in, to the rain, to the heat of the afternoon and the cool of the morning. Our work is to pay attention to those things and to tend the trees accordingly.",
      "When we talk about care, this is where it starts — not in the packaging, but in the rows.",
    ],
  },
  {
    slug: "behind-every-harvest",
    number: "03",
    category: "The People",
    title: "Behind every harvest",
    excerpt:
      "The hands that pluck, carry and sort. A few words about the people who make the work possible.",
    photo: "handsHarvestBasket",
    body: [
      "Every leaf in a pouch of SVARA Moringa Powder has passed through human hands.",
      "Harvesting moringa by hand is patient work. Leaves are plucked from the branch and laid into baskets; baskets are carried to the sorting table; leaves are looked over one handful at a time.",
      "We think it is worth saying plainly: this is the work of people, and the product is better for it.",
    ],
  },
  {
    slug: "on-shade",
    number: "04",
    category: "The Process",
    title: "On shade",
    excerpt:
      "Why the leaves rest out of direct sun, and what patience looks like in a drying shelter.",
    photo: "shadeDryingRacks",
    body: [
      "After the harvest, the leaves are not left out in the open sun. They are spread across trays in a shaded, ventilated shelter where air can move freely around them.",
      "Drying this way is slow. The leaves change gradually — from soft and bright to crisp and deep green — and they are watched as they go.",
      "Only once the leaves are properly dry do they move on to be milled. Patience, here, is part of the process.",
    ],
  },
  {
    slug: "a-spoonful-in-the-kitchen",
    number: "05",
    category: "The Kitchen",
    title: "A spoonful in the kitchen",
    excerpt:
      "Simple, everyday ways to bring moringa powder to the table — in a glass, a bowl or a pot.",
    photo: "powderMacro",
    body: [
      "Moringa powder is easy to keep close at hand. Its flavour is green and gently earthy.",
      "Stir a small spoonful into a glass of water. Blend it into a smoothie, or swirl it through a bowl of yoghurt. Fold it into dough, or into a dal or soup towards the end of cooking.",
      "Keep the pouch sealed between uses, somewhere cool, dry and away from direct light.",
    ],
  },
];

export function findFieldNote(slug: string): FieldNote | null {
  return fieldNotes.find((note) => note.slug === slug) ?? null;
}

const WORDS_PER_MINUTE = 200;

export function readingMinutes(note: FieldNote): number {
  const words = note.body.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
