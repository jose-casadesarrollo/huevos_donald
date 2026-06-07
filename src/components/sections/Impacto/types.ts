export type MetricFormat = "thousands" | "decimal" | "plain";
export type MetricKind = "En vivo" | "Estimado" | "Acumulado";
export type MetricIconId = "huevo" | "co2" | "familias" | "gallinas";

export interface Metric {
  id: string;
  icon: MetricIconId;
  target: number; // 142680, 18.4, 312, 3960
  format: MetricFormat; // cómo formatear el número
  suffix?: string; // "ton" (para CO₂)
  label: string;
  note: string; // aclaración bajo el número
  kind: MetricKind; // tipo de dato — transparencia anti-greenwashing
}

export interface DashboardData {
  userInitials: string;
  userName: string;
  userPlan: string;
  monthsBadge: string;
  eggsReceived: number;
  co2Saved: string; // kg
  balanceUsed: number;
  balanceTotal: number;
}
