// Tipos de la página /planes. Mantener en sync con data.ts.

export interface PlanMediaFicha {
  stats: string[]; // ["Calibre L", "Yema naranja"] — pills mono
  loteCode: string; // "DN·2417·SE"
  saldoLabel: string; // "Saldo mensual"
  eggs: number; // 18
  price: string; // "7.990"
  pricePer: string; // "al mes"
}

export interface PlanFull {
  id: string; // "esencial" | "familia" | "cocinero"
  num: string; // "01" | "02" | "03"
  name: string; // "Esencial"
  tagLabel: string; // "Esencial" o "Familia · El más elegido"
  forWho: string; // "Para una o dos personas. Desayunos sin drama."
  includes: string[]; // lista de incluidos
  price: string; // "7.990"
  priceMetaEggs: string; // "18 huevos · saldo flexible"
  ctaLabel: string; // "Elegir Esencial"
  reverse: boolean; // true en Familia (zigzag invertido)
  darkBg: boolean; // fondo --cream-deep alternado (Familia)
  media: {
    src: string; // "/planes/plan-esencial.jpg"
    alt: string;
    ficha: PlanMediaFicha;
  };
}

// Hero
export interface HeroStat {
  num: string;
  label: string;
  curYolk?: boolean; // el "$" en --yolk
}

export interface HeroFloat {
  label: string;
  value: string;
}

export interface HeroData {
  eyebrow: { dim: string; main: string };
  stats: HeroStat[];
  video: { src: string; poster: string; alt: string };
  floats: { status: string; tl: HeroFloat; br: HeroFloat };
}

// ASMR band
export interface AsmrItem {
  kind: "video" | "image";
  src: string;
  poster?: string; // solo video
  alt: string;
  feature?: boolean; // el video principal grande
  wide?: boolean; // las imágenes con aspect 4:5
}

// Tabla comparativa
export type CompareValue =
  | { type: "check" }
  | { type: "none" }
  | { type: "text"; text: string };

export interface CompareFeature {
  name: string;
  values: [CompareValue, CompareValue, CompareValue]; // [esencial, familia, cocinero]
}

export interface CompareHeadCol {
  name: string;
  price: string;
  badge?: string;
}

// FAQ
export interface PlanesFaqItem {
  q: string;
  a: string;
}
