# Analytics — Google Analytics 4 (gtag.js) + Google Tag Manager

```
SVARA Agri Farms (Next.js)
        │  track…() → window.dataLayer.push({ event, … })
        ├──────────────► gtag("event", …) ──► Google Analytics 4   G-7X6NW0X8MJ
        │                                       (page views: GA4's own)
        └──────────────► Google Tag Manager   GTM-5PKWRX73
                         (loaded for other tags; must NOT also send to G-7X6NW0X8MJ)
```

| What               | Value                    | Where it is set                           |
| ------------------ | ------------------------ | ----------------------------------------- |
| GA4 measurement ID | `G-7X6NW0X8MJ`           | `NEXT_PUBLIC_GA4_ID` in `.env.production` |
| GTM container ID   | `GTM-5PKWRX73`           | `NEXT_PUBLIC_GTM_ID` in `.env.production` |
| Primary conversion | `whatsapp_order_started` | GA4 key event (see below)                 |

Both IDs are public identifiers, not secrets. No API keys or credentials are
involved. (`G-WEWVE2HTJG`, the measurement ID first planned for setup inside
GTM, is no longer used by the site.)

## How GA4 is installed

GA4 is installed with Google's `gtag.js` snippet for `G-7X6NW0X8MJ`; GTM is
installed alongside it.

- `src/components/analytics/GoogleAnalytics.tsx` — the gtag.js snippet, in
  `<head>` of the root layout. It runs while the HTML is parsed, so `gtag()`
  exists before hydration and nothing from the first render is lost; gtag.js
  itself loads async and never blocks rendering.
- `src/components/analytics/GoogleTagManager.tsx` — Google's GTM snippet
  (`next/script`, after hydration) plus the `<noscript>` iframe first in
  `<body>`. The container currently has no GA4 tags, and **must not get a
  Google tag or GA4 event tag for `G-7X6NW0X8MJ`**: gtag.js already sends to
  it, so every event would count twice.
- Neither is loaded on **`localhost` / `127.0.0.1`**, so local builds and the
  e2e suite never reach GA4. Events are still pushed to `window.dataLayer`
  there, which is what the tests check. Vercel deployments (production and
  previews) load both.
- With `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_GTM_ID` unset (e.g. `next dev`)
  that part is off; a malformed ID fails the build with a clear message.
- Nothing visible is added, so there is no layout shift.

### Page views: GA4's own, counted once

`gtag('config', …)` sends the first `page_view`, and GA4's enhanced
measurement (_Page changes based on browser history events_, on by default)
sends one on every client-side navigation, with the new page's title. The
site's own `page_view` push stays in the dataLayer for GTM but is **not** sent
to GA4 (`COLLECTED_BY_GTAG` in `dataLayer.ts`) — otherwise each page would
count twice. **Leave the history-based page-view setting on** in GA4.

Every other event goes to both: pushed to the dataLayer, and sent to GA4 with
`gtag("event", name, parameters)` — for ecommerce events, `currency`, `value`
and `items` as parameters.

## dataLayer architecture

Components never touch `window.dataLayer` directly. They call one named
function per event from `src/lib/analytics/events.ts`:

