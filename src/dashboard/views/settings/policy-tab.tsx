'use client'

import { useMemo, useState } from 'react'
import { Button, FieldError, Input, Label, ListBox, NumberField, Select, Switch, TextArea, TextField } from '@heroui/react'
import type { Key } from '@heroui/react'

import type { AppSetting } from '@/lib/admin/config/types'
import type { Json } from '@/lib/supabase/database.types'
import {
  DISPATCH_DAYS,
  SETTING_GROUP_ORDER,
  SETTING_META,
  type SettingMeta,
} from '@/lib/admin/config/labels'
import { updateSetting } from '@/app/admin/settings/actions'

import { Hint, Section, useSave } from './_shared'

const TIMEZONES = ['America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter', 'UTC']

const metaFor = (key: string): SettingMeta =>
  SETTING_META[key] ?? { label: key, help: '', kind: 'json', group: 'Otros' }

export function PolicyTab({ settings }: { settings: AppSetting[] }) {
  const grouped = useMemo(() => {
    const m = new Map<SettingMeta['group'], AppSetting[]>()
    for (const s of settings) {
      const g = metaFor(s.key).group
      m.set(g, [...(m.get(g) ?? []), s])
    }
    return m
  }, [settings])

  return (
    <Section title="Políticas & ajustes generales" description="Parámetros operativos y reglas de negocio (SOP).">
      <Hint>Las reglas de pausa se leen a diario por el proceso automático de pausas. Los valores vacíos quedan “sin definir”.</Hint>
      <div className="flex flex-col gap-8">
        {SETTING_GROUP_ORDER.filter((g) => grouped.has(g)).map((group) => (
          <div key={group} className="flex flex-col gap-3">
            <h3 className="text-muted text-xs font-semibold uppercase tracking-wide">{group}</h3>
            <div className="flex flex-col gap-3">
              {(grouped.get(group) ?? []).map((s) => (
                <SettingEditor key={s.key} setting={s} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function SettingEditor({ setting }: { setting: AppSetting }) {
  const meta = metaFor(setting.key)

  return (
    <div className="border-default-200 bg-surface grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-sm font-medium">{meta.label}</span>
        {meta.help ? <p className="text-muted text-xs leading-snug">{meta.help}</p> : null}
        <code className="text-muted/70 text-[11px]">{setting.key}</code>
      </div>
      <div>
        {meta.kind === 'dispatch_hours' ? (
          <DispatchHoursEditor settingKey={setting.key} value={setting.value} />
        ) : meta.kind === 'json' ? (
          <JsonEditor settingKey={setting.key} value={setting.value} />
        ) : (
          <ScalarEditor settingKey={setting.key} value={setting.value} meta={meta} />
        )}
      </div>
    </div>
  )
}

function ScalarEditor({ settingKey, value, meta }: { settingKey: string; value: Json; meta: SettingMeta }) {
  const { pending, save } = useSave()

  const asString = typeof value === 'string' ? value : value == null ? '' : String(value)
  const asNumber = typeof value === 'number' ? value : value == null ? undefined : Number(value)

  const [num, setNum] = useState<number | undefined>(asNumber)
  const [str, setStr] = useState<string>(asString)
  const [sel, setSel] = useState<Key | null>(asString || null)

  function commit(next: Json) {
    save(() => updateSetting(settingKey, next), 'Ajuste guardado')
  }

  if (meta.kind === 'int') {
    return (
      <div className="flex items-end gap-2">
        <NumberField className="w-40" aria-label={meta.label} value={num} step={1} onChange={setNum}>
          <NumberField.Group>
            <NumberField.Input />
          </NumberField.Group>
        </NumberField>
        <Button isPending={pending} isDisabled={num === undefined} onPress={() => commit(num as number)}>
          Guardar
        </Button>
      </div>
    )
  }

  if (meta.kind === 'enum' || meta.kind === 'tz') {
    const options = meta.kind === 'tz' ? TIMEZONES : (meta.options ?? [])
    return (
      <div className="flex items-end gap-2">
        <Select className="w-56" aria-label={meta.label} value={sel} onChange={setSel} placeholder="Selecciona…">
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {options.map((o) => (
                <ListBox.Item key={o} id={o} textValue={o}>
                  {o}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <Button isPending={pending} isDisabled={!sel} onPress={() => commit(String(sel))}>
          Guardar
        </Button>
      </div>
    )
  }

  // string
  return (
    <div className="flex items-end gap-2">
      <TextField className="flex-1" aria-label={meta.label} value={str} onChange={setStr}>
        <Input placeholder="Vacío = sin definir" />
      </TextField>
      <Button isPending={pending} onPress={() => commit(str.trim())}>
        Guardar
      </Button>
    </div>
  )
}

function DispatchHoursEditor({ settingKey, value }: { settingKey: string; value: Json }) {
  const { pending, save } = useSave()

  const initial = useMemo(() => {
    const obj = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, unknown>
    const state: Record<string, { enabled: boolean; start: string; end: string }> = {}
    for (const d of DISPATCH_DAYS) {
      const pair = obj[d.key]
      if (Array.isArray(pair) && pair.length === 2) {
        state[d.key] = { enabled: true, start: String(pair[0]), end: String(pair[1]) }
      } else {
        state[d.key] = { enabled: false, start: '10:00', end: '17:00' }
      }
    }
    return state
  }, [value])

  const [days, setDays] = useState(initial)

  function update(key: string, patch: Partial<{ enabled: boolean; start: string; end: string }>) {
    setDays((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function submit() {
    const out: Record<string, [string, string]> = {}
    for (const d of DISPATCH_DAYS) {
      const v = days[d.key]
      if (v.enabled) out[d.key] = [v.start, v.end]
    }
    save(() => updateSetting(settingKey, out as unknown as Json), 'Ventanas de despacho guardadas')
  }

  return (
    <div className="flex flex-col gap-2">
      {DISPATCH_DAYS.map((d) => {
        const v = days[d.key]
        return (
          <div key={d.key} className="grid grid-cols-[110px_auto_auto] items-center gap-3">
            <Switch isSelected={v.enabled} onChange={(on) => update(d.key, { enabled: on })}>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Content>
                <Label className="text-sm">{d.label}</Label>
              </Switch.Content>
            </Switch>
            <TextField
              aria-label={`${d.label}: hora de inicio`}
              value={v.start}
              onChange={(t) => update(d.key, { start: t })}
              isDisabled={!v.enabled}
            >
              <Input type="time" />
            </TextField>
            <TextField
              aria-label={`${d.label}: hora de término`}
              value={v.end}
              onChange={(t) => update(d.key, { end: t })}
              isDisabled={!v.enabled}
            >
              <Input type="time" />
            </TextField>
          </div>
        )
      })}
      <div className="flex justify-end">
        <Button isPending={pending} onPress={submit}>
          Guardar
        </Button>
      </div>
    </div>
  )
}

function JsonEditor({ settingKey, value }: { settingKey: string; value: Json }) {
  const { pending, save } = useSave()
  const [text, setText] = useState(JSON.stringify(value, null, 2))
  const [error, setError] = useState<string | null>(null)

  function submit() {
    let parsed: Json
    try {
      parsed = JSON.parse(text) as Json
      setError(null)
    } catch {
      setError('JSON inválido')
      return
    }
    save(() => updateSetting(settingKey, parsed), 'Ajuste guardado')
  }

  return (
    <div className="flex flex-col gap-2">
      <TextField aria-label="Editor JSON del ajuste" value={text} onChange={setText} isInvalid={!!error}>
        <TextArea className="min-h-24 resize-y font-mono text-xs" />
        {error ? <FieldError className="text-xs">{error}</FieldError> : null}
      </TextField>
      <div className="flex justify-end">
        <Button isPending={pending} onPress={submit}>
          Guardar
        </Button>
      </div>
    </div>
  )
}
