import type { Metadata } from "next";

import { IngredientFlowDivider } from "@/components/botanical/IngredientFlowDivider";
import { flowPlacements } from "@/content/ingredientFlows";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { ProductShowcaseCard } from "@/components/commerce/ProductShowcaseCard";
import { RangeGrid } from "@/components/commerce/RangeGrid";
import { PageIntro } from "@/components/page/PageIntro";
import { localProductRepository } from "@/lib/commerce/catalog";
import { buildMetadata } from "@/lib/seo";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { LeafLink } from "@/components/ui/LeafButton";

export const metadata: Metadata = buildMetadata({
  title: "Products",
  description:
    "Products from the SVARA farm, beginning with SVARA Moringa Powder — grown, gathered by hand, shade dried and milled.",
  path: "/products",
  photo: "productPouch",
});

export default async function ProductsPage() {
  const products = await localProductRepository.findAll();
  return (
    <>
      <PageIntro
        label="Products"
        title={[
          "From the farm,",
          <em key="1" className="italic">
            to your shelf.
          </em>,
        ]}
        lead="We make only what we can grow and prepare with care. Our range begins with a single product."
      />

      <section className="pb-[var(--section-space)]" aria-label="Product range">
        <div className="container-page">
          <ol>
            {products.map((product, index) => (
              <li key={product.slug}>
                <SectionHeader
                  index={String(index + 1).padStart(2, "0")}
                  label={product.shortName}
                />
                <ProductShowcaseCard product={product} headingLevel="h2" preload={index === 0} />
              </li>
            ))}
          </ol>
        </div>

        <IngredientFlowDivider
          {...flowPlacements.productsRange}
          className="mt-[clamp(3rem,2rem+3vw,5rem)] mb-[clamp(2.5rem,1.5rem+3vw,4.5rem)]"
        />

        <div className="container-page">
          <div>
            <p className="type-label text-earth-ink">The wider range</p>
            <h2 id="range-preview-heading" className="mt-5 max-w-2xl type-h2 text-forest">
              Also in <em className="italic">preparation.</em>
            </h2>
            <p className="mt-5 max-w-xl type-body text-ink-soft">
              Packs we are preparing. Sizes, prices and availability will be shared when they are
              ready — follow our field notes to hear about them first.
            </p>
            <RangeGrid labelledBy="range-preview-heading" className="mt-12" />
            <LeafLink href="/field-notes" className="mt-8">
              Read the field notes
            </LeafLink>
          </div>
        </div>
      </section>
      <MotionRoot />
    </>
  );
}
