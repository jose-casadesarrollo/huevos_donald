"use client";

// Floating support chat popup, wired to the Supabase Edge agent (`agent-chat`).
//
// The Edge function streams an AI SDK v6 UI-message stream
// (`streamText` -> `toUIMessageStreamResponse`), so `@ai-sdk/react`'s `useChat`
// consumes it directly. The HeroUI Pro AI components are purely presentational —
// all chat state lives in `useChat`; we just render `messages`/`status` onto them.
//
// Assistant text is rendered with lightweight react-markdown + remark-gfm rather
// than HeroUI's `Markdown`, because the latter pulls in streamdown -> mermaid,
// which is far too heavy for a landing-page widget.
//
// Read-only tool activity (listPlans/listZones/checkDeliveryAvailability) is
// surfaced with a small custom <details> chip (`ToolActivity`); createOrder gets a
// graphic `OrderCard` (readable summary + actions, no raw JSON). We deliberately do
// NOT use HeroUI's `ChatTool`: it statically imports CodeBlock -> shiki (~600KB+),
// dead weight for a support chat that never renders code.
// createOrder is gated server-side with `needsApproval`. On AI SDK v6 the gate is
// real: streamText emits a `tool-approval-request` instead of executing. `OrderCard`
// renders Confirmar/Cancelar -> `addToolApprovalResponse`, and
// `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`
// auto-resubmits so the Edge function resumes and runs createOrder only on approval.

import type { DynamicToolUIPart, ToolUIPart, UIMessage } from "ai";

// v6's isToolUIPart narrows to ToolUIPart | DynamicToolUIPart; both share the same
// state/approval/input/output shape, so we accept either. (Our tools are all static.)
type AnyToolPart = ToolUIPart | DynamicToolUIPart;
import type { Components } from "react-markdown";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@heroui/react";
import { Sheet } from "@heroui-pro/react/sheet";
import { ChatConversation } from "@heroui-pro/react/chat-conversation";
import { ChatMessage } from "@heroui-pro/react/chat-message";
import { ChatMessageActions } from "@heroui-pro/react/chat-message-actions";
import { ChatLoader } from "@heroui-pro/react/chat-loader";
import { TextShimmer } from "@heroui-pro/react/text-shimmer";
import { PromptInput } from "@heroui-pro/react/prompt-input";
import { PromptSuggestion } from "@heroui-pro/react/prompt-suggestion";
import { createClient } from "@/lib/supabase/client";

const ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-chat`;
const FEEDBACK_ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/agent_message_feedback`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const CHAT_ID_KEY = "hd_support_chat_id";

const SUGGESTIONS = [
  "¿Cómo funciona la suscripción?",
  "¿Hacen entregas en mi comuna?",
  "¿Qué planes y precios tienen?",
  "Quiero pausar o cambiar mi plan",
];

// Spanish labels for the agent's tools, keyed by tool name.
const TOOL_TITLES: Record<string, string> = {
  listPlans: "Planes y precios",
  listZones: "Zonas de reparto",
  checkDeliveryAvailability: "Disponibilidad de entrega",
  createOrder: "Pedido",
};

// Status text shown (as a shimmer) while a tool is running and no answer text exists yet.
const TOOL_STATUS: Record<string, string> = {
  listPlans: "Consultando planes…",
  listZones: "Revisando zonas de reparto…",
  checkDeliveryAvailability: "Verificando disponibilidad…",
  createOrder: "Preparando tu pedido…",
};

// Prefix for the read-only tool chips (createOrder uses the graphic OrderCard instead).
function toolTriggerPrefix(state: AnyToolPart["state"]): string {
  if (state === "output-available") return "Consulté ";
  if (state === "output-error") return "Error consultando ";
  return "Consultando ";
}

// Fire-and-forget thumbs up/down rating, inserted straight into PostgREST under
// the insert-only RLS policy (anon key). Failures never disrupt the chat.
async function postFeedback(chatId: string, messageId: string, rating: "up" | "down") {
  if (!chatId || !ANON_KEY) return;
  try {
    await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, rating }),
    });
  } catch {
    // Best-effort only.
  }
}

function ChatBubbleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M4 12a8 8 0 1 1 3.2 6.4L4 20l.9-2.7A7.9 7.9 0 0 1 4 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M3.5 10.8V5a1.5 1.5 0 0 1 1.5-1.5h5.8c.4 0 .8.16 1.06.44l8 8a1.5 1.5 0 0 1 0 2.12l-5.8 5.8a1.5 1.5 0 0 1-2.12 0l-8-8A1.5 1.5 0 0 1 3.5 10.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
    </svg>
  );
}

