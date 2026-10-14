import type { Product } from "@/lib/commerce/types";

import { ProductGallery } from "./ProductGallery";
import { ProductInformation } from "./ProductInformation";

interface ProductPurchaseProps {
  product: Product;
  headingLevel?: "h1" | "h2";
  preloadImage?: boolean;
}

/** Gallery + purchase panel, shared by the homepage and the product page. */
export function ProductPurchase({
  product,
  headingLevel = "h2",
  preloadImage = false,
}: ProductPurchaseProps) {
  return (
    <div className="grid-editorial gap-y-12">
      <div className="col-span-4 md:col-span-8 lg:col-span-7">
        <ProductGallery
          gallery={product.gallery}
          productName={product.name}
          preloadFirst={preloadImage}
        />
      </div>
      <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:pl-6 xl:pl-10">
        <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
          <ProductInformation product={product} headingLevel={headingLevel} />
        </div>
      </div>
    </div>
  );
}
