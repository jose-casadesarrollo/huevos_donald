import type { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']
type Views = Database['public']['Views']

export type Enums = Database['public']['Enums']

// --- Row aliases (generated, authoritative) -------------------------------
export type Zone = Tables['delivery_zones']['Row']
export type ZoneDay = Tables['delivery_zone_days']['Row']
export type Slot = Tables['delivery_slots']['Row']
export type SlotCapacity = Tables['slot_capacity']['Row']
export type SlotUtilization = Views['admin_slot_utilization']['Row']
export type BlackoutDate = Tables['delivery_blackout_dates']['Row']
export type Plan = Tables['plans']['Row']
export type Product = Tables['products']['Row']
export type AppSetting = Tables['app_settings']['Row']
export type Coupon = Tables['coupons']['Row']
export type CouponRedemption = Tables['coupon_redemptions']['Row']
export type Incident = Tables['incidents']['Row']
export type ProductionLot = Tables['production_lots']['Row']
export type EggLedgerEntry = Tables['egg_ledger']['Row']
export type PointsLedgerEntry = Tables['points_ledger']['Row']
export type AgentConfigVersion = Tables['agent_config_versions']['Row']

/** Lightweight customer projection for pickers + ledger labelling. */
export type CustomerLite = {
  id: string
  fullName: string | null
  email: string | null
  pointsBalance: number
}

/** Subscription projection for the saldo (egg balance) editor. */
export type SubscriptionLite = {
  id: string
  userId: string
  planId: string | null
  status: Enums['subscription_status']
  eggBalance: number
}

/** Everything the Service Config page renders. Fetched once on the server. */
export type ServiceConfigData = {
  zones: Zone[]
  zoneDays: ZoneDay[]
  slots: Slot[]
  capacity: SlotCapacity[]
  utilization: SlotUtilization[]
  blackouts: BlackoutDate[]
  plans: Plan[]
  products: Product[]
  settings: AppSetting[]
  coupons: Coupon[]
  redemptions: CouponRedemption[]
  lots: ProductionLot[]
  eggLedger: EggLedgerEntry[]
  pointsLedger: PointsLedgerEntry[]
  customers: CustomerLite[]
  subscriptions: SubscriptionLite[]
  agentConfig: AgentConfigVersion | null
  agentConfigVersions: AgentConfigVersion[]
}

/** Standard return shape for every config server action. */
export type ActionResult = { ok: boolean; error?: string }
