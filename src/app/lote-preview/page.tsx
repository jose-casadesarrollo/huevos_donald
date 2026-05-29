import { LoteCarousel } from "@/components/hero/LoteCarousel";

export default function LoteCarouselPreview() {
  return (
    <main className="bg-background min-h-screen p-8 md:p-16">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:gap-16">
        <LoteCarousel />
        <div className="text-foreground">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Slot del hero
          </h1>
          <p className="text-muted mt-4 text-base md:text-lg">
            Esta página existe sólo para validar <code>LoteCarousel</code> en aislamiento. La
            columna izquierda contiene el componente; la derecha es un placeholder del contenido
            real del hero.
          </p>
          <ul className="text-muted mt-6 list-disc space-y-2 pl-5 text-sm">
            <li>Auto-rota cada 5 s, pausa en hover/focus.</li>
            <li>Soporta flechas ←/→ con teclado, swipe en mobile.</li>
            <li>Respeta <code>prefers-reduced-motion</code>.</li>
            <li>Click en los dots salta a cualquier lote.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
