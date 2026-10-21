# SVARA Agri Farms — website

The production site for SVARA Agri Farms and SVARA Moringa Powder. It is an
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
npm run db:migrate     # apply database migrations (see "Database" below)
npm run commerce:status # what this environment's commerce is set up to do (no secrets)
```

`NEXT_PUBLIC_SITE_URL` is the canonical origin — canonical URLs, Open Graph,
structured data, the sitemap and robots.txt use it (no trailing slash; paths are
added without one). Production builds read it from the committed
`.env.production` (`https://svaraagrifarms.vercel.app`); a Vercel environment
variable of the same name overrides it. Without it the site falls back to
`http://localhost:3000` and robots.txt disallows everything.

## Where things live

| Path                       | What it is                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/`             | All copy and data: `site.ts` (nav, footer), `journey.ts`, `products.ts` (the catalogue), `commerce.ts` (delivery/tax rules), `field-notes.ts`, `photos.ts`                   |
| `src/lib/commerce/`        | Commerce domain: catalogue rules, availability, cart, pricing, delivery details, order requests, order status, payment and notification boundaries; `server/` is server-only |
| `src/server/`              | Server-only: environment validation, database client, schema, migrations, seed, data access                                                                                  |
| `src/lib/motion/`          | The scroll-progress loop (`scrollProgress.ts`) and motion hooks                                                                                                              |
| `src/components/home/`     | The eleven homepage chapters (01 Hero → 11 Closing)                                                                                                                          |
| `src/components/journey/`  | "Follow the Leaf": sticky image stage, stages, progress indicator                                                                                                            |
| `src/components/commerce/` | Gallery, product information, selectors, cart drawer, cart page, delivery form, confirmation                                                                                 |
| `src/components/motion/`   | `MotionRoot` (declarative `data-reveal` / `data-parallax`)                                                                                                                   |
| `src/assets/`              | Official logo and optimised photography (next/image serves AVIF/WebP)                                                                                                        |

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

## The catalogue — `src/content/products.ts`

One file lists every product SVARA sells or is preparing, in display order:
id, slug, name, ingredient, description, pack-shot image, availability, display
order, and its sizes. Every product has a **100 g** and a **250 g** size, each
with its own ID (`<product>-100g`), SKU (`SVARA-<PRODUCT>-100`, derived from the product ID by `skuFor`), net weight,
price and availability. Cards, product pages, the cart, checkout, the order API
and the database seed all read it.

Availability means the same everywhere (`src/lib/commerce/availability.ts`):

| State            | What customers see                                    | Can be added to the cart |
| ---------------- | ----------------------------------------------------- | ------------------------ |
| `available`      | Its price and Add to cart                             | Yes, if it has a price   |
| `coming-soon`    | "Coming soon — ordering opens once its price is set"  | No                       |
| `in-preparation` | "In preparation" — a preview of a pack being prepared | No                       |
| `sold-out`       | "Sold out"                                            | No                       |

A size can be ordered only when the **product** and the **size** are
`available` and the size has a price. To open one, edit `products.ts` only:

```ts
availability: "available",                                          // the product
size("moringa-powder", "MORINGA", 100, { availability: "available", price: inr(249) }),
```

No component needs changing: the product page, the pack cards in the shop
(which grow a size picker and Add to cart by themselves), the cart and the
server all follow. `catalogueRules.ts` refuses a broken catalogue (an available
size without a price, duplicate IDs or SKUs…) and a unit test runs it.

Today (set by the business on 2026-10-17): **all 12 products are `available`**,
every 100 g pouch at **₹250** and every 250 g pouch at **₹350**, from one table,
`STANDARD_PRICES` in `products.ts`. Change a price there (or give one size
its own with `size(…, { price: inr(…) })`) and every page, the cart, checkout
and the server follow. Only Moringa has its own product page; the other packs
sell from their cards in the shop and on /products. The SKUs are placeholders.

## Cart and ordering via WhatsApp (no payment)

Product → choose 100 g / 250 g → Add to cart → `/cart` (review, change
quantities, remove, accept changed prices) → **Proceed to order** → `/order`
(delivery details beside the order summary) → **Place order on WhatsApp** →
WhatsApp opens with the details and the whole order written in → the customer
presses Send → the team confirms the order, delivery and payment in the chat.

- `/order` asks for full name, mobile number, address, city, state and PIN
  code (required) and a landmark and delivery instructions (optional). Rules
  and messages are in `src/lib/commerce/orderDetails.ts`; a mobile number is
  only checked for its form (not verified) and a PIN code's form says nothing
  about delivery. Typed details are kept for the browser session
  (`sessionStorage`), so going back to the cart loses nothing.
- **Order IDs.** Once the details and the cart pass every check, the order
  gets an ID — `SVARA-YYYYMMDD-XXXXXX`, the date in India and six random
  Crockford-base32 characters (`src/lib/commerce/orderId.ts`) — which heads
  the WhatsApp message (`ORDER ID: …`). A failed check makes no ID.
- **Placing the order.** WhatsApp opens with the message; then a fixed copy of
  the order (ID, time, details, lines, totals and the WhatsApp link —
  `src/lib/commerce/submittedOrder.ts`) is kept in `sessionStorage`
  (`svara.submitted-order.v1`), the cart is emptied, and the page is replaced
  by `/order/confirmation` — so Back leads to the (empty) cart, not the form.
- **The confirmation** (`src/components/commerce/OrderConfirmation.tsx`)
  shows that copy, never the cart: the order ID, every line, the totals and
  the delivery details, then **Continue shopping** and **View products**, with
  a small link to open the same WhatsApp message again. A refresh shows the
  same order and ID. The heading and message are constants at the top of the
  file. The site cannot see whether the customer pressed Send in WhatsApp;
  the order exists for the team once the message arrives.
- **Nothing is sent to the website.** The message is built in the browser by
  `src/lib/commerce/whatsappOrder.ts` from the details and the cart **as
  resolved against the catalogue** — names, sizes, quantities, unit prices, line
  totals and subtotal all from `products.ts`, never from what the browser
  stored — and only when the cart can be ordered as it stands: an unavailable
  or withdrawn item, or a changed price not yet accepted, blocks it with a
  message. Every typed value is kept to one line in the message.
- WhatsApp opens in a new tab; nothing is saved, numbered, confirmed or marked
  paid, and the site never says an order was received. The cart is kept. The
  customer can still edit the message in WhatsApp before sending, so the team
  should check prices against the site.
- `/checkout` and `/checkout/confirmation` redirect (307) to `/cart`.
- The cart is kept in this browser's `localStorage`, survives refreshes and
  stays in step across tabs; if storage is blocked it still works for the visit
  and says so. At most 10 of a size per order; an identical add within 0.8 s (a
  double click) adds once.
- SVARA stays away on phones and tablets on `/order` (the keyboard and form
  take the screen). On desktop the order column leaves room for it, and its
  notes wait rather than cover the order summary or the button.
- No analytics is installed, so no events are tracked.

### The order-request endpoint (kept for a future checkout)

`POST /api/order-requests` and the stores below remain, unused by the site
today, for when a payment-backed checkout returns. The server re-prices every
line from the catalogue, re-checks availability, computes unit price ×
quantity = line total and subtotal + delivery + tax = total (`pricing.ts`),
refuses a price the customer was not shown (`409 price-changed`), gives the
request a reference (`SVF-YYMMDD-XXXXXX`) and saves it as `requested`, payment
`not-collected`.

### Delivery, tax and minimum order — `src/content/commerce.ts`

Delivery zones (by PIN-code prefix, with a charge and an optional free-delivery
threshold), a tax rule (rate, added or included in prices) and a minimum order
value. **None is configured.** Until they are, no delivery charge or tax is
calculated (the summary says "To be confirmed" and "Total before delivery",
never ₹0), no PIN code is refused, and no minimum applies. Once set, the cart,
checkout and server all apply them; the server's figures are the ones saved.

### Order statuses — `src/lib/commerce/orderStatus.ts`

```
requested → confirmed → payment-pending → paid → processing → shipped → delivered
              cancelled (before payment)      failed (payment given up)
