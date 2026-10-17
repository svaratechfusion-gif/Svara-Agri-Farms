import type { Metadata } from "next";

import { OrderConfirmation } from "@/components/commerce/OrderConfirmation";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Order confirmation",
    description: "Your SVARA Agri Farms order.",
    path: "/order/confirmation",
  }),
  robots: { index: false, follow: false },
};

export default function OrderConfirmationPage() {
  return (
    <div className="bg-sun">
      <div className="container-page pt-[calc(var(--header-height)+clamp(3rem,7vw,6rem))] pb-[var(--section-space)]">
        <OrderConfirmation />
      </div>
    </div>
  );
}
