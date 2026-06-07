// Conversation lifecycle + message persistence for the agent.
//
// Two persistence shapes share the agent_messages table (distinguished by the
// conversation's channel):
//   * WhatsApp (stateless server): we store provider ModelMessage[] so the next
//     turn can be reconstructed server-side. We APPEND new messages each turn.
//   * Web (useChat): the client sends full history each turn, so we persist the
//     final UIMessage[] from onFinish purely for audit — REPLACE-all per turn.
import type { ModelMessage, UIMessage } from "ai";
import type { Db } from "./supabase.ts";
import type { Database } from "./database.types.ts";

type ConversationRow =
  Database["public"]["Tables"]["agent_conversations"]["Row"];

export interface TokenUsage {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
}

export async function getOrCreateConversation(
  db: Db,
  args: { channel: string; externalId: string; metadata?: Record<string, unknown> },
): Promise<ConversationRow> {
  const { channel, externalId, metadata } = args;

  const existing = await db
    .from("agent_conversations")
    .select("*")
    .eq("channel", channel)
    .eq("external_id", externalId)
    .maybeSingle();
  if (existing.error) throw new Error(`getConversation: ${existing.error.message}`);
  if (existing.data) return existing.data;

  const inserted = await db
    .from("agent_conversations")
    .insert({ channel, external_id: externalId, metadata: metadata ?? {} })
    .select("*")
    .single();
  // Lost a race? Re-read the row the other writer created.
  if (inserted.error) {
    const retry = await db
      .from("agent_conversations")
      .select("*")
      .eq("channel", channel)
      .eq("external_id", externalId)
      .single();
    if (retry.error) throw new Error(`createConversation: ${retry.error.message}`);
    return retry.data;
  }
  return inserted.data;
}

export async function setConversationStatus(
  db: Db,
  conversationId: string,
  status: Database["public"]["Enums"]["agent_conversation_status"],
): Promise<void> {
  const { error } = await db
    .from("agent_conversations")
    .update({ status })
    .eq("id", conversationId);
  if (error) throw new Error(`setConversationStatus: ${error.message}`);
}

export async function touchInbound(db: Db, conversationId: string): Promise<void> {
  // Advisory timestamp — log on failure but never abort the turn.
  const { error } = await db
    .from("agent_conversations")
    .update({ last_inbound_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) console.error(`touchInbound: ${error.message}`);
}

export async function touchOutbound(db: Db, conversationId: string): Promise<void> {
  const { error } = await db
    .from("agent_conversations")
    .update({ last_outbound_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) console.error(`touchOutbound: ${error.message}`);
}

/** Flatten a ModelMessage/UIMessage content into plain text for admin readability. */
export function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p && typeof p === "object" && (p as { type?: string }).type === "text")
      .map((p) => (p as { text?: string }).text ?? "")
      .join("");
  }
  return "";
}

// ── WhatsApp (ModelMessage[]) ────────────────────────────────────────────────

export async function loadModelMessages(
  db: Db,
  conversationId: string,
  limit = 40,
): Promise<ModelMessage[]> {
  const { data, error } = await db
    .from("agent_messages")
    .select("role, parts")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`loadModelMessages: ${error.message}`);
  return (data ?? []).map((r) => ({
    role: r.role as ModelMessage["role"],
    // parts holds the original ModelMessage content (string-wrapped as a text part).
    content: r.parts as ModelMessage["content"],
  })) as ModelMessage[];
}

/** Append provider messages (one row each). Token usage lands on the last row. */
export async function appendModelMessages(
  db: Db,
  conversationId: string,
  messages: ModelMessage[],
  usage?: TokenUsage,
): Promise<void> {
  if (!messages.length) return;
  const rows = messages.map((m, i) => {
    const parts = typeof m.content === "string"
      ? [{ type: "text", text: m.content }]
      : m.content;
    const isLast = i === messages.length - 1;
    return {
      conversation_id: conversationId,
      role: m.role,
      parts: parts as unknown as Database["public"]["Tables"]["agent_messages"]["Insert"]["parts"],
      content_text: extractText(m.content) || null,
      prompt_tokens: isLast ? usage?.prompt_tokens ?? null : null,
      completion_tokens: isLast ? usage?.completion_tokens ?? null : null,
      total_tokens: isLast ? usage?.total_tokens ?? null : null,
    };
  });
  const { error } = await db.from("agent_messages").insert(rows);
  if (error) throw new Error(`appendModelMessages: ${error.message}`);
}

// ── Web (UIMessage[]) ─────────────────────────────────────────────────────────

/** Replace all stored messages for a conversation with the final UIMessage[]. */
export async function replaceUIMessages(
  db: Db,
  conversationId: string,
  messages: UIMessage[],
): Promise<void> {
  const del = await db
    .from("agent_messages")
    .delete()
    .eq("conversation_id", conversationId);
  if (del.error) throw new Error(`replaceUIMessages/delete: ${del.error.message}`);
  if (!messages.length) return;

  const rows = messages.map((m) => ({
    conversation_id: conversationId,
    role: m.role,
    parts: m.parts as unknown as Database["public"]["Tables"]["agent_messages"]["Insert"]["parts"],
    content_text: extractText(m.parts) || null,
    provider_message_id: m.id ?? null,
  }));
  const { error } = await db.from("agent_messages").insert(rows);
  if (error) throw new Error(`replaceUIMessages/insert: ${error.message}`);
}
