/**
 * Stand-in for a media asset that hasn't landed in `public/planes/` yet. Fills
 * its (positioned, aspect-ratio'd) parent with a designed dark block — diagonal
 * hairline texture, a framed glyph, the asset type, and the asset's alt text — so
 * the page reads as intentional rather than broken before the real food/ASMR
 * footage arrives. Flip `MEDIA_READY` in data.ts to swap these for <video>/<img>.
 *
 * Decorative (`aria-hidden`); the real `alt`/`aria-label` ships with the media.
 */
export function MediaPlaceholder({
  kind,
  label,
}: {
  kind: "video" | "image";
  label: string;
}) {
  return (
    <div
      aria-hidden
      data-placeholder={kind}
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--dark-soft)] px-6 text-center"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent 0, transparent 15px, rgba(255,251,240,0.025) 15px, rgba(255,251,240,0.025) 16px)",
        }}
      />

      <span className="relative flex size-12 items-center justify-center rounded-full border border-[rgba(255,251,240,0.2)] text-[rgba(255,251,240,0.55)]">
        {kind === "video" ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
            <path d="M9 7.5v9l7-4.5-7-4.5z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <rect x="3.5" y="5" width="17" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M5 17l4.5-4.5L13 16l3-3 3 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      <span className="relative font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.18em] text-[rgba(255,251,240,0.5)]">
        {kind === "video" ? "Video" : "Imagen"} · pendiente
      </span>

      <p className="relative max-w-[88%] font-[var(--font-dm-sans)] text-[12px] leading-[1.45] text-[rgba(255,251,240,0.4)]">
        {label}
      </p>
    </div>
  );
}
