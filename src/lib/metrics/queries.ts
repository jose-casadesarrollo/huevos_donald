import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Overview } from './types'

/**
 * Headline KPIs from the pre-built `admin_metrics_overview` view.
 * The view returns a single row; nulls (empty DB) are coalesced to 0.
 */
export async function getOverview(): Promise<Overview> {
  const supabase = await createClient()
  const { data } = await supabase.from('admin_metrics_overview').select('*').maybeSingle()

  return {
    activeSubscriptions: data?.active_subscriptions_count ?? 0,
    mrrCents: data?.mrr_cents ?? 0,
    revenueLast30dCents: data?.revenue_last_30d_cents ?? 0,
    revenueMtdCents: data?.revenue_mtd_cents ?? 0,
    deliveriesScheduledNext7d: data?.deliveries_scheduled_next_7d ?? 0,
    deliveriesCompletedLast30d: data?.deliveries_completed_last_30d ?? 0,
    failedDeliveriesLast30d: data?.failed_deliveries_last_30d ?? 0,
  }
}
