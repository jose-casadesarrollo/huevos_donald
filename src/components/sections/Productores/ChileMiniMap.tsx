import type { ProductorMapPosition } from "./types";

/**
 * Decorative mini-map of central Chile. Renders a fixed base silhouette plus the
 * producer's dot (and a dashed line back to Santiago) at the relative coords in
 * `position`. Purely presentational and `aria-hidden` — the textual distance is
 * announced by the sibling copy in <ProductorInfo />.
 */
export function ChileMiniMap({ position }: { position: ProductorMapPosition }) {
  const midX = (position.x + 32) / 2;
  const midY = (position.y + 50) / 2;

  return (
    <svg
      viewBox="0 0 70 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-full w-full"
    >
      {/* Silueta zona central */}
      <path
        d="M 35 5 Q 28 18, 30 30 Q 26 42, 32 55 Q 28 65, 34 75"
        stroke="var(--ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />
      {/* Línea de costa */}
      <path
        d="M 10 5 Q 14 20, 12 30 Q 18 45, 14 60 Q 18 70, 16 78"
        stroke="var(--ink)"
        strokeWidth="0.8"
        opacity="0.15"
        fill="none"
      />
      {/* Santiago */}
      <circle cx="32" cy="50" r="3" fill="var(--ink)" opacity="0.4" />
      <text
        x="38"
        y="52"
        fontFamily="var(--font-jetbrains-mono)"
        fontSize="5"
        fill="var(--ink-soft)"
        opacity="0.6"
      >
        STGO
      </text>
      {/* Punto productor */}
      <circle cx={position.x} cy={position.y} r="4" fill="var(--red)" />
      <circle
        cx={position.x}
        cy={position.y}
        r="7"
        fill="none"
        stroke="var(--red)"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <text
        x={position.x + position.labelOffsetX}
        y={position.y + position.labelOffsetY}
        fontFamily="var(--font-jetbrains-mono)"
        fontSize="5"
        fill="var(--red)"
        fontWeight="700"
      >
        {position.labelCode}
      </text>
      {/* Conexión punteada al destino */}
      <path
        d={`M ${position.x} ${position.y + 4} Q ${midX} ${midY}, 32 47`}
        stroke="var(--red)"
        strokeWidth="0.8"
        strokeDasharray="1 2"
        opacity="0.5"
        fill="none"
      />
    </svg>
  );
}
