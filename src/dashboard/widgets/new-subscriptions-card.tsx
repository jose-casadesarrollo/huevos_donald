"use client";

import {Card} from "@heroui/react";
import {LineChart} from "@heroui-pro/react";

import {shortDayLabel} from "@/lib/metrics/format";
import type {NewSubsPoint} from "@/lib/metrics/types";

import {ChartEmpty} from "./chart-empty";

export function NewSubscriptionsCard({data}: {data: NewSubsPoint[]}) {
  const chartData = data.map((d) => ({day: shortDayLabel(d.day), subs: d.count}));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div>
          <Card.Title className="text-base">Nuevas suscripciones</Card.Title>
          <Card.Description className="text-muted text-xs">{total} en total</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        {chartData.length === 0 ? (
          <ChartEmpty message="Aún no hay suscripciones." />
        ) : (
          <LineChart data={chartData} height={200}>
            <LineChart.Grid vertical={false} />
            <LineChart.XAxis dataKey="day" tickMargin={8} />
            <LineChart.YAxis allowDecimals={false} width={30} />
            <LineChart.Line
              dataKey="subs"
              dot={false}
              name="Suscripciones"
              stroke="var(--chart-2)"
              strokeWidth={2}
              type="monotone"
            />
            <LineChart.Tooltip content={<LineChart.TooltipContent />} />
          </LineChart>
        )}
      </Card.Content>
    </Card>
  );
}
