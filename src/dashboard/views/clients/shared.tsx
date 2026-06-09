"use client";

import type {Database} from "@/lib/supabase/database.types";
import type {Channel} from "@/lib/admin/clients/types";

import {Chip} from "@heroui/react";

type Enums = Database["public"]["Enums"];
type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

// --- formatters ------------------------------------------------------------

/** 'd mmm yyyy' in es-CL, or em-dash for null. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** '56912345678' → '+56 9 1234 5678'; falls back to a leading '+'. */
export function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  const mobile = phone.match(/^56(\d)(\d{4})(\d{4})$/);
  if (mobile) return `+56 ${mobile[1]} ${mobile[2]} ${mobile[3]}`;

  return `+${phone}`;
}

/** Up to two uppercase initials from a name. */
export function initials(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "—"
  );
}

// --- subscription status ---------------------------------------------------

const SUB_LABEL: Record<Enums["subscription_status"], string> = {
  authorized: "Activa",
  paused: "Pausada",
  pending: "Pendiente",
  cancelled: "Cancelada",
  past_due: "Vencida",
};

const SUB_COLOR: Record<Enums["subscription_status"], ChipColor> = {
  authorized: "success",
  paused: "warning",
  pending: "default",
  cancelled: "default",
  past_due: "danger",
};

export function SubscriptionChip({
  status,
}: {
  status: Enums["subscription_status"] | null;
}) {
  if (!status) {
    return (
      <Chip color="default" size="sm" variant="soft">
        Sin suscripción
      </Chip>
    );
  }

  return (
    <Chip color={SUB_COLOR[status]} size="sm" variant="soft">
      {SUB_LABEL[status]}
    </Chip>
  );
}

// --- account + channel -----------------------------------------------------

export function AccountChip({hasAccount}: {hasAccount: boolean}) {
  return (
    <Chip color={hasAccount ? "success" : "default"} size="sm" variant="soft">
      {hasAccount ? "Con cuenta" : "Invitado"}
    </Chip>
  );
}

export function ChannelChips({channels}: {channels: Channel[]}) {
  if (channels.length === 0) return <span className="text-muted">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {channels.includes("web") ? (
        <Chip color="accent" size="sm" variant="soft">
          Web
        </Chip>
      ) : null}
      {channels.includes("chatbot") ? (
        <Chip color="warning" size="sm" variant="soft">
          Bot
        </Chip>
      ) : null}
    </div>
  );
}

// --- order + delivery status (for the detail feeds) ------------------------

const ORDER_LABEL: Record<Enums["order_status"], string> = {
  pending: "Pendiente",
  awaiting_payment: "Por pagar",
  paid: "Pagado",
  fulfilling: "Preparando",
  completed: "Completado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const ORDER_COLOR: Record<Enums["order_status"], ChipColor> = {
  pending: "warning",
  awaiting_payment: "warning",
  paid: "success",
  fulfilling: "warning",
  completed: "success",
  cancelled: "default",
  refunded: "danger",
};

export function OrderStatusChip({status}: {status: Enums["order_status"]}) {
  return (
    <Chip color={ORDER_COLOR[status]} size="sm" variant="soft">
      {ORDER_LABEL[status]}
    </Chip>
  );
}

const DELIVERY_LABEL: Record<Enums["delivery_status"], string> = {
  scheduled: "Programado",
  preparing: "En preparación",
  ready_for_dispatch: "Listo",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
  failed: "Fallido",
  skipped: "Omitido",
};

const DELIVERY_COLOR: Record<Enums["delivery_status"], ChipColor> = {
  scheduled: "warning",
  preparing: "warning",
  ready_for_dispatch: "default",
  out_for_delivery: "default",
  delivered: "success",
  failed: "danger",
  skipped: "default",
};

export function DeliveryStatusChip({
  status,
}: {
  status: Enums["delivery_status"];
}) {
  return (
    <Chip color={DELIVERY_COLOR[status]} size="sm" variant="soft">
      {DELIVERY_LABEL[status]}
    </Chip>
  );
}
