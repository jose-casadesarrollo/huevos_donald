import 'server-only'
import {
  createClient as createServiceClient,
  type SupabaseClient,
} from '@supabase/supabase-js'
import type { Database } from './database.types'
import { createClient as createServerRlsClient } from './server'

/**
 * Typed clients + row aliases for the storefront/cart commerce tables added by the
 * `20260610*` migrations (store_products, carts, cart_items, order_items). Now that
 * `database.types.ts` has been regenerated from the live schema, these are the real
 * generated types.
 */

export type CartStatus = Database['public']['Enums']['cart_status']
export type StoreProductRow = Database['public']['Tables']['store_products']['Row']
export type CartRow = Database['public']['Tables']['carts']['Row']
export type CartItemRow = Database['public']['Tables']['cart_items']['Row']
export type OrderItemRow = Database['public']['Tables']['order_items']['Row']

export type StoreClient = SupabaseClient<Database>

/** Service-role client (bypasses RLS; server-only). */
export function createStoreAdminClient(): StoreClient {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/** RLS-bound (cookie) client. */
export async function createStoreServerClient(): Promise<StoreClient> {
  return createServerRlsClient()
}
