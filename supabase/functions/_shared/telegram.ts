// Minimal Telegram Bot API helpers for the agent webhook.

const API = "https://api.telegram.org";

function token(): string {
  const t = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!t) throw new Error("Missing TELEGRAM_BOT_TOKEN secret.");
  return t;
}

/**
 * Verify the webhook caller. When you register the webhook with a secret_token,
 * Telegram sends it back in this header on every update. Reject mismatches.
 * If no secret is configured, verification is skipped (dev only — set one!).
 */
export function verifyTelegramSecret(req: Request): boolean {
  const expected = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  if (!expected) return true;
  return req.headers.get("x-telegram-bot-api-secret-token") === expected;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name?: string; username?: string };
    text?: string;
  };
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
): Promise<void> {
  const res = await fetch(`${API}/bot${token()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    // Retry once without Markdown in case the text breaks the parser.
    await fetch(`${API}/bot${token()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }
}
