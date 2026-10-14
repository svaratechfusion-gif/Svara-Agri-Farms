import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";

import { MascotCompanion } from "@/components/mascot/MascotCompanion";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { CartProvider } from "@/components/commerce/CartProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { site } from "@/content/site";

import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — From the earth. Made with care.`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: { siteName: site.name, locale: site.locale, type: "website" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f3e8",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed top-4 left-4 z-50 -translate-y-24 bg-forest px-5 py-3 type-nav text-ivory focus:translate-y-0"
        >
          Skip to content
        </a>
        <CartProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter />
          <CartDrawer />
          <MascotCompanion />
        </CartProvider>
      </body>
    </html>
  );
}
