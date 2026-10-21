import { findProductSync, isPurchasable } from "@/lib/commerce/catalog";
import type { Cart } from "@/lib/commerce/types";

import { pushEcommerceEvent, pushToDataLayer } from "./dataLayer";
import { analyticsItem, analyticsItems, ecommerceFor, type ItemChoice } from "./ecommerce";

/**
 * Every analytics event the site sends, as named functions. They push to the
 * GTM dataLayer only and never carry anything about the customer: no name,
 * phone number, address, delivery notes or WhatsApp message text.
 *
 * The funnel: page_view → view_item → select_item (size) → add_to_cart →
 * view_cart → whatsapp_order_started. Opening WhatsApp is not a completed
 * order, and there is no online payment, so nothing here is a `purchase`.
 */

function pushItemEvent(event: string, choice: ItemChoice, listName?: string): void {
  if (choice.quantity <= 0) return;
  const item = analyticsItem(choice);
  if (!item) return;
  const listed = listName ? { ...item, item_list_name: listName } : item;
  const ecommerce = ecommerceFor([item]);
  pushEcommerceEvent(event, {
    ...ecommerce,
    ...(listName && { item_list_name: listName }),
    items: [listed],
  });
}

/** The product page was shown, with the size it opens on. */
export function trackViewItem(productSlug: string, variantId: string): void {
  pushItemEvent("view_item", { productSlug, variantId, quantity: 1 });
}

const PRODUCT_PAGE_PATH = /^\/products\/([^/]+)\/?$/;

/**
 * The product whose own page is at this path, with the size its purchase
 * controls open on (the first that can be ordered, as `PurchaseControls`).
 */
function productPageAt(pathname: string): { productSlug: string; variantId: string } | null {
  const slug = PRODUCT_PAGE_PATH.exec(pathname)?.[1];
  const product = slug ? findProductSync(slug) : null;
  if (!product?.hasProductPage) return null;
  const opening =
    product.variants.find((variant) => isPurchasable(product, variant)) ?? product.variants[0];
  return opening ? { productSlug: product.slug, variantId: opening.id } : null;
}

/** The customer chose a size (`listName`: where, e.g. "Product page"). */
export function trackSelectItem(
  productSlug: string,
  variantId: string,
  quantity: number,
  listName: string,
): void {
  pushItemEvent("select_item", { productSlug, variantId, quantity }, listName);
}

export function trackAddToCart(productSlug: string, variantId: string, quantity: number): void {
  pushItemEvent("add_to_cart", { productSlug, variantId, quantity });
}

export function trackRemoveFromCart(
  productSlug: string,
  variantId: string,
  quantity: number,
): void {
  pushItemEvent("remove_from_cart", { productSlug, variantId, quantity });
}

/** The cart page was shown with something in it. */
export function trackViewCart(cart: Cart): void {
  const items = analyticsItems(cart.lines);
  if (items.length === 0) return;
  pushEcommerceEvent("view_cart", ecommerceFor(items));
}

/**
 * The primary conversion: a valid order was handed to WhatsApp. Takes only
 * the order's lines, so customer details cannot reach it. GA4 custom
 * parameters must be scalars, so the lists are comma-separated.
 */
export function trackWhatsAppOrderStarted(lines: readonly ItemChoice[]): void {
  const items = analyticsItems(lines);
  if (items.length === 0) return;
  const ecommerce = ecommerceFor(items);
  pushEcommerceEvent("whatsapp_order_started", ecommerce, {
    item_count: items.length,
    total_quantity: items.reduce((total, item) => total + item.quantity, 0),
    cart_value: ecommerce.value,
    currency: ecommerce.currency,
    product_ids: items.map((item) => item.item_id).join(","),
    product_names: items.map((item) => item.item_name).join(","),
    selected_sizes: items.map((item) => item.item_variant).join(","),
  });
}

/** Where on SVARA the WhatsApp link was: its panel, or a chat reply. */
export type MascotWhatsAppLocation = "panel" | "chat_reply";

export function trackMascotWhatsAppClick(location: MascotWhatsAppLocation, pagePath: string): void {
  pushToDataLayer({
    event: "mascot_whatsapp_click",
    mascot_location: location,
    page_path: pagePath,
  });
}

export interface PageLocation {
  href: string;
  pathname: string;
  title: string;
}

/** The cart page, whose views are followed by `view_cart`. */
const CART_PATH = "/cart";

/**
 * A page_view pusher that counts each page once: a repeat for the page just
 * counted (React Strict Mode, a remount, a re-render) is ignored, so only a
 * real navigation — or a fresh load — pushes another.
 *
 * The "view" ecommerce events follow their page's view from here — a product
 * page's `view_item`, the cart's `view_cart` (from `readCart`, the device's
 * cart now) — rather than from the pages, because Next.js may keep a visited
 * page mounted in the background: a return visit is a new page view, so it
 * is a new `view_item` / `view_cart` too.
 */
export function createPageViewTracker(readCart: () => Cart): (location: PageLocation) => void {
  let lastPath: string | null = null;
  return (location) => {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    pushToDataLayer({
      event: "page_view",
      page_location: location.href,
      page_path: location.pathname,
      page_title: location.title,
    });
    const product = productPageAt(location.pathname);
    if (product) trackViewItem(product.productSlug, product.variantId);
    if (location.pathname === CART_PATH) trackViewCart(readCart());
  };
}
