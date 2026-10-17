import { describe, expect, it } from "vitest";

import { generalEnquiry, orderHelp, productEnquiry, WHATSAPP_URL, whatsappUrl } from "../whatsapp";

describe("WhatsApp links", () => {
  it("use the business number in wa.me form, without a plus sign", () => {
    expect(WHATSAPP_URL).toBe("https://wa.me/917780262442");
    expect(whatsappUrl()).toBe("https://wa.me/917780262442");
    expect(whatsappUrl("   ")).toBe("https://wa.me/917780262442");
  });

  it("encode the pre-filled message so every character survives", () => {
    const message = "Hi — 250 g × 2 & ₹350? 100% sure #1";
    const url = whatsappUrl(message);
    expect(url).toBe(`https://wa.me/917780262442?text=${encodeURIComponent(message)}`);
    expect(url.split("?text=")[1]).not.toMatch(/[ &#?]/);
    expect(new URL(url).searchParams.get("text")).toBe(message);
  });
});

describe("messages", () => {
  it("name the product, the size and the quantity", () => {
    expect(productEnquiry({ productName: "Ginger Powder", weightGrams: 250 })).toBe(
      "Hi SVARA Agri Farms, I'm interested in Ginger Powder — 250 g. I'd like to know more about availability and ordering.",
    );
    expect(productEnquiry({ productName: "Ginger Powder", weightGrams: 100, quantity: 3 })).toBe(
      "Hi SVARA Agri Farms, I'm interested in Ginger Powder — 100 g × 3. I'd like to know more about availability and ordering.",
    );
    expect(productEnquiry({ productName: "Ginger Powder" })).toBe(
      "Hi SVARA Agri Farms, I'm interested in Ginger Powder. I'd like to know more about availability and ordering.",
    );
  });

  it("list the cart, or quote the request ID, when asking for order help", () => {
    const lines = [
      { productName: "SVARA Moringa Powder", weightGrams: 100, quantity: 2 },
      { productName: "Amla Powder", weightGrams: 250, quantity: 1 },
    ];
    expect(orderHelp({ lines })).toBe(
      "Hi SVARA Agri Farms, I need help with an order: 2 × SVARA Moringa Powder (100 g), 1 × Amla Powder (250 g).",
    );
    expect(orderHelp({ reference: "SVF-261017-AAAAAA" })).toBe(
      "Hi SVARA Agri Farms, I need help with my order request SVF-261017-AAAAAA.",
    );
    expect(orderHelp({})).toBe("Hi SVARA Agri Farms, I need help with ordering.");
    expect(generalEnquiry()).toBe("Hi SVARA Agri Farms, I have a question.");
  });
});
