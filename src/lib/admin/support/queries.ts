import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { CustomerLite, Incident } from '@/lib/admin/config/types'

export type SupportData = {
  incidents: Incident[]
  customers: CustomerLite[]
}

/** Reads for the dedicated Soporte page: the incident queue + customer lookup. */
export async function getSupportData(): Promise<SupportData> {
  const supabase = await createClient()

  const [incidents, profiles] = await Promise.all([
    supabase.from('incidents').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email, points_balance').order('full_name'),
  ])

  return {
    incidents: incidents.data ?? [],
    customers: (profiles.data ?? []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      pointsBalance: p.points_balance ?? 0,
    })),
  }
}
