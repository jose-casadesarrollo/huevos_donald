import type {
  AsmrItem,
  CompareFeature,
  CompareHeadCol,
  HeroData,
  PlanesFaqItem,
  PlanFull,
} from "./types";

/**
 * Media gate. Cuando es `false`, los bloques renderizan <MediaPlaceholder> en
 * vez de <video>/<img>. Los assets reales ya están en `public/planes/` (3 clips
 * verticales 720×1280 + 2 fotos de tostada + 1 still de la sartén + pósters
 * extraídos de cada video), así que está en `true`.
 *
 * Pendiente de material definitivo: foto de repostería propia para Cocinero
 * (hoy usa un still del clip de la sartén) y, si se quieren, un bodegón de huevos
 * y una toma de gallinas free range para enriquecer la franja ASMR.
 */
export const MEDIA_READY = true;

// Entrada al checkout. Lleva el plan elegido para prellenar el alta.
// NOTA: `/register` aún no existe — repuntar a `/login` o a la ruta real de
// checkout cuando exista (las suscripciones requieren sesión).
export const CHECKOUT_PATH = "/register";
export const planHref = (planId: string): string => `${CHECKOUT_PATH}?plan=${planId}`;

// ⚠️ PRECIOS PLACEHOLDER: ajustar con unit economics real antes de publicar.
// (Espejados de la sección Planes del landing para mantener consistencia.)
export const plansFull: PlanFull[] = [
  {
    id: "esencial",
    num: "01",
    name: "Esencial",
    tagLabel: "Esencial",
    forWho: "Para una o dos personas. Desayunos sin drama.",
    includes: [
      "18 huevos al mes como saldo flexible",
      "Despacho gratis en tu comuna",
      "Puntos Donald en cada compra",
      "Pausa o cancela cuando quieras",
    ],
    price: "7.990",
    priceMetaEggs: "18 huevos · saldo flexible",
    ctaLabel: "Elegir Esencial",
    reverse: false,
    darkBg: false,
    media: {
      src: "/planes/plan-esencial.png",
      alt: "Tostada de palta con huevo pochado y yema naranja derramándose, en un café",
      ficha: {
        stats: ["Calibre L", "Yema naranja"],
        loteCode: "DN·2417·SE",
        saldoLabel: "Saldo mensual",
        eggs: 18,
        price: "7.990",
        pricePer: "al mes",
      },
    },
  },
  {
    id: "familia",
    num: "02",
    name: "Familia",
    tagLabel: "Familia · El más elegido",
    forWho: "Para 3 o 4 personas. El equilibrio justo.",
    includes: [
      "36 huevos al mes como saldo flexible",
      // ⚠️ Promo condicional: confirmar con el cliente antes de publicar.
      "20% off tu primer mes",
      "Recetas semanales por correo",
      "Puntos Donald x1.5",
    ],
    price: "13.990",
    priceMetaEggs: "36 huevos · saldo flexible",
    ctaLabel: "Elegir Familia",
    reverse: true,
    darkBg: true,
    media: {
      src: "/planes/plan-familia.png",
      alt: "Tostada de palta con huevo pochado y yema naranja sobre mesa de madera",
      ficha: {
        stats: ["Calibre L", "x1.5 puntos"],
        loteCode: "DN·2418·PN",
        saldoLabel: "Saldo mensual",
        eggs: 36,
        price: "13.990",
        pricePer: "al mes",
      },
    },
  },
  {
    id: "cocinero",
    num: "03",
    name: "Cocinero",
    tagLabel: "Cocinero",
    forWho: "Familias grandes o reposteros de fin de semana.",
    includes: [
      "72 huevos al mes como saldo flexible",
      "Acceso a lotes especiales",
      "Dos despachos al mes incluidos",
      "Puntos Donald x2",
    ],
    price: "24.990",
    priceMetaEggs: "72 huevos · saldo flexible",
    ctaLabel: "Elegir Cocinero",
    reverse: false,
    darkBg: false,
    media: {
      src: "/planes/plan-cocinero.jpg",
      alt: "Huevo friéndose en sartén de hierro con la yema naranja intensa",
      ficha: {
        stats: ["Calibre L", "x2 puntos"],
        loteCode: "DN·2420·TT",
        saldoLabel: "Saldo mensual",
        eggs: 72,
        price: "24.990",
        pricePer: "al mes",
      },
    },
  },
];

