import type { PhotoKey } from "./photos";

export interface JourneyStage {
  id: string;
  number: string;
  title: string;
  headline: string;
  description: string;
  photo: PhotoKey;
  /**
   * An optional second photograph shown beside the main one, so a stage can
   * be told as a before/after pair instead of claiming a scene we lack.
   */
  detailPhoto?: PhotoKey;
  caption: string;
}

/**
 * The six stages of "Follow the Leaf". Copy describes the process in plain,
 * observable terms only — no temperatures, durations or yields are stated
 * until they are confirmed by the farm.
 */
export const journeyStages: readonly JourneyStage[] = [
  {
    id: "grow",
    number: "01",
    title: "Grow",
    headline: "It begins in the soil.",
    description:
      "Moringa trees grow in open rows on our farm, rooted in red earth and shaped by the seasons. Before anything is made, the land is tended.",
    photo: "stageGrow",
    caption: "Young moringa in red earth",
  },
  {
    id: "harvest",
    number: "02",
    title: "Harvest",
    headline: "Gathered by hand.",
    description:
      "Leaves are plucked from the branch by hand and laid into woven baskets — a quiet, unhurried motion repeated tree after tree.",
    photo: "stageHarvest",
    caption: "Leaves into a woven basket",
  },
  {
    id: "select",
    number: "03",
    title: "Select",
    headline: "Leaf by leaf.",
    description:
      "Fresh leaves are sorted on cloth, by eye and by hand. Stems and anything that does not belong are set aside.",
    photo: "stageSelect",
    caption: "Sorting the morning's harvest",
  },
  {
    id: "shade-dry",
    number: "04",
    title: "Shade Dry",
    headline: "Dried away from direct sun.",
    description:
      "The selected leaves are spread across trays in a shaded, airy shelter and left to dry slowly, in their own time.",
    photo: "stageShade",
    caption: "Leaves resting in the shade",
  },
  {
    id: "mill",
    number: "05",
    title: "Mill",
    headline: "From leaf to powder.",
    description: "The dried leaves are transformed into a fine powder.",
    photo: "stageMill",
    detailPhoto: "leafDriedSprig",
    caption: "Dried leaf, and the powder it becomes",
  },
  {
    id: "pack",
    number: "06",
    title: "Pack",
    headline: "Sealed for your home.",
    description:
      "The powder is packed into SVARA pouches, ready to leave the farm and find its way to your kitchen.",
    photo: "productPouch",
    caption: "SVARA Moringa Powder",
  },
];

/** The full arc, used as a quiet typographic index across the site. */
export const leafPath: readonly string[] = [
  "Earth",
  "Grow",
  "Leaf",
  "Harvest",
  "Select",
  "Shade",
  "Dry",
  "Mill",
  "Powder",
  "Pack",
  "Home",
];

/**
 * The eight-tile sequence from the Stitch "Leaf" and "Product" chapters.
 * Notes are plain observations of the process — no measurements.
 */
export const leafSequence: readonly { title: string; note: string }[] = [
  { title: "Earth", note: "Red soil, open rows" },
  { title: "Grow", note: "Tended through the seasons" },
  { title: "Leaf", note: "A single leaflet" },
  { title: "Harvest", note: "Plucked by hand" },
  { title: "Select", note: "Sorted on cloth" },
  { title: "Shade", note: "Dried away from the sun" },
  { title: "Mill", note: "Milled into powder" },
  { title: "Pack", note: "Sealed in a SVARA pouch" },
];
