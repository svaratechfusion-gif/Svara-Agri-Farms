import type { Metadata } from "next";

import { OrderView } from "@/components/commerce/OrderView";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { PageIntro } from "@/components/page/PageIntro";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Your order",
    description: "Add your delivery details and send your SVARA Agri Farms order on WhatsApp.",
    path: "/order",
  }),
  robots: { index: false, follow: false },
};

export default function OrderPage() {
  return (
    <>
      <PageIntro
        label="Your order"
        title={["Almost there."]}
        lead="Tell us where to deliver. Your order and details then open in WhatsApp, ready for you to send."
      />
      <div className="container-page pb-[var(--section-space)]">
        <OrderView />
      </div>
      <MotionRoot />
    </>
  );
}