```

Any other step is refused. `paid` is refused unless a **verified** payment has
already set the payment status to `paid` — so while no payment provider is
connected, orders go no further than `payment-pending`.

### Saving order requests

**Saving is off by default.** With it off, the endpoint answers
`503 not-accepting` and the checkout says requests cannot be received yet.
Choose a store with `ORDER_REQUESTS_STORE`:

| Value      | Where requests go                                                                                                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database` | PostgreSQL at `DATABASE_URL` (any host, including Vercel). Request, lines, customer and first history event are written in **one transaction**; unique indexes refuse a reused submission key or reference across instances. |
| `file`     | JSON files in `$ORDER_REQUESTS_DIR/requests/` (mode 600). One long-running `next start` server only — not serverless.                                                                                                        |
| unset      | Off.                                                                                                                                                                                                                         |

```bash
# Database (run the migrations and seed first — see "Database" below)
ORDER_REQUESTS_STORE=database DATABASE_URL=postgres://… npm run start
```

`database` is used only when `DATABASE_URL` is a valid Postgres URL; otherwise
saving stays off and the reason is logged (never the value). Every server
start logs its set-up, and `npm run commerce:status` prints the same:

```
[commerce] Commerce store: DATABASE — order requests are saved to PostgreSQL (DATABASE_URL).
[commerce] Payment: NOT CONNECTED — order request mode; no payment is taken on the site.
[commerce] Notifications: NONE — nobody is told about new requests automatically.
[commerce] Delivery/tax rules: NOT CONFIGURED — delivery charges and tax are confirmed by the team.
```

