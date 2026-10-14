import Image from "next/image";
import Link from "next/link";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { LeafButton, LeafLink } from "@/components/ui/LeafButton";
import { photos } from "@/content/photos";
import { AVAILABILITY_LABEL } from "@/lib/commerce/availability";
import type { Product } from "@/lib/commerce/types";

/** The leaf in its three forms, as small leaflet-framed thumbnails. */
function IngredientStrip() {
  const dried = photos.leafDriedSprig;
  return (
    <ul className="flex items-center gap-3" aria-label="The leaf, dried leaf and powder">
      <li className="relative grid size-16 place-items-center overflow-hidden leaflet bg-ivory-deep">
        <CutoutImage cutout="moringaLeafBranch" sizes="64px" className="w-[120%] rotate-[-30deg]" />
      </li>
      <li className="relative size-16 overflow-hidden leaflet bg-ivory-deep">
        <Image src={dried.src} alt={dried.alt} fill sizes="64px" className="object-cover" />
      </li>
      <li className="relative grid size-16 place-items-center overflow-hidden leaflet bg-ivory-deep">
        <CutoutImage cutout="powderMound" sizes="64px" className="w-[94%]" />
      </li>
    </ul>
  );
}

interface ProductShowcaseCardProps {
  product: Product;
  headingLevel?: "h2" | "h3";
  preload?: boolean;
}

/**
 * A catalogue card in the product-led language: a gold sun arc rising behind
 * the cream pouch, which stands taller than its card, and the product's own
 * facts beside it. Sizes print as provisional and no price is shown until the
 * catalogue data is confirmed.
 */
export function ProductShowcaseCard({
  product,
  headingLevel = "h3",
  preload = false,
}: ProductShowcaseCardProps) {
  const Heading = headingLevel;
  const href = `/products/${product.slug}`;
  const availability = AVAILABILITY_LABEL[product.variants[0].availability];
  return (
    <article className="showcase-card relative mt-24 grid overflow-visible leaf-plate card-float lg:mt-32 lg:grid-cols-[1.05fr_1fr]">
      <div className="relative h-[19rem] xs:h-[22rem] sm:h-[30rem] lg:h-auto lg:min-h-[34rem]">
        {/* The sun arc: a half disc on the card floor, the pouch rising from it. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden leaf-plate">
          <span
            aria-hidden="true"
            className="showcase-card__sun absolute bottom-[-38%] left-1/2 aspect-square w-[88%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(197_161_90/0.55)_0%,rgb(197_161_90/0.28)_45%,rgb(197_161_90/0.06)_68%,transparent_72%)]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgb(92_120_61/0.14),transparent)]"
          />
        </div>
        <div className="absolute -top-[20%] left-[-6%] w-[46%] sm:w-[36%]" aria-hidden="true">
          <CutoutImage
            cutout="moringaLeafBranch"
            decorative
            sizes="(min-width: 1024px) 18vw, 40vw"
            className="rotate-[34deg]"
          />
        </div>
        <div
          className="showcase-card__pouch absolute inset-x-0 -top-[18%] bottom-[6%] mx-auto"
          data-reveal="fade"
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-[30%] bottom-[0.5%] h-[6%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(24_32_25/0.4),transparent)]"
          />
          <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full">
            <CutoutImage
              cutout="svaraPouch"
              loading={preload ? "eager" : undefined}
              placeholder
              sizes="(min-width: 1024px) 30vw, 70vw"
              className="mx-auto h-full"
              imageClassName="drop-shadow-[0_26px_28px_rgb(24_32_25/0.26)]"
            />
          </Link>
        </div>
        <div className="absolute right-[4%] bottom-[5%] hidden w-[26%] sm:block">
          <CutoutImage cutout="powderMound" decorative sizes="(min-width: 1024px) 14vw, 26vw" />
        </div>
      </div>

      <div className="flex flex-col justify-center gap-6 p-7 sm:p-10 lg:p-14">
        <div className="flex flex-wrap items-center gap-3">
          <span className="seed bg-ivory-deep text-earth-ink">{product.botanicalName}</span>
          <span className="seed bg-forest text-ivory">{availability}</span>
        </div>
        <Heading className="type-h2 text-forest">
          <Link href={href} className="link-quiet">
            {product.name}
          </Link>
        </Heading>
        <p className="max-w-md type-lead text-ink-soft">{product.tagline}</p>
        <dl className="grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl bg-[var(--vein)]">
          {product.variants.map((variant) => (
            <div key={variant.id} className="bg-ivory px-4 py-3">
              <dt className="type-h4 text-forest">{variant.label}</dt>
              <dd className="mt-1 type-small text-ink-soft">
                {variant.isProvisional
                  ? "Size to be confirmed"
                  : AVAILABILITY_LABEL[variant.availability]}
              </dd>
            </div>
          ))}
        </dl>
        <IngredientStrip />
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
          <LeafButton href={href} icon="arrow" size="lg">
            View product
          </LeafButton>
          <LeafLink href="/shop">Visit the shop</LeafLink>
        </div>
      </div>
    </article>
  );
}
