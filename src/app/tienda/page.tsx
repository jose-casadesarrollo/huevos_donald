import type { Metadata } from "next";

import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { ProductGrid } from "@/components/tienda/ProductGrid";
import { getStoreProducts } from "@/components/tienda/loader";
import { TIENDA_TOKENS } from "@/components/tienda/tokens";

export const metadata: Metadata = {
  title: "Tienda — Huevos Donald",
  description:
    "Compra cajas de huevos free range por unidad, sin suscripción. Media docena, docena, docena y media o bandeja de 30, del mismo lote trazable. Despacho gratis en tu comuna.",
};

// ISR: revalida el catálogo desde la DB cada 5 min (precios/stock server-authoritative).
export const revalidate = 300;

/**
 * `/tienda` — vista grid (catálogo). Header de sección + cuadrícula de 4
 * formatos. La paleta se inyecta una vez en el `<main>` vía `TIENDA_TOKENS`.
 * Los <Nav>/<Footer> son el layout compartido del sitio.
 */
export default async function TiendaPage() {
  const products = await getStoreProducts();

  return (
    <>
      <Nav />
      <main style={TIENDA_TOKENS} className="bg-background">
        {/* Header de sección */}
        <section className="px-6 pb-12 pt-[120px] md:pt-[132px]">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex items-center gap-3">
              <span aria-hidden className="inline-block h-px w-7 bg-[var(--red)]" />
              <span className="font-[var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.2em]">
                <span className="text-[var(--ink-soft)]">TIENDA /</span>{" "}
                <span className="text-[var(--red)]">Compra por unidad</span>
              </span>
            </div>

            <h1
              className="mt-5 font-[var(--font-fraunces)] font-bold leading-[0.98] tracking-tight text-[var(--ink)]"
              style={{ fontSize: "clamp(36px, 5vw, 60px)" }}
            >
              Sin suscripción.
              <br />
              Solo <em className="font-medium italic text-[var(--red)]">buenos huevos.</em>
            </h1>

            <p className="mt-5 max-w-[520px] font-[var(--font-dm-sans)] text-[16px] leading-[1.55] text-[var(--ink-soft)]">
              ¿No quieres comprometerte aún? Pide una caja cuando quieras. Los mismos huevos free
              range, del mismo lote trazable.
            </p>
          </div>
        </section>

        {/* Grid */}
        <section className="px-6 pb-[100px]">
          <ProductGrid products={products} />
        </section>
      </main>
      <Footer />
    </>
  );
}