Every size in an order must exist in `product_variants` (`npm run db:seed`);
otherwise the save fails, is logged with that hint, and the customer is told it
was not received. Prices and availability are read from `products.ts`, not
from `product_variants`.

### For an admin dashboard (not built yet)

`src/server/dal/orderRequests.ts` already provides what one needs:
`findOrderByReference`, `listOrders` (newest first, by status, in pages of at
most 100) and `changeOrderStatus` (locks the row, applies the lifecycle rules,
records who changed it and why in `order_events`, all in one transaction). An
order holds its reference, customer and delivery details, lines with SKU, size,
quantity and unit price as ordered, subtotal, delivery charge, tax, total,
currency, status, payment status and reference, notes and timestamps. No route
exposes these yet; a dashboard needs authentication first (`admin_users`
exists in the schema).

### Notifications — `src/lib/commerce/notifications.ts`

None is connected and nothing is sent or claimed. The extension point is
`OrderNotifier`; `notificationsFor(status)` already says what each step should
announce (request received → customer and team; confirmed; payment received;
shipped; delivered). Notifications run after a save and never decide whether
an order succeeded; failures are logged.

### Security

- Prices, totals, product and size IDs and quantities are taken from the
  catalogue on the server; anything else the browser sends is ignored or
  refused (tested in `e2e/order-flow.spec.ts`, "cannot be tricked").
- Same-origin JSON only (CSRF), under 16 KB, schema-checked.
- One order per submission key (`Idempotency-Key`), enforced by a unique index.
- **Rate limit:** 5 requests a minute per client, in memory per server
  process. The client is identified by `X-Real-IP` or the last
  `X-Forwarded-For` entry — never the first, which the client can write. A
  server exposed **without** a proxy cannot see client addresses; deploy behind
  one (Vercel, nginx). A multi-instance deploy needs a shared limit at the proxy.
- Logs name the order reference only — never customer details or secrets.

Still required before taking real orders:

- **A database**: `DATABASE_URL`, `npm run db:migrate`, `npm run db:seed`, and
  `ORDER_REQUESTS_STORE=database`.
- **A way for the team to see requests**: a notifier, a dashboard, or someone
  querying the database.
- **Delivery and tax rules** in `src/content/commerce.ts`, once decided.
- **A privacy notice** covering the details collected.

`e2e/order-flow.spec.ts` exercises the whole path (size, add, double click,
quantities, refresh, a price change, validation, review, a failed save, a
double click on Place, confirmation, the saved record, tampered requests, the
rate limit). It runs once a size is orderable and the file store is on, e.g.
`ORDER_REQUESTS_STORE=file ORDER_REQUESTS_DIR=/tmp/svara-orders npm run test:e2e`.

