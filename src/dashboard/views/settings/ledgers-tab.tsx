'use client'

import { useMemo, useState } from 'react'
import { Button, Input, Label, ListBox, NumberField, Select, TextField } from '@heroui/react'
import type { Key } from '@heroui/react'

import type {
  CustomerLite,
  EggLedgerEntry,
  PointsLedgerEntry,
  SubscriptionLite,
} from '@/lib/admin/config/types'
import { EGG_LEDGER_REASON_LABEL, POINTS_LEDGER_REASON_LABEL } from '@/lib/admin/config/labels'
import { adjustEggBalance, adjustPoints } from '@/app/admin/settings/actions'

import { Hint, Section, useSave } from './_shared'

export function LedgersTab({
  customers,
  subscriptions,
  eggLedger,
  pointsLedger,
}: {
  customers: CustomerLite[]
  subscriptions: SubscriptionLite[]
  eggLedger: EggLedgerEntry[]
  pointsLedger: PointsLedgerEntry[]
}) {
  const customerName = (id: string) => {
    const c = customers.find((x) => x.id === id)
    return c?.fullName ?? c?.email ?? id.slice(0, 8)
  }

  return (
    <div className="flex flex-col gap-8">
      <Section title="Saldo de huevos" description="Ajustes manuales del saldo de huevos (crédito o débito).">
        <Hint>El saldo se calcula sumando movimientos; cada ajuste agrega un movimiento, no reemplaza el saldo.</Hint>
        <EggAdjustForm customers={customers} subscriptions={subscriptions} />
        <LedgerTable
          rows={eggLedger.map((e) => ({
            id: e.id,
            who: customerName(e.user_id),
            delta: e.delta,
            reason: EGG_LEDGER_REASON_LABEL[e.reason],
            note: e.note,
            date: e.created_at,
          }))}
          unit="huevos"
        />
      </Section>

      <Section title="Puntos Donald" description="Ajustes manuales de puntos de fidelidad.">
        <PointsAdjustForm customers={customers} />
        <LedgerTable
          rows={pointsLedger.map((p) => ({
            id: p.id,
            who: customerName(p.user_id),
            delta: p.delta,
            reason: POINTS_LEDGER_REASON_LABEL[p.reason],
            note: p.note,
            date: p.created_at,
          }))}
          unit="pts"
        />
      </Section>
    </div>
  )
}

function CustomerSelect({
  customers,
  value,
  onChange,
}: {
  customers: CustomerLite[]
  value: Key | null
  onChange: (k: Key | null) => void
}) {
  return (
    <Select value={value} onChange={onChange} placeholder="Selecciona un cliente">
      <Label>Cliente</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {customers.map((c) => (
            <ListBox.Item key={c.id} id={c.id} textValue={c.fullName ?? c.email ?? c.id}>
              {c.fullName ?? c.email ?? c.id}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}

function EggAdjustForm({ customers, subscriptions }: { customers: CustomerLite[]; subscriptions: SubscriptionLite[] }) {
  const { pending, save } = useSave()
  const [userId, setUserId] = useState<Key | null>(null)
  const [subId, setSubId] = useState<Key | null>('none')
  const [delta, setDelta] = useState<number | undefined>(undefined)
  const [note, setNote] = useState('')

  const subs = useMemo(() => subscriptions.filter((s) => s.userId === userId), [subscriptions, userId])

  function submit() {
    save(
      () =>
        adjustEggBalance({
          user_id: String(userId ?? ''),
          subscription_id: subId === 'none' ? null : String(subId),
          delta: delta ?? 0,
          note: note.trim() || null,
          value_cents_per_unit: null,
        }),
      'Ajuste de saldo registrado',
      () => {
        setDelta(undefined)
        setNote('')
      },
    )
  }

  return (
    <div className="border-default-200 bg-surface grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-[1.4fr_1fr_0.8fr_1.4fr_auto] md:items-end">
      <CustomerSelect customers={customers} value={userId} onChange={(k) => { setUserId(k); setSubId('none') }} />

      <Select value={subId} onChange={setSubId} isDisabled={!userId}>
        <Label>Suscripción</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="none" textValue="Sin suscripción">
              Sin suscripción
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {subs.map((s) => (
              <ListBox.Item key={s.id} id={s.id} textValue={`${s.id.slice(0, 8)} · saldo ${s.eggBalance}`}>
                {s.id.slice(0, 8)} · saldo {s.eggBalance}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <NumberField value={delta} step={1} onChange={setDelta}>
        <Label>Δ huevos</Label>
        <NumberField.Group>
          <NumberField.Input />
        </NumberField.Group>
      </NumberField>

      <TextField value={note} onChange={setNote}>
        <Label>Nota</Label>
        <Input placeholder="Motivo del ajuste" />
      </TextField>

      <Button isDisabled={!userId || !delta || pending} isPending={pending} onPress={submit}>
        Registrar
      </Button>
    </div>
  )
}

function PointsAdjustForm({ customers }: { customers: CustomerLite[] }) {
  const { pending, save } = useSave()
  const [userId, setUserId] = useState<Key | null>(null)
  const [delta, setDelta] = useState<number | undefined>(undefined)
  const [note, setNote] = useState('')

  function submit() {
    save(
      () => adjustPoints({ user_id: String(userId ?? ''), delta: delta ?? 0, note: note.trim() || null }),
      'Ajuste de puntos registrado',
      () => {
        setDelta(undefined)
        setNote('')
      },
    )
  }

  return (
    <div className="border-default-200 bg-surface grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-[1.4fr_0.8fr_1.4fr_auto] md:items-end">
      <CustomerSelect customers={customers} value={userId} onChange={setUserId} />

      <NumberField value={delta} step={1} onChange={setDelta}>
        <Label>Δ puntos</Label>
        <NumberField.Group>
          <NumberField.Input />
        </NumberField.Group>
      </NumberField>

      <TextField value={note} onChange={setNote}>
        <Label>Nota</Label>
        <Input placeholder="Motivo del ajuste" />
      </TextField>

      <Button isDisabled={!userId || !delta || pending} isPending={pending} onPress={submit}>
        Registrar
      </Button>
    </div>
  )
}

function LedgerTable({
  rows,
  unit,
}: {
  rows: { id: string; who: string; delta: number; reason: string; note: string | null; date: string }[]
  unit: string
}) {
  return (
    <div className="border-default-200 overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-default-200 border-b">
            <th className="text-muted p-3 text-left font-medium">Cliente</th>
            <th className="text-muted p-3 text-right font-medium">Movimiento</th>
            <th className="text-muted p-3 text-left font-medium">Motivo</th>
            <th className="text-muted p-3 text-left font-medium">Nota</th>
            <th className="text-muted p-3 text-left font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-default-100 border-b last:border-0">
              <td className="text-foreground p-3">{r.who}</td>
              <td className={`p-3 text-right tabular-nums ${r.delta < 0 ? 'text-danger' : 'text-success'}`}>
                {r.delta > 0 ? '+' : ''}
                {r.delta} {unit}
              </td>
              <td className="text-muted p-3">{r.reason}</td>
              <td className="text-muted p-3">{r.note ?? '—'}</td>
              <td className="text-muted p-3 tabular-nums">{new Date(r.date).toLocaleDateString('es-CL')}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="text-muted p-3" colSpan={5}>
                Sin movimientos.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
