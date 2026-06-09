'use client'

import { useState } from 'react'
import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Slider,
  Table,
  TextArea,
  TextField,
} from '@heroui/react'
import type { Key } from '@heroui/react'

import type { AgentConfigVersion } from '@/lib/admin/config/types'
import { AGENT_MODEL_OPTIONS, AGENT_SECTION_FIELDS, AGENT_TEMPERATURE } from '@/lib/admin/config/labels'
import { activateAgentConfigVersion, saveAgentConfig } from '@/app/admin/settings/actions'

import { Hint, Section, useSave } from './_shared'

type SectionState = Record<(typeof AGENT_SECTION_FIELDS)[number]['key'], string>

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export function AgentTab({
  agentConfig,
  versions,
}: {
  agentConfig: AgentConfigVersion | null
  versions: AgentConfigVersion[]
}) {
  const { pending, save } = useSave()

  const [sections, setSections] = useState<SectionState>({
    persona: agentConfig?.persona ?? '',
    order_rules: agentConfig?.order_rules ?? '',
    sop_policies: agentConfig?.sop_policies ?? '',
    limits: agentConfig?.limits ?? '',
  })
  const [model, setModel] = useState<Key | null>(agentConfig?.model ?? AGENT_MODEL_OPTIONS[0])
  const [temperature, setTemperature] = useState<number>(agentConfig?.temperature ?? AGENT_TEMPERATURE.default)
  const [note, setNote] = useState('')

  const personaEmpty = sections.persona.trim().length === 0

  function setSection(key: keyof SectionState, value: string) {
    setSections((prev) => ({ ...prev, [key]: value }))
  }

  function submit() {
    save(
      () =>
        saveAgentConfig({
          persona: sections.persona,
          order_rules: sections.order_rules,
          sop_policies: sections.sop_policies,
          limits: sections.limits,
          model: String(model ?? AGENT_MODEL_OPTIONS[0]),
          temperature,
          note: note.trim() || null,
        }),
      'Configuración del agente guardada',
    )
  }

  return (
    <Section
      title="Agente IA"
      description="Edita el prompt y el modelo del asistente de ventas y soporte. Los cambios se aplican al agente en vivo (chat web y WhatsApp) en el siguiente mensaje, sin redespliegue."
    >
      <Hint>
        La fecha de hoy, la lista de herramientas y el estado de sesión del cliente se agregan automáticamente; aquí
        solo editas el texto de cada sección, el modelo y la temperatura.
      </Hint>

      {/* ── Editor ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {AGENT_SECTION_FIELDS.map((field) => (
            <div
              key={field.key}
              className="border-default-200 bg-surface flex flex-col gap-2 rounded-xl border p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-foreground text-sm font-medium">{field.label}</span>
                <p className="text-muted text-xs leading-snug">{field.help}</p>
              </div>
              <TextField
                aria-label={field.label}
                value={sections[field.key]}
                onChange={(v) => setSection(field.key, v)}
              >
                <TextArea className="min-h-40 resize-y font-mono text-xs leading-relaxed" />
              </TextField>
            </div>
          ))}
        </div>

        {/* Model + temperature */}
        <div className="border-default-200 bg-surface grid grid-cols-1 gap-6 rounded-xl border p-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-foreground text-sm font-medium">Modelo</span>
            <Select aria-label="Modelo del agente" value={model} onChange={setModel} placeholder="Selecciona…">
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {AGENT_MODEL_OPTIONS.map((m) => (
                    <ListBox.Item key={m} id={m} textValue={m}>
                      {m}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Slider
              aria-label="Temperatura del modelo"
              value={temperature}
              onChange={(v) => setTemperature(Array.isArray(v) ? (v[0] ?? 0) : v)}
              minValue={AGENT_TEMPERATURE.min}
              maxValue={AGENT_TEMPERATURE.max}
              step={AGENT_TEMPERATURE.step}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm font-medium">Temperatura</Label>
                <Slider.Output className="text-muted text-xs tabular-nums" />
              </div>
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
            <p className="text-muted text-xs leading-snug">
              Más baja = respuestas más consistentes; más alta = más creativas. Recomendado: {AGENT_TEMPERATURE.default}.
            </p>
          </div>
        </div>

        {/* Note + save */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between">
          <TextField
            className="flex-1"
            aria-label="Nota del cambio (opcional)"
            value={note}
            onChange={setNote}
          >
            <Input placeholder="Nota del cambio (opcional)" />
          </TextField>
          <Button isPending={pending} isDisabled={personaEmpty} onPress={submit}>
            Guardar cambios
          </Button>
        </div>
        {personaEmpty ? <Hint>La sección “Persona y tono” no puede quedar vacía.</Hint> : null}
      </div>

      {/* ── Version history ────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-2">
        <h3 className="text-muted text-xs font-semibold uppercase tracking-wide">Historial de versiones</h3>
        {versions.length === 0 ? (
          <p className="text-muted text-sm">Aún no hay versiones guardadas.</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Historial de versiones del agente" className="min-w-[560px]">
                <Table.Header>
                  <Table.Column isRowHeader>Versión</Table.Column>
                  <Table.Column>Fecha</Table.Column>
                  <Table.Column>Nota</Table.Column>
                  <Table.Column>Estado</Table.Column>
                  <Table.Column>Acción</Table.Column>
                </Table.Header>
                <Table.Body>
                  {versions.map((row) => (
                    <Table.Row key={row.id} id={row.id} textValue={`v${row.version}`}>
                      <Table.Cell className="font-medium tabular-nums">v{row.version}</Table.Cell>
                      <Table.Cell className="text-muted text-sm tabular-nums">{dateFmt(row.created_at)}</Table.Cell>
                      <Table.Cell className="text-muted max-w-xs truncate text-sm">{row.note ?? '—'}</Table.Cell>
                      <Table.Cell>
                        {row.is_active ? (
                          <Chip color="success" size="sm" variant="soft">
                            Activa
                          </Chip>
                        ) : null}
                      </Table.Cell>
                      <Table.Cell>
                        {row.is_active ? null : (
                          <Button
                            size="sm"
                            variant="secondary"
                            isPending={pending}
                            onPress={() => save(() => activateAgentConfigVersion(row.id), 'Versión restaurada')}
                          >
                            Restaurar
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>
    </Section>
  )
}
