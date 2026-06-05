// Shared CORS helpers for the agent edge functions.
// Allowed origins come from the AGENT_CHAT_ALLOWED_ORIGINS secret (comma-separated).
// Falls back to "*" only when the secret is unset (dev convenience).

const allowList = (Deno.env.get("AGENT_CHAT_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function corsHeaders(origin: string | null): Record<string, string> {
  // No allow-list configured -> permissive (dev only). Otherwise echo the origin
  // ONLY when it's explicitly allowed; never fall back to echoing a listed origin
  // to an unlisted caller.
  const allowOrigin = !allowList.length
    ? "*"
    : origin && allowList.includes(origin)
      ? origin
      : null;

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
}

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response("ok", { headers: corsHeaders(req.headers.get("origin")) });
}
