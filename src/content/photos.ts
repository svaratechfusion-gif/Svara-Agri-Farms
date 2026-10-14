import type { StaticImageData } from "next/image";

import farmRowsDawn from "@/assets/photos/farm-rows-dawn.jpg";
import farmHarvestValley from "@/assets/photos/farm-harvest-valley.jpg";
import farmRowsCanopy from "@/assets/photos/farm-rows-canopy.jpg";
import farmYoungTrees from "@/assets/photos/farm-young-trees.jpg";
import farmGoldenHour from "@/assets/photos/farm-golden-hour.jpg";
import farmRuralLandscape from "@/assets/photos/farm-rural-landscape.jpg";
import farmPathBasket from "@/assets/photos/farm-path-basket.jpg";
import farmersPortrait from "@/assets/photos/farmers-portrait.jpg";
import handsHarvestBasket from "@/assets/photos/hands-harvest-basket.jpg";
import harvestersField from "@/assets/photos/harvesters-field.jpg";
import sortingLeaves from "@/assets/photos/sorting-leaves.jpg";
import shadePavilion from "@/assets/photos/shade-pavilion.jpg";
import shadeMeshTrays from "@/assets/photos/shade-mesh-trays.jpg";
import shadeDryingRacks from "@/assets/photos/shade-drying-racks.jpg";
import moringaBranch from "@/assets/photos/moringa-branch.jpg";
import leafletsFlowers from "@/assets/photos/leaflets-flowers.jpg";
import leafMacroLight from "@/assets/photos/leaf-macro-light.jpg";
import leafMacroDew from "@/assets/photos/leaf-macro-dew.jpg";
import leafDriedSprig from "@/assets/photos/leaf-dried-sprig.jpg";
import leafDriedScatter from "@/assets/photos/leaf-dried-scatter.jpg";
import powderMacro from "@/assets/photos/powder-macro.jpg";
import productPouch from "@/assets/photos/product-pouch-cream.jpg";
import productPouchWide from "@/assets/photos/product-pouch-cream-wide.jpg";
import powderMound from "@/assets/photos/powder-mound-ivory.jpg";
import herbariumNotebook from "@/assets/photos/herbarium-notebook.jpg";
import leafBranchSunlit from "@/assets/photos/leaf-branch-sunlit.jpg";
import harvestRows from "@/assets/photos/harvest-rows.jpg";
import shadeVeranda from "@/assets/photos/shade-veranda.jpg";
import stageGrow from "@/assets/photos/stage-grow.jpg";
import stageHarvest from "@/assets/photos/stage-harvest.jpg";
import stageSelect from "@/assets/photos/stage-select.jpg";
import stageShade from "@/assets/photos/stage-shade.jpg";
import stageMill from "@/assets/photos/stage-mill.jpg";
import farmPlantationAerial from "@/assets/photos/farm-plantation-aerial.jpg";
import driedBotanicals from "@/assets/photos/dried-botanicals.jpg";

export interface Photo {
  src: StaticImageData;
  alt: string;
}

/**
 * Single registry for every photograph on the site. Components reference
 * photos by key so imagery and alt text stay consistent across pages.
 */
