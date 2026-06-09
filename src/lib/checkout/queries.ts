import 'server-only';

import { getCurrentUser } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createStoreAdminClient } from '@/lib/supabase/store-db';

export interface ZoneOption {
  id: string;
  name: string;
  comuna: string | null;
}

export interface CheckoutPrefill {
  email: string | null;
  name: string | null;
  phone: string | null;
}

/** Active delivery zones (comunas) for the checkout select. Read service-role
 *  (zones aren't sensitive; avoids depending on a public RLS policy). */
export async function getActiveZones(): Promise<ZoneOption[]> {
  try {
    const db = createStoreAdminClient();
    const { data } = await db
      .from('delivery_zones')
      .select('id, name, comuna')
      .eq('active', true)
      .order('name');
    return (data ?? []) as ZoneOption[];
  } catch {
    return [];
  }
}

/** Prefill from the logged-in user's profile (empty for guests). */
export async function getCheckoutPrefill(): Promise<CheckoutPrefill> {
  try {
    const user = await getCurrentUser();
    if (!user) return { email: null, name: null, phone: null };
    const db = await createClient();
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle();
    return {
      email: user.email ?? null,
      name: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
    };
  } catch {
    return { email: null, name: null, phone: null };
  }
}