## WhatsApp — the order channel, and help

Customers can reach the team on WhatsApp (`https://wa.me/917780262442`; the
number is in `src/content/contact.ts`). `src/lib/contact/whatsapp.ts` builds
the links and their pre-filled messages, URL-encoded:

- product pages and pack cards — "Ask about this product on WhatsApp", naming
  the product, the chosen size and the quantity;
- `/order` — **Place order on WhatsApp**, the details and whole order written in (see above);
- `/order/confirmation` — the placed order, from this browser session;
- SVARA's panel (the existing floating companion — no second floating button)
  and the footer.

Every message is only suggested text: nothing is sent until the customer
presses Send in WhatsApp.

## Payment — not connected

No payment gateway is configured, and none is simulated: no "paid" state is
ever shown, and Cash on Delivery is not offered. `src/lib/commerce/payment.ts`
defines the boundary a gateway attaches to:

- `PaymentProvider` — `createPayment(order, idempotencyKey)` for a **saved**
  order request's server-computed total, and `verifyWebhook(rawBody, headers)`,
  which returns an event only when its signature is genuine.
- `nextPaymentState(order, event)` — the only way payment state may change:
  `paid` needs a verified event for the same reference and the exact amount;
  `paid` is never undone; failed, cancelled and expired attempts can be retried.
  A browser redirect back to the site is never treated as proof of payment.

To connect one (the business has not chosen a provider yet):

1. Implement `PaymentProvider` with the provider's server SDK or API, and set
   `paymentProvider` to it.
