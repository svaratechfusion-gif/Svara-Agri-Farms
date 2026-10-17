import { catalogue, products } from "@/content/products";
import { orderHelp, whatsappUrl } from "@/lib/contact/whatsapp";
import {
  AVAILABILITY_LABEL,
  productAvailability,
  sizeAvailability,
} from "@/lib/commerce/availability";
import { formatMoney } from "@/lib/commerce/money";
import type { Money, Product } from "@/lib/commerce/types";

import type { MascotState } from "../definition";

/**
 * SVARA's scripted conversation: what it says, which quick replies follow,
 * and the mood each answer wears. Scripted paths (quick replies) live here;
 * free-text matching lives apart in `intents.ts` and only ever picks one of
 * these nodes — nothing is generated.
 *
 * Facts (product names, prices, availability) are read from the catalogue,
 * never written into the script, so SVARA cannot drift from the shop. No
 * health, certification, stock, shipping or order claims are made.
 */

export type NodeId =
  | "hello"
  | "farm"
  | "powders"
  | "shopping"
  | "moringa"
  | "usage"
  | "organic"
  | "price"
  | "availability"
  | "order"
  | "thanks"
  | "goodbye"
  | "unknown";

export type ReplyId =
  | "explore-farm"
  | "discover-powders"
  | "take-shopping"
  | "show-journey"
  | "our-story"
  | "moringa-powder"
  | "browse-ingredients"
  | "open-shop"
  | "see-products";

export type ReplyAction = { kind: "say"; node: NodeId } | { kind: "go"; href: string };

export interface QuickReply {
  id: ReplyId;
  label: string;
  action: ReplyAction;
}

export interface ChatLink {
  href: string;
  label: string;
  /** Opens outside the site (e.g. WhatsApp), in a new tab. */
  external?: boolean;
}

export interface ScriptNode {
  id: NodeId;
  text: string;
  /** Lines read from the catalogue, shown under the text. */
  facts?: readonly string[];
  links?: readonly ChatLink[];
  replies: readonly ReplyId[];
  mood: MascotState;
}

const MORINGA_SLUG = "moringa-powder";
const moringa = products.find((product) => product.slug === MORINGA_SLUG);
if (!moringa) throw new Error(`SVARA's script needs the "${MORINGA_SLUG}" product.`);
const MORINGA_HREF = `/products/${moringa.slug}`;

export const QUICK_REPLIES: Readonly<Record<ReplyId, QuickReply>> = {
  "explore-farm": {
    id: "explore-farm",
    label: "Explore the farm",
    action: { kind: "say", node: "farm" },
  },
  "discover-powders": {
    id: "discover-powders",
    label: "Discover powders",
    action: { kind: "say", node: "powders" },
  },
  "take-shopping": {
    id: "take-shopping",
    label: "Take me shopping",
    action: { kind: "say", node: "shopping" },
  },
  "show-journey": {
    id: "show-journey",
    label: "Show me the journey",
    action: { kind: "go", href: "/journey" },
  },
  "our-story": { id: "our-story", label: "Our story", action: { kind: "go", href: "/our-story" } },
  "moringa-powder": {
    id: "moringa-powder",
    label: "Moringa powder",
    action: { kind: "go", href: MORINGA_HREF },
  },
  "browse-ingredients": {
    id: "browse-ingredients",
    label: "Browse ingredients",
    action: { kind: "go", href: "/products#range-preview-heading" },
  },
  "open-shop": { id: "open-shop", label: "Open the shop", action: { kind: "go", href: "/shop" } },
  "see-products": {
    id: "see-products",
    label: "See available products",
    action: { kind: "go", href: "/products" },
  },
};

export const MAIN_REPLIES: readonly ReplyId[] = [
  "explore-farm",
  "discover-powders",
  "take-shopping",
];

function lowestPrice(product: Product): Money | null {
  const prices = product.variants
    .map((variant) => variant.price)
    .filter((price): price is Money => price !== null);
  if (prices.length === 0) return null;
  return prices.reduce((low, price) => (price.amountMinor < low.amountMinor ? price : low));
}

