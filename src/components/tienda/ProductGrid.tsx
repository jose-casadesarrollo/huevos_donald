import { ProductCard } from "./ProductCard";
import type { Product } from "./types";

/** Cuadrícula del catálogo: 1 col (<560px) → 2 (560–939px) → 4 (≥940px). */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-5 min-[560px]:grid-cols-2 min-[940px]:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
