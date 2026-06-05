// Durable tool-approval state for the stateless Telegram path.
//
// AI SDK v5 does not pause generateText for approvals: a guarded tool returns a
// `tool-approval-request` and the call ends. We persist the EXACT resume payload
// (the ModelMessage[] including the assistant turn that holds the request) so a
// later /approve or /deny can deterministically resume — the documented
// in-process round-trip, just split across two webhook invocations.
import type { ModelMessage } from "ai";
import type { Db } from "./supabase.ts";
import type { Database } from "./database.types.ts";

type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

// Stored verbatim in agent_pending_approvals.tool_input (jsonb).
interface ApprovalPayload {
  input: unknown;
  resumeMessages: ModelMessage[];
}

export interface PendingApproval {
  id: string;
  approvalId: string;
  toolName: string;
  summary: string | null;
  input: unknown;
  resumeMessages: ModelMessage[];
}

export async function savePendingApproval(
  db: Db,
  args: {
    conversationId: string;
    approvalId: string;
    toolName: string;
    input: unknown;
    summary: string;
    resumeMessages: ModelMessage[];
  },
): Promise<void> {
  const payload: ApprovalPayload = {
    input: args.input,
    resumeMessages: args.resumeMessages,
  };
  const { error } = await db.from("agent_pending_approvals").insert({
    conversation_id: args.conversationId,
    approval_id: args.approvalId,
    tool_name: args.toolName,
    tool_input: payload as unknown as
      Database["public"]["Tables"]["agent_pending_approvals"]["Insert"]["tool_input"],
    summary: args.summary,
  });
  if (error) throw new Error(`savePendingApproval: ${error.message}`);
}

export async function getPendingApproval(
  db: Db,
  conversationId: string,
  approvalId: string,
): Promise<PendingApproval | null> {
  const { data, error } = await db
    .from("agent_pending_approvals")
    .select("id, approval_id, tool_name, summary, tool_input, status")
    .eq("conversation_id", conversationId)
    .eq("approval_id", approvalId)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw new Error(`getPendingApproval: ${error.message}`);
  if (!data) return null;
  const payload = (data.tool_input ?? {}) as unknown as ApprovalPayload;
  return {
    id: data.id,
    approvalId: data.approval_id,
    toolName: data.tool_name,
    summary: data.summary,
    input: payload.input,
    resumeMessages: payload.resumeMessages ?? [],
  };
}

/** The single oldest still-pending approval for a conversation, if any. */
export async function getOldestPendingApproval(
  db: Db,
  conversationId: string,
): Promise<PendingApproval | null> {
  const { data, error } = await db
    .from("agent_pending_approvals")
    .select("id, approval_id, tool_name, summary, tool_input, status")
    .eq("conversation_id", conversationId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getOldestPendingApproval: ${error.message}`);
  if (!data) return null;
  const payload = (data.tool_input ?? {}) as unknown as ApprovalPayload;
  return {
    id: data.id,
    approvalId: data.approval_id,
    toolName: data.tool_name,
    summary: data.summary,
    input: payload.input,
    resumeMessages: payload.resumeMessages ?? [],
  };
}

export async function resolvePendingApproval(
  db: Db,
  id: string,
  status: Extract<ApprovalStatus, "approved" | "denied" | "expired">,
): Promise<void> {
  const { error } = await db
    .from("agent_pending_approvals")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`resolvePendingApproval: ${error.message}`);
}
