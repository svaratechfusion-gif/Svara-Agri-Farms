/**
 * Runs once when a Next.js server starts: reports how commerce is set up
 * (order store, payment, notifications, rules), so a misconfigured
 * deployment is visible in its logs. Prints no secret.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logCommerceStatus } = await import("./server/commerceStatus");
  logCommerceStatus();
}
