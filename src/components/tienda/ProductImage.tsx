import Image from "next/image";

import { MEDIA_READY } from "./data";
import type { ProductImage as ProductImageData } from "./types";

/**
 * Wrapper de imagen de producto. Rellena su padre (que debe ser `relative` y con
 * aspect-ratio) con `next/image` + object-cover. Mientras los assets no existan
 * en `public/tienda/` (`MEDIA_READY === false` en data.ts), muestra un
 * placeholder cálido con el `alt` — así la UI se ve antes de tener las fotos.
 */
export function ProductImage({
  image,
  sizes = "(min-width: 940px) 25vw, 100vw",
  priority = false,
  className = "",
}: {
  image: ProductImageData;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (MEDIA_READY) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }
  return <Placeholder label={image.alt} />;
}

/** Placeholder cálido para assets pendientes (decorativo; el alt real va en la foto). */
function Placeholder({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      data-placeholder="image"
      className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-5 text-center"
      style={{ background: "linear-gradient(135deg, var(--cream-deep) 0%, var(--cream) 100%)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent 0, transparent 15px, rgba(34,26,15,0.03) 15px, rgba(34,26,15,0.03) 16px)",
        }}
      />
      <span className="relative flex size-11 items-center justify-center rounded-full border border-[rgba(34,26,15,0.15)] text-[rgba(34,26,15,0.35)]">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="3.5" y="5" width="17" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M5 17l4.5-4.5L13 16l3-3 3 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="relative font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.18em] text-[rgba(34,26,15,0.4)]">
        Imagen · pendiente
      </span>
      <p className="relative max-w-[85%] font-[var(--font-dm-sans)] text-[11px] leading-[1.4] text-[rgba(34,26,15,0.45)]">
        {label}
      </p>
    </div>
  );
}
