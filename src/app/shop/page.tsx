import type { Metadata } from "next";

import Image from "next/image";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { ProductPurchase } from "@/components/commerce/ProductPurchase";
import { IngredientFlowDivider } from "@/components/botanical/IngredientFlowDivider";
import { flowPlacements } from "@/content/ingredientFlows";
import { RangeGrid } from "@/components/commerce/RangeGrid";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { PageIntro } from "@/components/page/PageIntro";
import { HandLeafIcon, MillIcon, PouchIcon } from "@/components/ui/processIcons";
import { photos, type PhotoKey } from "@/content/photos";
import { range } from "@/content/range";
import { isPurchasable, localProductRepository } from "@/lib/commerce/catalog";
import { buildMetadata } from "@/lib/seo";
import { MotionRoot } from "@/components/motion/MotionRoot";

export const metadata: Metadata = buildMetadata({
  title: "Shop",
  description: "Shop SVARA Moringa Powder — from our farm, to your home.",
  path: "/shop",
  photo: "productPouch",
});

const DELIVERY_STEPS: readonly {
  title: string;
  body: string;
  photo?: PhotoKey;
  Icon: typeof HandLeafIcon;
}[] = [
  {
    title: "From our farm",
    body: "Grown, gathered by hand and dried in the shade.",
    photo: "stageHarvest",
    Icon: HandLeafIcon,
  },
  {
    title: "Through our process",
    body: "Milled and sealed in a SVARA pouch.",
    photo: "stageMill",
    Icon: MillIcon,
  },
  {
    title: "To your home",
    body: "Send an order request from your cart. Our team confirms availability, delivery charges and payment with you — no payment is taken on this site.",
    Icon: PouchIcon,
  },
];

interface ShopSection {
  id: string;
  label: string;
  count?: number;
}

export default async function ShopPage() {
  const products = await localProductRepository.findAll();
  // Read from the catalogue: a product is orderable once a size has a price and is available.
  const orderable = products.filter((product) => product.variants.some(isPurchasable));
  const firstLabel = orderable.length > 0 ? "Available to order" : "Coming soon";
  const SHOP_SECTIONS: readonly ShopSection[] = [
    { id: "available", label: firstLabel, count: orderable.length || products.length },
    { id: "in-preparation", label: "In preparation", count: range.length },
    { id: "how-it-reaches-you", label: "How it reaches you" },
  ];
  return (
    <>
      <PageIntro
        label="Shop"
        title={[
          "From our farm.",
          <em key="1" className="italic">
            To your home.
          </em>,
        ]}
        lead={
          orderable.length > 0
            ? "Everything we sell is grown and prepared on our farm. Choose a size, add it to your cart, and send us an order request."
            : "Everything we sell is grown and prepared on our farm. Ordering opens for each size once its price and availability are confirmed."
        }
      />
      <nav
        aria-label="Shop sections"
        className="sticky top-[calc(var(--header-height)*0.8)] z-30 border-y hairline bg-ivory"
      >
        <ul className="container-page flex gap-2 overflow-x-auto py-3">
          {SHOP_SECTIONS.map((entry) => (
            <li key={entry.id} className="shrink-0">
              <a href={`#${entry.id}`} className="leaf-chip">
                {entry.label}
                {entry.count !== undefined && <span className="tabular-nums">({entry.count})</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pb-[var(--section-space)]">
        <section
          id="available"
          aria-labelledby="available-heading"
          className="container-page scroll-mt-40 pt-[clamp(3rem,5vw,5rem)]"
        >
          <SectionHeader label={firstLabel} />
          <h2 id="available-heading" className="sr-only">
            {firstLabel}
          </h2>
          {products.map((product, index) => (
            <div key={product.slug} className="mt-12">
              <ProductPurchase product={product} headingLevel="h2" preloadImage={index === 0} />
            </div>
          ))}
        </section>

        <IngredientFlowDivider
          {...flowPlacements.shopPreparation}
          className="mt-[clamp(2rem,1rem+3vw,4rem)]"
        />

        <section
          id="in-preparation"
          aria-labelledby="preparation-heading"
          className="scroll-mt-40 bg-ivory-deep py-[var(--section-space)]"
        >
          <div className="container-page">
            <SectionHeader label="In preparation" />
            <h2 id="preparation-heading" className="mt-5 type-h1 text-forest">
              Coming to the <em className="text-botanical italic">pantry.</em>
            </h2>
            <p className="mt-5 max-w-xl type-body text-ink-soft">
              Packs we are preparing. They cannot be ordered yet — sizes, prices and availability
              will be shared when they are ready.
            </p>
            <RangeGrid labelledBy="preparation-heading" className="mt-14" />
          </div>
        </section>
        <section
          id="how-it-reaches-you"
          aria-labelledby="shop-how"
          className="container-page mt-[var(--section-space)] scroll-mt-40"
        >
          <SectionHeader label="How it reaches you" />
          <h2 id="shop-how" className="mt-5 type-h1 text-forest">
            From our farm, <em className="text-botanical italic">to your home.</em>
          </h2>
          <div className="relative mt-14" data-reveal="stagger">
            <svg
              aria-hidden="true"
              viewBox="0 0 1200 80"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 top-[34%] hidden h-16 w-full md:block"
            >
              <path
                d="M0 46 C 200 10, 380 70, 600 40 S 1000 10, 1200 42"
                pathLength={1}
                data-draw="reveal"
                fill="none"
                stroke="var(--color-botanical)"
                strokeOpacity={0.45}
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
              {DELIVERY_STEPS.map((step, index) => (
                <li key={step.title} className={index === 1 ? "md:mt-20" : undefined}>
                  <div
                    data-reveal="leaf"
                    className={`relative aspect-[4/3] overflow-hidden ${
                      index === 1 ? "leaf-plate-reverse" : "leaf-plate"
                    } ${step.photo ? "bg-forest-deep" : "bg-[radial-gradient(ellipse_at_50%_80%,rgb(232_200_120/0.6),var(--color-forest-deep)_75%)]"}`}
                  >
                    {step.photo ? (
                      <Image
                        src={photos[step.photo].src}
                        alt={photos[step.photo].alt}
                        fill
                        sizes="(min-width: 768px) 30vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-x-0 top-[10%] bottom-[6%] grid place-items-center">
                        <CutoutImage
                          cutout="svaraPouch"
                          decorative
                          sizes="20vw"
                          className="h-full"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full border border-[color:var(--vein)] bg-ivory text-botanical">
                      <step.Icon size={20} />
                    </span>
                    <span className="type-label text-earth-ink">0{index + 1}</span>
                  </div>
                  <h3 className="mt-3 type-h3 text-forest">{step.title}</h3>
                  <p className="mt-1 max-w-xs type-small text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
      <MotionRoot />
    </>
  );
}
