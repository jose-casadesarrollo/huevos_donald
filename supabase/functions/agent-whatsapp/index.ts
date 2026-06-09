// WhatsApp (Meta WABA Cloud API) webhook for the Huevos Donald ordering agent.
//
// Flow: GET = hub.challenge verify -> POST: verify X-Hub-Signature-256 over the
// raw body -> per message: idempotency guard -> resolve trusted identity from
// the platform-verified sender phone -> if a tool approval is pending, interpret
// the reply as the decision and RESUME; otherwise run a fresh agent turn.
// createOrder is gated by needsApproval, so the customer confirms before the
// order is committed (AI SDK v5 returns a tool-approval-request; we persist the
// resume state and continue on the next message).
//
// Approvals are surfaced as interactive reply buttons (Confirmar/Cancelar) whose
// ids encode the approvalId + decision, so a tap resolves the exact approval
// deterministically (see approvalButtons / parseButtonDecision). Typed "sí"/"no"
// still works as a fallback (parseDecision).
//
// Unlike Telegram, WhatsApp platform-verifies the sender number, so the customer
// is authenticated by their phone (see _shared/identity.ts) and the account
// tools (saldo, puntos, pausar/cancelar/reactivar, reclamo) are available.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  generateText,
  stepCountIs,
  type ModelMessage,
  type ToolApprovalResponse,
} from "ai";
import { buildSystemPrompt, getModel } from "../_shared/agent.ts";
import { loadAgentConfig } from "../_shared/config.ts";
import { frequencyEs } from "../_shared/catalog.ts";
import { buildTools, summarizeOrderDraft } from "../_shared/tools.ts";
import { createAdminClient, type Db } from "../_shared/supabase.ts";
import {
  appendModelMessages,
  getOrCreateConversation,
  loadModelMessages,
  setConversationStatus,
  touchInbound,
  touchOutbound,
} from "../_shared/conversations.ts";
import {
  getOldestPendingApproval,
  getPendingApproval,
  type PendingApproval,
  resolvePendingApproval,
  savePendingApproval,
} from "../_shared/approvals.ts";
import { resolveCustomerIdentity } from "../_shared/identity.ts";
import {
  extractIncomingMessages,
  handleVerificationRequest,
  type IncomingMessage,
  type ListRow,
  type ReplyButton,
  sendWhatsAppButtons,
  sendWhatsAppCtaUrl,
  sendWhatsAppList,
  sendWhatsAppMessage,
  verifyWhatsAppSignature,
  type WhatsAppWebhook,
} from "../_shared/whatsapp.ts";

const CHANNEL = "whatsapp";
const STEP_LIMIT = stepCountIs(8);

interface ApprovalRequest {
  approvalId: string;
  toolName: string;
  input: Record<string, unknown>;
}

// deno-lint-ignore no-explicit-any
function collectApprovalRequests(result: any): ApprovalRequest[] {
  const out = new Map<string, ApprovalRequest>();
  // deno-lint-ignore no-explicit-any
  const scan = (parts: any[] | undefined) => {
    for (const p of parts ?? []) {
      if (p?.type === "tool-approval-request") {
        out.set(p.approvalId, {
          approvalId: p.approvalId,
          toolName: p.toolCall?.toolName ?? "",
          input: (p.toolCall?.input ?? {}) as Record<string, unknown>,
        });
      }
    }
  };
  scan(result?.content);
  for (const s of result?.steps ?? []) scan(s?.content);
  return [...out.values()];
}

function parseDecision(text: string): "approve" | "deny" | null {
  const t = text.trim().toLowerCase().replace(/[!.¡]/g, "");
  const yes = ["si", "sí", "s", "yes", "ok", "okay", "dale", "ya", "confirmar", "confirmo", "acepto", "aprobar", "/approve", "/confirmar"];
  const no = ["no", "n", "cancelar", "cancela", "rechazar", "rechazo", "/deny", "/cancel", "/cancelar"];
  if (yes.includes(t)) return "approve";
  if (no.includes(t)) return "deny";
  return null;
}

// Approval reply buttons. We encode the approvalId + decision into the button id
// so a tap round-trips as `interactive.button_reply.id` = "appr:<id>:yes|no" —
// a deterministic decision, with no reliance on fuzzy text matching, that also
// names the exact approval it answers (uuid-ish id stays well under the 256 cap).
function approvalButtons(approvalId: string): ReplyButton[] {
  return [
    { id: `appr:${approvalId}:yes`, title: "✅ Confirmar" },
    { id: `appr:${approvalId}:no`, title: "❌ Cancelar" },
  ];
}

/** Parse an approval decision from a tapped button id, or null if it isn't one. */
function parseButtonDecision(
  interactiveId: string,
): { approvalId: string; decision: "approve" | "deny" } | null {
  const m = /^appr:(.+):(yes|no)$/.exec(interactiveId);
  if (!m) return null;
  return { approvalId: m[1], decision: m[2] === "yes" ? "approve" : "deny" };
}

