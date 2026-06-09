/**
 * Client-safe labels + metadata for the Service Config CMS (no `server-only`).
 * Spanish (es-CL) display strings for enums and the app_settings policy keys.
 */
import type { Enums } from './types'

// Postgres `extract(dow)` convention: 0 = Domingo … 6 = Sábado.
export const WEEKDAYS: { value: number; short: string; long: string }[] = [
  { value: 1, short: 'Lun', long: 'Lunes' },
  { value: 2, short: 'Mar', long: 'Martes' },
  { value: 3, short: 'Mié', long: 'Miércoles' },
  { value: 4, short: 'Jue', long: 'Jueves' },
  { value: 5, short: 'Vie', long: 'Viernes' },
  { value: 6, short: 'Sáb', long: 'Sábado' },
  { value: 0, short: 'Dom', long: 'Domingo' },
]

export const PLAN_FREQUENCY_LABEL: Record<Enums['plan_frequency'], string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

export const COUPON_TYPE_LABEL: Record<Enums['coupon_type'], string> = {
  percent: 'Porcentaje (%)',
  fixed: 'Monto fijo (CLP)',
  eggs: 'Huevos',
}

export const COUPON_STATUS_LABEL: Record<Enums['coupon_status'], string> = {
  active: 'Activo',
  redeemed: 'Canjeado',
  expired: 'Expirado',
  void: 'Anulado',
}

export const INCIDENT_TYPE_LABEL: Record<Enums['incident_type'], string> = {
  damaged_product: 'Producto dañado',
  missing_items: 'Faltantes',
  wrong_items: 'Producto equivocado',
  other: 'Otro',
}

export const INCIDENT_STATUS_LABEL: Record<Enums['incident_status'], string> = {
  open: 'Abierto',
  reviewing: 'En revisión',
  resolved: 'Resuelto',
  rejected: 'Rechazado',
}

export const INCIDENT_RESOLUTION_LABEL: Record<Enums['incident_resolution'], string> = {
  partial_replacement: 'Reposición parcial',
  full_replacement: 'Reposición total',
  coupon: 'Cupón',
  none: 'Sin resolución',
}

export const SUBSCRIPTION_STATUS_LABEL: Record<Enums['subscription_status'], string> = {
  pending: 'Pendiente',
  authorized: 'Activa',
  paused: 'Pausada',
  cancelled: 'Cancelada',
  past_due: 'Morosa',
}

export const EGG_LEDGER_REASON_LABEL: Record<Enums['egg_ledger_reason'], string> = {
  plan_credit: 'Crédito de plan',
  delivery_debit: 'Débito por entrega',
  refund: 'Reembolso',
  adjustment: 'Ajuste manual',
  incident_credit: 'Crédito por incidencia',
}

export const POINTS_LEDGER_REASON_LABEL: Record<Enums['points_ledger_reason'], string> = {
  purchase: 'Compra',
  renewal: 'Renovación',
  redemption: 'Canje',
  expiration: 'Expiración',
  adjustment: 'Ajuste manual',
}

// --- app_settings policy keys ---------------------------------------------
// `kind` drives the editor widget; `value` JSONB type is load-bearing.
export type SettingKind = 'int' | 'string' | 'tz' | 'enum' | 'dispatch_hours' | 'json'

export type SettingMeta = {
  label: string
  help: string
  kind: SettingKind
  options?: string[]
  group: 'Programación' | 'Pedidos' | 'Pausas' | 'Reembolsos & saldo' | 'Puntos' | 'Otros'
}

