import type { Productor, RedStats } from "./types";

// ⚠️ QUOTES PLACEHOLDER: estas frases son ficticias para diseño.
// Antes de publicar, validar con cada productor real y conseguir consentimiento
// por escrito para usar su nombre y atribuirle una frase.

/**
 * The producer network shown in the carousel. Copy is Chilean Spanish.
 *
 * Note: `total` is the size of the *published* network (8) while this array
 * only ships the first few profiles — the carousel logic scales to whatever
 * is present here, and the "01 DE 08" tag reads from `total`.
 */
export const productores: Productor[] = [
  {
    id: "don-manuel",
    index: 1,
    total: 8,
    initials: "DM",
    socioDesde: 2024,
    socioPlural: false,
    rol: "El productor",
    nombre: "Don Manuel Henríquez",
    granja: "Granja San Esteban",
    ubicacion: {
      short: "San Esteban, V",
      long: "Valle del Aconcagua · V Región",
    },
    distanciaKm: 87,
    quote:
      "Mis gallinas no saben lo que es una jaula. Salen al campo cada mañana y vuelven al gallinero cuando se pone el sol.",
    stats: [
      { label: "Gallinas", value: "320", sub: "Lohmann Brown" },
      { label: "Pradera", value: "1.500 m²", sub: "4 m² por gallina" },
      { label: "Producción", value: "~280/día", sub: "Promedio anual" },
    ],
    mapPosition: { x: 30, y: 35, labelCode: "SE", labelOffsetX: 8, labelOffsetY: 2 },
    silhouette: "manuel",
    photo: {
      src: "/DonManuel_HuevosDonald.png",
      alt: "Don Manuel Henríquez de pie en su pradera, con sombrero y rodeado de gallinas, frente a la cordillera.",
    },
  },
  {
    id: "familia-perez",
    index: 2,
    total: 8,
    initials: "FP",
    socioDesde: 2024,
    socioPlural: true,
    rol: "Los productores",
    nombre: "Familia Pérez",
    granja: "Campo Las Acacias",
    ubicacion: {
      short: "Paine, RM",
      long: "Maipo Valley · Región Metropolitana",
    },
    distanciaKm: 42,
    quote:
      "Llevamos tres generaciones criando gallinas. Cuando llegó Donald, fue la primera vez que pudimos vender directo, sin un intermediario que se quede con la mitad.",
    stats: [
      { label: "Gallinas", value: "480", sub: "Híbrido criollo" },
      { label: "Pradera", value: "2.400 m²", sub: "5 m² por gallina" },
      { label: "Producción", value: "~410/día", sub: "Promedio anual" },
    ],
    mapPosition: { x: 33, y: 58, labelCode: "PN", labelOffsetX: 7, labelOffsetY: 2 },
    silhouette: "perez",
    photo: {
      src: "/familiaX_huevosDonald.png",
      alt: "La Familia Pérez frente a su casa de campo, con la cordillera nevada de fondo.",
    },
  },
  {
    id: "hermanas-soto",
    index: 3,
    total: 8,
    initials: "LS",
    socioDesde: 2025,
    socioPlural: true,
    rol: "Las productoras",
    nombre: "Hermanas Soto",
    granja: "Huertos Mallarauco",
    ubicacion: {
      short: "Mallarauco, RM",
      long: "Valle de Mallarauco · RM",
    },
    distanciaKm: 64,
    quote:
      "Empezamos con 50 gallinas en el patio. Hoy somos parte de una red que entiende que la calidad importa más que el volumen.",
    stats: [
      { label: "Gallinas", value: "220", sub: "Araucana + criolla" },
      { label: "Pradera", value: "980 m²", sub: "4.5 m² por gallina" },
      { label: "Producción", value: "~190/día", sub: "Huevos azules + marrones" },
    ],
    mapPosition: { x: 22, y: 52, labelCode: "MAL", labelOffsetX: -16, labelOffsetY: -4 },
    silhouette: "soto",
    photo: {
      src: "/hermanas_soto_huevosDonald.png",
      alt: "Las Hermanas Soto sonriendo en su huerto, sosteniendo una caja de madera llena de huevos.",
    },
  },
  {
    id: "don-juan",
    index: 4,
    total: 8,
    initials: "DJ",
    socioDesde: 2025,
    socioPlural: false,
    rol: "El productor",
    nombre: "Don Juan Cortés",
    granja: "Caleu Kuram",
    ubicacion: {
      short: "Til Til, RM",
      long: "Comuna de Til Til · RM",
    },
    distanciaKm: 71,
    quote:
      "Lo que me pidieron fue lo que ya hacía: cuidar bien a las gallinas y entregar huevos frescos. La diferencia es que ahora alguien valora ese trabajo.",
    stats: [
      { label: "Gallinas", value: "350", sub: "Lohmann Brown" },
      { label: "Pradera", value: "1.750 m²", sub: "5 m² por gallina" },
      { label: "Producción", value: "~310/día", sub: "Promedio anual" },
    ],
    mapPosition: { x: 30, y: 40, labelCode: "TT", labelOffsetX: 8, labelOffsetY: 2 },
    silhouette: "juan",
    photo: {
      src: "/don_Juan_huevosdonald.png",
      alt: "Don Juan Cortés con sombrero de paja y las manos en la cintura, junto a sus gallinas en el cerro.",
    },
  },
];

/** Header counter — the network at a glance. */
export const redStats: RedStats = {
  productores: 8,
  regiones: 3,
  intermediarios: 0,
};