// Scan a generateText result's content + step content for a tool's RAW execute
// output. Mirrors collectApprovalRequests. Works for NON-GATED tools (listPlans/
// listZones), whose tool-result lands in step content of THIS same call. (A gated
// tool runs pre-step-loop on resume and does NOT appear here — see
// readCreateOrderOutput.) The tool-result part shape is verified against
// ai@6.0.197: { type:"tool-result", toolName, input, output }.
// deno-lint-ignore no-explicit-any
function scanToolOutputs(result: any, toolName: string): any[] {
  // deno-lint-ignore no-explicit-any
  const out: any[] = [];
  // deno-lint-ignore no-explicit-any
  const scan = (parts: any[] | undefined) => {
    for (const p of parts ?? []) {
      if (p?.type === "tool-result" && p?.toolName === toolName) out.push(p.output);
    }
  };
  scan(result?.content);
  for (const s of result?.steps ?? []) scan(s?.content);
  return out;
}

/** listPlans().plans → WABA list rows. id = `plan:<plan_id>` (the actionable UUID). */
// deno-lint-ignore no-explicit-any
function planRows(o: any): ListRow[] {
  // deno-lint-ignore no-explicit-any
  return (o?.plans ?? []).map((p: any) => ({
    id: `plan:${p.plan_id}`,
    title: String(p.name ?? "Plan"),
    description: `${p.quantity_per_delivery} huevos · ${p.price_label} ${frequencyEs(p.frequency)}`
      .trim(),
  }));
}

/** listZones().zones → WABA list rows. id = `zone:<zone_id>`. */
// deno-lint-ignore no-explicit-any
function zoneRows(o: any): ListRow[] {
  // deno-lint-ignore no-explicit-any
  return (o?.zones ?? []).map((z: any) => ({
    id: `zone:${z.zone_id}`,
    title: String(z.comuna ?? z.name),
    ...(z.name && z.name !== z.comuna ? { description: String(z.name) } : {}),
  }));
}

// Read GATED createOrder output. On RESUME it executes PRE-step-loop, so it never
// lands in step content — only in result.response.messages as a role:"tool"
// message, where the output is WRAPPED by the SDK as { type:"json", value:{...} }
// (verified ai@6.0.197 to-response-messages + create-tool-model-output). We
// unwrap .value. The steps scan is a fallback for any non-resume path (raw there).
// deno-lint-ignore no-explicit-any
function readCreateOrderOutput(result: any): any | null {
  const fromSteps = scanToolOutputs(result, "createOrder");
  if (fromSteps.length) return fromSteps[fromSteps.length - 1]; // raw, unwrapped
  for (const m of result?.response?.messages ?? []) {
    if (m?.role !== "tool") continue;
    for (const c of m?.content ?? []) {
      if (c?.type === "tool-result" && c?.toolName === "createOrder") {
        const o = c.output;
        // Unwrap the { type:"json"|"text", value } envelope; tolerate raw objects.
        if (o && typeof o === "object" && "value" in o) return o.value;
        return o;
      }
    }
  }
  return null;
}

// A tapped list row id → a synthetic user ModelMessage carrying the actionable
// UUID, so the model can route it into checkDeliveryAvailability/createOrder
// without re-listing. Unknown prefix → null (caller falls back to the row title).
function selectionToUserMessage(it: { id: string; title: string }): ModelMessage | null {
  const i = it.id.indexOf(":");
  if (i < 0) return null;
  const type = it.id.slice(0, i);
  const uuid = it.id.slice(i + 1);
  if (type === "plan") {
    return { role: "user", content: `Elegí el plan "${it.title}" (plan_id: ${uuid}).` };
  }
  if (type === "zone") {
    return { role: "user", content: `Elegí la comuna "${it.title}" (zone_id: ${uuid}).` };
  }
  return null;
}

function usageCols(result: { totalUsage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number } }) {
  return {
    prompt_tokens: result.totalUsage?.inputTokens ?? null,
    completion_tokens: result.totalUsage?.outputTokens ?? null,
    total_tokens: result.totalUsage?.totalTokens ?? null,
  };
}

/** Have we already FINISHED handling this message id? (read-only check) */
async function isProcessed(db: Db, messageId: string): Promise<boolean> {
  const { data, error } = await db
    .from("processed_webhook_events")
    .select("id")
    .eq("provider", CHANNEL)
    .eq("event_id", messageId)
    .maybeSingle();
  if (error) {
    console.error("isProcessed check error", error);
    return false; // don't block the message on the idempotency guard
  }
  return !!data;
}

