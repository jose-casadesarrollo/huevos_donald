import type { CommonBenefit, Frequency, Plan } from "./types";

// Descuento del plan trimestral frente al mensual. Solo informativo (el badge
// "AHORRA 15%" del toggle); los precios ya vienen calculados en `planes`.
export const DESCUENTO_TRIMESTRAL = 0.15; // 15%

// ⚠️ PRECIOS PLACEHOLDER: estimaciones de mercado. Ajustar con el unit economics
// real (y revisar la promo "20% off primer mes") antes de publicar.
export const planes: Plan[] = [
  {
    id: "esencial",
    name: "Esencial",
    tagline: "Para una o dos personas. Desayunos sin drama.",
    pricing: {
      mensual: "7.990",
      trimestral: "6.790",
      savingsLabel: "Ahorras $3.600 al trimestre",
    },
    eggs: 18,
    eggsNote: "Saldo que usas a tu ritmo",
    features: [
      "Huevos free range certificados",
      "Despacho gratis en tu comuna",
      "Puntos Donald en cada compra",
      "Pausa o cancela cuando quieras",
    ],
    featured: false,
    ctaLabel: "Elegir Esencial",
  },
  {
    id: "familia",
    name: "Familia",
    tagline: "Para 3 o 4 personas. El equilibrio justo.",
    pricing: {
      mensual: "13.990",
      trimestral: "11.890",
      savingsLabel: "Ahorras $6.300 al trimestre",
    },
    eggs: 36,
    eggsNote: "Saldo que usas a tu ritmo",
    features: [
      "Todo lo del plan Esencial",
      // ⚠️ Promo condicional: confirmar con el cliente antes de publicar.
      "20% off tu primer mes",
      "Recetas semanales por correo",
      "Puntos Donald x1.5",
    ],
    featured: true,
    badge: "El más elegido",
    ctaLabel: "Elegir Familia",
  },
  {
    id: "cocinero",
    name: "Cocinero",
    tagline: "Familias grandes o reposteros de fin de semana.",
    pricing: {
      mensual: "24.990",
      trimestral: "21.240",
      savingsLabel: "Ahorras $11.250 al trimestre",
    },
    eggs: 72,
    eggsNote: "Saldo que usas a tu ritmo",
    features: [
      "Todo lo del plan Familia",
      "Acceso a lotes especiales",
      "Dos despachos al mes incluidos",
      "Puntos Donald x2",
    ],
    featured: false,
    ctaLabel: "Elegir Cocinero",
  },
];

export const commonBenefits: CommonBenefit[] = [
  { label: "Todos incluyen despacho gratis" },
  { label: "Trazabilidad por lote" },
  { label: "Sin contratos ni amarres" },
  { label: "Reposición ante quebrados" },
];

// Nota legal (SERNAC): renovación automática exige transparencia sobre IVA, saldo
// no consumido y cancelación sin penalización. Reemplazar por los términos del
// cliente si los tiene.
export const legalNote =
  "Los precios incluyen IVA. El saldo de huevos no consumido se mantiene vigente mientras tu suscripción esté activa. Puedes pausar o cancelar en cualquier momento sin penalización.";

// Entrada al checkout. Lleva plan + frecuencia para que el flujo de alta los
// prellene. NOTA: `/register` aún no existe — repuntar CHECKOUT_PATH a `/login`
// (las suscripciones requieren sesión) o a la ruta real de checkout cuando exista.
export const CHECKOUT_PATH = "/register";

export const checkoutHref = (planId: string, frequency: Frequency): string =>
  `${CHECKOUT_PATH}?plan=${planId}&freq=${frequency}`;
