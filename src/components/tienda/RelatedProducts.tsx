import { ProductCard } from "./ProductCard";
import type { Product } from "./types";

/**
 * "También te puede servir": cards de productos relacionados ya resueltos
 * (server-side, desde la DB, para precios correctos). Grid 2 cols (<720px) → 3
 * (≥720px). `onAddToCart` se propaga del detalle a cada card.
 */
export function RelatedProducts({
  related,
  onAddToCart,
}: {
  related: Product[];
  onAddToCart?: (productId: string, qty: number) => void;
}) {
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="mx-auto w-full max-w-[1240px]">
      <h2
        id="related-title"
        className="font-[var(--font-fraunces)] text-[26px] font-bold text-[var(--ink)]"
      >
        También te puede servir
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-4 min-[720px]:grid-cols-3 min-[720px]:gap-5">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} compact onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  );
}