export const photos = {
  farmHarvestValley: {
    src: farmHarvestValley,
    alt: "Harvesters gathering leaves into woven baskets among young moringa trees, a mountain valley behind them at sunrise.",
  },
  farmRowsDawn: {
    src: farmRowsDawn,
    alt: "Long rows of young moringa trees in red soil, stretching towards misty hills at first light.",
  },
  farmRowsCanopy: {
    src: farmRowsCanopy,
    alt: "Dense green moringa canopy in neat rows across the farm under soft morning sun.",
  },
  farmYoungTrees: {
    src: farmYoungTrees,
    alt: "Young moringa trees growing along a red earth path, with a farmer walking in the distance.",
  },
  farmGoldenHour: {
    src: farmGoldenHour,
    alt: "A farmer standing among moringa trees at golden hour, the sun low over distant hills.",
  },
  farmRuralLandscape: {
    src: farmRuralLandscape,
    alt: "A wide view of moringa rows on the farm, hills and scattered trees on the horizon.",
  },
  farmPathBasket: {
    src: farmPathBasket,
    alt: "A woman carrying a basket on her head along a path between tall moringa trees.",
  },
  farmersPortrait: {
    src: farmersPortrait,
    alt: "Two farmers standing together among moringa trees in warm evening light.",
  },
  handsHarvestBasket: {
    src: handsHarvestBasket,
    alt: "A farmer's hands plucking moringa leaves into a woven bamboo basket.",
  },
  harvestersField: {
    src: harvestersField,
    alt: "Two harvesters gathering moringa leaves into baskets beneath the trees.",
  },
  sortingLeaves: {
    src: sortingLeaves,
    alt: "A woman sorting freshly harvested moringa leaves by hand on a cloth-covered table.",
  },
  shadePavilion: {
    src: shadePavilion,
    alt: "Inside an airy wooden pavilion, moringa leaves spread across tiers of drying racks in the shade.",
  },
  shadeMeshTrays: {
    src: shadeMeshTrays,
    alt: "A woman tending moringa leaves spread on shaded drying trays inside a ventilated shelter.",
  },
  shadeDryingRacks: {
    src: shadeDryingRacks,
    alt: "Wooden drying racks filled with moringa leaves inside a shaded, open-sided pavilion.",
  },
  moringaBranch: {
    src: moringaBranch,
    alt: "A young moringa branch with fine leaflets and small cream blossoms against a pale lime-washed wall.",
  },
  leafletsFlowers: {
    src: leafletsFlowers,
    alt: "Delicate moringa leaflets and blossoms resting on undyed linen.",
  },
  leafMacroLight: {
    src: leafMacroLight,
    alt: "Close detail of tender moringa leaflets, backlit and translucent.",
  },
  leafMacroDew: {
    src: leafMacroDew,
    alt: "Macro view of fresh moringa leaflets with drops of morning dew on linen.",
  },
  leafDriedSprig: {
    src: leafDriedSprig,
    alt: "A single sprig of shade-dried moringa leaves laid flat on linen.",
  },
  leafDriedScatter: {
    src: leafDriedScatter,
    alt: "Shade-dried moringa leaflets scattered on linen beside a handwritten label.",
  },
  powderMacro: {
    src: powderMacro,
    alt: "A mound of fine green moringa powder on dark stone with a copper spoon.",
  },
  /**
   * The SVARA pouch (cream packaging — the chosen direction). The supplied
   * artwork is unaltered, placed on a warm ivory ground with a contact shadow.
   * Its printed claims are not repeated in site copy (README → Before launch).
   */
  productPouch: {
    src: productPouch,
    alt: "The SVARA Moringa Leaf Powder pouch, cream with the circular SVARA seal, beside a wooden bowl of green powder and fresh moringa leaves.",
  },
  productPouchWide: {
    src: productPouchWide,
    alt: "The SVARA Moringa Leaf Powder pouch, cream with the circular SVARA seal, beside a wooden bowl of green powder and fresh moringa leaves.",
  },
  powderMound: {
    src: powderMound,
    alt: "A soft mound of fine green moringa powder on a pale ground.",
  },
  leafBranchSunlit: {
    src: leafBranchSunlit,
    alt: "Fresh moringa leaflets on a branch, lit from behind by a low sun over the hills.",
  },
  harvestRows: {
    src: harvestRows,
    alt: "Harvesters picking moringa leaves between the rows in early sunlight, baskets at their feet.",
  },
  shadeVeranda: {
    src: shadeVeranda,
    alt: "Rows of woven trays of moringa leaves along a shaded bamboo veranda, hills beyond.",
  },
  stageGrow: {
    src: stageGrow,
    alt: "Young moringa trees in rows of red earth, hills and a low sun on the horizon.",
  },
  stageHarvest: {
    src: stageHarvest,
    alt: "Hands plucking moringa leaves from a branch into woven baskets.",
  },
  stageSelect: {
    src: stageSelect,
    alt: "Hands sorting fresh moringa leaves on a cloth beside woven baskets.",
  },
  stageShade: {
    src: stageShade,
    alt: "Round woven trays of moringa leaves under the roof of an open-sided drying shelter.",
  },
  stageMill: {
    src: stageMill,
    alt: "Dried moringa leaves above a stone mill, fine green powder falling into a wooden bowl.",
  },
  farmPlantationAerial: {
    src: farmPlantationAerial,
    alt: "Rows of moringa across red earth seen from above, with misty hills behind.",
  },
  herbariumNotebook: {
    src: herbariumNotebook,
    alt: "An open field notebook with pressed botanical drawings and notes on a wooden desk.",
  },
  driedBotanicals: {
    src: driedBotanicals,
    alt: "Raw dried seed pods and roots arranged on pale stone.",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
