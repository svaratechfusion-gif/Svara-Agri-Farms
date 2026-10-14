# SVARA Farms — website

The production site for SVARA Farms and SVARA Moringa Powder. It is an
independent codebase, separate from the SVARA TechFusion website.

The visual reference is the Stitch export at
`../Svara Farms/stitch_svara_farms_flagship_experience/` (screens, `DESIGN.md`,
photography and the official logo). That export is reference-only and is never
edited; assets were converted from it into `src/assets/`.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript ·
Tailwind CSS 4 · Vitest · Playwright (no animation library)

## Commands

```bash
npm run dev            # local development
npm run build          # production build (pages prerender; /api/order-requests is dynamic)
npm run verify         # format check → lint → typecheck → unit tests + coverage → build
npm run test:e2e       # Playwright (desktop 1440 + mobile 390), uses system Chrome
```

Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://example.com`) in every deployed
environment. Canonical URLs, Open Graph, the sitemap and structured data use it.
Without it the site falls back to `http://localhost:3000`.

## Where things live

| Path                       | What it is                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/`             | All copy and data: `site.ts` (nav, footer), `journey.ts`, `products.ts`, `field-notes.ts`, `photos.ts` (every image + alt text) |
| `src/lib/commerce/`        | Commerce domain: cart, pricing (`orderLines`), delivery details, order requests, payment boundary; `server/` is server-only     |
| `src/lib/motion/`          | The scroll-progress loop (`scrollProgress.ts`) and motion hooks                                                                 |
| `src/components/home/`     | The eleven homepage chapters (01 Hero → 11 Closing)                                                                             |
| `src/components/journey/`  | "Follow the Leaf": sticky image stage, stages, progress indicator                                                               |
| `src/components/commerce/` | Gallery, product information, selectors, cart drawer, cart page, delivery form, confirmation                                    |
| `src/components/motion/`   | `MotionRoot` (declarative `data-reveal` / `data-parallax`)                                                                      |
| `src/assets/`              | Official logo and optimised photography (next/image serves AVIF/WebP)                                                           |

### Motion

No animation or smooth-scroll library is shipped — scrolling is always native. Motion is CSS, driven by two small mechanisms:

- **Reveals:** `data-reveal="heading | fade | image | stagger"`. `MotionRoot`
  (mounted at the end of each page) marks elements `data-revealed` via
  IntersectionObserver; CSS transitions do the rest. Headings are split into
  lines on the server with `RevealHeading`.
- **Scroll-linked motion:** one rAF-throttled scroll loop writes `--progress`
  (0–1) to registered elements (`useScrollProgress`); CSS turns it into
  transforms and clip-paths (hero, leaf zoom, parallax, transformation).

Hidden-before-reveal states apply only under
`@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`, so
content is visible without JavaScript and with reduced motion.

## Cart and order requests (no payment)

Customers add orderable sizes to the cart (kept in this browser's
`localStorage`), review it on `/cart`, enter delivery details on `/checkout`
and send an **order request**. The server (`POST /api/order-requests`)
re-prices it from `products.ts`, re-checks availability, gives it a reference
(`SVF-YYMMDD-XXXXXX`) and saves it with status `pending-confirmation` and
payment `not-collected`. Only after that save does the customer see the
confirmation and is the cart emptied. No payment is taken or simulated —
`src/lib/commerce/payment.ts` describes where a gateway would attach later.

**Saving is off by default.** With it off, the endpoint answers
`503 not-accepting` and the checkout says requests cannot be received yet.
To switch it on for a long-running `next start` server (a VM or your own
machine):

```bash
ORDER_REQUESTS_STORE=file ORDER_REQUESTS_DIR=/srv/svara/order-requests npm run start
```

Each request is a JSON file in `$ORDER_REQUESTS_DIR/requests/` (mode 600). The
files hold customers' names, phone numbers and addresses: keep the directory
private, backed up and outside the web root (the default `.data/` is
git-ignored).

Still required before taking real orders:

- **A way for the team to see requests.** Nothing notifies anyone yet — no
  email, SMS or dashboard exists. Someone must read the files, or connect a
  notification service.
- **Serverless hosting** (e.g. Vercel) has no lasting disk: implement
  `OrderRequestStore` (`src/lib/commerce/server/orderRequestStore.ts`) with a
  database there instead of the file store.
- **Rate limiting** is per server process, in memory (5 requests/minute per
  client); a multi-instance deploy needs a shared limit at the proxy.
- **Delivery rules** — no PIN-code serviceability, delivery charges or taxes
  are configured; the site shows the product subtotal only and says the team
  will confirm the rest.
- **A privacy notice** covering the delivery details collected.

`e2e/order-flow.spec.ts` exercises the whole path (add, quantities, refresh,
validation, a failed save, a double click, confirmation, the saved file). It
runs once a size is orderable and saving is on, e.g.
`ORDER_REQUESTS_STORE=file ORDER_REQUESTS_DIR=/tmp/svara-orders npm run test:e2e`.

## Before launch — business data required

The site does not invent facts. These are placeholders until confirmed:

- **Prices** — every variant has `price: null` ("Price to be announced"). Set
  amounts in paise in `src/content/products.ts`.
- **Pack sizes** — `100 g` / `250 g` follow the Stitch design and are marked
  `isProvisional: true`.
- **Availability** — currently `coming-soon`.
- **Ordering** — a size can be added to the cart only once it has a price and
  is `available`. Until then Add to cart stays disabled; nothing else to switch.
- **Packaging** — the cream SVARA pouch is the chosen direction and is used
  everywhere (homepage reveal, Products, Shop, product page, gallery, cart).
  Product photographs are the supplied cutout
  (`src/assets/cutouts/svara-moringa-pouch.webp`) placed, unaltered, on an
  ivory ground (`src/assets/photos/product-pouch-cream*.jpg`). The earlier
  kraft-pouch photographs (`product-pouch.jpg`, `product-ritual.jpg`) remain
  in the folder but are no longer referenced. Still to confirm: the final
  print-ready artwork and the sellable SKUs — the artwork prints "NET WT.
  250 g", but the 100 g / 250 g options stay provisional.
- **Packaging claims review** — the cream pouch prints "Rich in natural
  nutrients", "Sustainably farmed", "No additives", "100% Organic" and
  "NET WT. 250 g"; the kraft pouch and the official logo print "100%
  ORGANIC" (the logo also says "TRUELY INDIAN"). None of these is repeated
  in site copy, metadata or structured data. Each needs supporting
  documentation (organic certification included) before it may appear in
  any HTML, product description, ad or schema.
- **Generated imagery** — the farm hero, the leaf and powder cutouts and
  several photographs are generated illustrations. Use them as
  illustration, never as evidence of a specific farm, facility or process.
  The powder sweep (`powder-swoosh.webp`) shows generic, non-moringa leaves:
  keep it atmospheric (The Green chapter) and never caption it as moringa.
- **Wider range (`src/content/range.ts`)** — the beetroot, carrot, apple, garlic,
  onion, ginger, neem, raw banana, hibiscus leaf, hibiscus flower and amla packs
  are shown as a preview only ("In
  preparation"): no product pages, prices, sizes or cart actions. Their packs
  print "100% Natural", "No Additives", "Rich in Nutrients" and "NET WT. 100 g";
  confirm each product, its sourcing and those claims before they become real
  catalogue entries. Do not describe them as grown on the SVARA farm unless that
  is confirmed.
- **Artwork to fix:** the Amla pack's tagline reads "NATURAL WE LNESS" (one L
  missing) and the Hibiscus Flower tagline has a malformed letter in
  "WELLNESS". Both are shown unaltered; replace the artwork before launch.
- **Rejected:** "Moringa Powder Packaging at Svara Farm.png" (Downloads) — the
  foreground pouch carries garbled small print. Not used.
- **Claims** — no certifications, nutrition, health, origin or statistics are
  stated. A unit test (`src/content/__tests__/content.test.ts`) fails if copy
  introduces percentages, temperatures, "organic", "certified" and similar
  without review.

Note: the official logo artwork and the product-pouch photography carry the
words "100% Organic" and "Organic • Healthy • Trusted". Those claims belong to
the supplied assets, not the site copy, and should be backed by certification
before launch.
