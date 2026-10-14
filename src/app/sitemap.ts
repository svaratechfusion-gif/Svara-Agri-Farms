import type { MetadataRoute } from "next";

import { fieldNotes } from "@/content/field-notes";
import { products } from "@/content/products";
import { primaryNavigation } from "@/content/site";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    ...primaryNavigation.map((item) => item.href),
    ...products.map((product) => `/products/${product.slug}`),
    ...fieldNotes.map((note) => `/field-notes/${note.slug}`),
  ];
  return [...new Set(paths)].map((path) => ({ url: absoluteUrl(path) }));
}
