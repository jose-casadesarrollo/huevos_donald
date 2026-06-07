'use client'

import { useState } from 'react'
import { Button, Chip, Input, Label, ListBox, NumberField, Select, TextField } from '@heroui/react'
import type { Key } from '@heroui/react'

import type { Coupon, CouponRedemption, CustomerLite, Enums } from '@/lib/admin/config/types'
import { COUPON_STATUS_LABEL, COUPON_TYPE_LABEL } from '@/lib/admin/config/labels'
import { formatCurrencyCents } from '@/lib/metrics/format'
import { setCouponStatus, upsertCoupon } from '@/app/admin/settings/actions'

import { FormModal, Hint, Section, useSave } from './_shared'

const TYPES: Enums['coupon_type'][] = ['percent', 'fixed', 'eggs']
const STATUSES: Enums['coupon_status'][] = ['active', 'redeemed', 'expired', 'void']

const STATUS_COLOR: Record<Enums['coupon_status'], 'success' | 'default' | 'warning' | 'danger'> = {
  active: 'success',
  redeemed: 'default',
  expired: 'warning',
  void: 'danger',
}

function formatValue(coupon: Coupon): string {
  if (coupon.type === 'percent') return `${coupon.value}%`
  if (coupon.type === 'eggs') return `${coupon.value} huevos`
  return formatCurrencyCents(coupon.value, coupon.currency)
}

