import Image from "next/image";

import { photos, type PhotoKey } from "@/content/photos";

import { ImageCaption } from "./ImageCaption";
import { ImageTag, type ImageTagPosition } from "./ImageTag";

export interface PlateHeading {
  /** e.g. "Plate 03 — Moringa oleifera" */
  label: string;
  /** A quiet right-hand note, e.g. "Leaflet, at first light" */
  meta?: string;
}

/**
 * `plain` (fine corners) · `matted` (parchment mount) · botanical shapes:
 * `plate` / `plate-reverse` (leaf plate), `plate-sm`, `leaflet`.
 */
export type ImageFrame = "plain" | "matted" | "plate" | "plate-reverse" | "plate-sm" | "leaflet";

const SHAPE: Partial<Record<ImageFrame, string>> = {
  plate: "leaf-plate",
  "plate-reverse": "leaf-plate-reverse",
  "plate-sm": "leaf-plate-sm",
  leaflet: "leaflet",
};

export interface ImageTagSpec {
  text: string;
  position: ImageTagPosition;
  tone?: "light" | "forest";
}

interface EditorialImageProps {
  photo: PhotoKey;
  /** CSS aspect-ratio, e.g. "4 / 5". Omit to use the photo's natural ratio. */
  aspect?: string;
  sizes: string;
  caption?: string;
  figureLabel?: string;
  /** `true` unveils from below; `"leaf"` opens through an organic leaf mask. */
  reveal?: boolean | "leaf";
  parallax?: number;
  preload?: boolean;
  className?: string;
  imageClassName?: string;
  /** Override the registry alt text when the context needs it. */
  alt?: string;
  /**
   * `matted` sets the photograph on a parchment mount, like a specimen plate
   * in the Stitch references; an optional `plate` heading runs across the top.
   */
  frame?: ImageFrame;
  /** Add the offset hairline plate (botanical frame) behind the photograph. */
  botanical?: boolean;
  plate?: PlateHeading;
  /** Small labels pinned to the photograph's corners. */
  tags?: readonly ImageTagSpec[];
}

/**
 * The photographic building block of the site: a framed, responsive image
 * with optional figure caption, unveil, parallax, plate mount and corner
 * tags. Dimensions always come from the source, so there is no layout shift.
 */
export function EditorialImage({
  photo,
  aspect,
  sizes,
  caption,
  figureLabel,
  reveal = true,
  parallax,
  preload = false,
  className = "",
  imageClassName = "",
  alt,
  frame = "plain",
  plate,
  tags,
  botanical = false,
}: EditorialImageProps) {
  const { src, alt: defaultAlt } = photos[photo];
  const ratio = aspect ?? `${src.width} / ${src.height}`;
  const hasParallax = parallax !== undefined;

  const media = (
    <div
      className="media-frame w-full"
      style={{ aspectRatio: ratio }}
      data-reveal={reveal === "leaf" ? "leaf" : reveal ? "image" : undefined}
      data-parallax={hasParallax ? parallax : undefined}
    >
      <div
        className={`absolute inset-x-0 ${hasParallax ? "-inset-y-[12%]" : "inset-y-0"}`}
        data-parallax-target={hasParallax ? "" : undefined}
      >
        <Image
          src={src}
          alt={alt ?? defaultAlt}
          fill
          sizes={sizes}
          preload={preload}
          placeholder="blur"
          className={`object-cover ${imageClassName}`}
        />
      </div>
      {tags?.map((tag) => (
        <ImageTag key={tag.text} position={tag.position} tone={tag.tone}>
          {tag.text}
        </ImageTag>
      ))}
    </div>
  );

  const mounted =
    frame === "matted" ? (
      <div className="bg-parchment/70 p-3 sm:p-4">
        {plate && (
          <div className="mb-3 flex items-baseline justify-between gap-4 px-1 sm:mb-4">
            <span className="type-label text-forest">{plate.label}</span>
            {plate.meta && (
              <span className="hidden type-label text-ink-soft sm:inline">{plate.meta}</span>
            )}
          </div>
        )}
        {media}
      </div>
    ) : SHAPE[frame] ? (
      <div className={`${SHAPE[frame]} ${botanical ? "botanical-frame" : ""}`}>{media}</div>
    ) : (
      media
    );

  if (!caption && !figureLabel) {
    return <div className={className}>{mounted}</div>;
  }

  return (
    <figure className={className}>
      {mounted}
      <ImageCaption label={figureLabel} caption={caption} />
    </figure>
  );
}
