"use client";

import type {DeliveryRow, DeliveryStatus} from "@/lib/metrics/types";
import type {DataGridColumn} from "@heroui-pro/react";

import {Avatar, Chip} from "@heroui/react";
import {DataGrid} from "@heroui-pro/react";
import {useMemo} from "react";

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  scheduled: "Programado",
  preparing: "En preparación",
  ready_for_dispatch: "Listo para despacho",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
  failed: "Fallido",
  skipped: "Omitido",
};

const STATUS_COLOR: Record<DeliveryStatus, "success" | "warning" | "default" | "danger"> = {
  scheduled: "warning",
  preparing: "warning",
  ready_for_dispatch: "default",
  out_for_delivery: "default",
  delivered: "success",
  failed: "danger",
  skipped: "default",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("es-CL", {day: "numeric", month: "short", year: "numeric"});
}

function initials(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "—";
}

export function OrdersPage({deliveries}: {deliveries: DeliveryRow[]}) {
  const columns = useMemo<DataGridColumn<DeliveryRow>[]>(
    () => [
      {
        accessorKey: "customerName",
        cell: (item) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <Avatar.Fallback>{initials(item.customerName)}</Avatar.Fallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-medium">{item.customerName ?? "—"}</span>
              <span className="text-muted text-xs">{item.customerEmail ?? ""}</span>
            </div>
          </div>
        ),
        header: "Cliente",
        id: "customer",
        isRowHeader: true,
        minWidth: 240,
      },
      {
        accessorKey: "status",
        cell: (item) =>
          item.status ? (
            <Chip color={STATUS_COLOR[item.status]} size="sm" variant="soft">
              {STATUS_LABEL[item.status]}
            </Chip>
          ) : null,
        header: "Estado",
        id: "status",
        minWidth: 130,
      },
      {
        accessorKey: "scheduledFor",
        cell: (item) => (
          <span className="text-muted tabular-nums">{formatDateTime(item.scheduledFor)}</span>
        ),
        header: "Programado",
        id: "scheduledFor",
        minWidth: 160,
      },
      {
        accessorKey: "notes",
        cell: (item) => <span className="text-muted">{item.notes ?? "—"}</span>,
        header: "Notas",
        id: "notes",
        minWidth: 200,
      },
    ],
    [],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <p className="text-muted text-sm">Gestiona y haz seguimiento de los pedidos de clientes.</p>

      <DataGrid
        aria-label="Pedidos"
        columns={columns}
        contentClassName="min-w-[760px]"
        data={deliveries}
        getRowId={(item) => item.id}
        renderEmptyState={() => "No hay pedidos programados todavía."}
      />
    </div>
  );
}
