"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCartOptional } from "@/lib/cart/CartProvider";

import { DeliveryInfo } from "./DeliveryInfo";
import { LoteFicha } from "./LoteFicha";
import { ProductAccordion } from "./ProductAccordion";
import { ProductGallery } from "./ProductGallery";
import { QuantitySelector } from "./QuantitySelector";
import { RelatedProducts } from "./RelatedProducts";
import { Tag } from "./Tag";
import { deliveryPoints } from "./data";
import { CartIcon, CheckIcon } from "./icons";
import type { ProductDetailProps } from "./types";

/**
 * Layout completo del detalle: breadcrumb, grid galería/info (1 col <880px → 2
 * cols `1.05fr 0.95fr`), acordeón y relacionados. Posee el estado de UI: cantidad
 * del selector y feedback transitorio del botón "Agregar". Los callbacks
 * (`onAddToCart`/`onBuyNow`) son opcionales; sin ellos, registran un ejemplo.
 */
export function ProductDetail({ product, related = [], onAddToCart, onBuyNow }: ProductDetailProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cart = useCartOptional();
  const router = useRouter();
  const soldOut = !product.inStock;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleAdd() {
    if (soldOut) return;
    setAdded(true);
    // `onAddToCart` prop wins (tests/standalone); otherwise the CartProvider.
    if (onAddToCart) onAddToCart(product.id, qty);
    else if (cart) {
      cart.addItem({ slug: product.slug, qty });
      cart.open();
    } else console.log("[tienda] onAddToCart", product.id, qty);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
  }

  function handleBuy() {
    if (soldOut) return;
    if (onBuyNow) onBuyNow(product.id, qty);
    else if (cart) {
      cart.addItem({ slug: product.slug, qty });
      router.push("/tienda/checkout");
    } else console.log("[tienda] onBuyNow", product.id, qty);
  }

  return (
    // Sección de detalle escalada al 80% (−20%) con `zoom` (refluye, a diferencia
    // de transform:scale). El padding superior se compensa (150·0.8 = 120px) para
    // conservar la separación original con el nav flotante.
    <div style={{ zoom: 0.8 }} className="px-6 pb-[100px] pt-[150px] md:pt-[165px]">
      {/* Breadcrumb */}
      <nav aria-label="Migas de pan" className="mx-auto mb-8 w-full max-w-[1240px]">
        <ol className="flex flex-wrap items-center gap-2 font-[var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          <li>
            <Link href="/tienda" className="transition-colors hover:text-[var(--red)] motion-reduce:transition-none">
              Tienda
            </Link>
          </li>
          <li aria-hidden className="text-[rgba(34,26,15,0.3)]">/</li>
          <li>Cajas</li>
          <li aria-hidden className="text-[rgba(34,26,15,0.3)]">/</li>
          <li className="font-bold text-[var(--ink)]">{product.name}</li>
        </ol>
      </nav>

      {/* Grid principal */}
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-10 min-[880px]:grid-cols-[1.05fr_0.95fr] min-[880px]:gap-14">
        <ProductGallery images={product.images} inStock={product.inStock} />

        <div className="flex flex-col gap-5">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-block size-[7px] rounded-full bg-[var(--red)]" />
            <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
              <span className="text-[var(--ink-soft)]">PRODUCTO /</span>{" "}
              <span className="text-[var(--red)]">Caja {product.formatShort}</span>
            </span>
          </div>

          <h1
            className="font-[var(--font-fraunces)] font-bold leading-[1.0] tracking-tight text-[var(--ink)]"
            style={{ fontSize: "clamp(32px, 4vw, 46px)" }}
          >
            {product.name}
          </h1>

          <p className="font-[var(--font-fraunces)] text-[17px] font-medium italic text-[var(--ink-soft)]">
            {product.subtitle}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>

          {/* Precio */}
          <div className="flex items-end gap-3">
            <div className="flex items-start gap-1">
              <span className="mt-1.5 font-[var(--font-fraunces)] text-[22px] font-bold leading-none text-[var(--ink)]">
                $
              </span>
              <span className="font-[var(--font-fraunces)] text-[44px] font-bold leading-[0.9] tracking-[-0.03em] text-[var(--ink)]">
                {product.price}
              </span>
            </div>
            <span className="pb-1.5 font-[var(--font-jetbrains-mono)] text-[11px] leading-tight text-[var(--ink-soft)]">
              ${product.pricePerUnit} por huevo
              <br />
              IVA incluido
            </span>
          </div>

          <LoteFicha lote={product.lote} />

          {/* Cantidad + Agregar */}
          <div className="flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} min={1} max={20} />
            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              aria-label={soldOut ? `${product.name} agotado` : "Agregar al carro"}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 font-[var(--font-dm-sans)] text-[15px] font-semibold transition-all duration-200 ease-out motion-reduce:transition-none ${
                soldOut
                  ? "cursor-not-allowed bg-[rgba(34,26,15,0.12)] text-[var(--ink-soft)]"
                  : added
                    ? "bg-[var(--moss)] text-[var(--shell)] shadow-[0_2px_0_#3a4a2e]"
                    : "bg-[var(--red)] text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)]"
              }`}
            >
              {soldOut ? (
                "Agotado"
              ) : added ? (
                <>
                  <CheckIcon className="size-[18px]" />
                  Agregado
                </>
              ) : (
                <>
                  <CartIcon className="size-[18px]" />
                  Agregar al carro
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleBuy}
            disabled={soldOut}
            className="inline-flex items-center justify-center rounded-full border border-[rgba(34,26,15,0.25)] px-6 py-3.5 font-[var(--font-dm-sans)] text-[15px] font-semibold text-[var(--ink)] transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            Comprar ahora
          </button>

          <DeliveryInfo points={deliveryPoints} />
        </div>
      </div>

      {/* Acordeón */}
      <div className="mt-16">
        <ProductAccordion content={product.content} />
      </div>

      {/* Relacionados */}
      <div className="mt-20">
        <RelatedProducts related={related} onAddToCart={onAddToCart} />
      </div>
    </div>
  );
}
