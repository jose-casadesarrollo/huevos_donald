// WhatsApp credentials, loaded from Supabase Vault (encrypted at rest).
//
// PostgREST does not expose the `vault` schema, so we read the secrets through
// the locked-down SECURITY DEFINER RPC `public.get_whatsapp_secrets()` (EXECUTE
// granted only to service_role; see migration 20260607130000). The result is
// cached per warm worker with a short TTL so we don't hit the DB every request
// while still picking up rotations within minutes.
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY stay in Deno.env on purpose — they're
// needed to construct the client that reaches the DB/Vault in the first place.
import type { Db } from "./supabase.ts";

export interface WhatsAppConfig {
  accessToken: string | null;
  phoneNumberId: string | null;
  verifyToken: string | null;
  /** null => signature verification is skipped (dev only). */
  appSecret: string | null;
  /** Not secret; from Deno.env with a sane default. */
  graphVersion: string;
}

const TTL_MS = 10 * 60_000;
let cache: { value: WhatsAppConfig; at: number } | null = null;

/** Fetch the WhatsApp config, reading the secrets from Vault (cached). */
export async function getWhatsAppConfig(db: Db): Promise<WhatsAppConfig> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;

  // The generated Database type doesn't include this helper RPC; call it untyped.
  // deno-lint-ignore no-explicit-any
  const { data, error } = await (db as any).rpc("get_whatsapp_secrets");
  if (error) {
    console.error("getWhatsAppConfig: vault RPC get_whatsapp_secrets failed", error);
  }
  const secrets = (data ?? {}) as Record<string, string>;
  const value: WhatsAppConfig = {
    accessToken: secrets.WHATSAPP_ACCESS_TOKEN ?? null,
    phoneNumberId: secrets.WHATSAPP_PHONE_NUMBER_ID ?? null,
    verifyToken: secrets.WHATSAPP_VERIFY_TOKEN ?? null,
    appSecret: secrets.WHATSAPP_APP_SECRET ?? null,
    graphVersion: Deno.env.get("WHATSAPP_GRAPH_VERSION") ?? "v23.0",
  };
  // Only cache a successful, non-empty load so a transient failure self-heals.
  if (!error && value.accessToken) cache = { value, at: now };
  return value;
}
