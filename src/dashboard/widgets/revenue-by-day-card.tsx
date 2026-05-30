"use client";

import {Card} from "@heroui/react";
import {BarChart} from "@heroui-pro/react";

import {formatCurrencyCents, shortDayLabel} from "@/lib/metrics/format";
import type {RevenuePoint} from "@/lib/metrics/types";

import {ChartEmpty} from "./chart-empty";

export function RevenueByDayCard({data}: {data: RevenuePoint[]}) {
  const chartData = data.map((d) => ({day: shortDayLabel(d.day), revenue: d.revenueCents / 100}));
  const totalCents = data.reduce((sum, d) => sum + d.revenueCents, 0);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div>
          <Card.Title className="text-base">Ingresos por día</Card.Title>
          <Card.Description className="text-muted text-xs">Pagos aprobados</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <span className="text-foreground text-lg font-semibold tabular-nums">
          {formatCurrencyCents(totalCents)}
        </span>
        {chartData.length === 0 ? (
          <ChartEmpty message="Aún no hay ingresos registrados." />
        ) : (
          <BarChart data={chartData} height={200}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="day" tickMargin={8} />
            <BarChart.YAxis width={40} />
            <BarChart.Bar barSize={16} dataKey="revenue" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        )}
      </Card.Content>
    </Card>
  );
}
