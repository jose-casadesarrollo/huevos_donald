// Streaming web chat endpoint for the Huevos Donald agent.
//
// Compatible with @ai-sdk/react `useChat` (DefaultChatTransport). The browser
// sends the full UIMessage[] each turn; we stream the response back and persist
// the final history for audit. createOrder's needsApproval surfaces as an
// approval-request in the stream — the useChat client renders the confirm/deny
// UI and round-trips the decision, so no server-side pending state is needed here.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  convertToModelMessages,
  createIdGenerator,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { buildSystemPrompt, getModel } from "../_shared/agent.ts";
import { buildTools } from "../_shared/tools.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  getOrCreateConversation,
  replaceUIMessages,
  touchInbound,
  touchOutbound,
} from "../_shared/conversations.ts";
import { corsHeaders, preflight } from "../_shared/cors.ts";

const CHANNEL = "web";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }

  let body: { messages?: UIMessage[]; chatId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400, headers: cors });
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages[] required" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const db = createAdminClient();
  const externalId = body.chatId ?? crypto.randomUUID();
  const conv = await getOrCreateConversation(db, { channel: CHANNEL, externalId });
  await touchInbound(db, conv.id);

  const result = streamText({
    model: getModel(),
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: buildTools(db, { conversationId: conv.id, channel: CHANNEL }),
    stopWhen: stepCountIs(8),
    onError: ({ error }) => console.error("agent-chat stream error", error),
  });

  // Persist even if the browser disconnects mid-stream.
  EdgeRuntime.waitUntil(result.consumeStream());

  const response = result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
    onFinish: async ({ messages: finalMessages }) => {
      try {
        await replaceUIMessages(db, conv.id, finalMessages);
        await touchOutbound(db, conv.id);
      } catch (err) {
        console.error("agent-chat persist error", err);
      }
    },
  });

  // Merge CORS headers onto the streamed response.
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
});
