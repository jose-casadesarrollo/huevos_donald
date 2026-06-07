import { MediaPlaceholder } from "./MediaPlaceholder";
import { ScanCorners } from "./ScanCorners";
import { SmartVideo } from "./SmartVideo";
import { MEDIA_READY, heroData } from "./data";
import { GRID_TEXTURE } from "./tokens";

const BTN_YOLK =
  "inline-flex items-center gap-1.5 rounded-full bg-[var(--yolk)] px-6 py-3.5 font-[var(--font-dm-sans)] text-[14px] font-semibold text-[var(--ink)] shadow-[0_2px_0_var(--yolk-deep)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--yolk-deep)] motion-reduce:transition-none";

const BTN_GHOST_LIGHT =
  "inline-flex items-center rounded-full border border-[rgba(255,251,240,0.3)] px-5 py-3.5 font-[var(--font-dm-sans)] text-[14px] font-semibold text-[var(--shell)] transition-colors duration-200 ease-out hover:border-[var(--shell)] hover:bg-[rgba(255,251,240,0.06)] motion-reduce:transition-none";

// Small status-dot pulse for the "RECIÉN PUESTO" pill; off under reduced motion.
const HERO_KEYFRAMES = `
@keyframes planes-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.45; transform: scale(0.8); }
}
@media (prefers-reduced-motion: reduce) {
  .planes-pulse { animation: none !important; }
  .planes-vfloat { transform: none !important; }
}
`;

/**
 * Block 1 — the dark hero. Two columns on `≥940px`: copy + CTAs + mini-stats on
 * the left, a 4:5 video card (with scan corners and three floating "ficha"
 * overlays) on the right. Server-rendered shell; the only client island is the
 * autoplaying <SmartVideo> (gated behind `MEDIA_READY`).
 */
export function PlanesHero() {
  const { eyebrow, stats, video, floats } = heroData;

  return (
    <section
      aria-labelledby="planes-hero-title"
      className="relative overflow-hidden bg-[var(--dark)] px-6 pb-[88px] pt-[112px] text-[var(--shell)] md:pt-[120px]"
    >
      <style>{HERO_KEYFRAMES}</style>

      {/* Faint grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: GRID_TEXTURE }}
      />
      {/* Soft yellow glow, top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[-25%] h-[460px] w-[620px]"
        style={{ background: "radial-gradient(ellipse, rgba(242,169,0,0.1) 0%, transparent 70%)" }}
      />

      <div className="relative z-[1] mx-auto grid max-w-[1200px] items-center gap-12 min-[940px]:grid-cols-2 min-[940px]:gap-16">
        {/* Left — copy */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span aria-hidden className="inline-block h-px w-7 bg-[var(--yolk)]" />
            <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
              <span className="text-[rgba(255,251,240,0.4)]">{eyebrow.dim}</span>{" "}
              <span className="text-[var(--yolk)]">{eyebrow.main}</span>
            </span>
          </div>

          <h1
            id="planes-hero-title"
            className="font-[var(--font-fraunces)] font-bold leading-[0.96] tracking-tight"
            style={{ fontSize: "clamp(42px, 6.5vw, 82px)" }}
          >
            Elige tu plan.
            <br />
            El resto lo
            <br />
            <em className="font-medium italic text-[var(--yolk)]">ponemos nosotros.</em>
          </h1>

          <p className="max-w-[460px] font-[var(--font-dm-sans)] text-[17px] leading-[1.55] text-[rgba(255,251,240,0.7)]">
            Tres planes flexibles de huevos free range, con saldo que usas a tu ritmo y despacho
            gratis en tu comuna. Eliges el tamaño; nosotros ponemos la frescura.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a href="#comparar" className={BTN_YOLK}>
              Ver y comparar planes
              <span aria-hidden>→</span>
            </a>
            <a href="#planes-detalle" className={BTN_GHOST_LIGHT}>
              Conocer cada uno
            </a>
          </div>

          {/* Mini-stats */}
          <dl className="mt-2 flex flex-wrap gap-x-10 gap-y-4 border-t border-[rgba(255,251,240,0.12)] pt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dd className="font-[var(--font-fraunces)] text-[26px] font-bold leading-none">
                  {stat.curYolk ? (
                    <>
                      <span className="text-[var(--yolk)]">$</span>
                      {stat.num.replace(/^\$/, "")}
                    </>
                  ) : (
                    stat.num
                  )}
                </dd>
                <dt className="font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.15em] text-[rgba(255,251,240,0.5)]">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Right — video card */}
        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-[rgba(255,251,240,0.12)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
            {MEDIA_READY ? (
              <SmartVideo
                src={video.src}
                poster={video.poster}
                alt={video.alt}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <MediaPlaceholder kind="video" label={video.alt} />
            )}

            <ScanCorners light />

            {/* Status — top-right */}
            <div className="absolute right-3 top-3 z-[5] inline-flex items-center gap-2 rounded-full border border-[rgba(74,93,58,0.4)] bg-[rgba(26,20,16,0.82)] px-3 py-1.5 backdrop-blur-[6px]">
              <span
                aria-hidden
                className="planes-pulse inline-block size-[6px] rounded-full bg-[var(--moss-light)]"
                style={{ animation: "planes-pulse 1.6s ease-in-out infinite" }}
              />
              <span className="font-[var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--shell)]">
                {floats.status}
              </span>
            </div>

            {/* Float TL — top-left, slight tilt */}
            <div
              className="planes-vfloat absolute left-3 top-14 z-[5] rounded-xl border border-[rgba(255,251,240,0.12)] bg-[rgba(26,20,16,0.85)] px-3.5 py-2.5 backdrop-blur-[8px]"
              style={{ transform: "rotate(-2deg)" }}
            >
              <div className="font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--yolk)]">
                {floats.tl.label}
              </div>
              <div className="font-[var(--font-fraunces)] text-[15px] font-bold leading-tight text-[var(--shell)]">
                {floats.tl.value}
              </div>
            </div>

            {/* Float BR — bottom-right, slight tilt */}
            <div
              className="planes-vfloat absolute bottom-4 right-3 z-[5] rounded-xl border border-[rgba(255,251,240,0.12)] bg-[rgba(26,20,16,0.85)] px-3.5 py-2.5 backdrop-blur-[8px]"
              style={{ transform: "rotate(2deg)" }}
            >
              <div className="font-[var(--font-jetbrains-mono)] text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--yolk)]">
                {floats.br.label}
              </div>
              <div className="font-[var(--font-fraunces)] text-[15px] font-bold leading-tight text-[var(--shell)]">
                {floats.br.value}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
