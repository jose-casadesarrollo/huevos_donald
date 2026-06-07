import { ChileMiniMap } from "./ChileMiniMap";
import { StatValue } from "./StatValue";
import type { Productor } from "./types";

/**
 * Right column of a slide: producer identity (role / name / farm + location
 * pill), the quote with a red rule + decorative opening mark, a 3-up stats grid,
 * and the distance-to-Santiago mini map. `inView` gates the hen-count count-up.
 */
export function ProductorInfo({
  productor,
  inView,
}: {
  productor: Productor;
  inView: boolean;
}) {
  const { rol, nombre, granja, ubicacion, quote, stats, mapPosition, distanciaKm } =
    productor;

  return (
    <div className="flex flex-col gap-5 px-6 py-7 md:px-10 md:py-9">
      {/* Identity header */}
      <div className="flex flex-col gap-4 border-b border-dashed border-[var(--ink)]/15 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="mb-2 font-[var(--font-jetbrains-mono)] text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
            {rol}
          </p>
          <h3
            className="mb-1.5 font-[var(--font-fraunces)] font-bold leading-none tracking-[-0.02em] text-[var(--ink)]"
            style={{ fontSize: "clamp(23px, 2.7vw, 32px)" }}
          >
            {nombre}
          </h3>
          <p className="font-[var(--font-fraunces)] text-[15px] font-medium italic text-[var(--red)]">
            {granja}
          </p>
        </div>

        {/* Location pill */}
        <div className="shrink-0 rounded-xl border border-[var(--ink)]/8 bg-[var(--cream)] px-3.5 py-2 text-left md:text-right">
          <p className="font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Ubicación
          </p>
          <p className="font-[var(--font-fraunces)] text-[14px] font-bold text-[var(--ink)]">
            {ubicacion.short}
          </p>
        </div>
      </div>

      {/* Quote */}
      <blockquote className="relative border-l-2 border-[var(--red)] pl-[18px]">
        <span
          aria-hidden
          className="absolute -top-2 left-1 font-[var(--font-fraunces)] text-[32px] leading-none italic text-[var(--red)]"
        >
          &ldquo;
        </span>
        <p
          className="font-[var(--font-fraunces)] font-medium italic leading-[1.4] text-[var(--ink)]"
          style={{ fontSize: "clamp(14px, 1.3vw, 15px)" }}
        >
          {quote}
        </p>
      </blockquote>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[10px] border border-[var(--ink)]/6 bg-[var(--cream)] px-3 py-2.5"
          >
            <p className="mb-1 font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              {stat.label}
            </p>
            <p className="font-[var(--font-fraunces)] text-[14px] font-bold leading-[1.1] text-[var(--ink)]">
              <StatValue value={stat.value} run={inView} />
            </p>
            <p className="mt-0.5 font-[var(--font-dm-sans)] text-[10px] text-[var(--ink-soft)]">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Mini map + distance */}
      <div className="flex items-center gap-3 rounded-[10px] border border-[var(--ink)]/6 bg-[var(--cream)] px-3.5 py-3">
        <div className="h-16 w-[56px] shrink-0">
          <ChileMiniMap position={mapPosition} />
        </div>
        <div className="min-w-0">
          <p className="font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]">
            Distancia a Santiago
          </p>
          <p className="font-[var(--font-fraunces)] text-[14px] leading-[1.2] font-bold text-[var(--ink)]">
            <strong className="font-bold text-[var(--red)]">{distanciaKm} km</strong>
          </p>
          <p className="mt-1 font-[var(--font-dm-sans)] text-[11px] text-[var(--ink-soft)]">
            {ubicacion.long}
          </p>
        </div>
      </div>
    </div>
  );
}