/** Mark a message fully handled. Swallows errors (must never abort a reply). */
async function markProcessed(db: Db, messageId: string): Promise<void> {
  const { error } = await db
    .from("processed_webhook_events")
    .insert({ provider: CHANNEL, event_id: messageId });
  if (error && error.code !== "23505") {
    console.error("markProcessed error", error);
  }
}

async function handleMessage(db: Db, incoming: IncomingMessage): Promise<void> {
  const from = incoming.from;
  const text = incoming.text.trim();

  const conv = await getOrCreateConversation(db, {
    channel: CHANNEL,
    externalId: from,
    metadata: { profileName: incoming.profileName ?? null },
  });
  await touchInbound(db, conv.id);

  // Trusted identity: WhatsApp platform-verifies the sender, so the phone maps
  // to a profile/subscription (see _shared/identity.ts). Account tools unlock.
  const { userId } = await resolveCustomerIdentity(db, {
    channel: CHANNEL,
    verifiedPhone: from,
  });
  if (userId) {
    await db.from("agent_conversations").update({ user_id: userId }).eq("id", conv.id);
  }

  const config = await loadAgentConfig(db);
  const model = getModel(config.model);
  const system = buildSystemPrompt({ config, authenticated: !!userId, interactive: true });
  const temperature = config.temperature;
  const tools = buildTools(db, { conversationId: conv.id, channel: CHANNEL, userId });

  // ── Resume path: a confirmation is pending ──────────────────────────────────
  // A tapped approval button names its exact approval + decision in its id; a
  // typed reply ("sí"/"no") falls back to resolving the oldest pending one.
  const btn = incoming.interactive ? parseButtonDecision(incoming.interactive.id) : null;
  let pending: PendingApproval | null = null;
  let decision: "approve" | "deny" | null = null;
  if (btn) {
    pending = await getPendingApproval(db, conv.id, btn.approvalId);
    if (pending) decision = btn.decision;
  }
  if (!pending) {
    pending = await getOldestPendingApproval(db, conv.id);
    if (pending) decision = parseDecision(text);
  }

  if (pending) {
    if (!decision) {
      await sendWhatsAppButtons(
        db,
        from,
        `Tienes una confirmación pendiente:\n\n${pending.summary ?? ""}`,
        approvalButtons(pending.approvalId),
        { footer: "Toca Confirmar o Cancelar" },
      );
      await touchOutbound(db, conv.id);
      return;
    }

    const approved = decision === "approve";
    const messages = [...pending.resumeMessages];
    const approvalResponse: ToolApprovalResponse = {
      type: "tool-approval-response",
      approvalId: pending.approvalId,
      approved,
      reason: approved ? "Cliente confirmó por WhatsApp" : "Cliente canceló por WhatsApp",
    };
    const toolMessage: ModelMessage = { role: "tool", content: [approvalResponse] };
    messages.push(toolMessage);

    const result = await generateText({ model, system, temperature, tools, messages, stopWhen: STEP_LIMIT });

    // Resolve the approval FIRST so a partial failure can't leave it stuck pending
    // (which would re-prompt forever). Then persist the resumed turn.
    await resolvePendingApproval(db, pending.id, approved ? "approved" : "denied");
    await setConversationStatus(db, conv.id, "open");
    await appendModelMessages(
      db,
      conv.id,
      [toolMessage, ...result.response.messages],
      usageCols(result),
    );

    // If the resumed turn committed an order, surface the MercadoPago link as a
    // one-tap "Pagar ahora" CTA button instead of a raw URL buried in prose.
    const co = readCreateOrderOutput(result);
    if (co?.ok === true && typeof co.payment_url === "string" && co.payment_url) {
      if (result.text) await sendWhatsAppMessage(db, from, result.text);
      // URL-free body: the link rides on the button, so don't reuse co.message
      // (it embeds the raw URL) which would show the link twice.
      await sendWhatsAppCtaUrl(
        db,
        from,
        `Tu pedido está reservado por ${co.hold_minutes ?? 30} min. Toca para pagar y confirmarlo. 👇`,
        "Pagar ahora",
        co.payment_url,
      );
    } else {
      // co is null (non-order tool), or carries ok:false / a denial envelope
      // (denied approval or pay-link failure): result.text already paraphrases it.
      await sendWhatsAppMessage(
        db,
        from,
        result.text || (approved ? "✅ Listo." : "Cancelado. ¿Te ayudo con algo más?"),
      );
    }
    await touchOutbound(db, conv.id);
    return;
  }

  // ── Fresh turn ──────────────────────────────────────────────────────────────
  const history = await loadModelMessages(db, conv.id);
  // A tapped list row (plan/zone) re-enters as a synthetic user message carrying
  // the actionable UUID; a non-list tap or plain text uses the text as-is. (List
  // ids never match parseButtonDecision, so they fall through to here.)
  const selMsg = incoming.interactive?.kind === "list_reply"
    ? selectionToUserMessage(incoming.interactive)
    : null;
  const userMessage: ModelMessage = selMsg ?? { role: "user", content: text };
  const messages = [...history, userMessage];

  const result = await generateText({ model, system, temperature, tools, messages, stopWhen: STEP_LIMIT });
  const approvals = collectApprovalRequests(result);

  if (approvals.length > 0) {
    // Resolve approvals one at a time; persist only the first to avoid zombie
    // pending rows. createOrder is the only gated tool, so >1 is not expected.
    if (approvals.length > 1) {
      console.warn(
        `agent-whatsapp: ${approvals.length} approval requests in one turn; handling the first only.`,
      );
    }
    const first = approvals[0];

    // Persist this turn (user + assistant turn carrying the approval request).
    await appendModelMessages(db, conv.id, [userMessage, ...result.response.messages]);

    const summary = first.toolName === "createOrder"
      ? await summarizeOrderDraft(db, first.input)
      : `Acción: ${first.toolName}`;
    await savePendingApproval(db, {
      conversationId: conv.id,
      approvalId: first.approvalId,
      toolName: first.toolName,
      input: first.input,
      summary,
      resumeMessages: [...messages, ...result.response.messages],
    });
    await setConversationStatus(db, conv.id, "awaiting_approval");

    // Send any agent preamble as its own text so the summary (the thing being
    // approved) is never truncated against the 1024-char interactive body cap.
    if (result.text) await sendWhatsAppMessage(db, from, result.text);
    await sendWhatsAppButtons(
      db,
      from,
      summary,
      approvalButtons(first.approvalId),
      { footer: "Toca Confirmar o Cancelar" },
    );
    await touchOutbound(db, conv.id);
    return;
  }

  // No approval needed — persist and reply.
  await appendModelMessages(
    db,
    conv.id,
    [userMessage, ...result.response.messages],
    usageCols(result),
  );

  // LLM-driven list rendering: the model's listPlans/listZones tool-call IS the
  // "show a tappable picker" signal (there is intentionally no presenter tool —
  // the trigger is a tool-result match here, symmetric with collectApprovalRequests;
  // the WhatsApp prompt steers the model not to enumerate options in prose). These
  // tools are NON-GATED, so their raw output is in this call's step content.
  // Dedupe by toolName and gate on actual ROWS (not just that the tool ran), so an
  // empty catalog never emits a Graph-rejected empty-sections list.
  const planList = planRows(scanToolOutputs(result, "listPlans")[0] ?? {});
  const zoneList = zoneRows(scanToolOutputs(result, "listZones")[0] ?? {});

  if (!planList.length && !zoneList.length) {
    // No picker to show — plain reply (falls back to result.text or a placeholder).
    await sendWhatsAppMessage(db, from, result.text || "…");
  } else {
    // Fold the model's short guiding text into the FIRST list's body so we don't
    // send a near-duplicate text message alongside the picker.
    let lead = result.text?.trim() ?? "";
    if (planList.length) {
      await sendWhatsAppList(db, from, lead || "Elige tu plan abajo 👇", "Elegir plan", [
        { title: "Planes", rows: planList },
      ]);
      lead = "";
    }
    if (zoneList.length) {
      await sendWhatsAppList(db, from, lead || "Elige tu comuna abajo 👇", "Elegir comuna", [
        { title: "Zonas de reparto", rows: zoneList },
      ]);
    }
  }
  await touchOutbound(db, conv.id);
}

