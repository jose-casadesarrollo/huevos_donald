// Channel-aware customer identity for the agent.
//
// TRUST MODEL (see IDENTITY_MODEL.md):
//   - web:      a logged-in Supabase session JWT → user_id (validated by getUser).
//   - whatsapp: the sender's number is PLATFORM-VERIFIED by WhatsApp, so a
//               phone → profile/subscription match IS trustworthy on this channel.
//   - anything else: NO trusted identity → null.
//
// A phone number the customer merely *types into chat* is NEVER trusted here —
// only a `verifiedPhone` asserted by a platform that authenticates the sender
// (i.e. WhatsApp) counts. Account-scoped tools must refuse when userId is null.
import type { Db } from "./supabase.ts";
import { normalizePhone } from "./tools.ts";

export type IdentityVia = "web_session" | "whatsapp_number" | null;

export interface ResolveIdentityInput {
  channel: string;
  /** web: the customer's Supabase access token (NOT the anon apikey). */
  jwt?: string | null;
  /** whatsapp: the platform-verified sender phone number. */
  verifiedPhone?: string | null;
}

export interface ResolvedIdentity {
  userId: string | null;
  via: IdentityVia;
}

export async function resolveCustomerIdentity(
  db: Db,
  input: ResolveIdentityInput,
): Promise<ResolvedIdentity> {
  // ── Web: validate the session JWT → user_id ───────────────────────────────
  if (input.channel === "web" && input.jwt) {
    try {
      const { data, error } = await db.auth.getUser(input.jwt);
      if (!error && data?.user) return { userId: data.user.id, via: "web_session" };
    } catch (e) {
      console.error("resolveCustomerIdentity: getUser failed", e);
    }
    return { userId: null, via: null };
  }

  // ── WhatsApp: verified sender number → user_id ─────────────────────────────
  if (input.channel === "whatsapp" && input.verifiedPhone) {
    const phone = normalizePhone(input.verifiedPhone);
    if (!phone) return { userId: null, via: null };
    const prof = await db.from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (prof.data?.id) return { userId: prof.data.id, via: "whatsapp_number" };
    const sub = await db
      .from("subscriptions")
      .select("user_id")
      .eq("contact_phone", phone)
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (sub.data?.user_id) return { userId: sub.data.user_id, via: "whatsapp_number" };
    return { userId: null, via: null };
  }

  // ── Unauthenticated / unknown channel → no trusted identity ───────────────
  return { userId: null, via: null };
}
