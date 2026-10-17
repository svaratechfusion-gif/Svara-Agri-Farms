import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductPurchase } from "@/components/commerce/ProductPurchase";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import { IngredientFlowDivider } from "@/components/botanical/IngredientFlowDivider";
import { flowPlacements } from "@/content/ingredientFlows";
import { RangeGrid, rangeProducts } from "@/components/commerce/RangeGrid";
import { Ingredient } from "@/components/home/Ingredient";
import { ProcessSequence } from "@/components/journey/ProcessSequence";

import { Branch, Branches } from "@/components/botanical/Branches";
import { IngredientDiagram } from "@/components/botanical/IngredientDiagram";
import { RevealHeading } from "@/components/editorial/RevealHeading";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { NextChapter } from "@/components/page/NextChapter";
import { JsonLd } from "@/components/seo/JsonLd";
import { photos } from "@/content/photos";
import { site } from "@/content/site";
import { isPurchasable, localProductRepository } from "@/lib/commerce/catalog";
import type { FeaturedProduct } from "@/lib/commerce/types";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { MotionRoot } from "@/components/motion/MotionRoot";

/** Monograph letters and quiet tags per detail chapter (Stitch 09), by detail id. */
const MONOGRAPH_LETTERS = ["A", "B", "C", "D"] as const;
const DETAIL_TAGS: Record<string, readonly string[]> = {
  ingredient: ["Moringa oleifera", "Grown on our farm"],
  process: ["Hand harvested", "Shade dried", "Milled"],
  pack: ["SVARA mark", "Reseal after opening"],
};

/**
 * Every known slug is prerendered by generateStaticParams, so the page is
 * static; opting out of instant-navigation validation only silences the
 * dev-time insight about reading `params` (see Next.js "Opting out").
 */
export const instant = false;

export async function generateStaticParams() {
  const products = await localProductRepository.findAll();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await localProductRepository.findBySlug(slug);
  if (!product) return {};
  return buildMetadata({
    title: product.name,
    description: product.description,
    path: `/products/${product.slug}`,
    photo: product.gallery[0],
  });
}

