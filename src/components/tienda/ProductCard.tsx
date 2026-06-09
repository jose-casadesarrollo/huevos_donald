"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useCartOptional } from "@/lib/cart/CartProvider";

import { LoteBadge } from "./LoteBadge";
import { ProductImage } from "./ProductImage";
import { ScanCorners } from "./ScanCorners";
import { Tag } from "./Tag";
import { tiendaHref } from "./data";
import { CheckIcon, PlusIcon } from "./icons";
import type { ProductCardProps } from "./types";

/**
 * Card de producto, usada en el grid y en relacionados. El área de imagen y el
 * nombre linkean al detalle; el botón "Agregar" NO navega — hace el feedback
 * visual "Agregado" (1.4s) y llama `onAddToCart(id, 1)` si viene por props.
 *
 * `compact` (relacionados) oculta el precio por unidad y los tags para una card
 * más liviana. Si el producto está agotado, el botón se deshabilita.
 */
export function ProductCard({ product, href, compact = false, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cart = useCartOptional();
  const link = href ?? tiendaHref(product.slug);
  const soldOut = !product.inStock;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleAdd() {
    if (soldOut) return;
    setAdded(true);
    // `onAddToCart` prop wins (tests/standalone); otherwise the CartProvider.
    if (onAddToCart) onAddToCart(product.id, 1);
    else if (cart) {
      cart.addItem({ slug: product.slug, qty: 1 });
      cart.open();
    } else console.log("[tienda] onAddToCart", product.id, 1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-[20px] border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_14px_28px_-18px_rgba(34,26,15,0.15)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_24px_40px_-18px_rgba(34,26,15,0.22)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* Media — linkea al detalle */}
      <Link
        href={link}
        aria-label={product.name}
        className="relative block aspect-square overflow-hidden bg-[var(--cream-deep)]"
      >
        <ProductImage
          image={product.images[0]}
          sizes="(min-width: 940px) 280px, (min-width: 560px) 45vw, 90vw"
        />
        <ScanCorners />
        <span className="absolute left-3 top-3 z-[4] rounded-full border border-[rgba(34,26,15,0.08)] bg-[rgba(255,251,240,0.92)] px-2.5 py-1 font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)] backdrop-blur-[4px]">
          {product.formatShort}
        </span>
        <span className="absolute right-3 top-3 z-[4]">
          <LoteBadge code={product.lote.code} />
        </span>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4 min-[560px]:p-5">
        <div className="flex flex-col gap-2">
          <Link
            href={link}
            className="font-[var(--font-fraunces)] text-[20px] font-bold leading-tight text-[var(--ink)] transition-colors hover:text-[var(--red)] motion-reduce:transition-none"
          >
            {product.name}
          </Link>
          <span className="font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            {product.unitsLabel}
          </span>
          {!compact && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
        </div>

        {/* Precio + Agregar — pegado al fondo */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="leading-none">
            <div className="flex items-start gap-0.5">
              <span className="mt-1 font-[var(--font-fraunces)] text-[16px] font-bold text-[var(--ink)]">$</span>
              <span className="font-[var(--font-fraunces)] text-[28px] font-bold tracking-[-0.02em] text-[var(--ink)]">
                {product.price}
              </span>
            </div>
            {!compact && (
              <span className="mt-1 block font-[var(--font-jetbrains-mono)] text-[10px] text-[var(--ink-soft)]">
                ${product.pricePerUnit} c/u
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={soldOut ? `${product.name} agotado` : `Agregar ${product.name} al carro`}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 font-[var(--font-dm-sans)] text-[13px] font-semibold transition-all duration-200 ease-out motion-reduce:transition-none ${
              soldOut
                ? "cursor-not-allowed bg-[rgba(34,26,15,0.1)] text-[var(--ink-soft)]"
                : added
                  ? "bg-[var(--moss)] text-[var(--shell)] shadow-[0_2px_0_#3a4a2e]"
                  : "bg-[var(--red)] text-[var(--shell)] shadow-[0_2px_0_var(--red-deep)] hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--red-deep)]"
            }`}
          >
            {soldOut ? (
              "Agotado"
            ) : added ? (
              <>
                <CheckIcon className="size-4" />
                Agregado
              </>
            ) : (
              <>
                <PlusIcon className="size-4" />
                Agregar
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
