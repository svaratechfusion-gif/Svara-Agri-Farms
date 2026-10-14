import type { Metadata } from "next";

import { OrderConfirmation } from "@/components/commerce/OrderConfirmation";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { PageIntro } from "@/components/page/PageIntro";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Order request received",
    description: "Your SVARA Farms order request.",
    path: "/checkout/confirmation",
  }),
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return (
    <>
      <PageIntro label="Order request" title={["Pending confirmation."]} />
      <div className="container-page pb-[var(--section-space)]">
        <OrderConfirmation />
      </div>
      <MotionRoot />
    </>
  );
}
