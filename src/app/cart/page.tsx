import type { Metadata } from "next";

import { CartView } from "@/components/commerce/CartView";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { PageIntro } from "@/components/page/PageIntro";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Your cart",
    description: "Review the SVARA Agri Farms products in your cart.",
    path: "/cart",
  }),
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <PageIntro label="Your cart" title={["Your cart."]} />
      <div className="container-page pb-[var(--section-space)]">
        <CartView />
      </div>
      <MotionRoot />
    </>
  );
}
