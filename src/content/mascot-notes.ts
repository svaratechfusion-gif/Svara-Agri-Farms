import { journeyStages } from "./journey";

/**
 * SVARA's contextual notes: one short line per section, keyed by a selector
 * for that section's anchor. Every note restates copy the site already shows
 * on that page — no new claims about the farm, the process or the product.
 * Purchase areas and the cart deliberately have no note.
 */
export interface SectionNote {
  /** CSS selector for the section's anchor (usually its heading). */
  anchor: string;
  note: string;
}

/** On the journey, each stage points ahead to the next one, from the stage data itself. */
const NEXT_STAGE_NOTES: readonly SectionNote[] = journeyStages.slice(0, -1).map((stage, index) => {
  const next = journeyStages[index + 1];
  return {
    anchor: `#stage-${stage.id}`,
    note: `After ${stage.title.toLowerCase()}, the leaf moves on to ${next.title.toLowerCase()}: ${next.headline
      .replace(/\.$/, "")
      .toLowerCase()}.`,
  };
});

const LAST_STAGE: SectionNote = {
  anchor: `#stage-${journeyStages.at(-1)?.id ?? "pack"}`,
  note: "That's the whole journey — from a row on our farm to your kitchen.",
};

const HOME: readonly SectionNote[] = [
  {
    anchor: "#hero-heading",
    note: "Hello, I'm SVARA. Everything here begins as a leaf on our farm.",
  },
  {
    anchor: "#ritual-heading",
    note: "A small spoonful stirs into water, a smoothie or the day's cooking.",
  },
  {
    anchor: "#leaf-heading",
    note: "Moringa oleifera, the drumstick tree. Its leaf is the part that becomes the powder.",
  },
  {
    anchor: "#ingredient-heading",
    note: "Fresh leaf, shade-dried leaf, then powder — one leaf in three forms.",
  },
  {
    anchor: "#journey-heading",
    note: "Six stages — grow, harvest, select, shade dry, mill and pack.",
  },
  {
    anchor: "#green-heading",
    note: "One green, followed from the branch through the shade into the bowl.",
  },
  {
    anchor: "#range-heading",
    note: "Moringa Powder comes first; the other packs are still in preparation.",
  },
  { anchor: "#notes-heading", note: "Field notes are short stories from the farm — open any one." },
  { anchor: "#closing-heading", note: "Nature. Nurture. Nourish. From our farm, to your home." },
];

/** Notes by route. A route maps to the first matching entry (exact path, or a prefix ending in "/"). */
export const MASCOT_NOTES: ReadonlyArray<{ route: string; notes: readonly SectionNote[] }> = [
  { route: "/", notes: HOME },
  {
    route: "/farm",
    notes: [
      {
        anchor: "#monograph-heading",
        note: "Our moringa grows in open rows of red soil, with hills on the horizon.",
      },
      {
        anchor: "#landscape-heading",
        note: "The seasons decide when the trees flush with new leaves.",
      },
    ],
  },
  {
    route: "/journey",
    notes: [
      ...NEXT_STAGE_NOTES,
      LAST_STAGE,
      {
        anchor: "#people-heading",
        note: "Every leaf is plucked, carried and sorted by hand, at the pace of the morning.",
      },
      {
        anchor: "#shade-heading",
        note: "The leaves dry slowly in an open-sided shelter, away from direct sun.",
      },
    ],
  },
  {
    route: "/products",
    notes: [
      {
        anchor: "#range-preview-heading",
        note: "These packs can't be ordered yet — sizes and prices will follow when ready.",
      },
    ],
  },
  {
    route: "/products/",
    notes: [
      {
        anchor: "#process-heading",
        note: "Grown, gathered by hand, shade dried and milled — six stages in all.",
      },
    ],
  },
  {
    route: "/shop",
    notes: [
      {
        anchor: "#preparation-heading",
        note: "These packs can't be ordered yet — sizes and prices will follow when ready.",
      },
    ],
  },
  {
    route: "/our-story",
    notes: [
      {
        anchor: "#manifesto-heading",
        note: "SVARA Farms starts with the land, not the product — the idea behind every page.",
      },
      {
        anchor: "#meet-svara-heading",
        note: "That's me, a little larger. Press a mood to see how I move.",
      },
    ],
  },
  {
    route: "/field-notes",
    notes: [
      {
        anchor: '[aria-label="Filter field notes by subject"]',
        note: "Filter the notes by subject, or open any one to read it.",
      },
    ],
  },
  {
    route: "/field-notes/",
    notes: [
      {
        anchor: "#note-body",
        note: "A short read — related notes and the next one wait at the end.",
      },
    ],
  },
];

/** The notes for a path: an exact route, else the longest matching "/prefix/". */
export function notesFor(pathname: string): readonly SectionNote[] {
  const exact = MASCOT_NOTES.find((entry) => entry.route === pathname);
  if (exact) return exact.notes;
  const prefix = MASCOT_NOTES.filter(
    (entry) => entry.route.endsWith("/") && entry.route !== "/" && pathname.startsWith(entry.route),
  ).sort((a, b) => b.route.length - a.route.length)[0];
  return prefix?.notes ?? [];
}
