/**
 * Checks on who is calling the order endpoint, kept free of the framework so
 * they are tested directly.
 */

/**
 * The request comes from this site's own pages. Browsers always send
 * `Origin` on a cross-site POST and cannot forge it, so a missing or foreign
 * origin is refused (CSRF protection).
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Who is asking, for the rate limit. The first X-Forwarded-For entry is
 * whatever the client typed, so it is never used: X-Real-IP (set by Vercel
 * and nginx) comes first, else the last X-Forwarded-For entry — the one the
 * nearest proxy added. A server exposed without any proxy cannot see client
 * addresses at all; put it behind one.
 */
export function clientOf(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((part) => part.trim());
  return forwarded?.at(-1) || "direct";
}
