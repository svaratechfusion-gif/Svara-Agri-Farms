import { describe, expect, it } from "vitest";

import { products } from "@/content/products";
import { AVAILABILITY_LABEL } from "@/lib/commerce/availability";

import { converse, EMPTY_CHAT, MAX_INPUT_LENGTH, MAX_MESSAGES } from "../chat/conversation";
import { matchIntent } from "../chat/intents";
import { MAIN_REPLIES, QUICK_REPLIES, SCRIPT, type NodeId } from "../chat/script";

const moringa = products.find((product) => product.slug === "moringa-powder")!;

describe("SVARA's script", () => {
  it("opens with the first-visit greeting and the three main quick replies", () => {
    expect(SCRIPT.hello.text).toBe(
      "Hey there! 🌱 I'm SVARA, your little guide to SVARA Farms. Ready to explore something natural?",
    );
    expect(SCRIPT.hello.replies.map((id) => QUICK_REPLIES[id].label)).toEqual([
      "Explore the farm",
      "Discover powders",
      "Take me shopping",
    ]);
    expect(SCRIPT.hello.mood).toBe("greeting");
  });

  it.each([
    ["explore-farm", "farm", ["Show me the journey", "Our story"]],
    ["discover-powders", "powders", ["Moringa powder", "Browse ingredients"]],
    ["take-shopping", "shopping", ["Open the shop", "See available products"]],
  ] as const)("%s leads to its branch and its own replies", (reply, node, labels) => {
    const action = QUICK_REPLIES[reply].action;
    expect(action).toEqual({ kind: "say", node });
    expect(SCRIPT[node].replies.map((id) => QUICK_REPLIES[id].label)).toEqual(labels);
  });

  it("sends every navigating quick reply to a real route", () => {
    const routes = new Set([
      "/journey",
      "/our-story",
      "/products",
      "/products/moringa-powder",
      "/shop",
    ]);
    const hrefs = Object.values(QUICK_REPLIES)
      .map((reply) => reply.action)
      .filter((action) => action.kind === "go")
      .map((action) => action.href.split("#")[0]);
    expect(hrefs.length).toBeGreaterThan(0);
    hrefs.forEach((href) => expect(routes).toContain(href));
    expect(QUICK_REPLIES["moringa-powder"].action).toEqual({
      kind: "go",
      href: `/products/${moringa.slug}`,
    });
  });

  it("takes product names, prices and availability from the catalogue", () => {
    const price = SCRIPT.price.facts?.join(" ") ?? "";
    const availability = SCRIPT.availability.facts?.join(" ") ?? "";
    expect(price).toContain(moringa.shortName);
    // No price is set in the catalogue yet, so none is shown.
    if (moringa.variants.every((variant) => variant.price === null)) {
      expect(price).toMatch(/not listed yet/);
      expect(price).not.toMatch(/₹|\d/);
    }
    for (const variant of moringa.variants) {
      expect(availability).toContain(AVAILABILITY_LABEL[variant.availability]);
    }
  });

  it("makes no health, certification, stock, shipping or order claims", () => {
    const everything = Object.values(SCRIPT)
      .flatMap((node) => [node.text, ...(node.facts ?? [])])
      .join(" ")
      .toLowerCase();
    for (const claim of [
      "certified",
      "is organic",
      "100%",
      "health",
      "immun",
      "nutrient",
      "in stock",
      "ships",
      "delivered",
      "dispatched",
    ]) {
      expect(everything).not.toContain(claim);
    }
  });

  it("is honest when it does not understand, and offers the supported paths", () => {
    expect(SCRIPT.unknown.text).toBe(
      "Hmm, I don't know that one yet. Want to explore our products or learn about the farm instead?",
    );
    expect(SCRIPT.unknown.replies).toEqual(MAIN_REPLIES);
  });

  it("never uses the error mood for chat; that stays reserved for real failures", () => {
    Object.values(SCRIPT).forEach((node) => expect(node.mood).not.toBe("error"));
  });
});

