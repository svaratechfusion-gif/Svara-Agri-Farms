/**
 * A small fixed-window limit per client, held in memory. Enough to blunt
 * accidental floods on a single `next start` server; a multi-instance deploy
 * needs a shared limiter (e.g. at the proxy) instead.
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const windows = new Map<string, { start: number; count: number }>();
  const MAX_TRACKED = 10_000;

  return function allow(client: string): boolean {
    const time = now();
    const current = windows.get(client);
    if (!current || time - current.start >= windowMs) {
      if (windows.size >= MAX_TRACKED) windows.clear();
      windows.set(client, { start: time, count: 1 });
      return true;
    }
    if (current.count >= limit) return false;
    windows.set(client, { start: current.start, count: current.count + 1 });
    return true;
  };
}
