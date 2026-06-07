import { Button } from '@heroui/react'
import { requireUser } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { formatCurrencyCents, formatNumber } from '@/lib/metrics/format'
import { signOut } from './actions'

type Tone = 'success' | 'warning' | 'danger' | 'muted'

const SUB_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pendiente', tone: 'muted' },
  authorized: { label: 'Activa', tone: 'success' },
  paused: { label: 'En pausa', tone: 'warning' },
  cancelled: { label: 'Cancelada', tone: 'danger' },
  past_due: { label: 'Pago pendiente', tone: 'warning' },
}

const ORDER_STATUS: Record<string, string> = {
  pending: 'Recibido',
  awaiting_payment: 'Esperando pago',
  paid: 'Pagado',
  fulfilling: 'En preparación',
  completed: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

const EGG_REASON: Record<string, string> = {
  plan_credit: 'Abono de plan',
  delivery_debit: 'Entrega',
  refund: 'Reembolso',
  adjustment: 'Ajuste',
  incident_credit: 'Compensación',
}

const POINTS_REASON: Record<string, string> = {
  purchase: 'Compra',
  renewal: 'Renovación',
  redemption: 'Canje',
  expiration: 'Caducidad',
  adjustment: 'Ajuste',
}

const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-amber-500/10 text-amber-600',
  danger: 'bg-danger/10 text-danger',
  muted: 'bg-[var(--background-secondary)] text-muted',
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {label}
    </span>
  )
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  )
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-separator bg-[var(--surface)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export default async function AccountPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const [profileRes, subsRes, ordersRes, eggRes, pointsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, points_balance').eq('id', user.id).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('id, status, egg_balance, next_billing_at, plan_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, status, amount_cents, requested_delivery_date, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('egg_ledger')
      .select('delta, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('points_ledger')
      .select('delta, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const profile = profileRes.data
  const subs = subsRes.data ?? []
  const active = subs.find((s) => s.status === 'authorized') ?? subs[0] ?? null
  const orders = ordersRes.data ?? []
  const eggLedger = eggRes.data ?? []
  const pointsLedger = pointsRes.data ?? []

  let planName: string | null = null
  if (active?.plan_id) {
    const { data: plan } = await supabase
      .from('plans')
      .select('name')
      .eq('id', active.plan_id)
      .maybeSingle()
    planName = plan?.name ?? null
  }

  const subStatus = active ? (SUB_STATUS[active.status] ?? { label: active.status, tone: 'muted' as Tone }) : null
  const greetingName = profile?.full_name?.split(' ')[0] ?? user.email

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Hola, {greetingName}</h1>
            <p className="text-sm text-muted">Tu cuenta Huevos Donald</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile
            label="Saldo de huevos"
            value={formatNumber(active?.egg_balance ?? 0)}
            hint="Se descuenta en cada entrega."
          />
          <StatTile
            label="Puntos Donald"
            value={formatNumber(profile?.points_balance ?? 0)}
            hint="Acumulas con cada compra."
          />
        </div>

        {/* Subscription */}
        <section className="rounded-2xl border border-separator bg-[var(--surface)] p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Suscripción</h2>
            {subStatus ? <Badge label={subStatus.label} tone={subStatus.tone} /> : null}
          </div>
          {active ? (
            <dl className="space-y-2 text-sm">
              {planName ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Plan</dt>
                  <dd className="font-medium text-foreground">{planName}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Próximo cobro</dt>
                <dd className="font-medium text-foreground">{fmtDate(active.next_billing_at)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">Aún no tienes una suscripción activa.</p>
          )}
        </section>

        {/* Order history */}
        <section className="rounded-2xl border border-separator bg-[var(--surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Historial de pedidos</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">Todavía no tienes pedidos.</p>
          ) : (
            <ul className="divide-y divide-separator">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{ORDER_STATUS[o.status] ?? o.status}</p>
                    <p className="text-xs text-muted">
                      {fmtDate(o.requested_delivery_date ?? o.created_at)}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatCurrencyCents(o.amount_cents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ledgers */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LedgerCard
            title="Movimientos de saldo"
            empty="Sin movimientos de saldo."
            rows={eggLedger.map((e) => ({
              label: EGG_REASON[e.reason] ?? e.reason,
              date: fmtDate(e.created_at),
              delta: e.delta,
              unit: 'huevos',
            }))}
          />
          <LedgerCard
            title="Movimientos de puntos"
            empty="Sin movimientos de puntos."
            rows={pointsLedger.map((p) => ({
              label: POINTS_REASON[p.reason] ?? p.reason,
              date: fmtDate(p.created_at),
              delta: p.delta,
              unit: 'pts',
            }))}
          />
        </div>
      </div>
    </main>
  )
}

function LedgerCard({
  title,
  empty,
  rows,
}: {
  title: string
  empty: string
  rows: { label: string; date: string; delta: number; unit: string }[]
}) {
  return (
    <section className="rounded-2xl border border-separator bg-[var(--surface)] p-5">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-separator">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted">{r.date}</p>
              </div>
              <span
                className={`font-semibold ${r.delta >= 0 ? 'text-emerald-600' : 'text-danger'}`}
              >
                {r.delta >= 0 ? '+' : ''}
                {formatNumber(r.delta)} {r.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
