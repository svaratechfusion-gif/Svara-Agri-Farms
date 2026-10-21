import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { catalogue, STANDARD_PRICES } from "@/content/products";

import { pushToDataLayer } from "../dataLayer";
import {
  createPageViewTracker,
  trackAddToCart,
  trackMascotWhatsAppClick,
  trackRemoveFromCart,
  trackSelectItem,
  trackViewCart,
  trackViewItem,
  trackWhatsAppOrderStarted,
} from "../events";

const moringa = catalogue.find((product) => product.slug === "moringa-powder")!;
const [small, large] = moringa.variants;
const other = catalogue.find((product) => product.slug !== moringa.slug)!;

let dataLayer: Record<string, unknown>[];

beforeEach(() => {
  vi.stubGlobal("window", {});
  dataLayer = [];
  (window as unknown as { dataLayer: unknown[] }).dataLayer = dataLayer;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const events = () => dataLayer.filter((entry) => "event" in entry);

describe("pushToDataLayer", () => {
  it("creates the dataLayer when GTM has not yet", () => {
    delete (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    pushToDataLayer({ event: "test" });
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([{ event: "test" }]);
  });

  it("does nothing on the server", () => {
    vi.unstubAllGlobals();
    expect(() => pushToDataLayer({ event: "test" })).not.toThrow();
  });
});

describe("ecommerce events", () => {
  it("clear the previous ecommerce object before each one, as GTM merges pushes", () => {
    trackAddToCart(moringa.slug, small.id, 1);
    expect(dataLayer[0]).toEqual({ ecommerce: null });
    expect(dataLayer[1]).toMatchObject({ event: "add_to_cart" });
  });

  it("add_to_cart carries the item, value and currency", () => {
    trackAddToCart(moringa.slug, large.id, 2);
    expect(events()).toEqual([
      {
        event: "add_to_cart",
        ecommerce: {
          currency: "INR",
          value: (2 * STANDARD_PRICES[250].amountMinor) / 100,
          items: [
            expect.objectContaining({ item_id: moringa.id, item_variant: "250 g", quantity: 2 }),
          ],
        },
      },
    ]);
  });

  it("remove_from_cart, view_item and select_item share the shape", () => {
    trackRemoveFromCart(moringa.slug, small.id, 3);
    trackViewItem(moringa.slug, small.id);
    trackSelectItem(moringa.slug, large.id, 1, "Product page");
    expect(events().map((entry) => entry.event)).toEqual([
      "remove_from_cart",
      "view_item",
      "select_item",
    ]);
    expect(events()[0]).toMatchObject({
      ecommerce: { value: (3 * STANDARD_PRICES[100].amountMinor) / 100 },
    });
    expect(events()[1]).toMatchObject({ ecommerce: { items: [{ quantity: 1 }] } });
    expect(events()[2]).toMatchObject({
      ecommerce: {
        item_list_name: "Product page",
        items: [{ item_variant: "250 g", item_list_name: "Product page" }],
      },
    });
  });

  it("push nothing for a size the catalogue does not know, or a zero quantity", () => {
    trackAddToCart("nope", "x", 1);
    trackRemoveFromCart(moringa.slug, small.id, 0);
    trackViewCart({ lines: [] });
    expect(dataLayer).toEqual([]);
  });

  it("view_cart lists every line of the cart", () => {
    trackViewCart({
      lines: [
        { productSlug: moringa.slug, variantId: small.id, quantity: 1 },
        { productSlug: other.slug, variantId: other.variants[1].id, quantity: 2 },
      ],
    });
    const [viewCart] = events();
    expect(viewCart).toMatchObject({ event: "view_cart", ecommerce: { currency: "INR" } });
    expect((viewCart.ecommerce as { items: unknown[] }).items).toHaveLength(2);
  });
});

describe("whatsapp_order_started", () => {
  const lines = [
    { productSlug: moringa.slug, variantId: large.id, quantity: 2 },
    { productSlug: other.slug, variantId: other.variants[0].id, quantity: 1 },
  ];

  it("summarises the order for GA4 and carries its items", () => {
    trackWhatsAppOrderStarted(lines);
    const value = (2 * STANDARD_PRICES[250].amountMinor + STANDARD_PRICES[100].amountMinor) / 100;
    expect(events()).toEqual([
      {
        event: "whatsapp_order_started",
        item_count: 2,
        total_quantity: 3,
        cart_value: value,
        currency: "INR",
        product_ids: `${moringa.id},${other.id}`,
        product_names: `${moringa.name},${other.name}`,
        selected_sizes: "250 g,100 g",
        ecommerce: { currency: "INR", value, items: expect.any(Array) },
      },
    ]);
  });

  it("holds nothing about the customer: only catalogue facts and counts", () => {
    trackWhatsAppOrderStarted(lines);
    const [event] = events();
    const { ecommerce, ...params } = event as { ecommerce: { items: object[] } };
    expect(Object.keys(params).sort()).toEqual(
      [
        "cart_value",
        "currency",
        "event",
        "item_count",
        "product_ids",
        "product_names",
        "selected_sizes",
        "total_quantity",
      ].sort(),
    );
    for (const item of ecommerce.items) {
      expect(Object.keys(item).sort()).toEqual(
        [
          "currency",
          "item_category",
          "item_id",
          "item_name",
          "item_variant",
          "price",
          "quantity",
        ].sort(),
      );
    }
  });

  it("is never named as a purchase", () => {
    trackWhatsAppOrderStarted(lines);
    expect(JSON.stringify(dataLayer)).not.toMatch(/purchase|order_completed|payment/);
  });
});

describe("mascot_whatsapp_click", () => {
  it("records where on SVARA the link was, and the page", () => {
    trackMascotWhatsAppClick("chat_reply", "/shop");
    expect(dataLayer).toEqual([
      { event: "mascot_whatsapp_click", mascot_location: "chat_reply", page_path: "/shop" },
    ]);
  });
});

describe("createPageViewTracker", () => {
  const at = (path: string) => ({
    href: `https://svaraagrifarms.vercel.app${path}`,
    pathname: path,
    title: `Title of ${path}`,
  });

  const noCart = () => ({ lines: [] });

  it("pushes one page_view per page, ignoring repeats of the same page", () => {
    const track = createPageViewTracker(noCart);
    track(at("/"));
    track(at("/")); // Strict Mode or a remount runs the effect again
    track(at("/products"));
    track(at("/"));
    expect(events()).toEqual([
      { event: "page_view", page_location: at("/").href, page_path: "/", page_title: "Title of /" },
      expect.objectContaining({ page_path: "/products" }),
      expect.objectContaining({ page_path: "/" }),
    ]);
  });

  it("follows a product page's view with view_item, on every visit to it", () => {
    const track = createPageViewTracker(noCart);
    const productPath = `/products/${moringa.slug}`;
    track(at(productPath));
    track(at(productPath)); // a repeat of the same view adds nothing
    track(at("/shop"));
    track(at(productPath)); // coming back is a new view of the product
    expect(events().map((entry) => `${entry.event} ${entry.page_path ?? ""}`.trim())).toEqual([
      `page_view ${productPath}`,
      "view_item",
      "page_view /shop",
      `page_view ${productPath}`,
      "view_item",
    ]);
    expect(events()[1]).toMatchObject({
      ecommerce: { items: [{ item_id: moringa.id, item_variant: "100 g", quantity: 1 }] },
    });
  });

  it("sends no view_item for a product path the catalogue has no page for", () => {
    const track = createPageViewTracker(noCart);
    track(at("/products/not-a-product"));
    track(at(`/products/${other.slug}`)); // in the range, but without its own page
    expect(events().map((entry) => entry.event)).toEqual(["page_view", "page_view"]);
  });

  it("follows the cart page's view with view_cart, read from the device's cart each visit", () => {
    let lines = [{ productSlug: moringa.slug, variantId: large.id, quantity: 2 }];
    const track = createPageViewTracker(() => ({ lines }));
    track(at("/cart"));
    track(at("/cart")); // a repeat adds nothing
    track(at("/shop"));
    lines = [...lines, { productSlug: moringa.slug, variantId: small.id, quantity: 1 }];
    track(at("/cart"));
    const viewCarts = events().filter((entry) => entry.event === "view_cart");
    expect(
      viewCarts.map((entry) => (entry.ecommerce as { items: unknown[] }).items.length),
    ).toEqual([1, 2]);
  });

  it("sends no view_cart for an empty cart", () => {
    createPageViewTracker(noCart)(at("/cart"));
    expect(events().map((entry) => entry.event)).toEqual(["page_view"]);
  });
});

describe("sending to GA4 through gtag.js", () => {
  let gtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtag = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
  });

  it("sends each ecommerce event with its items, value and currency", () => {
    trackAddToCart(moringa.slug, large.id, 2);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "add_to_cart", {
      currency: "INR",
      value: (2 * STANDARD_PRICES[250].amountMinor) / 100,
      items: [expect.objectContaining({ item_id: moringa.id, item_variant: "250 g", quantity: 2 })],
    });
  });

  it("sends the WhatsApp order with its summary, value and items — and nothing else", () => {
    trackWhatsAppOrderStarted([{ productSlug: moringa.slug, variantId: small.id, quantity: 3 }]);
    const [command, name, params] = gtag.mock.calls[0];
    expect([command, name]).toEqual(["event", "whatsapp_order_started"]);
    expect(Object.keys(params).sort()).toEqual(
      [
        "cart_value",
        "currency",
        "item_count",
        "items",
        "product_ids",
        "product_names",
        "selected_sizes",
        "total_quantity",
        "value",
      ].sort(),
    );
    expect(params).toMatchObject({ value: params.cart_value, currency: "INR", total_quantity: 3 });
  });

  it("sends the mascot click with its parameters", () => {
    trackMascotWhatsAppClick("panel", "/journey");
    expect(gtag).toHaveBeenCalledWith("event", "mascot_whatsapp_click", {
      mascot_location: "panel",
      page_path: "/journey",
    });
  });

  it("sends only the site's parameters, not what GTM stamps on each dataLayer entry", () => {
    // GTM, once loaded, adds its own `gtm` object to every entry pushed.
    dataLayer.push = (...entries: Record<string, unknown>[]) => {
      for (const entry of entries) if ("event" in entry) entry.gtm = { uniqueEventId: 1 };
      return Array.prototype.push.apply(dataLayer, entries);
    };
    trackMascotWhatsAppClick("chat_reply", "/shop");
    trackAddToCart(moringa.slug, small.id, 1);
    for (const [, , params] of gtag.mock.calls) expect(params).not.toHaveProperty("gtm");
  });

  it("leaves page views to gtag.js itself, so none is counted twice", () => {
    createPageViewTracker(() => ({ lines: [] }))({
      href: "https://svaraagrifarms.vercel.app/shop",
      pathname: "/shop",
      title: "Shop",
    });
    expect(events().map((entry) => entry.event)).toEqual(["page_view"]); // still in the dataLayer for GTM
    expect(gtag).not.toHaveBeenCalled();
  });

  it("does nothing when gtag.js is not installed (e.g. on a local host)", () => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    expect(() => trackAddToCart(moringa.slug, small.id, 1)).not.toThrow();
    expect(events()).toHaveLength(1);
  });
});
