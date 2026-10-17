import "server-only";

import { commerceRules } from "@/content/commerce";
import { orderNotifier } from "@/lib/commerce/notifications";
import { paymentProvider } from "@/lib/commerce/payment";
import { describeCommerceSetup } from "@/lib/commerce/server/configuredStore";

/** This server's commerce set-up, from its environment and the business rules. */
export function commerceStatus(env: NodeJS.ProcessEnv = process.env) {
  const rulesConfigured = [
    commerceRules.deliveryZones && "delivery zones",
    commerceRules.tax && "tax",
    commerceRules.minimumOrder && "minimum order",
  ].filter((rule): rule is string => Boolean(rule));
  return describeCommerceSetup(env, {
    paymentConnected: paymentProvider !== null,
    notificationsConnected: orderNotifier !== null,
    rulesConfigured,
  });
}

export function logCommerceStatus(log: (line: string) => void = console.info): void {
  for (const line of commerceStatus().lines) log(`[commerce] ${line}`);
}
