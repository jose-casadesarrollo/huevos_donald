export type LoteStatus = "EN RUTA" | "DESPACHADO";

export interface Lote {
  id: string;
  productor: string;
  granja: string;
  ubicacion: string;
  postura: string;
  distanciaKm: number;
  status: LoteStatus;
  sticker: string;
}

export const lotes: Lote[] = [
  {
    id: "DN-2417-SE",
    productor: "Don Manuel",
    granja: "Granja San Esteban",
    ubicacion: "San Esteban, V Región",
    postura: "Hoy · 06:42",
    distanciaKm: 87,
    status: "EN RUTA",
    sticker: "FRESCO · 36H",
  },
  {
    id: "DN-2418-PN",
    productor: "Familia Pérez",
    granja: "Campo Las Acacias",
    ubicacion: "Paine, RM",
    postura: "Hoy · 07:15",
    distanciaKm: 42,
    status: "EN RUTA",
    sticker: "FRESCO · 24H",
  },
  {
    id: "DN-2419-MP",
    productor: "Las Soto",
    granja: "Huertos Mallarauco",
    ubicacion: "Mallarauco, RM",
    postura: "Ayer · 17:30",
    distanciaKm: 64,
    status: "DESPACHADO",
    sticker: "LOTE DEL DÍA",
  },
  {
    id: "DN-2420-TT",
    productor: "Don Juan",
    granja: "Caleu Kuram",
    ubicacion: "Til Til, RM",
    postura: "Hoy · 05:55",
    distanciaKm: 71,
    status: "EN RUTA",
    sticker: "FRESCO · 12H",
  },
];