function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

const markdownComponents: Components = {
  a({ children, href }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2"
      >
        {children}
      </a>
    );
  },
};

function AssistantMarkdown({ text }: { text: string }) {
  return (
    <div className="text-sm leading-relaxed [&_code]:rounded [&_code]:bg-[var(--background-tertiary)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

// Read-only tool chip (listPlans/listZones/checkDeliveryAvailability): a compact
// collapsed row that expands to the raw JSON. createOrder uses OrderCard instead.
function ToolActivity({ part }: { part: AnyToolPart }) {
  const name = String(getToolName(part));
  const title = TOOL_TITLES[name] ?? name;
  const isError = part.state === "output-error";
  const isDone = part.state === "output-available";
  const payload = part.state === "output-available" ? part.output : part.input;

  return (
    <details
      open={isError}
      className="rounded-lg border border-separator bg-[var(--background-secondary)] text-xs"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className={`size-1.5 shrink-0 rounded-full ${
            isError ? "bg-danger" : isDone ? "bg-emerald-500" : "animate-pulse bg-accent"
          }`}
        />
        <span className="min-w-0 flex-1 truncate">
          <span className="text-muted">{toolTriggerPrefix(part.state)}</span>
          <span className="font-medium text-foreground">{title}</span>
        </span>
        <svg className="size-3 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="m9 6 6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="border-t border-separator px-3 py-2">
        {part.state === "output-error" ? (
          <p className="text-danger">{String(part.errorText ?? "Ocurrió un error.")}</p>
        ) : (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted">
            {JSON.stringify(payload ?? {}, null, 2)}
          </pre>
        )}
      </div>
    </details>
  );
}

function CardRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatPhone(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const m = digits.match(/^56(\d)(\d{4})(\d{4})$/);
  return m ? `+56 ${m[1]} ${m[2]} ${m[3]}` : String(raw ?? "");
}

function OrderErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-separator bg-[var(--surface)] p-3 text-xs">
      <div className="mb-1 flex items-center gap-2 font-semibold text-danger">
        <span aria-hidden className="size-2 rounded-full bg-danger" />
        Problema con el pedido
      </div>
      <p className="text-muted">{message}</p>
    </div>
  );
}

// Plan name/price and zone comuna are read straight from the listPlans/listZones
// tool outputs already present in the conversation — no extra fetch needed.
type PlanInfo = {
  name?: string;
  price_label?: string;
  quantity_per_delivery?: number;
  frequency?: string;
};
type ZoneInfo = { name?: string; comuna?: string };
type Catalog = { plans: Map<string, PlanInfo>; zones: Map<string, ZoneInfo> };

const FREQ_LABEL: Record<string, string> = {
  weekly: "semanal",
  biweekly: "quincenal",
  monthly: "mensual",
};

function collectCatalog(messages: UIMessage[]): Catalog {
  const plans = new Map<string, PlanInfo>();
  const zones = new Map<string, ZoneInfo>();
  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") continue;
      const output = part.output as Record<string, unknown> | null | undefined;
      if (!output) continue;
      const tool = getToolName(part);
      if (tool === "listPlans" && Array.isArray(output.plans)) {
        for (const entry of output.plans) {
          const plan = entry as Record<string, unknown>;
          if (typeof plan.plan_id === "string") {
            plans.set(plan.plan_id, {
              name: typeof plan.name === "string" ? plan.name : undefined,
              price_label: typeof plan.price_label === "string" ? plan.price_label : undefined,
              quantity_per_delivery:
                typeof plan.quantity_per_delivery === "number" ? plan.quantity_per_delivery : undefined,
              frequency: typeof plan.frequency === "string" ? plan.frequency : undefined,
            });
          }
        }
      }
      if (tool === "listZones" && Array.isArray(output.zones)) {
        for (const entry of output.zones) {
          const zone = entry as Record<string, unknown>;
          if (typeof zone.zone_id === "string") {
            zones.set(zone.zone_id, {
              name: typeof zone.name === "string" ? zone.name : undefined,
              comuna: typeof zone.comuna === "string" ? zone.comuna : undefined,
            });
          }
        }
      }
    }
  }
  return { plans, zones };
}