export const SETTING_META: Record<string, SettingMeta> = {
  schedule_horizon_weeks: {
    label: 'Horizonte de generación (semanas)',
    help: 'Cuántas semanas hacia adelante se pre-generan las entregas.',
    kind: 'int',
    group: 'Programación',
  },
  timezone: {
    label: 'Zona horaria',
    help: 'Zona horaria operativa para el cálculo de días y horarios.',
    kind: 'tz',
    group: 'Programación',
  },
  dispatch_hours: {
    label: 'Ventanas de despacho por día',
    help: 'Horario de despacho por día de la semana (SOP §4). Sin sábado/domingo/feriados.',
    kind: 'dispatch_hours',
    group: 'Programación',
  },
  order_cutoff_hours: {
    label: 'Bloqueo de pedido (horas antes)',
    help: 'Horas antes del slot en que un pedido se bloquea (sin cambios).',
    kind: 'int',
    group: 'Pedidos',
  },
  order_cutoff_time: {
    label: 'Hora de corte (despacho mismo día)',
    help: 'SOP §5 — hora de corte para despacho el mismo día (ej. "13:00"). Vacío = sin definir.',
    kind: 'string',
    group: 'Pedidos',
  },
  dispatch_sla: {
    label: 'SLA de despacho',
    help: 'SOP §5 — mismo día hábil / X días hábiles. Vacío = sin definir.',
    kind: 'string',
    group: 'Pedidos',
  },
  pause_min_notice_days: {
    label: 'Aviso mínimo para pausar (días)',
    help: 'SOP §11 — días de aviso antes del próximo despacho para poder pausar.',
    kind: 'int',
    group: 'Pausas',
  },
  pause_max_months: {
    label: 'Pausa máxima (meses)',
    help: 'SOP §11 — duración máxima de pausa antes de la acción de expiración. Lo lee a diario el cron de pausas.',
    kind: 'int',
    group: 'Pausas',
  },
  pause_expiry_action: {
    label: 'Acción al expirar la pausa',
    help: 'SOP §11 — qué hacer al alcanzar la pausa máxima. Lo lee a diario el cron de pausas.',
    kind: 'enum',
    options: ['reactivate', 'cancel'],
    group: 'Pausas',
  },
  refund_window_business_days: {
    label: 'Ventana de reembolso (días hábiles)',
    help: 'SOP §20 — ventana de reembolso en días hábiles.',
    kind: 'int',
    group: 'Reembolsos & saldo',
  },
  saldo_delivery_window_days: {
    label: 'Ventana de entrega de saldo (días)',
    help: 'SOP §20 — ventana para entregar saldo pendiente tras una cancelación.',
    kind: 'int',
    group: 'Reembolsos & saldo',
  },
  points_earn_rate: {
    label: 'Tasa de acumulación de puntos',
    help: 'SOP §10 — puntos ganados por compra/renovación.',
    kind: 'int',
    group: 'Puntos',
  },
}

export const SETTING_GROUP_ORDER: SettingMeta['group'][] = [
  'Programación',
  'Pedidos',
  'Pausas',
  'Reembolsos & saldo',
  'Puntos',
  'Otros',
]

// --- Agente IA (agent_config_versions) ------------------------------------
// Editable prose sections of the system prompt. The dynamic skeleton (today's
// date, the tool-capabilities list, the logged-in/guest line, the headings)
// stays in code (supabase/functions/_shared/agent.ts) so it always matches the
// registered tools — admins only edit the prose below + model + temperature.
export type AgentSectionKey = 'persona' | 'order_rules' | 'sop_policies' | 'limits'

export const AGENT_SECTION_FIELDS: {
  key: AgentSectionKey
  label: string
  help: string
}[] = [
  {
    key: 'persona',
    label: 'Persona y tono',
    help: 'Quién es el asistente, su tono y los pilares de marca. Es la apertura del prompt (sin encabezado).',
  },
  {
    key: 'order_rules',
    label: 'Reglas para tomar pedidos',
    help: 'Cómo reúne datos, confirma y crea pedidos. Va bajo el encabezado “## Reglas para tomar pedidos”.',
  },
  {
    key: 'sop_policies',
    label: 'Conocimiento de marca y políticas (SOP)',
    help: 'Cobertura, horarios, pagos, estados, pausas, reembolsos, etc. Va bajo “## Conocimiento de marca y políticas (SOP)”.',
  },
  {
    key: 'limits',
    label: 'Límites',
    help: 'Qué NO debe hacer el asistente. Va bajo el encabezado “## Límites”.',
  },
]

/** OpenAI models offered in the agent config picker. */
export const AGENT_MODEL_OPTIONS: string[] = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
  'gpt-4.1',
]

export const AGENT_TEMPERATURE = { min: 0, max: 2, step: 0.1, default: 0.3 } as const

/** dispatch_hours weekday keys in display order (no weekend). */
export const DISPATCH_DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
]