Deno.serve(async (req) => {
  // The service-role client is also how we reach the Vault for credentials, so
  // create it up front (needed by the GET verify + POST signature checks too).
  const db = createAdminClient();

  // GET = Meta webhook verification handshake.
  const verification = await handleVerificationRequest(db, req);
  if (verification) return verification;

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Read the RAW body first — signature is HMAC over these exact bytes.
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!(await verifyWhatsAppSignature(db, raw, signature))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WhatsAppWebhook;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const messages = extractIncomingMessages(payload);

  // Process sequentially: a single sender's messages may include an approval
  // reply that must resolve before the next turn. Meta delivers at-least-once,
  // so we dedup on the message id and mark-on-success.
  for (const incoming of messages) {
    try {
      if (await isProcessed(db, incoming.id)) continue;
      await handleMessage(db, incoming);
      await markProcessed(db, incoming.id);
    } catch (err) {
      // Not marked -> Meta will redeliver (correct for transient failures).
      console.error("agent-whatsapp error", err);
      try {
        await sendWhatsAppMessage(
          db,
          incoming.from,
          "Disculpa, tuve un problema procesando tu mensaje. Intenta nuevamente en un momento.",
        );
      } catch (_) { /* ignore */ }
    }
  }

  // Always 200 so Meta doesn't disable the webhook; dedup guards retries.
  return new Response("ok");
});
