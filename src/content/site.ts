export interface NavItem {
  label: string;
  href: string;
}

/**
 * The canonical site origin. Set NEXT_PUBLIC_SITE_URL in each environment.
 * On Vercel the project's production domain is used when it is unset. The
 * localhost fallback keeps local builds working without inventing a domain —
 * and while it is in use, `isSiteUrlConfigured` is false and robots.txt asks
 * crawlers not to index the build.
 */
const FALLBACK_SITE_URL = "http://localhost:3000";

function configuredSiteUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : undefined;
}

export const isSiteUrlConfigured = configuredSiteUrl() !== undefined;

function resolveSiteUrl(): string {
  const raw = configuredSiteUrl();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL is not a valid URL: "${raw}"`);
  }
}

export const site = {
  name: "SVARA Farms",
  url: resolveSiteUrl(),
  philosophy: ["Nature.", "Nurture.", "Nourish."],
  description:
    "SVARA Farms is a farm-to-product agricultural brand beginning with Moringa Powder — grown on our farm, gathered by hand, dried in the shade and milled with care.",
  shortDescription: "A journey from leaf to powder.",
  locale: "en_IN",
} as const;

export const primaryNavigation: readonly NavItem[] = [
  { label: "Farm", href: "/farm" },
  { label: "The Journey", href: "/journey" },
  { label: "Products", href: "/products" },
  { label: "Our Story", href: "/our-story" },
  { label: "Field Notes", href: "/field-notes" },
  { label: "Shop", href: "/shop" },
];

/** The desktop header splits the navigation either side of the central seal. */
export const headerNavigation = {
  left: primaryNavigation.slice(0, 2),
  right: primaryNavigation.slice(2),
} as const;

export interface FooterColumn {
  heading: string;
  links: readonly NavItem[];
}

export const footerColumns: readonly FooterColumn[] = [
  {
    heading: "The Farm",
    links: [
      { label: "Farm", href: "/farm" },
      { label: "The Journey", href: "/journey" },
      { label: "Our Story", href: "/our-story" },
    ],
  },
  {
    heading: "Shop",
    links: [
      { label: "Moringa Powder", href: "/products/moringa-powder" },
      { label: "All Products", href: "/products" },
      { label: "Shop", href: "/shop" },
    ],
  },
  {
    heading: "Read",
    links: [{ label: "Field Notes", href: "/field-notes" }],
  },
];
