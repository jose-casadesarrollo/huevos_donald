/**
 * Camera/scan-style L-corners overlaid on the four inner corners of a
 * `position: relative` parent (the hero video card and each plan photo). Purely
 * decorative — same motif as the Trazabilidad certificate and the landing hero.
 *
 * `light` (default) draws them in `--shell` to read over a photo/video; pass
 * `light={false}` for the ink-colored variant over light surfaces.
 */
export function ScanCorners({ light = true }: { light?: boolean }) {
  const color = light ? "var(--shell)" : "var(--ink)";
  const corner = "absolute h-[22px] w-[22px] opacity-60";

  return (
    <span aria-hidden className="pointer-events-none absolute inset-[14px] z-[3]">
      <span
        className={`${corner} left-0 top-0 rounded-tl-[4px] border-l-2 border-t-2`}
        style={{ borderColor: color }}
      />
      <span
        className={`${corner} right-0 top-0 rounded-tr-[4px] border-r-2 border-t-2`}
        style={{ borderColor: color }}
      />
      <span
        className={`${corner} bottom-0 left-0 rounded-bl-[4px] border-b-2 border-l-2`}
        style={{ borderColor: color }}
      />
      <span
        className={`${corner} bottom-0 right-0 rounded-br-[4px] border-b-2 border-r-2`}
        style={{ borderColor: color }}
      />
    </span>
  );
}
