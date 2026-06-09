// data.ts — MOCK. Reemplazar por fetching real más adelante (productos, stock,
// lote del día) sin tocar los componentes: todos consumen el tipo `Product`.
//
// ⚠️ PRECIOS PLACEHOLDER: ajustar con unit economics real antes de publicar.
// ⚠️ PRODUCTORES FICTICIOS: los nombres en `lote` (Familia Pérez, etc.) son
//    placeholder y requieren consentimiento real antes de publicar.
// ⚠️ POSTURA "Hace 2 días": ilustrativo; en producción debe venir del dato real
//    del lote del envase.
import type { DeliveryPoint, Product } from "./types";

/**
 * Gate de media. Mientras es `false`, `<ProductImage>` renderiza un placeholder
 * cálido en vez de `next/image` — así se ve la UI antes de tener las fotos de
 * cartones. Cuando las fotos lleguen a `public/tienda/`, ponlo en `true`.
 */
export const MEDIA_READY: boolean = false;

export const products: Product[] = [
  {
    id: "p6",
    slug: "media-docena",
    formatShort: "½ Docena",
    name: "Media docena",
    units: 6,
    unitsLabel: "6 huevos",
    subtitle: "6 huevos free range · Calibre L",
    price: "2.990",
    pricePerUnit: "498",
    tags: ["Calibre L", "Free range"],
    inStock: true,
    images: [
      { src: "/tienda/media-docena-carton.jpg", alt: "Media docena de huevos en cartón" },
      { src: "/tienda/huevo-macro.jpg", alt: "Huevo en detalle macro" },
      { src: "/tienda/yema.jpg", alt: "Yema naranja" },
      { src: "/tienda/origen.jpg", alt: "Gallinas en el campo de origen" },
    ],
    lote: {
      code: "DN·2417·SE",
      origin: "Granja San Esteban, V Región",
      producer: "Don Manuel Henríquez",
      caliber: "L · 60–65g",
      laid: "Hace 2 días",
    },
    content: {
      description:
        "Media docena de huevos de gallinas criadas en libertad (free range) en la Granja San Esteban, en la V Región. Las gallinas pastorean al aire libre y se alimentan de forma natural, lo que se traduce en una yema más naranja, firme y sabrosa. El formato justo para quienes cocinan poco o quieren probar.",
      traceability:
        "Cada lote tiene un código único (DN·2417·SE) que identifica el campo, el productor y la fecha de postura. Escanea el código del envase para ver de dónde viene exactamente el huevo que te estás comiendo.",
      storage:
        "Mantén los huevos refrigerados. Consume preferentemente dentro de los 21 días posteriores a la postura.",
    },
    relatedSlugs: ["docena", "docena-media", "bandeja-30"],
  },
  {
    id: "p12",
    slug: "docena",
    formatShort: "Docena",
    name: "Docena de huevos",
    units: 12,
    unitsLabel: "12 huevos",
    subtitle: "12 huevos free range · Calibre L",
    price: "5.490",
    pricePerUnit: "457",
    tags: ["Calibre L", "Free range"],
    inStock: true,
    images: [
      { src: "/tienda/docena-carton.jpg", alt: "Docena de huevos en cartón abierto" },
      { src: "/tienda/huevo-macro.jpg", alt: "Huevo en detalle macro" },
      { src: "/tienda/yema.jpg", alt: "Yema naranja" },
      { src: "/tienda/origen.jpg", alt: "Gallinas en el campo de origen" },
    ],
    lote: {
      code: "DN·2418·PN",
      origin: "Campo Las Acacias, Paine",
      producer: "Familia Pérez",
      caliber: "L · 60–65g",
      laid: "Hace 2 días",
    },
    content: {
      description:
        "Huevos de gallinas criadas en libertad (free range) en el Campo Las Acacias, en Paine. Las gallinas se alimentan en praderas al aire libre, lo que se traduce en una yema más naranja, firme y sabrosa. Cada caja viene de un lote identificado y trazable.",
      traceability:
        "Cada lote tiene un código único (DN·2418·PN) que identifica el campo, el productor y la fecha de postura. Puedes escanear el código del envase para ver toda la información del huevo que estás comiendo.",
      storage:
        "Mantén los huevos refrigerados. Por su frescura y cáscara más resistente, se conservan en óptimas condiciones por varias semanas. Consume preferentemente dentro de los 21 días posteriores a la postura.",
    },
    relatedSlugs: ["media-docena", "docena-media", "bandeja-30"],
  },
  {
    id: "p18",
    slug: "docena-media",
    formatShort: "Docena ½",
    name: "Docena y media",
    units: 18,
    unitsLabel: "18 huevos",
    subtitle: "18 huevos free range · Calibre L",
    price: "7.990",
    pricePerUnit: "444",
    tags: ["Calibre L", "Free range"],
    inStock: true,
    images: [
      { src: "/tienda/docena-media-carton.jpg", alt: "Docena y media de huevos en cartón" },
      { src: "/tienda/huevo-macro.jpg", alt: "Huevo en detalle macro" },
      { src: "/tienda/yema.jpg", alt: "Yema naranja" },
      { src: "/tienda/origen.jpg", alt: "Gallinas en el campo de origen" },
    ],
    lote: {
      code: "DN·2419·MP",
      origin: "Huertos Mallarauco, RM",
      producer: "Hermanas Soto",
      caliber: "L · 60–65g",
      laid: "Hace 2 días",
    },
    content: {
      description:
        "Docena y media de huevos free range de los Huertos Mallarauco, en la Región Metropolitana. Las gallinas se crían en praderas abiertas, sin jaulas, con una dieta natural que le da a la yema su color naranja característico. Un formato cómodo para toda la semana.",
      traceability:
        "Lote DN·2419·MP, trazable desde el campo: identifica productor, origen y fecha de postura. Escanea el código del envase para conocer la historia completa de tus huevos.",
      storage:
        "Mantén los huevos refrigerados. Consume preferentemente dentro de los 21 días posteriores a la postura.",
    },
    relatedSlugs: ["media-docena", "docena", "bandeja-30"],
  },
  {
    id: "p30",
    slug: "bandeja-30",
    formatShort: "Bandeja 30",
    name: "Bandeja 30",
    units: 30,
    unitsLabel: "30 huevos",
    subtitle: "30 huevos free range · Calibre L",
    price: "12.990",
    pricePerUnit: "433",
    tags: ["Calibre L", "Free range"],
    inStock: true,
    images: [
      { src: "/tienda/bandeja-30-maple.jpg", alt: "Bandeja de 30 huevos (maple)" },
      { src: "/tienda/huevo-macro.jpg", alt: "Huevo en detalle macro" },
      { src: "/tienda/yema.jpg", alt: "Yema naranja" },
      { src: "/tienda/origen.jpg", alt: "Gallinas en el campo de origen" },
    ],
    lote: {
      code: "DN·2420·TT",
      origin: "Caleu Kuram, Til Til, RM",
      producer: "Don Juan Cortés",
      caliber: "L · 60–65g",
      laid: "Hace 2 días",
    },
    content: {
      description:
        "La bandeja de 30, pensada para quienes cocinan harto o son varios en casa. Huevos free range de Caleu, en Til Til, de gallinas criadas en libertad con alimentación natural. La misma frescura y trazabilidad, en formato grande y más conveniente por huevo.",
      traceability:
        "Lote DN·2420·TT, trazable desde Til Til: campo, productor y fecha de postura en un solo código. Escanéalo en el envase para ver el origen de cada huevo.",
      storage:
        "Mantén los huevos refrigerados. Consume preferentemente dentro de los 21 días posteriores a la postura.",
    },
    relatedSlugs: ["media-docena", "docena", "docena-media"],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/** Link al detalle de un producto. */
export const tiendaHref = (slug: string): string => `/tienda/${slug}`;

export const deliveryPoints: DeliveryPoint[] = [
  { icon: "truck", title: "Despacho gratis", text: "en tu comuna, en el día asignado." },
  { icon: "shield", title: "Trazabilidad por lote", text: "sabes de qué campo viene cada huevo." },
  { icon: "clock", title: "Fresco siempre", text: "despachamos a pocos días de la postura." },
];