| File                             | Role                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/lib/analytics/dataLayer.ts` | `pushToDataLayer()` / `pushEcommerceEvent()` — the only writers; also send each event to GA4 via `gtag()` |
| `src/lib/analytics/ecommerce.ts` | GA4 `items` built from the product catalogue (`content/products.ts`)                                      |
| `src/lib/analytics/events.ts`    | `trackViewItem`, `trackAddToCart`, `trackWhatsAppOrderStarted`, …                                         |
| `src/lib/analytics/config.ts`    | GA4 and GTM IDs from the environment; local-host rule                                                     |
| `src/components/analytics/*`     | gtag.js snippet, GTM snippet, `PageViewTracker`                                                           |

Every ecommerce push is preceded by `{ ecommerce: null }` (Google's
recommended pattern), because GTM merges successive pushes and one event's
items must not leak into the next.

Product names, sizes and prices are **never written in analytics code**: they
are read from the catalogue, so a price change there is reflected
automatically. Prices are sent in rupees (catalogue paise ÷ 100), currency
`INR`.

## Events

| Event                    | When                                                                                                                                          | Where in code                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `page_view`              | First load and every client-side navigation — once per page. **GA4 gets its own** (above); the site's push is for GTM                         | `PageViewTracker` (root layout)                 |
| `view_item`              | Right after a product page's `page_view`, on every visit (with the size it opens on: the first orderable, 100 g today)                        | `PageViewTracker` (via `createPageViewTracker`) |
| `select_item`            | The customer chooses a size (product page or a card in the range)                                                                             | `PurchaseControls`                              |
| `add_to_cart`            | Add to cart / Buy now, or a quantity increase in the cart                                                                                     | `CartProvider`                                  |
| `remove_from_cart`       | Remove, or a quantity decrease in the cart                                                                                                    | `CartProvider`                                  |
| `view_cart`              | Right after the `/cart` page's `page_view`, on every visit, if the cart has something in it (quantity edits there are cart events, not views) | `PageViewTracker` (via `createPageViewTracker`) |
| `whatsapp_order_started` | **Primary conversion.** A valid order is handed to WhatsApp ("Place order on WhatsApp")                                                       | `OrderView`                                     |
| `mascot_whatsapp_click`  | The WhatsApp link in SVARA's panel or in a SVARA chat reply is clicked                                                                        | `MascotCompanion`, `MascotChat`                 |

Not tracked on purpose: SVARA's animations, moods, blinks, hover and
movement; the cart drawer opening (it opens automatically on every add); the
footer and product "Ask on WhatsApp" enquiry links (questions, not orders).

### page_view

```js
{ event: "page_view", page_location: "https://…/products", page_path: "/products", page_title: "Products — SVARA Agri Farms" }
```

The site's own push (dataLayer only — GA4 counts page views itself, as
above). Counted once per page: a repeat for the page just counted (React Strict Mode,
a remount, a re-render) is ignored; a real navigation or a fresh load pushes
another. After a client-side navigation Next.js sets the new title a moment
after the URL changes, so the push waits for it (at most 1 s) to report the
right `page_title`. Changes to the query string or `#hash` alone are not page
views.

A product page's `page_view` is followed by its `view_item`, and the cart
page's by `view_cart` (read from the cart saved on the device). They come
from the page-view tracker rather than the pages themselves, because Next.js
may keep a visited page mounted in the background: a return visit is a new
page view, so it is a new `view_item` / `view_cart` too.

### Ecommerce events

`view_item`, `select_item`, `add_to_cart`, `remove_from_cart`, `view_cart`:

```js
{ ecommerce: null }                       // clear the previous one
{
  event: "add_to_cart",
  ecommerce: {
    currency: "INR",
    value: 700,                           // Σ price × quantity, rupees
    items: [{
      item_id: "moringa-powder",          // product ID
      item_name: "SVARA Moringa Powder",
      item_category: "Moringa leaf",      // the catalogue's ingredient (it has no categories)
      item_variant: "250 g",              // pack size
      price: 350,                         // unit price, rupees
      quantity: 2,
      currency: "INR"
    }]
  }
}
```

`select_item` also carries `item_list_name` (`"Product page"` or
`"Product range"`), on `ecommerce` and on the item.

### whatsapp_order_started — the conversion

```js
{ ecommerce: null }
{
  event: "whatsapp_order_started",
  item_count: 2,                          // distinct product/size lines
  total_quantity: 3,                      // packs in total
  cart_value: 950,                        // rupees, before delivery
  currency: "INR",
  product_ids: "moringa-powder,ginger-powder",
  product_names: "SVARA Moringa Powder,Ginger Powder",
  selected_sizes: "250 g,100 g",          // in the same order as product_ids
  ecommerce: { currency: "INR", value: 950, items: [ … ] }
}
```

**Definition:** fired when the customer presses _Place order on WhatsApp_,
the details pass validation and WhatsApp is opened with the order. It means
an order was **started**, not completed — the customer still has to press
Send in WhatsApp, and the team confirms availability, delivery and payment in
the chat. There is no online payment, so the site never sends `purchase`,
`order_completed` or `payment_success`. `value` is the cart value before
delivery, not revenue.

**No personal data:** the function receives only the order lines (product,
size, quantity), so the customer's name, mobile number, address, city, state,
PIN, landmark, delivery instructions and the WhatsApp message text cannot
reach GA4. The order ID is not sent either. A unit test and an e2e test check
this.

GA4 custom parameter values are cut at 100 characters, so for a very large
order `product_names` may be truncated in reports; the full detail is in
`items`.

### mascot_whatsapp_click

```js
{ event: "mascot_whatsapp_click", mascot_location: "panel" | "chat_reply", page_path: "/journey" }
```

## GA4 property setup (`G-7X6NW0X8MJ`)

The code sends everything once deployed; these make it useful in reports.

- **Keep** Admin → Data streams → the web stream → Enhanced measurement ⚙ →
  Page views → _Page changes based on browser history events_ **on**: it is
  how in-site navigation is counted.
- **Key event:** Admin → Key events → _New key event_ → `whatsapp_order_started`.
  Do **not** mark `add_to_cart` or anything else as a purchase, and do not
  create `purchase`, `order_completed` or `payment_success`.
- **Custom definitions** (Admin → Custom definitions), to see the parameters
  in reports: event-scoped custom dimensions `product_ids`, `product_names`,
  `selected_sizes`, `mascot_location`; custom metrics `item_count`,
  `total_quantity` (Standard) and `cart_value` (Currency). `currency` and
  `value` are standard GA4 fields and need no definition. Never create
  definitions for customer details — they are never sent.
- Recommended: Admin → Data streams → _Configure tag settings_ → _Define
  internal traffic_ for the team's office IP, then activate the _Internal
  Traffic_ data filter, so the team's own testing is excluded.

**GTM (`GTM-5PKWRX73`):** add no GA4 tags for `G-7X6NW0X8MJ`. If GA4 is ever
moved into GTM instead, remove the gtag.js snippet (`NEXT_PUBLIC_GA4_ID`) in
the same release.

### Also collected by GA4 automatically

Enhanced measurement adds `scroll`, `click` (outbound links — e.g. the footer
and SVARA WhatsApp links, whose URLs carry only the generic pre-filled
question), `form_start` (the order form's ID and field count — never field
values) and, if switched on, site search and file downloads. The WhatsApp
**order** is opened without a link on the page, so its URL — which holds the
customer's details — is never collected as a click; a test run confirmed no
name, phone number, address, PIN or order ID in any GA4 request.

## How to test

### Locally

```bash
npm run test -- src/lib/analytics          # unit tests: items, values, gtag calls, no PII, page-view dedupe
npx playwright test e2e/analytics.spec.ts  # the funnel's dataLayer pushes, desktop + mobile
```

In a browser on `next start`, type `dataLayer` in the console after each step
to see the pushes (gtag.js and GTM are not loaded on localhost).

### 1. Tag Assistant — after the code is deployed

1. Open [tagassistant.google.com](https://tagassistant.google.com), _Add
   domain_ → `https://svaraagrifarms.vercel.app` → _Connect_.
2. The site opens connected. In Tag Assistant, choose the **G-7X6NW0X8MJ**
   tag and browse:
   - each page (including links clicked within the site): **one** `page_view`
   - Moringa product page: `view_item`; choose 250 g: `select_item`
   - Add to cart: `add_to_cart` with `currency`, `value` and `items`
   - `/cart`: `view_cart`; a quantity change: `add_to_cart` / `remove_from_cart`
   - order details → _Place order on WhatsApp_: `whatsapp_order_started`
     (you need not send the WhatsApp message)
   - SVARA → _Chat with our team on WhatsApp_: `mascot_whatsapp_click`
3. Open `whatsapp_order_started` → parameters: the order summary only; no
   name, phone or address.

### 2. GA4 Realtime

Reports → Realtime (live within seconds). Use the site in another window:
_Event count by Event name_ should show `page_view`, `view_item`,
`add_to_cart`, `view_cart`, `whatsapp_order_started`. Key events appear in the
_Key events_ card once marked.

### 3. GA4 DebugView

Admin → DebugView. Sessions connected through Tag Assistant are sent in debug
mode, so they appear here with each event on a timeline. Click an event to see
its parameters and items. Confirm one `page_view` per page (not two) and the
`whatsapp_order_started` parameters.

## Adding Google Ads conversion tracking later

Use the same event — never a `purchase`:

1. In GTM, add a **Conversion Linker** tag on _All Pages_ (Google Ads tags in
   GTM are fine — only GA4 tags would duplicate).
2. Add a **Google Ads Conversion Tracking** tag with the conversion ID and
   label from Google Ads, _Conversion value_ a Data Layer Variable for
   `cart_value`,
   _Currency code_ `INR`, triggered by a _Custom Event_ trigger for
   `whatsapp_order_started` only.
3. Alternatively link Google Ads to GA4 and import the
   `whatsapp_order_started` key event as the conversion — no new tag needed.
4. Name the Ads conversion something like _WhatsApp order started_, and do not
   switch on enhanced conversions: they rely on customer contact details,
   which this site deliberately never sends.

No site code changes are needed for either route.
