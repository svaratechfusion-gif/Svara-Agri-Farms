import { cacheLife } from "next/cache";
import Link from "next/link";

import { LeafletMark } from "@/components/botanical/LeafletMark";
import { VeinDivider } from "@/components/botanical/VeinDivider";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";
import { footerColumns, site } from "@/content/site";
import { generalEnquiry } from "@/lib/contact/whatsapp";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

/**
 * The footer as a small plant: the brand block is the root, and the three
 * navigation columns hang from one shared vein, each from its own leaflet.
 */
export function SiteFooter() {
  return (
    <footer
      className="bg-forest-deep text-ivory"
      data-surface="dark"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="container-page grid-editorial gap-y-14 py-20 lg:py-28">
        <div className="col-span-4 md:col-span-8 lg:col-span-5">
          <p className="type-label text-harvest">From the earth. Made with care.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-5"
            aria-label={`${site.name} — home`}
          >
            <Logo size={72} decorative />
            <span className="type-h3 text-ivory">{site.name}</span>
          </Link>
          <p className="mt-8 max-w-sm type-h3 text-ivory/90 italic">{site.shortDescription}</p>
          <p className="mt-6 type-label text-harvest">{site.philosophy.join(" ")}</p>
          <WhatsAppLink tone="light" className="mt-6" message={generalEnquiry()}>
            Chat with us on WhatsApp
          </WhatsAppLink>
        </div>
        {footerColumns.map((column) => (
          <nav
            key={column.heading}
            aria-label={column.heading}
            className="relative col-span-2 border-t border-rule-light pt-6 md:col-span-2 lg:col-span-2 lg:self-start"
          >
            <span aria-hidden="true" className="absolute -top-[0.45rem] left-0 text-harvest">
              <LeafletMark variant="filled" size={16} rotate={-30} />
            </span>
            <p className="type-label text-harvest">{column.heading}</p>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-quiet type-small text-ivory/85 hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <VeinDivider reveal tone="light" className="container-page" />
      <div className="container-page flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="type-label text-ivory/65">
          © <CopyrightYear /> {site.name}
        </p>
        <p className="type-label text-ivory/65">Nature · Nurture · Nourish</p>
        <p className="inline-flex items-center gap-2 self-start rounded-2xl border border-rule-light px-4 py-1.5 type-label text-ivory/65 sm:self-auto sm:rounded-full">
          <span aria-hidden="true" className="text-harvest">
            <LeafletMark variant="filled" size={10} rotate={-30} />
          </span>
          <span>
            Designed &amp; developed by <span className="text-ivory/90">{site.credit}</span>
          </span>
        </p>
      </div>
    </footer>
  );
}
