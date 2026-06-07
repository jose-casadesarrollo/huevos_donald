import Image from "next/image";

import { MediaPlaceholder } from "./MediaPlaceholder";
import { SmartVideo } from "./SmartVideo";
import { MEDIA_READY, asmrItems } from "./data";
import type { AsmrItem } from "./types";

/** One media tile in the ASMR grid — viewport-gated video or a still image.
 *  Videos are the 9:16 source ratio; any still images use 4:5. The `feature`
 *  clip gets a subtle yolk ring so it reads as the lead. */
function AsmrTile({ item }: { item: AsmrItem }) {
  const aspect = item.kind === "image" ? "aspect-[4/5]" : "aspect-[9/16]";
  const feature = item.feature
    ? " ring-1 ring-[rgba(242,169,0,0.35)] ring-offset-2 ring-offset-[var(--dark)]"
    : "";
  const frame = `relative overflow-hidden rounded-[18px] bg-[var(--dark-soft)] ${aspect}${feature}`;
  const mediaClass = "absolute inset-0 h-full w-full object-cover";

  return (
    <figure className={frame}>
      {item.kind === "video" ? (
        MEDIA_READY ? (
          <SmartVideo
            src={item.src}
            poster={item.poster}
            alt={item.alt}
            className={mediaClass}
          />
        ) : (
          <MediaPlaceholder kind="video" label={item.alt} />
        )
      ) : MEDIA_READY ? (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes="(min-width: 760px) 33vw, 100vw"
          className="object-cover"
        />
      ) : (
        <MediaPlaceholder kind="image" label={item.alt} />
      )}
      <figcaption className="sr-only">{item.alt}</figcaption>
    </figure>
  );
}

/**
 * Block 3 — the dark ASMR band. A centered header over a responsive media grid
 * (1 → 2 → 3 columns) where the `feature` clip spans two rows on the widest
 * layout. Videos autoplay only in view and respect reduced motion (see
 * <SmartVideo>); until the real footage lands they render as placeholders.
 */
export function AsmrBand() {
  return (
    <section
      aria-labelledby="asmr-title"
      className="bg-[var(--dark)] px-6 py-20 text-[var(--shell)]"
    >
      <div className="mx-auto max-w-[1180px]">
        {/* Header */}
        <header className="mx-auto mb-12 max-w-[640px] text-center">
          <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--yolk)]">
            — La prueba está en la yema —
          </span>
          <h2
            id="asmr-title"
            className="mt-4 font-[var(--font-fraunces)] font-bold leading-[1.02] tracking-tight"
            style={{ fontSize: "clamp(32px, 4.6vw, 52px)" }}
          >
            Mira lo que vas a <em className="font-medium italic text-[var(--yolk)]">cocinar.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] font-[var(--font-dm-sans)] text-[16px] leading-[1.55] text-[rgba(255,251,240,0.7)]">
            Yema naranja intensa, clara firme, sabor real. La diferencia de un huevo free range
            fresco se nota apenas toca la sartén.
          </p>
        </header>

        {/* Grid — vertical clips, stacked on mobile, a 3-up row on desktop */}
        <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-4 min-[760px]:max-w-none min-[760px]:grid-cols-3">
          {asmrItems.map((item) => (
            <AsmrTile key={item.src} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
