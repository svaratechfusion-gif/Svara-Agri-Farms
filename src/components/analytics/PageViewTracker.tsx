"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { readCart } from "@/components/commerce/CartProvider";
import { createPageViewTracker } from "@/lib/analytics/events";

/** One per page load; it remembers the last page counted, across remounts. */
const trackPageView = createPageViewTracker(readCart);

/** The title of the last page counted, to tell when the next page's title has arrived. */
let countedTitle: string | null = null;

/** Longest wait for a new page's title before counting the view anyway. */
const TITLE_WAIT_MS = 1000;

/**
 * Pushes `page_view` on the first load and after every client-side
 * navigation. GA4's own automatic page views are switched off in GTM (see
 * docs/analytics.md), so this is the only source and each page counts once.
 *
 * After a client-side navigation Next.js sets the new title a moment after
 * the URL changes, so the view waits for it (briefly) to report the right
 * page_title. Leaving the page before then counts it at once.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      observer.disconnect();
      window.clearTimeout(timeout);
      countedTitle = document.title;
      trackPageView({ href: window.location.href, pathname, title: document.title });
    };
    const titleArrived = () => document.title !== "" && document.title !== countedTitle;
    const observer = new MutationObserver(() => {
      if (titleArrived()) send();
    });
    const timeout = window.setTimeout(send, TITLE_WAIT_MS);
    if (titleArrived()) send();
    else observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return send;
  }, [pathname]);
  return null;
}
