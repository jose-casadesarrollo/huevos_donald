// Agent core: OpenAI model + system prompt. Tools live in tools.ts; the
// per-channel run loops live in each function's index.ts. The editable parts of
// the prompt (persona / order rules / SOP policies / limits) and the model come
// from the DB via _shared/config.ts — admins edit them in /admin/settings and
// changes apply on the next request. The dynamic/structural parts below (today's
// date, the tool-capabilities list, the logged-in vs guest line, the headings)
// stay in code so they always match the actually-registered tools.
import { createOpenAI } from "@ai-sdk/openai";
import { type AgentConfig, DEFAULT_AGENT_CONFIG } from "./config.ts";

// gpt-4o-mini: cost-effective, strong tool-calling, good Spanish. The active
// config's `model` normally wins; OPENAI_MODEL secret remains a last-resort
// override for the rare empty-config case.
const DEFAULT_MODEL = "gpt-4o-mini";

export function getModel(model?: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY secret.");
  const openai = createOpenAI({ apiKey });
  const name = (model ?? "").trim() || Deno.env.get("OPENAI_MODEL") || DEFAULT_MODEL;
  return openai(name);
}

/** Today's date (YYYY-MM-DD) in the business timezone for relative dates. */
export function todayInSantiago(): string {
  // en-CA renders ISO-like YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
  }).format(new Date());
}

// Brand + policy knowledge is distilled from the Donald SOP v1.0. Bracketed
// SOP values that are not yet finalized are phrased generically in the config so
// the agent never states an unconfirmed figure. Fill these in when confirmed:
//   TODO[SOP §5]:  hora de corte + SLA de despacho (mismo día / X días hábiles).
//   TODO[SOP §11]: anticipación mínima para pausar (X días) y pausa máxima (X meses).
//   TODO[SOP §20]: plazo del reembolso y de la entrega del saldo pendiente (X días hábiles).
export function buildSystemPrompt(opts: {
  config?: AgentConfig;
  today?: string;
  authenticated?: boolean;
}): string {
  // Falls back to the hardcoded defaults if no config is passed (e.g. a caller
  // that hasn't been wired to loadAgentConfig yet), so the prompt is never empty.
  const config = opts.config ?? DEFAULT_AGENT_CONFIG;
  const today = opts.today ?? todayInSantiago();
  const authenticated = opts.authenticated ?? false;
  return [
    config.persona,
    "",
    `La fecha de hoy es ${today} (zona horaria America/Santiago). Úsala para interpretar fechas relativas como "mañana" o "el viernes".`,
    "",
    "## Qué puedes hacer con herramientas",
    "- Explicar planes y precios con listPlans (hay planes con distintas frecuencias: semanal, quincenal y mensual; los precios salen de la herramienta).",
    "- Verificar cobertura por comuna con listZones.",
    "- Verificar disponibilidad de fecha y bloque horario con checkDeliveryAvailability ANTES de tomar un pedido.",
    "- Tomar un pedido de UNA entrega con createOrder (pago único). La cantidad y el precio salen del plan elegido.",
    "- Consultar el saldo de huevos (checkSaldo) y los Puntos Donald (checkPuntos) — solo con sesión iniciada.",
    "- Consultar el estado de un pedido con getOrderStatus.",
    "- Pausar (pauseSubscription), cancelar (cancelSubscription) o reactivar (reactivateSubscription) la suscripción — solo con sesión iniciada y con confirmación del cliente.",
    "- Registrar un reclamo por producto dañado con reportDamagedProduct — solo con sesión iniciada.",
    "",
    authenticated
      ? "El cliente TIENE sesión iniciada: puedes usar las herramientas de cuenta (saldo, puntos, pausar/cancelar/reactivar, reclamo)."
      : "El cliente NO tiene sesión iniciada: NO uses las herramientas de cuenta (saldo, puntos, pausar/cancelar/reactivar, reclamo). Si las pide, dile con amabilidad que inicie sesión en su cuenta del sitio web.",
    "",
    "## Reglas para tomar pedidos",
    config.orderRules,
    "",
    "## Conocimiento de marca y políticas (SOP)",
    config.sopPolicies,
    "",
    "## Límites",
    config.limits,
  ].join("\n");
}
