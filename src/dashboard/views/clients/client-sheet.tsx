"use client";

import type {
  ClientDelivery,
  ClientDetail,
  ClientFormData,
  ClientListItem,
  ClientOrder,
  ClientSubscription,
  SpendPoint,
} from "@/lib/admin/clients/types";

import {Avatar, Button, Card, Skeleton, Tabs} from "@heroui/react";
import {BarChart, KPI, ListView, Sheet} from "@heroui-pro/react";
import {useEffect, useState, useTransition} from "react";

import {getClientDetailAction} from "@/app/admin/clients/actions";
import {ChartEmpty} from "@/dashboard/widgets/chart-empty";
import {
  DEFAULT_CURRENCY,
  formatCurrencyCents,
  formatNumber,
  shortDayLabel,
} from "@/lib/metrics/format";

import {BalanceAdjustModal} from "./balance-adjust";
import {CreateClientModal} from "./create-client-modal";
import {EditClientModal} from "./edit-client-modal";
import {EditSubscriptionModal} from "./edit-subscription-modal";
import {
  AccountChip,
  ChannelChips,
  DeliveryStatusChip,
  OrderStatusChip,
  SubscriptionChip,
  formatDate,
  formatPhone,
  initials,
} from "./shared";

export function ClientSheet({
  client,
  formData,
  onClose,
}: {
  client: ClientListItem | null;
  formData: ClientFormData;
  onClose: () => void;
}) {
  const clientKey = client?.clientKey ?? null;
  // Keyed cache so `detail` derives to null the instant a different client is
  // opened (no synchronous setState in the effect) and fills in when the fetch
  // for the *current* key resolves. `reloadN` re-fetches after an edit.
  const [loaded, setLoaded] = useState<{
    key: string;
    data: ClientDetail | null;
  } | null>(null);
  const [reloadN, setReloadN] = useState(0);
  const [, startTransition] = useTransition();

  const [editingClient, setEditingClient] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [adjust, setAdjust] = useState<"egg" | "points" | null>(null);
  const [editingSub, setEditingSub] = useState<ClientSubscription | null>(null);

  useEffect(() => {
    if (!clientKey) return;
    let active = true;

    startTransition(async () => {
      const data = await getClientDetailAction(clientKey);
      if (active) setLoaded({data, key: clientKey});
    });

    return () => {
      active = false;
    };
  }, [clientKey, reloadN, startTransition]);

  const detail = loaded && loaded.key === clientKey ? loaded.data : null;
  const reload = () => setReloadN((n) => n + 1);

  return (
    <>
      <Sheet
        isOpen={client !== null}
        placement="right"
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Sheet.Backdrop variant="blur">
          <Sheet.Content className="w-[460px] max-w-full">
            <Sheet.Dialog>
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <div className="flex items-center gap-3 pr-8">
                  <Avatar className="size-11">
                    <Avatar.Fallback>
                      {initials(client?.name ?? null)}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <Sheet.Heading className="truncate text-base">
                      {client?.name ?? "Cliente"}
                    </Sheet.Heading>
                    <span className="text-muted truncate text-xs">
                      {formatPhone(client?.phone ?? null)}
                      {client?.email ? ` · ${client.email}` : ""}
                    </span>
                  </div>
                </div>
              </Sheet.Header>

              <Sheet.Body>
                <div className="flex flex-col gap-5">
                  {client ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <AccountChip hasAccount={client.hasAccount} />
                      <ChannelChips channels={client.channels} />
                      <SubscriptionChip status={client.subscriptionStatus} />
                    </div>
                  ) : null}

                  {client ? (
                    <div className="flex flex-wrap gap-2">
                      {client.hasAccount ? (
                        <>
                          <Button
                            isDisabled={!detail?.profile}
                            size="sm"
                            variant="secondary"
                            onPress={() => setEditingClient(true)}
                          >
                            Editar datos
                          </Button>
                          <Button
                            size="sm"
                            variant="tertiary"
                            onPress={() => setAdjust("egg")}
                          >
                            Ajustar saldo
                          </Button>
                          <Button
                            size="sm"
                            variant="tertiary"
                            onPress={() => setAdjust("points")}
                          >
                            Ajustar puntos
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => setCreatingAccount(true)}
                        >
                          Crear cuenta
                        </Button>
                      )}
                    </div>
                  ) : null}

                  {client ? <ClientKpis client={client} /> : null}

                  {detail ? (
                    <SpendCard spendSeries={detail.spendSeries} />
                  ) : (
                    <Skeleton className="h-[220px] w-full rounded-2xl" />
                  )}

                  {detail ? (
                    <ClientTabs
                      detail={detail}
                      onEditSubscription={setEditingSub}
                    />
                  ) : (
                    <Skeleton className="h-44 w-full rounded-2xl" />
                  )}
                </div>
              </Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>

      {editingClient && detail?.profile ? (
        <EditClientModal
          profile={detail.profile}
          zones={formData.zones}
          onClose={() => setEditingClient(false)}
          onSaved={reload}
        />
      ) : null}

      {creatingAccount && client ? (
        <CreateClientModal
          prefill={{
            fullName: client.name,
            idType: client.phone ? "phone" : "email",
            idValue: client.phone ?? client.email ?? "",
          }}
          zones={formData.zones}
          onClose={() => setCreatingAccount(false)}
        />
      ) : null}

      {adjust && client ? (
        <BalanceAdjustModal
          client={client}
          kind={adjust}
          subscriptions={detail?.subscriptions ?? []}
          onClose={() => setAdjust(null)}
          onSaved={reload}
        />
      ) : null}

      {editingSub ? (
        <EditSubscriptionModal
          slots={formData.slots}
          subscription={editingSub}
          zones={formData.zones}
          onClose={() => setEditingSub(null)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}

function ClientKpis({client}: {client: ClientListItem}) {
  const cards: {label: string; value: number; currency?: string}[] = [
    {
      currency: DEFAULT_CURRENCY,
      label: "Pagado",
      value: client.totalPaidCents / 100,
    },
    {label: "Huevos entregados", value: client.totalEggsDelivered},
    {label: "Pedidos", value: client.ordersCount},
    {label: "Saldo huevos", value: client.eggBalance},
    {label: "Puntos", value: client.pointsBalance},
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
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

function SpendCard({spendSeries}: {spendSeries: SpendPoint[]}) {
  const chartData = spendSeries.map((d) => ({
    day: shortDayLabel(d.day),
    revenue: d.revenueCents / 100,
  }));

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div>
          <Card.Title className="text-base">Gasto en el tiempo</Card.Title>
          <Card.Description className="text-muted text-xs">
            Pagos aprobados
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        {chartData.length === 0 ? (
          <ChartEmpty height={160} message="Sin pagos registrados." />
        ) : (
          <BarChart data={chartData} height={160}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="day" tickMargin={8} />
            <BarChart.YAxis width={40} />
            <BarChart.Bar
              barSize={14}
              dataKey="revenue"
              fill="var(--chart-3)"
              radius={[8, 8, 0, 0]}
            />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        )}
      </Card.Content>
    </Card>
  );
}

function ClientTabs({
  detail,
  onEditSubscription,
}: {
  detail: ClientDetail;
  onEditSubscription: (sub: ClientSubscription) => void;
}) {
  return (
    <Tabs defaultSelectedKey="orders">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Detalle del cliente">
          <Tabs.Tab id="orders">
            Pedidos
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="deliveries">
            Entregas
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="subscriptions">
            Suscripciones
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-3" id="orders">
        <OrdersFeed orders={detail.orders} />
      </Tabs.Panel>
      <Tabs.Panel className="pt-3" id="deliveries">
        <DeliveriesFeed deliveries={detail.deliveries} />
      </Tabs.Panel>
      <Tabs.Panel className="pt-3" id="subscriptions">
        <SubscriptionsFeed
          subscriptions={detail.subscriptions}
          onEdit={onEditSubscription}
        />
      </Tabs.Panel>
    </Tabs>
  );
}

function FeedEmpty({message}: {message: string}) {
  return <p className="text-muted py-6 text-center text-sm">{message}</p>;
}

function OrdersFeed({orders}: {orders: ClientOrder[]}) {
  if (orders.length === 0) return <FeedEmpty message="Sin pedidos." />;

  return (
    <ListView
      aria-label="Pedidos del cliente"
      items={orders}
      selectionMode="none"
      variant="secondary"
    >
      {(order) => (
        <ListView.Item id={order.id} textValue={`Pedido ${order.id}`}>
          <ListView.ItemContent>
            <div className="flex min-w-0 flex-1 flex-col">
              <ListView.Title>
                {formatNumber(order.quantity)} huevos ·{" "}
                {formatCurrencyCents(order.amountCents)}
              </ListView.Title>
              <ListView.Description>
                {formatDate(order.createdAt)} ·{" "}
                {order.channel === "web" ? "Web" : "Bot"}
              </ListView.Description>
            </div>
            <OrderStatusChip status={order.status} />
          </ListView.ItemContent>
        </ListView.Item>
      )}
    </ListView>
  );
}

function DeliveriesFeed({deliveries}: {deliveries: ClientDelivery[]}) {
  if (deliveries.length === 0) return <FeedEmpty message="Sin entregas." />;

  return (
    <ListView
      aria-label="Entregas del cliente"
      items={deliveries}
      selectionMode="none"
      variant="secondary"
    >
      {(delivery) => (
        <ListView.Item id={delivery.id} textValue={`Entrega ${delivery.id}`}>
          <ListView.ItemContent>
            <div className="flex min-w-0 flex-1 flex-col">
              <ListView.Title>
                {delivery.quantity != null
                  ? `${formatNumber(delivery.quantity)} huevos`
                  : "Entrega"}
              </ListView.Title>
              <ListView.Description>
                {formatDate(delivery.deliveryDate ?? delivery.scheduledFor)}
              </ListView.Description>
            </div>
            <DeliveryStatusChip status={delivery.status} />
          </ListView.ItemContent>
        </ListView.Item>
      )}
    </ListView>
  );
}

function SubscriptionsFeed({
  subscriptions,
  onEdit,
}: {
  subscriptions: ClientSubscription[];
  onEdit: (sub: ClientSubscription) => void;
}) {
  if (subscriptions.length === 0)
    return <FeedEmpty message="Sin suscripciones." />;

  return (
    <ListView
      aria-label="Suscripciones del cliente"
      items={subscriptions}
      selectionMode="none"
      variant="secondary"
    >
      {(sub) => (
        <ListView.Item id={sub.id} textValue={sub.planName ?? "Suscripción"}>
          <ListView.ItemContent>
            <div className="flex min-w-0 flex-1 flex-col">
              <ListView.Title>{sub.planName ?? "Suscripción"}</ListView.Title>
              <ListView.Description>
                {sub.startedAt ? `desde ${formatDate(sub.startedAt)}` : "—"} ·
                saldo {formatNumber(sub.eggBalance)}
              </ListView.Description>
            </div>
            <SubscriptionChip status={sub.status} />
            <Button size="sm" variant="ghost" onPress={() => onEdit(sub)}>
              Editar
            </Button>
          </ListView.ItemContent>
        </ListView.Item>
      )}
    </ListView>
  );
}
