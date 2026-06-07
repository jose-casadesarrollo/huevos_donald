'use client'

import { useState } from 'react'
import { Button, Input, Label, ListBox, Select, TextField } from '@heroui/react'
import type { Key } from '@heroui/react'

import type { BlackoutDate, Zone } from '@/lib/admin/config/types'
import { shortDayLabel } from '@/lib/metrics/format'
import { addBlackout, deleteBlackout } from '@/app/admin/settings/actions'

import { Section, useSave } from './_shared'

export function BlackoutTab({ zones, blackouts }: { zones: Zone[]; blackouts: BlackoutDate[] }) {
  const { pending, save } = useSave()
  const [date, setDate] = useState('')
  const [zoneId, setZoneId] = useState<Key | null>('all')
  const [reason, setReason] = useState('')

  const zoneName = (id: string | null) => (id ? (zones.find((z) => z.id === id)?.comuna ?? '—') : 'Todas las comunas')

  function add() {
    save(
      () => addBlackout({ date, zone_id: zoneId === 'all' ? null : String(zoneId), reason: reason.trim() || null }),
      'Fecha bloqueada',
      () => {
        setDate('')
        setReason('')
        setZoneId('all')
      },
    )
  }

  return (
    <Section title="Feriados & bloqueos" description="Fechas sin reparto, globales o por comuna específica.">
      <div className="border-default-200 bg-surface grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
        <TextField value={date} onChange={setDate}>
          <Label>Fecha</Label>
          <Input type="date" />
        </TextField>

        <Select value={zoneId} onChange={setZoneId} placeholder="Todas las comunas">
          <Label>Comuna</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="all" textValue="Todas las comunas">
                Todas las comunas
                <ListBox.ItemIndicator />
              </ListBox.Item>
              {zones.map((z) => (
                <ListBox.Item key={z.id} id={z.id} textValue={z.comuna ?? z.name}>
                  {z.comuna ?? z.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <TextField value={reason} onChange={setReason}>
          <Label>Motivo</Label>
          <Input placeholder="Ej. Feriado" />
        </TextField>

        <Button isDisabled={!date || pending} isPending={pending} onPress={add}>
          Agregar
        </Button>
      </div>

      <div className="border-default-200 mt-2 overflow-hidden rounded-xl border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-default-200 border-b">
              <th className="text-muted p-3 text-left font-medium">Fecha</th>
              <th className="text-muted p-3 text-left font-medium">Comuna</th>
              <th className="text-muted p-3 text-left font-medium">Motivo</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {blackouts.map((b) => (
              <BlackoutRow key={b.id} blackout={b} zoneName={zoneName(b.zone_id)} />
            ))}
            {blackouts.length === 0 ? (
              <tr>
                <td className="text-muted p-3" colSpan={4}>
                  No hay fechas bloqueadas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function BlackoutRow({ blackout, zoneName }: { blackout: BlackoutDate; zoneName: string }) {
  const { pending, save } = useSave()
  return (
    <tr className="border-default-100 border-b last:border-0">
      <td className="text-foreground p-3 tabular-nums">{shortDayLabel(blackout.date)}</td>
      <td className="text-muted p-3">{zoneName}</td>
      <td className="text-muted p-3">{blackout.reason ?? '—'}</td>
      <td className="p-3 text-right">
        <Button
          size="sm"
          variant="danger-soft"
          isPending={pending}
          onPress={() => save(() => deleteBlackout(blackout.id), 'Fecha eliminada')}
        >
          Eliminar
        </Button>
      </td>
    </tr>
  )
}
