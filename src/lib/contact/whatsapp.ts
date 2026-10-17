import { contact } from "@/content/contact";
import { site } from "@/content/site";

/**
 * WhatsApp links ("click to chat"): `https://wa.me/<number>`, optionally with
 * a pre-filled message. The message is only suggested text — the customer
 * sees it in WhatsApp and decides whether to send it.
 */

export const WHATSAPP_URL = `https://wa.me/${contact.whatsappNumber}`;

export function whatsappUrl(message?: string): string {
  const text = message?.trim();
  return text ? `${WHATSAPP_URL}?text=${encodeURIComponent(text)}` : WHATSAPP_URL;
}

const greeting = `Hi ${site.name}`;

/** "Hi SVARA Agri Farms, I'm interested in Ginger Powder — 250 g × 2. …" */
export function productEnquiry(enquiry: {
  productName: string;
  weightGrams?: number;
  quantity?: number;
}): string {
  const size = enquiry.weightGrams ? ` — ${enquiry.weightGrams} g` : "";
  const quantity = enquiry.quantity && enquiry.quantity > 1 ? ` × ${enquiry.quantity}` : "";
  return `${greeting}, I'm interested in ${enquiry.productName}${size}${quantity}. I'd like to know more about availability and ordering.`;
}

/** Help with a cart or an order request, listing what is in it. */
export function orderHelp(details: {
  reference?: string;
  lines?: readonly { productName: string; weightGrams: number; quantity: number }[];
}): string {
  const items = (details.lines ?? []).map(
    (line) => `${line.quantity} × ${line.productName} (${line.weightGrams} g)`,
  );
  const about = details.reference
    ? `my order request ${details.reference}`
    : items.length > 0
      ? "an order"
      : "ordering";
  const list = items.length > 0 ? `: ${items.join(", ")}` : "";
  return `${greeting}, I need help with ${about}${list}.`;
}

export function generalEnquiry(): string {
  return `${greeting}, I have a question.`;
}
