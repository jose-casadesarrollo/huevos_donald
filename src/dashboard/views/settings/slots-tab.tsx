'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button, Chip, Input, Label, NumberField, Switch, TextField, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'

import type { Slot, SlotCapacity, SlotUtilization, Zone } from '@/lib/admin/config/types'
import { setCapacity, setSlotActive, upsertSlot } from '@/app/admin/settings/actions'

import { FormModal, Hint, Section, useSave } from './_shared'

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '')

export function SlotsTab({
  zones,
  slots,
  capacity,
  utilization,
}: {
  zones: Zone[]
  slots: Slot[]
  capacity: SlotCapacity[]
  utilization: SlotUtilization[]
}) {
  const [editing, setEditing] = useState<{ mode: 'new' } | { mode: 'edit'; slot: Slot } | null>(null)

  const activeZones = zones.filter((z) => z.active)
  const activeSlots = slots.filter((s) => s.active)

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Horarios de despacho"
        description="Ventanas horarias en las que se reparte (compartidas por todas las comunas)."
        actions={<Button onPress={() => setEditing({ mode: 'new' })}>Agregar horario</Button>}
      >
        <div className="flex flex-col gap-2">
          {slots.map((slot) => (
            <SlotRow key={slot.id} slot={slot} onEdit={() => setEditing({ mode: 'edit', slot })} />
          ))}
          {slots.length === 0 ? <p className="text-muted text-sm">No hay horarios configurados.</p> : null}
        </div>
      </Section>

      <Section
        title="Cupos por comuna y horario"
        description="Máximo de pedidos por comuna × horario. Vacío = sin límite; 0 = bloqueado."
      >
        <Hint>El “uso próximo” suma las entregas ya agendadas para los próximos días.</Hint>
        <CapacityGrid zones={activeZones} slots={activeSlots} capacity={capacity} utilization={utilization} />
      </Section>

      {editing ? (
        <SlotModal
          key={editing.mode === 'edit' ? editing.slot.id : 'new'}
          slot={editing.mode === 'edit' ? editing.slot : null}
          nextSort={slots.length + 1}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  )
}

function SlotRow({ slot, onEdit }: { slot: Slot; onEdit: () => void }) {
  const { pending, save } = useSave()
  return (
    <div className="border-default-200 bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <span className="text-foreground font-medium">{slot.name}</span>
        <span className="text-muted tabular-nums">
          {hhmm(slot.start_time)}–{hhmm(slot.end_time)}
        </span>
        {!slot.active ? (
          <Chip color="default" size="sm" variant="soft">
            Inactivo
          </Chip>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <Switch
          aria-label="Horario activo"
          isSelected={slot.active}
          isDisabled={pending}
          onChange={(v) => save(() => setSlotActive(slot.id, v), v ? 'Horario activado' : 'Horario desactivado')}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Content>
            <Label className="text-muted text-xs">Activo</Label>
          </Switch.Content>
        </Switch>
        <Button size="sm" variant="ghost" onPress={onEdit}>
          Editar
        </Button>
      </div>
    </div>
  )
}

function CapacityGrid({
  zones,
  slots,
  capacity,
  utilization,
}: {
  zones: Zone[]
  slots: Slot[]
  capacity: SlotCapacity[]
  utilization: SlotUtilization[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const key = (zoneId: string, slotId: string) => `${zoneId}|${slotId}`

  const initial = useMemo(() => {
    const m = new Map<string, number | undefined>()
    for (const c of capacity) m.set(key(c.zone_id, c.slot_id), c.max_orders)
    return m
  }, [capacity])

  const booked = useMemo(() => {
    const m = new Map<string, number>()
    for (const u of utilization) {
      if (!u.zone_id || !u.slot_id) continue
      m.set(key(u.zone_id, u.slot_id), (m.get(key(u.zone_id, u.slot_id)) ?? 0) + (u.booked ?? 0))
    }
    return m
  }, [utilization])

  const [edits, setEdits] = useState<Map<string, number | undefined>>(new Map())

  const value = (k: string) => (edits.has(k) ? edits.get(k) : initial.get(k))
  const dirty = edits.size > 0

  function setCell(k: string, v: number | undefined) {
    setEdits((prev) => {
      const next = new Map(prev)
      next.set(k, v)
      return next
    })
  }

  function saveAll() {
    const changes = [...edits.entries()].filter(([k, v]) => v !== initial.get(k) && v !== undefined)
    if (changes.length === 0) {
      setEdits(new Map())
      return
    }
    start(async () => {
      const results = await Promise.all(
        changes.map(([k, v]) => {
          const [zoneId, slotId] = k.split('|')
          return setCapacity(zoneId, slotId, v as number)
        }),
      )
      const failed = results.find((r) => !r.ok)
      if (failed) {
        toast.danger(failed.error ?? 'No se pudieron guardar algunos cupos')
      } else {
        toast.success('Cupos actualizados')
        setEdits(new Map())
        router.refresh()
      }
    })
  }

  if (zones.length === 0 || slots.length === 0) {
    return <p className="text-muted text-sm">Activa al menos una comuna y un horario para definir cupos.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="border-default-200 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-default-200 border-b">
              <th className="text-muted p-3 text-left font-medium">Comuna</th>
              {slots.map((s) => (
                <th key={s.id} className="text-muted p-3 text-left font-medium">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-default-100 border-b last:border-0">
                <td className="text-foreground p-3 font-medium">{z.comuna ?? z.name}</td>
                {slots.map((s) => {
                  const k = key(z.id, s.id)
                  return (
                    <td key={s.id} className="p-2 align-top">
                      <NumberField
                        aria-label={`Cupo ${z.comuna ?? z.name} ${s.name}`}
                        value={value(k)}
                        minValue={0}
                        step={1}
                        onChange={(v) => setCell(k, v)}
                      >
                        <NumberField.Group className="w-24">
                          <NumberField.Input />
                        </NumberField.Group>
                      </NumberField>
                      <span className="text-muted mt-1 block text-xs">uso próximo: {booked.get(k) ?? 0}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button isDisabled={!dirty} isPending={pending} onPress={saveAll}>
          Guardar cupos
        </Button>
      </div>
    </div>
  )
}

function SlotModal({ slot, nextSort, onClose }: { slot: Slot | null; nextSort: number; onClose: () => void }) {
  const { pending, save } = useSave()
  const [name, setName] = useState(slot?.name ?? '')
  const [startTime, setStartTime] = useState(hhmm(slot?.start_time ?? '') || '10:00')
  const [endTime, setEndTime] = useState(hhmm(slot?.end_time ?? '') || '13:00')
  const [sortOrder, setSortOrder] = useState<number | undefined>(slot?.sort_order ?? nextSort)
  const [active, setActive] = useState(slot?.active ?? true)

  function submit() {
    save(
      () =>
        upsertSlot({
          id: slot?.id,
          name: name.trim(),
          start_time: startTime,
          end_time: endTime,
          sort_order: sortOrder ?? 0,
          active,
        }),
      slot ? 'Horario actualizado' : 'Horario creado',
      onClose,
    )
  }

  return (
    <FormModal title={slot ? 'Editar horario' : 'Agregar horario'} onClose={onClose} onSubmit={submit} pending={pending}>
      <TextField value={name} onChange={setName}>
        <Label>Nombre</Label>
        <Input placeholder="Ej. Mañana" />
      </TextField>
      <div className="grid grid-cols-2 gap-3">
        <TextField value={startTime} onChange={setStartTime}>
          <Label>Inicio</Label>
          <Input type="time" />
        </TextField>
        <TextField value={endTime} onChange={setEndTime}>
          <Label>Término</Label>
          <Input type="time" />
        </TextField>
      </div>
      <NumberField value={sortOrder} minValue={0} step={1} onChange={setSortOrder}>
        <Label>Orden</Label>
        <NumberField.Group className="w-28">
          <NumberField.Input />
        </NumberField.Group>
      </NumberField>
      <Switch isSelected={active} onChange={setActive}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label>Horario activo</Label>
        </Switch.Content>
      </Switch>
    </FormModal>
  )
}
