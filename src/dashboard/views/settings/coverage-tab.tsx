'use client'

import { useMemo, useState } from 'react'
import { Button, Chip, Input, Label, Switch, TextArea, TextField, ToggleButton } from '@heroui/react'

import type { Zone, ZoneDay } from '@/lib/admin/config/types'
import { WEEKDAYS } from '@/lib/admin/config/labels'
import { setZoneActive, setZoneDay, upsertZone } from '@/app/admin/settings/actions'

import { FormModal, Hint, Section, useSave } from './_shared'

type Editing = { mode: 'new' } | { mode: 'edit'; zone: Zone } | null

export function CoverageTab({ zones, zoneDays }: { zones: Zone[]; zoneDays: ZoneDay[] }) {
  const [editing, setEditing] = useState<Editing>(null)

  // zone_id -> set of active weekdays
  const activeDays = useMemo(() => {
    const map = new Map<string, Set<number>>()
    for (const d of zoneDays) {
      if (!d.active) continue
      const set = map.get(d.zone_id) ?? new Set<number>()
      set.add(d.weekday)
      map.set(d.zone_id, set)
    }
    return map
  }, [zoneDays])

  return (
    <Section
      title="Cobertura & días de reparto"
      description="Qué comunas atendemos y en qué días de la semana. Activa o desactiva días para intercambiarlos."
      actions={
        <Button onPress={() => setEditing({ mode: 'new' })}>Agregar comuna</Button>
      }
    >
      <Hint>Los cambios aplican a entregas futuras; los pedidos ya agendados no se modifican.</Hint>

      <div className="flex flex-col gap-3">
        {zones.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            activeDays={activeDays.get(zone.id) ?? new Set()}
            onEdit={() => setEditing({ mode: 'edit', zone })}
          />
        ))}
        {zones.length === 0 ? <p className="text-muted text-sm">No hay comunas configuradas.</p> : null}
      </div>

      {editing ? (
        <ZoneModal
          key={editing.mode === 'edit' ? editing.zone.id : 'new'}
          zone={editing.mode === 'edit' ? editing.zone : null}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Section>
  )
}

function ZoneCard({ zone, activeDays, onEdit }: { zone: Zone; activeDays: Set<number>; onEdit: () => void }) {
  const { pending, save } = useSave()

  return (
    <div className="border-default-200 bg-surface flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-foreground font-medium">{zone.comuna ?? zone.name}</span>
          {!zone.active ? (
            <Chip color="default" size="sm" variant="soft">
              Inactiva
            </Chip>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Switch
            isSelected={zone.active}
            isDisabled={pending}
            onChange={(v) => save(() => setZoneActive(zone.id, v), v ? 'Comuna activada' : 'Comuna desactivada')}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <Label className="text-muted text-xs">Activa</Label>
            </Switch.Content>
          </Switch>
          <Button size="sm" variant="ghost" onPress={onEdit}>
            Editar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((wd) => {
          const on = activeDays.has(wd.value)
          return (
            <ToggleButton
              key={wd.value}
              size="sm"
              aria-label={wd.long}
              isSelected={on}
              isDisabled={pending}
              onChange={(next) => save(() => setZoneDay(zone.id, wd.value, next), 'Día actualizado')}
            >
              {wd.short}
            </ToggleButton>
          )
        })}
      </div>
    </div>
  )
}

function ZoneModal({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  const { pending, save } = useSave()
  const [name, setName] = useState(zone?.name ?? '')
  const [comuna, setComuna] = useState(zone?.comuna ?? '')
  const [notes, setNotes] = useState(zone?.notes ?? '')
  const [active, setActive] = useState(zone?.active ?? true)

  function submit() {
    save(
      () =>
        upsertZone({
          id: zone?.id,
          name: name.trim(),
          comuna: comuna.trim() || null,
          notes: notes.trim() || null,
          active,
        }),
      zone ? 'Comuna actualizada' : 'Comuna creada',
      onClose,
    )
  }

  return (
    <FormModal title={zone ? 'Editar comuna' : 'Agregar comuna'} onClose={onClose} onSubmit={submit} pending={pending}>
      <TextField value={name} onChange={setName}>
        <Label>Nombre de la zona</Label>
        <Input placeholder="Ej. Providencia" />
      </TextField>
      <TextField value={comuna} onChange={setComuna}>
        <Label>Comuna</Label>
        <Input placeholder="Ej. Providencia" />
      </TextField>
      <TextField value={notes} onChange={setNotes}>
        <Label>Notas internas</Label>
        <TextArea className="min-h-20 resize-y" placeholder="Opcional" />
      </TextField>
      <Switch isSelected={active} onChange={setActive}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label>Comuna activa</Label>
        </Switch.Content>
      </Switch>
    </FormModal>
  )
}
