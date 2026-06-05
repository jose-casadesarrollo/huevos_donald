// Telegram webhook for the Huevos Donald ordering agent.
//
// Flow: verify secret -> idempotency guard -> if a tool approval is pending,
// interpret the reply as the decision and RESUME; otherwise run a fresh agent
// turn. createOrder is gated by needsApproval, so the customer confirms before
// the order is committed (AI SDK v5 returns a tool-approval-request; we persist
// the resume state and continue on the next message).
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
import {
  sendTelegramMessage,
  type TelegramUpdate,
  verifyTelegramSecret,
} from "../_shared/telegram.ts";

const CHANNEL = "telegram";
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

/** Have we already FINISHED handling this update_id? (read-only check) */
async function isProcessed(db: Db, updateId: number): Promise<boolean> {
  const { data, error } = await db
    .from("processed_webhook_events")
    .select("id")
    .eq("provider", CHANNEL)
    .eq("event_id", String(updateId))
    .maybeSingle();
  if (error) {
    console.error("isProcessed check error", error);
    return false; // don't block the message on the idempotency guard
  }
  return !!data;
}

/** Mark an update fully handled. Swallows errors (must never abort a reply). */
async function markProcessed(db: Db, updateId: number): Promise<void> {
  const { error } = await db
    .from("processed_webhook_events")
    .insert({ provider: CHANNEL, event_id: String(updateId) });
  if (error && error.code !== "23505") {
    console.error("markProcessed error", error);
  }
}

async function handleUpdate(db: Db, update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg?.text || !msg.chat) return; // ignore non-text updates

  const chatId = String(msg.chat.id);
  const text = msg.text.trim();

  const conv = await getOrCreateConversation(db, {
    channel: CHANNEL,
    externalId: chatId,
    metadata: { from: msg.from ?? null },
  });
  await touchInbound(db, conv.id);

  const model = getModel();
  const system = buildSystemPrompt();
  const tools = buildTools(db, { conversationId: conv.id, channel: CHANNEL });

  // ── Resume path: a confirmation is pending ──────────────────────────────────
  const pending = await getOldestPendingApproval(db, conv.id);
  if (pending) {
    const decision = parseDecision(text);
    if (!decision) {
      await sendTelegramMessage(
        chatId,
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
      reason: approved ? "Cliente confirmó por Telegram" : "Cliente canceló por Telegram",
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

    await sendTelegramMessage(
      chatId,
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
        `agent-telegram: ${approvals.length} approval requests in one turn; handling the first only.`,
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
    await sendTelegramMessage(
      chatId,
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
  await sendTelegramMessage(chatId, result.text || "…");
  await touchOutbound(db, conv.id);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (!verifyTelegramSecret(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const db = createAdminClient();
  const updateId = typeof update.update_id === "number" ? update.update_id : null;

  // Idempotency (Telegram delivers at-least-once): skip only updates we've already
  // FINISHED handling. We mark-on-success below, so a mid-handling crash replays
  // safely instead of dropping the user's message.
  if (updateId !== null && (await isProcessed(db, updateId))) {
    return new Response("ok (duplicate)");
  }

  try {
    await handleUpdate(db, update);
    if (updateId !== null) await markProcessed(db, updateId);
  } catch (err) {
    // Not marked -> Telegram will retry (correct for transient failures).
    console.error("agent-telegram error", err);
    const chatId = update.message?.chat?.id;
    if (chatId) {
      try {
        await sendTelegramMessage(
          chatId,
          "Disculpa, tuve un problema procesando tu mensaje. Intenta nuevamente en un momento.",
        );
      } catch (_) { /* ignore */ }
    }
  }
  return new Response("ok");
});
