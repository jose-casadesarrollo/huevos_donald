// Tipos de la tienda (venta unitaria de cajas). Mantener en sync con data.ts.
// Estructurado para que el fetching real reemplace a data.ts sin tocar los
// componentes: todos reciben `Product` por props.

export interface ProductImage {
  src: string;
  alt: string;
}

export interface LoteInfo {
  code: string; // "DN·2418·PN"
  origin: string; // "Campo Las Acacias, Paine"
  producer: string; // "Familia Pérez"
  caliber: string; // "L · 60–65g"
  laid: string; // "Hace 2 días"
}

export interface ProductDetailContent {
  description: string;
  traceability: string;
  storage: string;
}

export interface Product {
  id: string;
  slug: string; // "docena"
  formatShort: string; // "Docena" / "½ Docena" / "Docena ½" / "Bandeja 30"
  name: string; // "Docena de huevos"
  units: number; // 12
  unitsLabel: string; // "12 huevos"
  subtitle: string; // "12 huevos free range · Calibre L"
  price: string; // "5.490" — CLP, separador de miles con punto
  pricePerUnit: string; // "457"
  tags: string[]; // ["Calibre L", "Free range"]
  inStock: boolean;
  images: ProductImage[]; // la primera es la principal
  lote: LoteInfo;
  content: ProductDetailContent;
  relatedSlugs: string[]; // slugs de productos relacionados
}

export type DeliveryIconName = "truck" | "shield" | "clock";

export interface DeliveryPoint {
  icon: DeliveryIconName;
  title: string;
  text: string;
}

/* ── Contrato de props/callbacks (lo conecta el consumidor) ─────────────────
 * Los callbacks son OPCIONALES: cuando faltan, el botón hace solo el feedback
 * visual y registra un `console.log` de ejemplo. La lógica real de carrito /
 * checkout la conecta quien use estos componentes. */

export interface ProductCardProps {
  product: Product;
  href?: string; // link al detalle; por defecto `/tienda/${slug}`
  compact?: boolean; // variante para relacionados (oculta precio por unidad)
  onAddToCart?: (productId: string, qty: number) => void; // qty = 1 desde la card
}

export interface ProductDetailProps {
  product: Product;
  related?: Product[]; // resueltos server-side desde la DB (relatedSlugs)
  onAddToCart?: (productId: string, qty: number) => void;
  onBuyNow?: (productId: string, qty: number) => void;
}
