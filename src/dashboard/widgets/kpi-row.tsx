"use client";

import {KPI} from "@heroui-pro/react";

import {DEFAULT_CURRENCY} from "@/lib/metrics/format";
import type {Overview} from "@/lib/metrics/types";

// Headline KPIs sourced from admin_metrics_overview. No trend chips yet — we
// have no prior-period comparison to show honestly.
export function KpiRow({overview}: {overview: Overview}) {
  const cards = [
    {label: "Suscripciones activas", value: overview.activeSubscriptions, currency: undefined},
    {label: "MRR", value: overview.mrrCents / 100, currency: DEFAULT_CURRENCY},
    {label: "Ingresos (30 días)", value: overview.revenueLast30dCents / 100, currency: DEFAULT_CURRENCY},
    {label: "Despachos (próx. 7 días)", value: overview.deliveriesScheduledNext7d, currency: undefined},
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <KPI key={card.label}>
          <KPI.Header>
            <KPI.Title>{card.label}</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value
              currency={card.currency}
              maximumFractionDigits={0}
              style={card.currency ? "currency" : "decimal"}
              value={card.value}
            />
          </KPI.Content>
        </KPI>
      ))}
    </div>
  );
}
