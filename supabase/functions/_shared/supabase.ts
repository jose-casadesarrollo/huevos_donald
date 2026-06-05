// Service-role Supabase client for the agent edge functions.
//
// SECURITY: the service role bypasses RLS. Per the agent_ordering_schema design,
// the edge agent is the ONLY writer to orders / agent_* tables, and those tables
// expose read access to admins only. Never return this client (or its key) to a
// browser. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

export type Db = SupabaseClient<Database>;

export function createAdminClient(): Db {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the edge function environment.",
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