// Hero
export const heroData: HeroData = {
  eyebrow: { dim: "PLANES /", main: "Elige el tuyo" },
  stats: [
    { num: "18–72", label: "Huevos al mes" },
    { num: "$7.990", label: "Desde, al mes", curYolk: true },
    { num: "3", label: "Planes flexibles" },
  ],
  video: {
    src: "/planes/hero-yema.mp4",
    poster: "/planes/hero-yema-poster.jpg",
    alt: "Tenedor rompiendo la yema de un huevo pochado sobre tostada de palta",
  },
  floats: {
    status: "RECIÉN PUESTO",
    tl: { label: "Yema", value: "Naranja intensa" },
    br: { label: "Crianza", value: "Free range · Lote fresco" },
  },
};

// ASMR band — 3 clips verticales reales (720×1280). El `feature` (mano mojando
// pan en la yema) abre la franja. `bodegon`/`gallinas` quedan fuera hasta tener
// material propio de huevos en bodegón y gallinas free range.
export const asmrItems: AsmrItem[] = [
  {
    kind: "video",
    src: "/planes/asmr-feature.mp4",
    poster: "/planes/asmr-feature-poster.jpg",
    alt: "Pan tostado mojándose en la yema dorada de un huevo frito",
    feature: true,
  },
  {
    kind: "video",
    src: "/planes/asmr-pan.mp4",
    poster: "/planes/asmr-pan-poster.jpg",
    alt: "Huevo friéndose con borde crocante en sartén de hierro",
  },
  {
    kind: "video",
    src: "/planes/hero-yema.mp4",
    poster: "/planes/hero-yema-poster.jpg",
    alt: "Tenedor rompiendo la yema de un huevo pochado sobre tostada de palta",
  },
];

// Tabla comparativa
export const compareHead: CompareHeadCol[] = [
  { name: "Esencial", price: "$7.990/mes" },
  { name: "Familia", price: "$13.990/mes", badge: "Más elegido" },
  { name: "Cocinero", price: "$24.990/mes" },
];

export const compareFeatures: CompareFeature[] = [
  {
    name: "Huevos al mes",
    values: [
      { type: "text", text: "18" },
      { type: "text", text: "36" },
      { type: "text", text: "72" },
    ],
  },
  {
    name: "Despacho gratis",
    values: [{ type: "check" }, { type: "check" }, { type: "check" }],
  },
  {
    name: "Despachos al mes",
    values: [
      { type: "text", text: "1" },
      { type: "text", text: "1" },
      { type: "text", text: "2" },
    ],
  },
  {
    name: "Trazabilidad por lote",
    values: [{ type: "check" }, { type: "check" }, { type: "check" }],
  },
  {
    name: "Puntos Donald",
    values: [
      { type: "text", text: "x1" },
      { type: "text", text: "x1.5" },
      { type: "text", text: "x2" },
    ],
  },
  {
    name: "Recetas semanales",
    values: [{ type: "none" }, { type: "check" }, { type: "check" }],
  },
  {
    name: "Lotes especiales",
    values: [{ type: "none" }, { type: "none" }, { type: "check" }],
  },
  {
    name: "Pausa / cancela cuando quieras",
    values: [{ type: "check" }, { type: "check" }, { type: "check" }],
  },
];

// FAQ — incluye la nota de saldo (cumplimiento SERNAC: el saldo no se pierde
// mes a mes mientras la suscripción esté activa).
export const planesFaq: PlanesFaqItem[] = [
  {
    q: "¿Puedo cambiar de plan después?",
    a: "Sí, cuando quieras. Subes o bajas de plan desde tu cuenta y el cambio aplica en tu próximo ciclo, sin costo.",
  },
  {
    q: "¿Qué pasa con los huevos que no alcanzo a pedir?",
    a: "Tu saldo de huevos se mantiene vigente mientras tu suscripción esté activa. No se pierde mes a mes.",
  },
  {
    q: "¿El precio incluye el despacho?",
    a: "Sí. Todos los planes incluyen despacho gratis dentro de tu comuna de cobertura.",
  },
  {
    q: "¿Cómo funcionan los puntos Donald?",
    a: "Acumulas puntos con cada compra según tu plan (x1, x1.5 o x2). Los canjeas por huevos gratis, productos o despachos extra.",
  },
];
