import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ServiceConfigData } from './types'

/**
 * Single round of reads for the Service Config page. Uses the RLS-bound SSR
 * client — an admin session passes `is_admin()`, so capacity / app_settings
 * (admin-only SELECT) come back too. Mirrors the shape of
 * `src/lib/metrics/queries.ts`.
 */
export async function getServiceConfig(): Promise<ServiceConfigData> {
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)

  const [
    zones,
    zoneDays,
    slots,
    capacity,
    utilization,
    blackouts,
    plans,
    products,
    settings,
    coupons,
    redemptions,
    lots,
    eggLedger,
    pointsLedger,
    profiles,
    subscriptions,
    agentConfig,
    agentConfigVersions,
  ] = await Promise.all([
    supabase.from('delivery_zones').select('*').order('active', { ascending: false }).order('name'),
    supabase.from('delivery_zone_days').select('*').order('zone_id').order('weekday'),
    supabase.from('delivery_slots').select('*').order('sort_order'),
    supabase.from('slot_capacity').select('*'),
    supabase
      .from('admin_slot_utilization')
      .select('*')
      .gte('delivery_date', today)
      .order('delivery_date')
      .limit(1000),
    supabase.from('delivery_blackout_dates').select('*').order('date'),
    supabase.from('plans').select('*').order('price_cents'),
    supabase.from('products').select('*').order('name'),
    supabase.from('app_settings').select('*').order('key'),
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('coupon_redemptions').select('*').order('redeemed_at', { ascending: false }).limit(200),
    supabase.from('production_lots').select('*').order('created_at', { ascending: false }),
    supabase.from('egg_ledger').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('points_ledger').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('profiles').select('id, full_name, email, points_balance').order('full_name'),
    supabase.from('subscriptions').select('id, user_id, plan_id, status, egg_balance'),
    supabase.from('agent_config_versions').select('*').eq('is_active', true).maybeSingle(),
    supabase.from('agent_config_versions').select('*').order('version', { ascending: false }).limit(50),
  ])

  return {
    zones: zones.data ?? [],
    zoneDays: zoneDays.data ?? [],
    slots: slots.data ?? [],
    capacity: capacity.data ?? [],
    utilization: utilization.data ?? [],
    blackouts: blackouts.data ?? [],
    plans: plans.data ?? [],
    products: products.data ?? [],
    settings: settings.data ?? [],
    coupons: coupons.data ?? [],
    redemptions: redemptions.data ?? [],
    lots: lots.data ?? [],
    eggLedger: eggLedger.data ?? [],
    pointsLedger: pointsLedger.data ?? [],
    customers: (profiles.data ?? []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      pointsBalance: p.points_balance ?? 0,
    })),
    subscriptions: (subscriptions.data ?? []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      planId: s.plan_id,
      status: s.status,
      eggBalance: s.egg_balance ?? 0,
    })),
    agentConfig: agentConfig.data ?? null,
    agentConfigVersions: agentConfigVersions.data ?? [],
  }
}
