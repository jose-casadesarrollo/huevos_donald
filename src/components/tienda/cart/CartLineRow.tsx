'use client';

import { useCart } from '@/lib/cart/CartProvider';
import { formatClp } from '@/lib/cart/format';
import type { CartLineView } from '@/lib/cart/types';

import { ProductImage } from '../ProductImage';
import { QuantitySelector } from '../QuantitySelector';

/** One cart line (used in the drawer and the full cart page). */
export function CartLineRow({ line }: { line: CartLineView }) {
  const { updateQty, removeItem } = useCart();

  return (
    <div className="flex gap-3 py-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-[12px] border border-[rgba(34,26,15,0.08)] bg-[var(--cream-deep)]">
        <ProductImage image={line.image} sizes="64px" />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-[var(--font-fraunces)] text-[15px] font-bold leading-tight text-[var(--ink)]">
              {line.name}
            </p>
            <p className="font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              {line.unitsLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(line.productId)}
            aria-label={`Quitar ${line.name}`}
            className="shrink-0 text-[var(--ink-soft)] transition-colors hover:text-[var(--red)] motion-reduce:transition-none"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4.5h6V7" />
            </svg>
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <QuantitySelector
            value={line.qty}
            onChange={(q) => updateQty(line.productId, q)}
            min={1}
            max={20}
          />
          <span className="font-[var(--font-fraunces)] text-[15px] font-bold text-[var(--ink)]">
            {formatClp(line.lineTotalCents)}
          </span>
        </div>
      </div>
    </div>
  );
}