// Graphic order card for the createOrder tool — readable summary with the plan name
// + price in bold, and prominent Confirmar/Cancelar (approval) / Pagar actions.
function OrderCard({
  part,
  onApprove,
  catalog,
}: {
  part: AnyToolPart;
  onApprove?: (id: string, approved: boolean) => void;
  catalog: Catalog;
}) {
  const input = (part.input ?? {}) as Record<string, unknown>;
  const plan = typeof input.plan_id === "string" ? catalog.plans.get(input.plan_id) : undefined;
  const zone =
    typeof input.delivery_zone_id === "string" ? catalog.zones.get(input.delivery_zone_id) : undefined;
  const zoneLabel = zone?.comuna ?? zone?.name;
  const planMeta = plan
    ? [
        plan.quantity_per_delivery ? `${plan.quantity_per_delivery} huevos` : null,
        plan.frequency ? (FREQ_LABEL[plan.frequency] ?? plan.frequency) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  // Terminal / transient states (not part of the confirm <-> created swap).
  if (part.state === "output-error") {
    return <OrderErrorCard message={String(part.errorText ?? "Ocurrió un error con el pedido.")} />;
  }
  if (part.state === "output-denied") {
    return (
      <div className="flex min-h-[260px] flex-col rounded-xl border border-separator bg-[var(--background-secondary)] p-4 text-sm text-muted">
        Pedido cancelado. Avísame si quieres retomarlo.
      </div>
    );
  }
  if (part.state !== "approval-requested" && part.state !== "output-available") {
    // input-streaming / input-available — still gathering the order
    return (
      <div className="flex min-h-[260px] items-center gap-2 rounded-xl border border-separator bg-[var(--background-secondary)] p-4 text-sm text-muted">
        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
        Preparando tu pedido…
      </div>
    );
  }

  // approval-requested and output-available share ONE layout — same plan header,
  // the same summary rows, and a fixed-height footer — so the card keeps the same
  // size when the order is confirmed and swaps from "Confirmar" to "Pedido creado".
  const output =
    part.state === "output-available" ? ((part.output ?? {}) as Record<string, unknown>) : null;
  // createOrder.execute can return { ok:false, error } as a normal output.
  if (output && (output.ok === false || (output.error && typeof output.payment_url !== "string"))) {
    return <OrderErrorCard message={String(output.error ?? "No se pudo crear el pedido.")} />;
  }
  const created = part.state === "output-available";
  const paymentUrl = output && typeof output.payment_url === "string" ? output.payment_url : null;
  const total =
    output && typeof output.amount_label === "string" ? output.amount_label : plan?.price_label;
  const holdMinutes =
    output && typeof output.hold_minutes === "number" ? output.hold_minutes : null;

  return (
    <div className="flex min-h-[260px] flex-col rounded-xl border border-separator bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span
          aria-hidden
          className={`size-2 rounded-full ${created ? "bg-emerald-500" : "bg-amber-500"}`}
        />
        {created ? "¡Pedido creado!" : "Confirmar pedido"}
      </div>

      {plan?.name || total ? (
        <div className="mb-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-base font-bold text-foreground">{plan?.name ?? "Pedido"}</span>
            {total ? <span className="text-base font-bold text-accent">{total}</span> : null}
          </div>
          {planMeta ? <p className="text-xs text-muted">{planMeta}</p> : null}
        </div>
      ) : null}

      <dl className="space-y-1.5 border-t border-separator pt-3 text-sm">
        {zoneLabel ? <CardRow label="Zona" value={zoneLabel} /> : null}
        {input.contact_name ? <CardRow label="Nombre" value={String(input.contact_name)} /> : null}
        {input.contact_phone ? (
          <CardRow label="Teléfono" value={formatPhone(input.contact_phone)} />
        ) : null}
        {input.requested_delivery_date ? (
          <CardRow label="Entrega" value={String(input.requested_delivery_date)} />
        ) : null}
        {input.delivery_address ? (
          <CardRow label="Dirección" value={String(input.delivery_address)} />
        ) : null}
        {input.delivery_notes ? <CardRow label="Notas" value={String(input.delivery_notes)} /> : null}
      </dl>

      {/* Fixed-height footer so the action swap (buttons <-> pay link) doesn't resize the card. */}
      <div className="mt-auto flex min-h-[80px] flex-col justify-end gap-2 pt-3">
        {part.state === "output-available" ? (
          paymentUrl ? (
            <>
              <p className="text-xs leading-snug text-muted">
                {holdMinutes != null
                  ? `Paga dentro de ${holdMinutes} minutos para confirmar tu pedido.`
                  : "Completa el pago para confirmar tu pedido."}
              </p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Pagar ahora
                <span aria-hidden>→</span>
              </a>
            </>
          ) : (
            <p className="text-xs leading-snug text-muted">Tu pedido fue registrado.</p>
          )
        ) : (
          <>
            <p className="text-xs leading-snug text-muted">Revisa el resumen y confirma tu pedido.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onPress={() => onApprove?.(part.approval.id, true)}>
                Confirmar pedido
              </Button>
              <Button size="sm" variant="outline" onPress={() => onApprove?.(part.approval.id, false)}>
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Account-action tools — pause/cancel/reactivate need approval; reportDamagedProduct
// runs immediately. Rendered as a confirm/result card (not a raw JSON chip).
const ACTION_TITLES: Record<string, string> = {
  pauseSubscription: "Pausar suscripción",
  cancelSubscription: "Cancelar suscripción",
  reactivateSubscription: "Reactivar suscripción",
  reportDamagedProduct: "Reclamo por producto dañado",
};

function ActionCard({
  part,
  onApprove,
}: {
  part: AnyToolPart;
  onApprove?: (id: string, approved: boolean) => void;
}) {
  const name = String(getToolName(part));
  const title = ACTION_TITLES[name] ?? name;

  if (part.state === "output-error") {
    return <OrderErrorCard message={String(part.errorText ?? "Ocurrió un error.")} />;
  }
  if (part.state === "output-denied") {
    return (
      <div className="rounded-xl border border-separator bg-[var(--background-secondary)] p-3 text-sm text-muted">
        {title}: acción cancelada.
      </div>
    );
  }
  if (part.state === "output-available") {
    const output = (part.output ?? {}) as Record<string, unknown>;
    const ok = output.ok !== false;
    const msg = String(output.message ?? output.error ?? (ok ? "Listo." : "No se pudo completar."));
    return (
      <div className="rounded-xl border border-separator bg-[var(--surface)] p-4 text-sm shadow-sm">
        <div className="mb-1.5 flex items-center gap-2 font-semibold text-foreground">
          <span aria-hidden className={`size-2 rounded-full ${ok ? "bg-emerald-500" : "bg-danger"}`} />
          {title}
        </div>
        <p className="text-muted">{msg}</p>
      </div>
    );
  }
  if (part.state === "approval-requested") {
    return (
      <div className="rounded-xl border border-separator bg-[var(--surface)] p-4 text-sm shadow-sm">
        <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
          <span aria-hidden className="size-2 rounded-full bg-amber-500" />
          {title}
        </div>
        <p className="mb-3 text-muted">Confirma para continuar con esta acción en tu cuenta.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onPress={() => onApprove?.(part.approval.id, true)}>
            Confirmar
          </Button>
          <Button size="sm" variant="outline" onPress={() => onApprove?.(part.approval.id, false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-separator bg-[var(--background-secondary)] p-3 text-sm text-muted">
      <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-accent" />
      {title}…
    </div>
  );
}

function getText(message: UIMessage): string {
  let text = "";
  for (const part of message.parts) {
    if (part.type === "text") text += part.text;
  }
  return text;
}

export function SupportChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Stable per-browser id so the conversation persists across turns and reloads.
  const [chatId] = useState(() => {
    if (typeof window === "undefined") return "";
    let id = window.localStorage.getItem(CHAT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(CHAT_ID_KEY, id);
    }
    return id;
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: ENDPOINT,
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
          // Logged-in customers forward their session token so the agent can act on
          // their account (saldo/puntos/pausar/cancelar). Anonymous → omitted.
          ...(accessToken ? { "x-customer-jwt": accessToken } : {}),
        },
        body: { chatId },
      }),
    [chatId, accessToken],
  );

  const { messages, sendMessage, status, stop, regenerate, addToolApprovalResponse } = useChat({
    transport,
    // Auto-resubmit once the user answers an approval, so the Edge function resumes
    // and runs createOrder (on approve) / records the denial (on cancel).
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  // Match the WhatsApp widget's mount-delay guard (no SSR flash / hydration mismatch).
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Track the logged-in customer's session token (forwarded to the agent so it can
  // act on their account). Anonymous visitors keep it null and account tools refuse.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) => setAccessToken(data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setAccessToken(session?.access_token ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const isBusy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    void sendMessage({ text: trimmed });
    setInput("");
  };

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  };

  const handleFeedback = (id: string, rating: "up" | "down") => {
    if (feedback[id] === rating) return; // already rated this way — don't double-post
    setFeedback((current) => ({ ...current, [id]: rating }));
    void postFeedback(chatId, id, rating);
  };

  const handleApprove = (id: string, approved: boolean) => {
    void addToolApprovalResponse({ id, approved });
  };

  if (!mounted) return null;

  const lastMessage = messages[messages.length - 1];
  const showTrailingLoader = status === "submitted" && lastMessage?.role !== "assistant";
  // Plan/zone details for the order card, read from listPlans/listZones tool outputs.
  const catalog = collectCatalog(messages);

  return (
    <Sheet placement="right">
      <Sheet.Trigger>
        <Button
          isIconOnly
          size="lg"
          aria-label="Abrir chat de soporte"
          className="fixed bottom-24 right-6 z-50 size-14 rounded-full bg-accent text-white shadow-2xl transition hover:opacity-90"
        >
          <ChatBubbleIcon className="size-7" />
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
          />
        </Button>
      </Sheet.Trigger>

      <Sheet.Backdrop>
        <Sheet.Content className="h-dvh w-full sm:w-[400px]">
          <Sheet.Dialog className="flex h-full flex-col bg-[var(--surface)] p-0">
            <Sheet.Header className="flex shrink-0 items-center justify-between gap-3 border-b border-separator px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent text-white">
                  <ChatBubbleIcon className="size-5" />
                </span>
                <div>
                  <Sheet.Heading className="text-sm font-semibold leading-tight text-foreground">
                    Soporte Huevos Donald
                  </Sheet.Heading>
                  <p className="text-xs text-muted">Normalmente respondemos al instante</p>
                </div>
              </div>
              <Sheet.CloseTrigger />
            </Sheet.Header>

            <Sheet.Body className="min-h-0 flex-1 p-0">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col justify-end gap-4 p-4">
                  <p className="text-sm text-foreground">
                    👋 ¡Hola! Soy el asistente de Huevos Donald. ¿En qué te puedo ayudar?
                  </p>
                  <PromptSuggestion>
                    <PromptSuggestion.Items>
                      {SUGGESTIONS.map((suggestion) => (
                        <PromptSuggestion.Item key={suggestion} onPress={() => send(suggestion)}>
                          {suggestion}
                        </PromptSuggestion.Item>
                      ))}
                    </PromptSuggestion.Items>
                  </PromptSuggestion>
                </div>
              ) : (
                <ChatConversation className="h-full">
                  <ChatConversation.Content className="flex flex-col gap-4 px-4 py-4">
                    {messages.map((message) => {
                      if (message.role === "user") {
                        return (
                          <ChatMessage.User key={message.id}>
                            <ChatMessage.Bubble>
                              <ChatMessage.Content className="whitespace-pre-wrap">
                                {getText(message)}
                              </ChatMessage.Content>
                            </ChatMessage.Bubble>
                          </ChatMessage.User>
                        );
                      }

                      const text = getText(message);
                      const isStreamingThis = isBusy && message.id === lastMessage?.id;
                      const toolParts = message.parts.filter(isToolUIPart);
                      const orderTool = toolParts.find(
                        (part) => getToolName(part) === "createOrder",
                      );
                      const actionTools = toolParts.filter(
                        (part) => ACTION_TITLES[String(getToolName(part))],
                      );
                      const readOnlyTools = toolParts.filter(
                        (part) =>
                          getToolName(part) !== "createOrder" &&
                          !ACTION_TITLES[String(getToolName(part))],
                      );
                      const activeTool = [...toolParts]
                        .reverse()
                        .find(
                          (part) =>
                            part.state === "input-streaming" || part.state === "input-available",
                        );
                      const statusLabel = activeTool
                        ? (TOOL_STATUS[String(getToolName(activeTool))] ?? "Pensando…")
                        : "Pensando…";

                      return (
                        <ChatMessage.Assistant key={message.id}>
                          <ChatMessage.Avatar show alt="Soporte" fallback="HD" />
                          <ChatMessage.Body>
                            {(readOnlyTools.length > 0 || actionTools.length > 0 || orderTool) && (
                              <div className="mb-1 flex flex-col gap-1.5">
                                {readOnlyTools.map((part) => (
                                  <ToolActivity key={part.toolCallId} part={part} />
                                ))}
                                {actionTools.map((part) => (
                                  <ActionCard
                                    key={part.toolCallId}
                                    part={part}
                                    onApprove={handleApprove}
                                  />
                                ))}
                                {orderTool && (
                                  <OrderCard
                                    key={orderTool.toolCallId}
                                    part={orderTool}
                                    onApprove={handleApprove}
                                    catalog={catalog}
                                  />
                                )}
                              </div>
                            )}

                            <ChatMessage.Content>
                              {text ? (
                                <AssistantMarkdown text={text} />
                              ) : isStreamingThis ? (
                                <TextShimmer className="text-sm text-muted">
                                  {statusLabel}
                                </TextShimmer>
                              ) : null}
                            </ChatMessage.Content>

                            {text && !isStreamingThis && (
                              <ChatMessageActions>
                                <ChatMessageActions.Copy
                                  aria-label="Copiar"
                                  tooltip="Copiar"
                                  isCopied={copiedId === message.id}
                                  onPress={() => handleCopy(message.id, text)}
                                />
                                <ChatMessageActions.ThumbsUp
                                  aria-label="Buena respuesta"
                                  tooltip="Buena respuesta"
                                  className={feedback[message.id] === "up" ? "text-success" : undefined}
                                  onPress={() => handleFeedback(message.id, "up")}
                                />
                                <ChatMessageActions.ThumbsDown
                                  aria-label="Mala respuesta"
                                  tooltip="Mala respuesta"
                                  className={feedback[message.id] === "down" ? "text-danger" : undefined}
                                  onPress={() => handleFeedback(message.id, "down")}
                                />
                                <ChatMessageActions.Regenerate
                                  aria-label="Regenerar respuesta"
                                  tooltip="Regenerar"
                                  onPress={() => regenerate({ messageId: message.id })}
                                />
                              </ChatMessageActions>
                            )}
                          </ChatMessage.Body>
                        </ChatMessage.Assistant>
                      );
                    })}

                    {showTrailingLoader && (
                      <ChatMessage.Assistant>
                        <ChatMessage.Avatar show alt="Soporte" fallback="HD" />
                        <ChatMessage.Body>
                          <ChatMessage.Content>
                            <ChatLoader.Skeleton label="Preparando respuesta…" />
                          </ChatMessage.Content>
                        </ChatMessage.Body>
                      </ChatMessage.Assistant>
                    )}

                    {status === "error" && (
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>No pudimos conectar.</span>
                        <button
                          type="button"
                          onClick={() => regenerate()}
                          className="font-medium text-accent underline"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}

                    <ChatConversation.ScrollAnchor />
                  </ChatConversation.Content>
                  <ChatConversation.ScrollButton aria-label="Ir al final de la conversación" />
                </ChatConversation>
              )}
            </Sheet.Body>

            <Sheet.Footer className="shrink-0 border-t border-separator p-3">
              <PromptInput
                className="w-full"
                size="sm"
                maxHeight={120}
                status={status}
                value={input}
                onValueChange={setInput}
                onStop={stop}
                onSubmit={() => send(input)}
              >
                <PromptInput.Shell>
                  <PromptInput.Content>
                    <PromptInput.TextArea placeholder="Escribe tu mensaje…" />
                  </PromptInput.Content>
                  <PromptInput.Toolbar>
                    <PromptInput.ToolbarStart>
                      <PromptInput.Action
                        aria-label="Ver planes y precios"
                        tooltip="Ver planes y precios"
                        onPress={() => send("¿Qué planes y precios tienen?")}
                      >
                        <TagIcon className="size-4" />
                      </PromptInput.Action>
                      <PromptInput.Action
                        aria-label="¿Entregan en mi comuna?"
                        tooltip="¿Entregan en mi comuna?"
                        onPress={() => send("¿Entregan en mi comuna?")}
                      >
                        <PinIcon className="size-4" />
                      </PromptInput.Action>
                    </PromptInput.ToolbarStart>
                    <PromptInput.ToolbarEnd>
                      <PromptInput.Send />
                    </PromptInput.ToolbarEnd>
                  </PromptInput.Toolbar>
                </PromptInput.Shell>
                <PromptInput.Footer>
                  La IA puede cometer errores. Verifica la información importante.
                </PromptInput.Footer>
              </PromptInput>
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
