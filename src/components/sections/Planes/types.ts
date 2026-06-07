export type Frequency = "mensual" | "trimestral";

export interface PlanPricing {
  mensual: string; // "7.990" — total mensual, formato CLP (punto miles, sin decimales)
  trimestral: string; // "6.790" — mensual equivalente, facturado cada 3 meses
  savingsLabel: string; // "Ahorras $3.600 al trimestre"
}

export interface Plan {
  id: string; // "esencial" | "familia" | "cocinero"
  name: string;
  tagline: string;
  pricing: PlanPricing;
  eggs: number;
  eggsNote: string;
  features: string[];
  featured: boolean; // true solo en Familia
  badge?: string; // "El más elegido" (solo el destacado)
  ctaLabel: string;
}

export interface CommonBenefit {
  label: string;
}
