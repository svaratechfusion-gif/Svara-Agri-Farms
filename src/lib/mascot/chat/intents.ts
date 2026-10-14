import type { NodeId } from "./script";

/**
 * A small keyword matcher for typed messages — not an AI. It maps a message
 * to one of the scripted answers or to nothing; the panel says plainly that
 * SVARA only understands a few set questions. Replace this with a real,
 * catalogue-grounded assistant when one exists.
 *
 * Rules are checked in order, so the more specific question wins: "how do I
 * use moringa" is about usage, "is moringa organic" about certification.
 */
const RULES: readonly (readonly [NodeId, RegExp])[] = [
  [
    "order",
    /\b(my orders?|order (status|number|id)|track(ing)?|deliver(y|ed)?|shipping|shipped|refund|return)\b/,
  ],
  ["organic", /\b(organic|certifi(ed|cation|cate)|pesticides?|chemicals?)\b/],
  ["price", /(\b(price[sd]?|pricing|costs?|how much|rupees?|rs|inr)\b|₹)/],
  ["availability", /\b(available|availability|in stock|stock|sold out|buy|purchase|order)\b/],
  [
    "usage",
    /\b(how (do|to|should|can) (i |you |we )?use|use (it|this)|usage|recipes?|dose|dosage)\b/,
  ],
  ["moringa", /\bmoringa\b/],
  ["thanks", /\b(thanks?|thank you|thx|ty)\b/],
  ["goodbye", /\b(bye|goodbye|see you|cya)\b/],
  ["hello", /^(hi|hello|hey|namaste)\b/],
  ["farm", /\b(farm|journey|story|grown|grow|harvest(ed|ing)?)\b/],
  ["shopping", /\b(shop|shopping|cart)\b/],
  ["powders", /\b(powders?|ingredients?|products?|range)\b/],
];

/** The scripted answer for a typed message, or null when SVARA does not know. */
export function matchIntent(message: string): NodeId | null {
  const text = message.toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return null;
  return RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}