export function CouponsTab({
  coupons,
  redemptions,
  customers,
}: {
  coupons: Coupon[]
  redemptions: CouponRedemption[]
  customers: CustomerLite[]
}) {
  const [editing, setEditing] = useState<{ mode: 'new' } | { mode: 'edit'; coupon: Coupon } | null>(null)

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Cupones & descuentos"
        description="Códigos promocionales o de resolución de incidencias (nunca efectivo)."
        actions={<Button onPress={() => setEditing({ mode: 'new' })}>Crear cupón</Button>}
      >
        <div className="border-default-200 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-default-200 border-b">
                <th className="text-muted p-3 text-left font-medium">Código</th>
                <th className="text-muted p-3 text-left font-medium">Tipo</th>
                <th className="text-muted p-3 text-right font-medium">Valor</th>
                <th className="text-muted p-3 text-right font-medium">Canjes</th>
                <th className="text-muted p-3 text-left font-medium">Estado</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <CouponRow key={c.id} coupon={c} onEdit={() => setEditing({ mode: 'edit', coupon: c })} />
              ))}
              {coupons.length === 0 ? (
                <tr>
                  <td className="text-muted p-3" colSpan={6}>
                    No hay cupones.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Canjes recientes" description="Registro de cupones canjeados (solo lectura).">
        <div className="border-default-200 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-default-200 border-b">
                <th className="text-muted p-3 text-left font-medium">Cupón</th>
                <th className="text-muted p-3 text-right font-medium">Monto</th>
                <th className="text-muted p-3 text-left font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((r) => {
                const code = coupons.find((c) => c.id === r.coupon_id)?.code ?? r.coupon_id.slice(0, 8)
                return (
                  <tr key={r.id} className="border-default-100 border-b last:border-0">
                    <td className="text-foreground p-3">{code}</td>
                    <td className="text-muted p-3 text-right tabular-nums">
                      {r.amount_cents != null ? formatCurrencyCents(r.amount_cents) : '—'}
                    </td>
                    <td className="text-muted p-3">{new Date(r.redeemed_at).toLocaleDateString('es-CL')}</td>
                  </tr>
                )
              })}
              {redemptions.length === 0 ? (
                <tr>
                  <td className="text-muted p-3" colSpan={3}>
                    Sin canjes registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>

      {editing ? (
        <CouponModal
          key={editing.mode === 'edit' ? editing.coupon.id : 'new'}
          coupon={editing.mode === 'edit' ? editing.coupon : null}
          customers={customers}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

function CouponRow({ coupon, onEdit }: { coupon: Coupon; onEdit: () => void }) {
  const { pending, save } = useSave()
  return (
    <tr className="border-default-100 border-b last:border-0">
      <td className="text-foreground p-3 font-mono font-medium">{coupon.code}</td>
      <td className="text-muted p-3">{COUPON_TYPE_LABEL[coupon.type]}</td>
      <td className="text-foreground p-3 text-right tabular-nums">{formatValue(coupon)}</td>
      <td className="text-muted p-3 text-right tabular-nums">
        {coupon.redeemed_count}/{coupon.max_redemptions}
      </td>
      <td className="p-3">
        <Chip color={STATUS_COLOR[coupon.status]} size="sm" variant="soft">
          {COUPON_STATUS_LABEL[coupon.status]}
        </Chip>
      </td>
      <td className="p-3 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onPress={onEdit}>
            Editar
          </Button>
          {coupon.status === 'active' ? (
            <Button
              size="sm"
              variant="danger-soft"
              isPending={pending}
              onPress={() => save(() => setCouponStatus(coupon.id, 'void'), 'Cupón anulado')}
            >
              Anular
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

function CouponModal({
  coupon,
  customers,
  onClose,
}: {
  coupon: Coupon | null
  customers: CustomerLite[]
  onClose: () => void
}) {
  const { pending, save } = useSave()
  const [code, setCode] = useState(coupon?.code ?? '')
  const [type, setType] = useState<Key | null>(coupon?.type ?? 'percent')
  const [valueInput, setValueInput] = useState<number | undefined>(
    coupon ? (coupon.type === 'fixed' ? coupon.value / 100 : coupon.value) : undefined,
  )
  const [reason, setReason] = useState(coupon?.reason ?? '')
  const [maxRedemptions, setMaxRedemptions] = useState<number | undefined>(coupon?.max_redemptions ?? 1)
  const [validUntil, setValidUntil] = useState(coupon?.valid_until ? coupon.valid_until.slice(0, 10) : '')
  const [status, setStatus] = useState<Key | null>(coupon?.status ?? 'active')
  const [userId, setUserId] = useState<Key | null>(coupon?.user_id ?? 'all')

  const couponType = (type ?? 'percent') as Enums['coupon_type']
  const valueLabel = couponType === 'percent' ? 'Porcentaje (1–100)' : couponType === 'eggs' ? 'Cantidad de huevos' : 'Monto (CLP)'

  function submit() {
    const raw = valueInput ?? 0
    const value = couponType === 'fixed' ? Math.round(raw * 100) : raw
    save(
      () =>
        upsertCoupon({
          id: coupon?.id,
          code: code.trim(),
          type: couponType,
          value,
          reason: reason.trim() || null,
          max_redemptions: maxRedemptions ?? 1,
          valid_until: validUntil || null,
          status: (status ?? 'active') as Enums['coupon_status'],
          user_id: userId === 'all' ? null : String(userId),
        }),
      coupon ? 'Cupón actualizado' : 'Cupón creado',
      onClose,
    )
  }

  return (
    <FormModal title={coupon ? 'Editar cupón' : 'Crear cupón'} onClose={onClose} onSubmit={submit} pending={pending}>
      <TextField value={code} onChange={setCode}>
        <Label>Código</Label>
        <Input placeholder="Ej. BIENVENIDA10" />
      </TextField>

      <div className="grid grid-cols-2 gap-3">
        <Select value={type} onChange={setType}>
          <Label>Tipo</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {TYPES.map((t) => (
                <ListBox.Item key={t} id={t} textValue={COUPON_TYPE_LABEL[t]}>
                  {COUPON_TYPE_LABEL[t]}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <NumberField value={valueInput} minValue={0} maxValue={couponType === 'percent' ? 100 : undefined} step={1} onChange={setValueInput}>
          <Label>{valueLabel}</Label>
          <NumberField.Group>
            <NumberField.Input />
          </NumberField.Group>
        </NumberField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField value={maxRedemptions} minValue={1} step={1} onChange={setMaxRedemptions}>
          <Label>Máx. de canjes</Label>
          <NumberField.Group>
            <NumberField.Input />
          </NumberField.Group>
        </NumberField>

        <TextField value={validUntil} onChange={setValidUntil}>
          <Label>Válido hasta</Label>
          <Input type="date" />
        </TextField>
      </div>

      <TextField value={reason} onChange={setReason}>
        <Label>Motivo</Label>
        <Input placeholder="Ej. promo, resolución de incidencia" />
      </TextField>

      <Select value={userId} onChange={setUserId}>
        <Label>Cliente</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="all" textValue="Global (cualquier cliente)">
              Global (cualquier cliente)
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {customers.map((c) => (
              <ListBox.Item key={c.id} id={c.id} textValue={c.fullName ?? c.email ?? c.id}>
                {c.fullName ?? c.email ?? c.id}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {couponType === 'fixed' ? <Hint>El monto se guarda en CLP.</Hint> : null}

      {coupon ? (
        <Select value={status} onChange={setStatus}>
          <Label>Estado</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATUSES.map((s) => (
                <ListBox.Item key={s} id={s} textValue={COUPON_STATUS_LABEL[s]}>
                  {COUPON_STATUS_LABEL[s]}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      ) : null}
    </FormModal>
  )
}
