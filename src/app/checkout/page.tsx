import type { Metadata } from "next";

import { CheckoutView } from "@/components/commerce/CheckoutView";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { PageIntro } from "@/components/page/PageIntro";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Delivery details",
    description: "Send an order request to SVARA Farms.",
    path: "/checkout",
  }),
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageIntro
        label="Order request"
        title={["Delivery details."]}
        lead="Tell us where to deliver. This sends an order request — our team confirms availability, delivery charges and payment with you before anything is dispatched."
      />
      <div className="container-page pb-[var(--section-space)]">
        <CheckoutView />
      </div>
      <MotionRoot />
    </>
  );
}
