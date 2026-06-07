import type { DashboardData, Metric, MetricFormat } from "./types";

// ⚠️ MÉTRICAS PLACEHOLDER: reemplazar con datos reales antes de publicar.
// Las cifras "En vivo"/"Acumulado" deberían venir de un endpoint mensual; la de
// CO₂ ("Estimado") necesita metodología verificable (ver methodNote / SERNAC).
export const metrics: Metric[] = [
  {
    id: "huevos",
    icon: "huevo",
    target: 142680,
    format: "thousands",
    label: "Huevos entregados",
    note: "Desde productores chilenos, directo a hogares.",
    kind: "En vivo",
  },
  {
    id: "co2",
    icon: "co2",
    target: 18.4,
    format: "decimal",
    suffix: "ton",
    label: "CO₂ evitado",
    note: "Versus cadena de distribución industrial larga.",
    kind: "Estimado",
  },
  {
    // ⚠️⚠️ INCONSISTENCIA A RESOLVER CON EL CLIENTE ⚠️⚠️
    // La sección 04 (Productores) publica una red de 8 productores
    // (`redStats.productores = 8`, tag "01 DE 08"). Este "312 familias
    // productoras apoyadas" la contradice directamente. Opciones para el cliente:
    //   (a) si son ~8 productores reales, bajar el número y reformular, o
    //   (b) si 312 mide otra cosa (hogares servidos, pedidos), cambiar el label.
    // Dejado como placeholder visible — NO publicar sin resolver esto.
    id: "familias",
    icon: "familias",
    target: 312,
    format: "plain",
    label: "Familias productoras apoyadas",
    note: "Con ingresos estables y pago directo, sin intermediarios.",
    kind: "Acumulado",
  },
  {
    id: "gallinas",
    icon: "gallinas",
    target: 3960,
    format: "thousands",
    label: "Gallinas viviendo sin jaula",
    note: "En praderas, con espacio para moverse al aire libre.",
    kind: "Acumulado",
  },
];

// ⚠️ Datos de ejemplo. Cuando exista el dashboard real, vienen del usuario
// logueado. "Jose C." es placeholder — cambiar por algo genérico si se prefiere.
export const dashboardExample: DashboardData = {
  userInitials: "JC",
  userName: "Jose C.",
  userPlan: "Plan Familia",
  monthsBadge: "8 MESES",
  eggsReceived: 288,
  co2Saved: "37",
  balanceUsed: 24,
  balanceTotal: 36,
};

export const methodNote =
  "Las cifras de CO₂ son estimaciones basadas en la reducción de kilómetros de la cadena de distribución frente al modelo industrial. Metodología disponible aquí. Datos actualizados al cierre de cada mes.";

// Página de metodología (anti-greenwashing / SERNAC). NOTA: `/metodologia` aún no
// existe — debe crearse antes de publicar cifras ambientales con respaldo.
export const METHODOLOGY_PATH = "/metodologia";

/**
 * Final formatted value for a metric, used for the count-up's `aria-label` (so
 * screen readers announce the end value, not the animation). Mirrors how
 * NumberFlow renders with `locales="es-CL"`: thousands grouped with a dot,
 * decimals with a comma.
 */
export function formatValue(target: number, format: MetricFormat): string {
  if (format === "decimal") {
    return new Intl.NumberFormat("es-CL", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(target);
  }
  return new Intl.NumberFormat("es-CL").format(Math.round(target));
}
