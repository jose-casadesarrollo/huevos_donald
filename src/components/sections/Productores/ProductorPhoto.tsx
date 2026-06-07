import Image from "next/image";
import { Chip } from "@heroui/react";

import { Silhouette } from "./Silhouettes";
import type { Productor } from "./types";

/** Zero-pad single digits — producers/network counts stay under 100. */
function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Left column of a slide. When the producer has a real `photo` it fills the
 * column (`object-cover`) with soft top/bottom scrims so the overlaid corner
 * meta stays legible; otherwise it falls back to an illustrated placeholder — a
 * diagonal texture, a circular framed silhouette, and the producer's initials
 * in a red pill. Either way the two corner tags ("Socio desde…" and the HeroUI
 * <Chip> "PRODUCTOR · 0X DE 08") render on top. All imagery is decorative; the
 * producer's name lives in <ProductorInfo />.
 */
export function ProductorPhoto({ productor }: { productor: Productor }) {
  const { initials, socioDesde, socioPlural, index, total, silhouette, photo } =
    productor;
  const hasPhoto = Boolean(photo);

  return (
    <div className="relative flex min-h-[256px] items-center justify-center overflow-hidden bg-[var(--cream-deep)] md:min-h-[384px]">
      {hasPhoto ? (
        <>
          <Image
            src={photo!.src}
            alt={photo!.alt}
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover object-[center_28%]"
            priority={index === 1}
          />
          {/* Scrims keep the corner meta legible over any photo. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent"
          />
        </>
      ) : (
        <>
          {/* Diagonal hairline texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent 0, transparent 24px, rgba(34,26,15,0.03) 24px, rgba(34,26,15,0.03) 25px)",
            }}
          />

          {/* Central illustration */}
          <div className="relative z-[2] aspect-square w-[176px] md:w-[208px]">
            {/* White framed circle */}
            <div className="absolute inset-0 overflow-hidden rounded-full border-2 border-[var(--ink)] bg-[var(--shell)]">
              {/* Soft interior gradient */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse at 50% 100%, rgba(74,93,58,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 30%, rgba(242,169,0,0.08) 0%, transparent 50%)",
                }}
              />
              {/* Silhouette anchored to the bottom of the circle */}
              <div
                aria-hidden
                className="absolute bottom-0 left-1/2 w-[65%] -translate-x-1/2"
              >
                <Silhouette kind={silhouette} />
              </div>
            </div>

            {/* Initials pill */}
            <div
              aria-hidden
              className="absolute -top-2 -right-2 z-[3] flex size-[52px] items-center justify-center rounded-full border-[3px] border-[var(--shell)] bg-[var(--red)] font-[var(--font-fraunces)] text-[18px] font-bold text-[var(--shell)] shadow-[0_8px_20px_rgba(230,26,39,0.3)]"
            >
              {initials}
            </div>
          </div>
        </>
      )}

      {/* Top-left meta — flips to a light tone when sitting over a photo. */}
      <div
        className={[
          "absolute top-5 left-5 z-[2] font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.15em]",
          hasPhoto ? "text-[var(--shell)]/90" : "text-[var(--ink-soft)]",
        ].join(" ")}
      >
        Socio{socioPlural ? "s" : ""} desde{" "}
        <span
          className={[
            "font-[var(--font-fraunces)] text-[13px] font-bold italic",
            hasPhoto ? "text-[var(--shell)]" : "text-[var(--ink)]",
          ].join(" ")}
        >
          {socioDesde}
        </span>
      </div>

      {/* Bottom-left status tag (HeroUI Chip) — its solid shell fill reads on
          both the placeholder and a photo. */}
      <div className="absolute bottom-5 left-5 z-[2]">
        <Chip
          variant="secondary"
          className="rounded-full border border-[var(--ink)]/10 bg-[var(--shell)] px-3 py-1.5"
        >
          <span aria-hidden className="size-[5px] rounded-full bg-[var(--moss)]" />
          <Chip.Label className="px-0 font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Productor · {pad2(index)} de {pad2(total)}
          </Chip.Label>
        </Chip>
      </div>
    </div>
  );
}