function productStructuredData(product: FeaturedProduct) {
  const path = `/products/${product.slug}`;
  const offers = product.variants.flatMap((variant) =>
    variant.price
      ? [
          {
            "@type": "Offer",
            sku: variant.sku,
            price: (variant.price.amountMinor / 100).toFixed(2),
            priceCurrency: variant.price.currency,
            availability: isPurchasable(product, variant)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        ]
      : [],
  );
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.gallery.map((key) => absoluteUrl(photos[key].src.src)),
      brand: { "@type": "Brand", name: site.name },
      url: absoluteUrl(path),
      // Offers are only published once real prices exist.
      ...(offers.length > 0 && { offers }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Products", item: absoluteUrl("/products") },
        { "@type": "ListItem", position: 3, name: product.name, item: absoluteUrl(path) },
      ],
    },
  ];
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const widerOrderable = rangeProducts.some((item) =>
    item.variants.some((variant) => isPurchasable(item, variant)),
  );
  const { slug } = await params;
  const product = await localProductRepository.findBySlug(slug);
  if (!product) notFound();

  return (
    <>
      {productStructuredData(product).map((data) => (
        <JsonLd key={String(data["@type"])} data={data} />
      ))}

      <div className="bg-sun">
        <div className="container-page pt-[calc(var(--header-height)+2.5rem)] pb-[var(--section-space)]">
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex flex-wrap items-baseline justify-between gap-4 py-3"
          >
            <ol className="flex flex-wrap gap-2 type-label text-ink-soft">
              <li>
                <Link href="/" className="link-quiet">
                  Home
                </Link>
                <span aria-hidden="true"> /</span>
              </li>
              <li>
                <Link href="/products" className="link-quiet">
                  Products
                </Link>
                <span aria-hidden="true"> /</span>
              </li>
              <li aria-current="page" className="text-ink">
                {product.shortName}
              </li>
            </ol>
          </nav>
          <ProductPurchase product={product} headingLevel="h1" preloadImage />
        </div>
      </div>

      {product.details.map((detail, index) => {
        const reverse = index % 2 === 1;
        return (
          <section
            key={detail.id}
            aria-labelledby={`detail-${detail.id}`}
            className={`section-space ${reverse ? "" : "bg-ivory-deep"}`}
          >
            <div className="container-page">
              <SectionHeader
                index={String(index + 1).padStart(2, "0")}
                label={`Monograph ${MONOGRAPH_LETTERS[index]} // ${detail.label}`}
              />
              <div className="mt-12 grid-editorial items-center gap-y-10">
                <EditorialImage
                  photo={detail.photo}
                  aspect="4 / 3"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  tags={[
                    { text: detail.label, position: reverse ? "bottom-right" : "bottom-left" },
                  ]}
                  frame={reverse ? "plate-reverse" : "plate"}
                  botanical
                  reveal="leaf"
                  className={`col-span-4 md:col-span-8 lg:col-span-6 ${reverse ? "lg:col-start-7" : ""}`}
                />
                <div
                  className={`col-span-4 md:col-span-8 lg:col-span-5 ${
                    reverse ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-8"
                  }`}
                >
                  <RevealHeading
                    id={`detail-${detail.id}`}
                    className="type-h1 text-forest"
                    lines={[detail.label]}
                  />
                  <p className="mt-3 type-h3 text-ink-soft italic">{detail.title}</p>
                  <p className="mt-6 type-lead" data-reveal="fade">
                    {detail.body}
                  </p>
                  {DETAIL_TAGS[detail.id] && (
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {DETAIL_TAGS[detail.id].map((tag) => (
                        <li
                          key={tag}
                          className="seed border border-[color:var(--vein)] bg-ivory text-ink-soft"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {detail.id === "ingredient" && <IngredientDiagram className="mt-16 lg:mt-20" />}
            </div>
          </section>
        );
      })}

      <Ingredient />

      <section aria-labelledby="how-to-use" className="bg-ivory-deep section-space">
        <div className="container-page">
          <SectionHeader
            index={String(product.details.length + 1).padStart(2, "0")}
            label={`Monograph ${MONOGRAPH_LETTERS[product.details.length]} // How to Use`}
          />
          <div className="mt-12 grid-editorial gap-y-10">
            <div className="col-span-4 md:col-span-8 lg:col-span-5">
              <RevealHeading
                id="how-to-use"
                className="type-h1 text-forest"
                lines={["How to use"]}
              />
              <p className="mt-3 type-h3 text-ink-soft italic">A spoonful, your way.</p>
              <Branches as="ol" className="mt-10 space-y-6" aria-label="Ways to use it">
                {product.howToUse.map((step, index) => (
                  <Branch key={step} as="li" flip={index % 2 === 1}>
                    <span className="block type-label text-earth-ink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1 block type-body">{step}</span>
                  </Branch>
                ))}
              </Branches>
            </div>
            <EditorialImage
              photo="powderMound"
              aspect="4 / 3"
              sizes="(min-width: 1024px) 50vw, 100vw"
              frame="plate"
              botanical
              reveal="leaf"
              className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7"
            />
          </div>
        </div>
      </section>

      <ProcessSequence headingId="process-heading" className="bg-ivory" />

      <IngredientFlowDivider {...flowPlacements.productRelated} />

      <section aria-labelledby="related-heading" className="bg-ivory-deep section-space">
        <div className="container-page">
          <SectionHeader label="The wider range" />
          <h2 id="related-heading" className="mt-5 type-h1 text-forest">
            Also in{" "}
            <em className="text-botanical italic">
              {widerOrderable ? "the range." : "preparation."}
            </em>
          </h2>
          <p className="mt-5 max-w-xl type-body text-ink-soft">
            {widerOrderable
              ? "Each pack comes in the same sizes as this one. Choose a size and add it to your cart right here."
              : "Packs we are preparing. Sizes, prices and availability will be shared when they are ready."}
          </p>
          <RangeGrid labelledBy="related-heading" className="mt-12" />
        </div>
      </section>

      <NextChapter
        label="Where it comes from"
        title="The journey of a leaf"
        description="Grow, harvest, select, shade dry, mill and pack — six stages, from the farm to this pouch."
        href="/journey"
        photo="stageGrow"
        action="Follow the leaf"
      />
      <MotionRoot />
    </>
  );
}