describe("free-text intent matching", () => {
  it.each<[string, NodeId]>([
    ["What is moringa?", "moringa"],
    ["How do I use this powder?", "usage"],
    ["how should I use moringa", "usage"],
    ["Is this organic?", "organic"],
    ["is moringa certified", "organic"],
    ["What is the price?", "price"],
    ["how much is the moringa powder", "price"],
    ["Is it available?", "availability"],
    ["is it in stock", "availability"],
    ["Where is my order?", "order"],
    ["can you track my delivery", "order"],
    ["can I order moringa?", "availability"],
    ["what is my order number", "order"],
    ["Thank you!", "thanks"],
    ["thanks a lot", "thanks"],
    ["Bye!", "goodbye"],
    ["see you", "goodbye"],
    ["hello", "hello"],
    ["tell me about the farm", "farm"],
    ["take me to the shop", "shopping"],
    ["what powders do you make", "powders"],
  ])("“%s” → %s", (text, node) => {
    expect(matchIntent(text)).toBe(node);
  });

  it.each(["", "   ", "asdfgh", "what's the weather in Delhi", "tell me a joke"])(
    "returns null for “%s”",
    (text) => {
      expect(matchIntent(text)).toBeNull();
    },
  );

  it("matches whole words only", () => {
    expect(matchIntent("ordering my thoughts")).toBeNull();
    expect(matchIntent("they shopped")).toBeNull();
  });
});

describe("the conversation", () => {
  it("starts with the greeting, once — repeated starts (Strict Mode) add nothing", () => {
    const first = converse(EMPTY_CHAT, { type: "start" });
    expect(first.state.messages).toHaveLength(1);
    expect(first.state.messages[0]).toMatchObject({ from: "svara", node: "hello" });
    expect(first.node?.id).toBe("hello");
    const again = converse(first.state, { type: "start" });
    expect(again.state).toBe(first.state);
    expect(again.node).toBeNull();
  });

  it("records a quick reply as the visitor's words, then SVARA's answer", () => {
    const started = converse(EMPTY_CHAT, { type: "start" }).state;
    const { state, node } = converse(started, { type: "choose", reply: "explore-farm" });
    expect(state.messages.slice(-2)).toMatchObject([
      { from: "visitor", text: "Explore the farm" },
      { from: "svara", node: "farm", text: SCRIPT.farm.text },
    ]);
    expect(node?.mood).toBe("explaining");
    // Immutability: the earlier state is untouched.
    expect(started.messages).toHaveLength(1);
  });

  it("records a navigating quick reply without an answer (the page is the answer)", () => {
    const { state, node } = converse(EMPTY_CHAT, { type: "choose", reply: "open-shop" });
    expect(state.messages).toEqual([
      expect.objectContaining({ from: "visitor", text: "Open the shop" }),
    ]);
    expect(node).toBeNull();
  });

  it("answers free text with the matched intent, or honestly says it does not know", () => {
    const known = converse(EMPTY_CHAT, { type: "say", text: "Is this organic?" });
    expect(known.state.messages.at(-1)).toMatchObject({ from: "svara", node: "organic" });
    const unknown = converse(known.state, { type: "say", text: "do you sell tractors" });
    expect(unknown.state.messages.at(-1)).toMatchObject({ from: "svara", node: "unknown" });
    expect(unknown.node?.replies).toEqual(MAIN_REPLIES);
  });

  it("ignores empty messages and trims long ones", () => {
    const empty = converse(EMPTY_CHAT, { type: "say", text: "   \n " });
    expect(empty.state).toBe(EMPTY_CHAT);
    const long = converse(EMPTY_CHAT, { type: "say", text: "a".repeat(MAX_INPUT_LENGTH + 50) });
    expect(long.state.messages[0].text).toHaveLength(MAX_INPUT_LENGTH);
  });

  it("keeps a bounded history with unique ids", () => {
    let state = EMPTY_CHAT;
    for (let i = 0; i < MAX_MESSAGES; i += 1)
      state = converse(state, { type: "say", text: "hi" }).state;
    expect(state.messages).toHaveLength(MAX_MESSAGES);
    const ids = state.messages.map((message) => message.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
