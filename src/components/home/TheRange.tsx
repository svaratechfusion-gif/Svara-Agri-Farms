import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { products } from "@/content/products";
import { range } from "@/content/range";
import { buildRoadmap } from "@/lib/commerce/roadmap";

import { ProductRoadmap } from "./ProductRoadmap";

const roadmap = buildRoadmap(products, range);

/**
 * Our products, as a journey rather than a grid: SVARA Moringa Powder opens
 * the route and each pack in preparation follows as its own stop, all read
 * from the catalogue (`lib/commerce/roadmap.ts`).
 */
export function TheRange({ index = "10" }: { index?: string }) {
  return (
    <section aria-labelledby="range-heading" className="bg-ivory section-space">
      <div className="container-page">
        <header className="mx-auto max-w-2xl text-center">
          <SectionHeader index={index} label="Our products" align="center" />
          <RevealHeading
            id="range-heading"
            className="mt-6 type-h1 text-forest"
            lines={[
              "A journey",
              <em key="1" className="text-botanical italic">
                through nature.
              </em>,
            ]}
          />
          <p className="mx-auto mt-6 max-w-md type-lead text-ink-soft">
            Discover the ingredients behind our growing collection.
          </p>
        </header>
        <ProductRoadmap roadmap={roadmap} />
      </div>
    </section>
  );
}