/** "Moringa Powder: price not listed yet." — or the lowest listed price. */
export function priceFacts(catalogue: readonly Product[]): string[] {
  return catalogue.map((product) => {
    const price = lowestPrice(product);
    return price
      ? `${product.shortName}: from ${formatMoney(price)}.`
      : `${product.shortName}: price not listed yet.`;
  });
}

/** "Moringa Powder: Coming soon." — every distinct state across its sizes. */
export function availabilityFacts(catalogue: readonly Product[], inPreparation: number): string[] {
  const lines = catalogue.map((product) => {
    const labels = [
      ...new Set(product.variants.map((v) => AVAILABILITY_LABEL[sizeAvailability(product, v)])),
    ];
    return `${product.shortName}: ${labels.join(" / ")}.`;
  });
  return inPreparation > 0
    ? [...lines, `${inPreparation} more powders are in preparation.`]
    : lines;
}

export const SCRIPT: Readonly<Record<NodeId, ScriptNode>> = {
  hello: {
    id: "hello",
    text: "Hey there! 🌱 I'm SVARA, your little guide to SVARA Agri Farms. Ready to explore something natural?",
    replies: MAIN_REPLIES,
    mood: "greeting",
  },
  farm: {
    id: "farm",
    text: "Ooh, let's start at the beginning! 🌿 Follow the journey from growing ingredients to turning them into powder.",
    replies: ["show-journey", "our-story"],
    mood: "explaining",
  },
  powders: {
    id: "powders",
    text: "Leaf me curious! 🍃 Want to explore moringa powder or browse the other ingredients?",
    replies: ["moringa-powder", "browse-ingredients"],
    mood: "explaining",
  },
  shopping: {
    id: "shopping",
    text: "Adventure awaits! 🛍️ Let's see what's available in the shop.",
    replies: ["open-shop", "see-products"],
    mood: "explaining",
  },
  moringa: {
    id: "moringa",
    text: `Our ${moringa.shortName} is made from the leaves of the moringa tree (${moringa.botanicalName}). 🌿 Want to explore it?`,
    replies: ["moringa-powder", "browse-ingredients"],
    mood: "explaining",
  },
  usage: {
    id: "usage",
    text: "Let's check the product details for suggested uses. I don't want to guess!",
    links: [{ href: `${MORINGA_HREF}#how-to-use`, label: `${moringa.shortName}: how to use` }],
    replies: ["see-products"],
    mood: "explaining",
  },
  organic: {
    id: "organic",
    text: "Good question! Let's check the product label and available certification details before making that claim.",
    links: [{ href: MORINGA_HREF, label: `${moringa.shortName} details` }],
    replies: ["see-products"],
    mood: "explaining",
  },
  price: {
    id: "price",
    text: "Let's look at the current product listing for the latest price.",
    facts: priceFacts(products),
    links: [{ href: "/shop", label: "Open the shop" }],
    replies: ["see-products"],
    mood: "explaining",
  },
  availability: {
    id: "availability",
    text: "I'll take you to the shop so you can check the current listing.",
    facts: availabilityFacts(
      products,
      catalogue.filter(
        (product) => !product.hasProductPage && productAvailability(product) === "in-preparation",
      ).length,
    ),
    links: [{ href: "/shop", label: "Open the shop" }],
    replies: ["see-products"],
    mood: "explaining",
  },
  order: {
    id: "order",
    // SVARA cannot see orders; the team can, on WhatsApp.
    text: "I can't see order details myself, but our team can help on WhatsApp.",
    links: [
      { href: whatsappUrl(orderHelp({})), label: "Chat with our team on WhatsApp", external: true },
    ],
    replies: MAIN_REPLIES,
    mood: "explaining",
  },
  thanks: {
    id: "thanks",
    text: "You're berry welcome! 🍃 Happy exploring!",
    replies: [],
    mood: "happy",
  },
  goodbye: {
    id: "goodbye",
    text: "See you soon! Keep growing curious. 🌱",
    replies: [],
    mood: "goodbye",
  },
  unknown: {
    id: "unknown",
    text: "Hmm, I don't know that one yet. Want to explore our products or learn about the farm instead?",
    replies: MAIN_REPLIES,
    mood: "listening",
  },
};
