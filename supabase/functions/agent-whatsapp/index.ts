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
  resolvePendingApproval,
  savePendingApproval,
} from "../_shared/approvals.ts";
import { resolveCustomerIdentity } from "../_shared/identity.ts";
import {
  extractIncomingTextMessages,
  handleVerificationRequest,
  type IncomingText,
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

async function handleMessage(db: Db, incoming: IncomingText): Promise<void> {
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

  const model = getModel();
  const system = buildSystemPrompt({ authenticated: !!userId });
  const tools = buildTools(db, { conversationId: conv.id, channel: CHANNEL, userId });

  // ── Resume path: a confirmation is pending ──────────────────────────────────
  const pending = await getOldestPendingApproval(db, conv.id);
  if (pending) {
    const decision = parseDecision(text);
    if (!decision) {
      await sendWhatsAppMessage(
        db,
        from,
        `Tienes una confirmación pendiente:\n\n${pending.summary ?? ""}\n\nResponde *sí* para confirmar o *no* para cancelar.`,
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

    const result = await generateText({ model, system, tools, messages, stopWhen: STEP_LIMIT });

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

    await sendWhatsAppMessage(
      db,
      from,
      result.text || (approved ? "✅ Listo." : "Cancelado. ¿Te ayudo con algo más?"),
    );
    await touchOutbound(db, conv.id);
    return;
  }

  // ── Fresh turn ──────────────────────────────────────────────────────────────
  const history = await loadModelMessages(db, conv.id);
  const userMessage: ModelMessage = { role: "user", content: text };
  const messages = [...history, userMessage];

  const result = await generateText({ model, system, tools, messages, stopWhen: STEP_LIMIT });
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

    const preface = result.text ? `${result.text}\n\n` : "";
    await sendWhatsAppMessage(
      db,
      from,
      `${preface}${summary}\n\n¿Confirmas? Responde *sí* para confirmar o *no* para cancelar.`,
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
  await sendWhatsAppMessage(db, from, result.text || "…");
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

  const messages = extractIncomingTextMessages(payload);

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
