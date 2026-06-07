/**
 * Type contracts for the "Productores" landing section (04 / Nuestra red).
 *
 * The data is 100% presentational placeholder content (see data.ts) — these
 * types intentionally model only what the editorial carousel renders, nothing
 * is persisted or sent anywhere.
 */

export type SilhouetteKind = "manuel" | "perez" | "soto" | "juan";

export interface ProductorStat {
  /** "Gallinas" | "Pradera" | "Producción". */
  label: string;
  /** "320" | "1.500 m²" | "~280/día". */
  value: string;
  /** Secondary line, e.g. "Lohmann Brown". */
  sub: string;
}

export interface ProductorMapPosition {
  /** Relative coords inside the mini-map's `0 0 70 80` viewBox (Santiago ≈ 32,50). */
  x: number;
  y: number;
  /** 2–3 letter code shown next to the dot, e.g. "SE" | "PN" | "MAL". */
  labelCode: string;
  /** Where to place that label relative to the dot. */
  labelOffsetX: number;
  labelOffsetY: number;
}

export interface Productor {
  id: string;
  /** Position within the published network (1-based). */
  index: number;
  /** Size of the full network (currently 8) — drives the "DE 08" tag. */
  total: number;
  /** Display initials, e.g. "DM". */
  initials: string;
  socioDesde: number;
  /** True when the producer is more than one person (Familia, Hermanas…). */
  socioPlural: boolean;
  /** "El productor" | "Los productores" | "Las productoras". */
  rol: string;
  nombre: string;
  granja: string;
  ubicacion: {
    short: string;
    long: string;
  };
  distanciaKm: number;
  quote: string;
  /** Exactly three stats render the desktop 3-up grid. */
  stats: [ProductorStat, ProductorStat, ProductorStat];
  mapPosition: ProductorMapPosition;
  /** Illustrated fallback used when no real `photo` is supplied. */
  silhouette: SilhouetteKind;
  /**
   * Real producer photo (in `/public`). When present it replaces the
   * illustrated silhouette in <ProductorPhoto />; otherwise the silhouette
   * fallback renders (e.g. for not-yet-photographed members of the network).
   */
  photo?: {
    /** Path under the public folder, e.g. "/DonManuel_HuevosDonald.png". */
    src: string;
    /** Descriptive alt text in Spanish. */
    alt: string;
  };
}

export interface RedStats {
  productores: number;
  regiones: number;
  intermediarios: number;
}
