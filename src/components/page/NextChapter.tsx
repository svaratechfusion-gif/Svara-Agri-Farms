import Image from "next/image";
import Link from "next/link";

import { CutoutImage } from "@/components/botanical/CutoutImage";
import { ArrowIcon } from "@/components/ui/icons";
import { leafButtonClasses } from "@/components/ui/leafButtonStyles";
import { photos, type PhotoKey } from "@/content/photos";

interface NextChapterProps {
  label: string;
  title: string;
  href: string;
  description?: string;
  /** Visible text of the leaf button inside the door. */
  action?: string;
  /** The next chapter's own scene. Without it (and without `product`) a quiet row is drawn. */
  photo?: PhotoKey;
  /** Stage the cream pouch on a low sun instead of a photograph. */
  product?: boolean;
}

/** The scene behind the door: the next chapter's photograph, or the pouch on a low sun. */
function DoorScene({ photo, product }: Pick<NextChapterProps, "photo" | "product">) {
  if (product || !photo) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_74%_80%,rgb(232_200_120/0.6),rgb(197_161_90/0.18)_45%,var(--color-forest-deep)_80%)]">
        <div className="next-chapter__subject absolute right-[6%] bottom-[8%] h-[78%] max-sm:right-[-10%] max-sm:h-[62%]">
          <CutoutImage
            cutout="svaraPouch"
            sizes="(min-width: 1024px) 30vw, 60vw"
            className="h-full"
            imageClassName="drop-shadow-[0_26px_28px_rgb(5_14_8/0.5)]"
          />
        </div>
      </div>
    );
  }
  const image = photos[photo];
  return (
    <div className="absolute inset-0" data-parallax="0.12">
      <div className="absolute inset-x-0 -inset-y-[12%]" data-parallax-target="">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(min-width: 1440px) 1360px, 100vw"
          className="next-chapter__subject object-cover"
        />
      </div>
    </div>
  );
}

/**
 * The door to the next chapter. With a scene it is a full-width plate that
 * opens through the leaf mask as it enters and drifts with the scroll, the
 * title set large over it; the whole plate is one link and its leaf button is
 * decorative. Without a scene it is the quiet monograph row.
 */
export function NextChapter({
  label,
  title,
  href,
  description,
  action = "Continue reading",
  photo,
  product = false,
}: NextChapterProps) {
  if (!photo && !product) {
    return (
      <div className="container-page pb-[var(--section-space)]">
        <Link
          href={href}
          className="leaf-btn-host group flex flex-col gap-6 border-y hairline py-10 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            <span className="block type-label text-earth-ink">{label}</span>
            <span className="mt-3 block type-h2 text-forest transition-transform duration-700 ease-[var(--ease-organic)] group-hover:translate-x-1">
              {title}
            </span>
            {description && (
              <span className="mt-3 block max-w-xl type-small text-ink-soft">{description}</span>
            )}
          </span>
          <span aria-hidden="true" className={leafButtonClasses({ variant: "secondary" })}>
            <span className="leaf-btn__label">{action}</span>
            <ArrowIcon className="leaf-btn__icon" />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page pb-[var(--section-space)]">
      <Link
        href={href}
        data-surface="dark"
        data-reveal="leaf"
        className="next-chapter leaf-btn-host group relative isolate flex min-h-[min(78svh,44rem)] items-end overflow-hidden leaf-plate bg-forest-deep text-ivory"
      >
        <span aria-hidden="true" className="absolute inset-0 -z-10">
          <DoorScene photo={photo} product={product} />
          <span className="absolute inset-0 bg-[linear-gradient(90deg,rgb(10_28_18/0.82)_0%,rgb(10_28_18/0.45)_45%,transparent_75%),linear-gradient(0deg,rgb(10_28_18/0.6),transparent_55%)]" />
        </span>
        <span className="relative block max-w-2xl p-7 sm:p-12 lg:p-16">
          <span className="block type-label text-harvest">{label}</span>
          <span className="next-chapter__title mt-4 block type-display text-ivory">{title}</span>
          {description && (
            <span className="mt-5 block max-w-md type-lead text-ivory/85">{description}</span>
          )}
          <span
            aria-hidden="true"
            className={`mt-9 ${leafButtonClasses({ variant: "primary", size: "lg" })}`}
          >
            <span className="leaf-btn__label">{action}</span>
            <ArrowIcon className="leaf-btn__icon" />
          </span>
        </span>
      </Link>
    </div>
  );
}
