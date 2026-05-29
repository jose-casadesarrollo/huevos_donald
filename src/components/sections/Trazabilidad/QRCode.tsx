/**
 * Decorative QR code — purely visual, NOT a real scannable code.
 * 3 detector squares (corners), pseudo-random body pattern, embedded
 * red dot logo at center. Pattern is deterministic so server-rendered
 * markup matches client (no hydration mismatch).
 */

// Deterministic dot pattern over a 25×25 cell grid (each cell 4×4 in viewBox).
// Skips detector zones (corners) and the embedded-logo zone (center 5×5 cells).
const QR_DOTS: ReadonlyArray<[number, number]> = (() => {
  const dots: [number, number][] = [];
  const seed = (x: number, y: number) => ((x * 31 + y * 17 + 13) ^ 0x55) & 0x7;
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < 25; x++) {
      if (x < 7 && y < 7) continue; // top-left detector
      if (x > 17 && y < 7) continue; // top-right detector
      if (x < 7 && y > 17) continue; // bottom-left detector
      if (x >= 10 && x <= 14 && y >= 10 && y <= 14) continue; // center logo zone
      if (seed(x, y) > 4) dots.push([x * 4, y * 4]);
    }
  }
  return dots;
})();

function Detector({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="0" y="0" width="22" height="22" fill="var(--ink)" />
      <rect x="4" y="4" width="14" height="14" fill="var(--shell)" />
      <rect x="8" y="8" width="6" height="6" fill="var(--ink)" />
    </g>
  );
}

export function QRCode() {
  return (
    <div
      aria-hidden
      className="flex w-[140px] shrink-0 flex-col items-center gap-3"
    >
      <div className="rounded-lg border border-[var(--ink)]/10 bg-[var(--shell)] p-2.5">
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Código QR del lote</title>
          {/* Body dots */}
          {QR_DOTS.map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="4" height="4" fill="var(--ink)" />
          ))}
          {/* Detector squares */}
          <Detector x={0} y={0} />
          <Detector x={78} y={0} />
          <Detector x={0} y={78} />
          {/* Embedded brand logo */}
          <rect x="40" y="40" width="20" height="20" fill="var(--shell)" />
          <circle cx="50" cy="50" r="6" fill="var(--red)" />
        </svg>
      </div>
      <span className="font-[var(--font-jetbrains-mono)] text-[9px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
        Escaneá para verificar
      </span>
    </div>
  );
}
