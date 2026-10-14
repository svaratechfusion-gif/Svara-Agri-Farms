import type { MetadataRoute } from "next";

import { isSiteUrlConfigured } from "@/content/site";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Never let a build with localhost canonicals be indexed.
  if (!isSiteUrlConfigured) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // Carts, order requests and the API are per visitor: nothing to index.
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
