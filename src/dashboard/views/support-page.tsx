'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button, Chip, Label, ListBox, Select, Switch, TextArea, TextField, Toast, toast } from '@heroui/react'
import type { Key } from '@heroui/react'

import type { CustomerLite, Enums, Incident } from '@/lib/admin/config/types'
import { INCIDENT_RESOLUTION_LABEL, INCIDENT_STATUS_LABEL, INCIDENT_TYPE_LABEL } from '@/lib/admin/config/labels'
import { getIncidentPhotos, updateIncident } from '@/app/admin/support/actions'

import { FormModal, Section, useSave } from './settings/_shared'

const STATUSES: Enums['incident_status'][] = ['open', 'reviewing', 'resolved', 'rejected']
const RESOLUTIONS: Enums['incident_resolution'][] = ['partial_replacement', 'full_replacement', 'coupon', 'none']

const STATUS_COLOR: Record<Enums['incident_status'], 'warning' | 'default' | 'success' | 'danger'> = {
  open: 'warning',
  reviewing: 'default',
  resolved: 'success',
  rejected: 'danger',
}

export function SupportPage({ incidents, customers }: { incidents: Incident[]; customers: CustomerLite[] }) {
  const [editing, setEditing] = useState<Incident | null>(null)
  const [filter, setFilter] = useState<Key | null>('all')

  const customerName = (id: string) => {
    const c = customers.find((x) => x.id === id)
    return c?.fullName ?? c?.email ?? id.slice(0, 8)
  }

  const rows = useMemo(
    () => (filter === 'all' ? incidents : incidents.filter((i) => i.status === filter)),
    [incidents, filter],
  )

  const open = incidents.filter((i) => i.status === 'open' || i.status === 'reviewing').length

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-12 pt-4">
      <Toast.Provider />

      <p className="text-muted text-sm">
        Gestiona los casos de soporte y reclamos de clientes. {open > 0 ? `Tienes ${open} caso(s) por revisar.` : ''}
      </p>

      <Section
        title="Casos de soporte"
        description="Reclamos de clientes y su resolución (reposición o cupón — nunca efectivo)."
        actions={
          <Select className="w-44" value={filter} onChange={setFilter} aria-label="Filtrar por estado">
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="Todos">
                  Todos
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {STATUSES.map((s) => (
                  <ListBox.Item key={s} id={s} textValue={INCIDENT_STATUS_LABEL[s]}>
                    {INCIDENT_STATUS_LABEL[s]}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        }
      >
        <div className="border-default-200 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-default-200 border-b">
                <th className="text-muted p-3 text-left font-medium">Tipo</th>
                <th className="text-muted p-3 text-left font-medium">Cliente</th>
                <th className="text-muted p-3 text-left font-medium">Descripción</th>
                <th className="text-muted p-3 text-left font-medium">Estado</th>
                <th className="text-muted p-3 text-left font-medium">Reportado</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="border-default-100 border-b last:border-0">
                  <td className="text-foreground p-3">{INCIDENT_TYPE_LABEL[i.type]}</td>
                  <td className="text-muted p-3">{customerName(i.user_id)}</td>
                  <td className="text-muted max-w-[260px] truncate p-3">{i.description ?? '—'}</td>
                  <td className="p-3">
                    <Chip color={STATUS_COLOR[i.status]} size="sm" variant="soft">
                      {INCIDENT_STATUS_LABEL[i.status]}
                    </Chip>
                  </td>
                  <td className="text-muted p-3 tabular-nums">{new Date(i.reported_at).toLocaleDateString('es-CL')}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onPress={() => setEditing(i)}>
                      Gestionar
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="text-muted p-3" colSpan={6}>
                    No hay casos de soporte.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>

      {editing ? <IncidentModal key={editing.id} incident={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  )
}

function IncidentModal({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const { pending, save } = useSave()
  const [status, setStatus] = useState<Key | null>(incident.status)
  const [resolution, setResolution] = useState<Key | null>(incident.resolution ?? 'none')
  const [note, setNote] = useState(incident.note ?? '')
  const [withinWindow, setWithinWindow] = useState(incident.within_window ?? false)

  const [photosPending, startPhotos] = useTransition()
  const [photos, setPhotos] = useState<string[] | null>(null)

  function loadPhotos() {
    startPhotos(async () => {
      const res = await getIncidentPhotos(incident.id)
      if (res.ok) setPhotos(res.urls)
      else toast.danger(res.error ?? 'No se pudieron cargar las fotos')
    })
  }

  function submit() {
    save(
      () =>
        updateIncident({
          id: incident.id,
          status: (status ?? 'open') as Enums['incident_status'],
          resolution: (resolution as Enums['incident_resolution']) ?? null,
          note: note.trim() || null,
          within_window: withinWindow,
        }),
      'Caso actualizado',
      onClose,
    )
  }

  return (
    <FormModal title="Gestionar caso" onClose={onClose} onSubmit={submit} pending={pending} submitLabel="Guardar">
      <p className="text-muted text-sm">
        {INCIDENT_TYPE_LABEL[incident.type]} · {incident.description ?? 'Sin descripción'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Select value={status} onChange={setStatus}>
          <Label>Estado</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATUSES.map((s) => (
                <ListBox.Item key={s} id={s} textValue={INCIDENT_STATUS_LABEL[s]}>
                  {INCIDENT_STATUS_LABEL[s]}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select value={resolution} onChange={setResolution}>
          <Label>Resolución</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {RESOLUTIONS.map((r) => (
                <ListBox.Item key={r} id={r} textValue={INCIDENT_RESOLUTION_LABEL[r]}>
                  {INCIDENT_RESOLUTION_LABEL[r]}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <TextField value={note} onChange={setNote}>
        <Label>Nota interna</Label>
        <TextArea className="min-h-20 resize-y" placeholder="Detalle de la gestión" />
      </TextField>

      <Switch isSelected={withinWindow} onChange={setWithinWindow}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label>Reportado dentro de la ventana (24h)</Label>
        </Switch.Content>
      </Switch>

      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" isPending={photosPending} onPress={loadPhotos}>
          Ver evidencia
        </Button>
        {photos ? (
          photos.length ? (
            <div className="flex flex-wrap gap-2">
              {photos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="Evidencia" className="border-default-200 size-24 rounded-lg border object-cover" />
              ))}
            </div>
          ) : (
            <p className="text-muted text-xs">Sin fotos adjuntas.</p>
          )
        ) : null}
      </div>
    </FormModal>
  )
}