2. Add its credentials as **server-only** environment variables — never
   `NEXT_PUBLIC_*` except a publishable key the provider documents as public.
   For example, Razorpay needs a key ID, a key secret and a webhook secret
   (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`);
   Stripe needs a secret key and a webhook signing secret. Validate them in
   `src/server/env.ts`.
3. The database already has the payment states (`payment_status`) and a
   unique `payment_reference` per order. Add a table of processed provider
   event IDs (unique), so a replayed webhook is processed once.
4. Add a webhook route: read the raw body → `verifyWebhook` (signature) →
   check the amount and the order (`nextPaymentState`) → in one transaction set
   `payment_status`/`payment_reference`, move the order `payment-pending → paid`
   with `changeOrderStatus`, and record the event → answer 2xx only after that
   commit. Then `sendNotifications(..., notificationsFor("paid", order))`.
5. Change the checkout and confirmation copy, which today say no payment is
   collected.

## Database (Neon PostgreSQL + Drizzle)

Order requests can be saved here (`ORDER_REQUESTS_STORE=database`, above).
Prices and availability are still read from `src/content/products.ts`;
moving them to `product_variants` is the next phase.

Editorial content (copy, photos, product descriptions) stays in
`src/content/`. Commercial state — price, availability, stock and order
requests — belongs in PostgreSQL.

| Path                        | What it is                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/server/env.ts`         | Zod-validated server environment (`DATABASE_URL`), checked on first use                                                                            |
| `src/server/db/client.ts`   | `getDb()` — one `pg` pool per server instance, connected on first query                                                                            |
| `src/server/db/schema/`     | Tables, enums and constraints; `rules.ts` mirrors the commerce rules it enforces                                                                   |
| `src/server/db/migrations/` | SQL generated by drizzle-kit. `0001` was rewritten by hand to keep existing rows (see its header; a test upgrades a populated database through it) |
| `src/server/db/seed/`       | Copies the sizes in `products.ts` into `product_variants`                                                                                          |
| `src/server/dal/`           | The only code that queries the database (incl. `orderRequests.ts`, the store)                                                                      |

```bash
cp .env.example .env.local   # then fill in DATABASE_URL (and DATABASE_URL_UNPOOLED)
npm run db:generate          # after changing src/server/db/schema → new SQL migration
npm run db:check             # migration files are consistent
npm run db:migrate           # apply pending migrations to DATABASE_URL(_UNPOOLED)
npm run db:seed              # add every catalogue size; never changes existing rows
```

The seed copies each size as it is: no price stays `null` and `coming-soon`
stays `coming-soon` (the database refuses an `available` size without a
price). It adds no stock. Re-running it adds only new sizes and reports, but
never overwrites, values that differ in the database.

Tests run the generated migrations against an in-process PostgreSQL (PGlite),
so `npm test` needs no database.

## Before launch — business data required

The site does not invent facts. These are placeholders until confirmed:

- **Prices and availability** — set: 100 g ₹250, 250 g ₹350, all 12 products
  available (`STANDARD_PRICES` and `availability` in `products.ts`).
- **SKUs** — `SVARA-[PRODUCT]-100` / `-250` (e.g. `SVARA-RAW-BANANA-250`), the business's pattern, confirmed 2026-10-18; derived from each product ID, never typed by hand.
- **Packaging** — the cream SVARA pouch is the chosen direction and is used
  everywhere (homepage reveal, Products, Shop, product page, gallery, cart).
  Product photographs are the supplied cutout
  (`src/assets/cutouts/svara-moringa-pouch.webp`) on an ivory ground
  (`src/assets/photos/product-pouch-cream*.jpg`). The earlier kraft-pouch
  photographs (`product-pouch.jpg`, `product-ritual.jpg`) remain in the
  folder but are no longer referenced (they print "100% ORGANIC"; do not
  reuse them).
- **Packaging claims review (2026-10-18).** All 12 pack images were retouched
  — the originals are kept outside the repository in
  `PROJECTS/_svarafarms-original-pack-art-2026-10-18/`, with the retouching
  script and plan. Only the pack's own pixels were moved or blended away; no
  lettering was redrawn.
  - **Net weight removed.** Each pack printed one weight ("NET WT. 100 g" on
    the 11 range packs, "NET WT. 250 g" on Moringa) while both sizes are sold
    with the same picture. The pictures are now weight-neutral; the selected
    size is shown beside them.
  - **Claim icons removed:** "100% Natural", "No Additives", "Rich in
    Nutrients" (11 range packs); "Rich in natural nutrients", "Plant based",
    "Sustainably farmed", "No additives" (Moringa). None was supported by
    project material.
  - **Typo fixed:** "NATURAL WE LNESS" → "NATURAL WELLNESS" on Amla and
    Hibiscus Flower, rebuilt from the pack's own letters.
  - **Kept, to review:** the taglines "Pure. Natural. Nourishing." (8 packs),
    "PURE • NATURAL • FARM FRESH" (Moringa) and "NATURAL WELLNESS" (Amla,
    both Hibiscus) — "pure" and "natural" are restricted terms under the FSSAI
    (Advertising and Claims) Regulations, 2018.
  - **Not edited — designer's files needed:** the SVARA seal (the brand mark,
    also the site logo) reads "ORGANIC • HEALTHY • TRUSTED", "100% ORGANIC",
    "HEALTHY LIVING", "FRESH FROM FARMS" and "TRUELY INDIAN" (misspelt; and
    "FRESH PBOM FARMS" on several packs). Its lettering is a few pixels high
    on the packs, so it cannot be corrected cleanly from these images. The
    organic claim needs certification (e.g. NPOP / Jaivik Bharat) or removal
    from the mark.
  - The physical packs must match: the printed net weight belongs on each
    size's own pack, with any claim the business can document.
- **Generated imagery** — the farm hero, the leaf and powder cutouts and
  several photographs are generated illustrations. Use them as
  illustration, never as evidence of a specific farm, facility or process.
  The powder sweep (`powder-swoosh.webp`) shows generic, non-moringa leaves:
  keep it atmospheric (The Green chapter) and never caption it as moringa.
- **Wider range** — the beetroot, carrot, apple, garlic, onion, ginger, neem,
  raw banana, hibiscus leaf, hibiscus flower and amla packs are catalogue
  entries in `products.ts` (pack shots and alt text in `range.ts` /
  `catalogueImages.ts`), all `available` at the standard prices since
  2026-10-17, with no description and no product page. Their pack shots carry
  no net weight or claim icons (see Packaging claims review). Confirm each
  product's sourcing; the site does not describe them as grown on the SVARA
  farm — keep it that way unless that is confirmed.
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
