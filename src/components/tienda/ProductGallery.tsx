"use client";

import { useState } from "react";

import { ProductImage } from "./ProductImage";
import { ScanCorners } from "./ScanCorners";
import type { ProductImage as ProductImageData } from "./types";

/**
 * Galería del detalle: foto principal (4/5) + 4 miniaturas. La miniatura activa
 * (estado local de UI) define la foto principal y lleva borde rojo. Badge
 * "En stock" sobre la principal cuando corresponde.
 */
export function ProductGallery({
  images,
  inStock,
}: {
  images: ProductImageData[];
  inStock: boolean;
}) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] border border-[rgba(34,26,15,0.1)] bg-[var(--cream-deep)] shadow-[0_30px_60px_-30px_rgba(34,26,15,0.35)]">
        <ProductImage image={main} priority sizes="(min-width: 880px) 48vw, 100vw" />
        <ScanCorners />
        {inStock && (
          <span className="absolute left-4 top-4 z-[4] inline-flex items-center gap-1.5 rounded-full border border-[rgba(74,93,58,0.3)] bg-[rgba(255,251,240,0.92)] px-3 py-1.5 backdrop-blur-[6px]">
            <span aria-hidden className="size-[6px] rounded-full bg-[var(--moss)]" />
            <span className="font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--moss)]">
              En stock
            </span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {images.map((img, i) => {
          const isActive = i === active;
          return (
            <button
              key={`${img.src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={isActive}
              className={`relative aspect-square overflow-hidden rounded-[12px] border-2 bg-[var(--cream-deep)] transition-colors duration-200 motion-reduce:transition-none ${
                isActive
                  ? "border-[var(--red)]"
                  : "border-transparent hover:border-[rgba(34,26,15,0.2)]"
              }`}
            >
              <ProductImage image={img} sizes="120px" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
