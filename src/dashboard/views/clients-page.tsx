"use client";

import type {ClientFormData, ClientListItem} from "@/lib/admin/clients/types";
import type {DataGridColumn, DataGridSortDescriptor} from "@heroui-pro/react";

import {Avatar, Button, Chip, SearchField, Toast} from "@heroui/react";
import {DataGrid} from "@heroui-pro/react";
import {Gear, PersonPlus} from "@gravity-ui/icons";
import {useRouter} from "next/navigation";
import {useMemo, useState} from "react";

import {formatCurrencyCents, formatNumber} from "@/lib/metrics/format";

import {ClientSheet} from "./clients/client-sheet";
import {CreateClientModal} from "./clients/create-client-modal";
import {
  AccountChip,
  ChannelChips,
  SubscriptionChip,
  formatDate,
  formatPhone,
  initials,
} from "./clients/shared";

function sortValue(item: ClientListItem, column: string): string | number {
  switch (column) {
    case "customer":
      return (item.name ?? "").toLowerCase();
    case "paid":
      return item.totalPaidCents;
    case "eggs":
      return item.totalEggsDelivered;
    case "orders":
      return item.ordersCount;
    case "activity":
      return item.lastActivityAt ?? "";
    default:
      return "";
  }
}

export function ClientsPage({
  clients,
  formData,
}: {
  clients: ClientListItem[];
  formData: ClientFormData;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "activity",
    direction: "descending",
  });
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const openClient = useMemo(
    () => clients.find((c) => c.clientKey === openKey) ?? null,
    [clients, openKey],
  );

  const filtered = useMemo<ClientListItem[]>(() => {
    if (!search) return clients;
    const q = search.toLowerCase();

    return clients.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [clients, search]);

  const sorted = useMemo<ClientListItem[]>(() => {
    const column = sortDescriptor.column as string | undefined;
    if (!column) return filtered;
    const direction = sortDescriptor.direction === "descending" ? -1 : 1;

    return [...filtered].sort((a, b) => {
      const first = sortValue(a, column);
      const second = sortValue(b, column);
      if (typeof first === "number" && typeof second === "number") {
        return (first - second) * direction;
      }

      return String(first).localeCompare(String(second)) * direction;
    });
  }, [filtered, sortDescriptor]);

  const columns = useMemo<DataGridColumn<ClientListItem>[]>(
    () => [
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <Avatar.Fallback>{initials(item.name)}</Avatar.Fallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium">
                {item.name ?? "Sin nombre"}
              </span>
              <span className="text-muted truncate text-xs">
                {item.email ?? "—"}
              </span>
            </div>
          </div>
        ),
        header: "Cliente",
        id: "customer",
        isRowHeader: true,
        minWidth: 240,
      },
      {
        cell: (item) => (
          <span className="text-muted tabular-nums">
            {formatPhone(item.phone)}
          </span>
        ),
        header: "Contacto",
        id: "contact",
        minWidth: 150,
      },
      {
        cell: (item) => <ChannelChips channels={item.channels} />,
        header: "Canal",
        id: "channel",
        minWidth: 120,
      },
      {
        cell: (item) => <AccountChip hasAccount={item.hasAccount} />,
        header: "Cuenta",
        id: "account",
        minWidth: 110,
      },
      {
        cell: (item) => (
          <div className="flex flex-col gap-1">
            <SubscriptionChip status={item.subscriptionStatus} />
            {item.subscriberSince ? (
              <span className="text-muted text-xs">
                desde {formatDate(item.subscriberSince)}
              </span>
            ) : null}
          </div>
        ),
        header: "Suscripción",
        id: "subscription",
        minWidth: 160,
      },
      {
        align: "end",
        allowsSorting: true,
        cell: (item) => (
          <span className="font-medium tabular-nums">
            {formatCurrencyCents(item.totalPaidCents)}
          </span>
        ),
        header: "Pagado",
        id: "paid",
        minWidth: 120,
      },
      {
        align: "end",
        allowsSorting: true,
        cell: (item) => (
          <span className="tabular-nums">
            {formatNumber(item.totalEggsDelivered)}
          </span>
        ),
        header: "Huevos",
        id: "eggs",
        minWidth: 100,
      },
      {
        align: "end",
        allowsSorting: true,
        cell: (item) => (
          <span className="tabular-nums">{item.ordersCount}</span>
        ),
        header: "Pedidos",
        id: "orders",
        minWidth: 90,
      },
      {
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted tabular-nums">
            {formatDate(item.lastActivityAt)}
          </span>
        ),
        header: "Última actividad",
        id: "activity",
        minWidth: 150,
      },
    ],
    [],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <Toast.Provider />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground text-base font-semibold">
              Clientes
            </span>
            <Chip size="sm" variant="soft">
              {formatNumber(clients.length)}
            </Chip>
            <p className="text-muted w-full text-sm sm:w-auto">
              Web y chatbot unificados por teléfono o correo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => router.push("/admin/settings")}
            >
              <Gear className="size-4" />
              Gestionar planes
            </Button>
            <Button size="sm" onPress={() => setCreating(true)}>
              <PersonPlus className="size-4" />
              Nuevo cliente
            </Button>
          </div>
        </div>
        <SearchField
          className="w-full sm:w-[320px]"
          name="client-search"
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Buscar por nombre, teléfono o correo..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      <DataGrid
        aria-label="Clientes"
        columns={columns}
        contentClassName="min-w-[1180px]"
        data={sorted}
        getRowId={(item) => item.clientKey}
        renderEmptyState={() => "No hay clientes todavía."}
        sortDescriptor={sortDescriptor}
        onRowAction={(key) => setOpenKey(String(key))}
        onSortChange={setSortDescriptor}
      />

      <ClientSheet
        client={openClient}
        formData={formData}
        onClose={() => setOpenKey(null)}
      />

      {creating ? (
        <CreateClientModal
          zones={formData.zones}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </div>
  );
}
