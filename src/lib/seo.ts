import type { Metadata } from "next";

import { photos, type PhotoKey } from "@/content/photos";
import { site } from "@/content/site";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  photo?: PhotoKey;
  type?: "website" | "article";
}

/** Consistent per-page metadata: canonical URL, Open Graph and X cards. */
export function buildMetadata({
  title,
  description,
  path,
  photo = "farmRowsDawn",
  type = "website",
}: PageMetadataInput): Metadata {
  const image = photos[photo];
  const images = [
    { url: image.src.src, width: image.src.width, height: image.src.height, alt: image.alt },
  ];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      title,
      description,
      url: path,
      siteName: site.name,
      locale: site.locale,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((entry) => entry.url),
    },
  };
}

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
