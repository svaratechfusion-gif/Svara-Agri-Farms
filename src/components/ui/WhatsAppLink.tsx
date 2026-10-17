import type { ReactNode } from "react";

import { whatsappUrl } from "@/lib/contact/whatsapp";

import { ChatIcon } from "./icons";

interface WhatsAppLinkProps {
  /** Suggested first message; the customer can edit it before sending. */
  message?: string;
  children: ReactNode;
  className?: string;
  /** `light` on dark surfaces (the footer). */
  tone?: "botanical" | "light";
}

/**
 * A quiet link that opens a WhatsApp chat with the team in a new tab — help
 * alongside the cart, never instead of it.
 */
export function WhatsAppLink({
  message,
  children,
  className = "",
  tone = "botanical",
}: WhatsAppLinkProps) {
  const colour = tone === "light" ? "text-ivory/85 hover:text-ivory" : "text-forest";
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex min-h-11 items-center gap-2 type-small font-medium ${colour} ${className}`}
    >
      <ChatIcon className={tone === "light" ? "shrink-0" : "shrink-0 text-botanical"} />
      <span className="underline decoration-[color:var(--vein)] underline-offset-4 transition-colors group-hover:decoration-current">
        {children}
      </span>
      <span className="sr-only"> (opens WhatsApp in a new tab)</span>
    </a>
  );
}
