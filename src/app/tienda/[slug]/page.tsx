import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { ProductDetail } from "@/components/tienda/ProductDetail";
import {
  getRelatedProducts,
  getStoreProductBySlug,
  getStoreProducts,
} from "@/components/tienda/loader";
import { TIENDA_TOKENS } from "@/components/tienda/tokens";

// ISR: revalida desde la DB cada 5 min (precio/stock server-authoritative).
export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getStoreProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado — Huevos Donald" };
  return {
    title: `${product.name} — Tienda Huevos Donald`,
    description: product.subtitle,
  };
}

/**
 * `/tienda/[slug]` — vista detalle. Resuelve el producto y sus relacionados
 * desde la DB (precios server-authoritative); `notFound()` si no existe. Los
 * callbacks de carrito/checkout los inyecta el CartProvider (ver layout).
 */
export default async function TiendaProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);

  return (
    <>
      <Nav />
      <main style={TIENDA_TOKENS} className="bg-background">
        <ProductDetail product={product} related={related} />
      </main>
      <Footer />
    </>
  );
}
