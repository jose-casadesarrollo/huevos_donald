'use client'

import { useState } from 'react'
import { Tabs, Toast } from '@heroui/react'
import type { Key } from '@heroui/react'

import type { ServiceConfigData } from '@/lib/admin/config/types'

import { CoverageTab } from './settings/coverage-tab'
import { SlotsTab } from './settings/slots-tab'
import { BlackoutTab } from './settings/blackout-tab'
import { PlansTab } from './settings/plans-tab'
import { PolicyTab } from './settings/policy-tab'
import { CouponsTab } from './settings/coupons-tab'
import { LedgersTab } from './settings/ledgers-tab'
import { LotsTab } from './settings/lots-tab'
import { AgentTab } from './settings/agent-tab'

const TABS = [
  { id: 'cobertura', label: 'Cobertura & días' },
  { id: 'horarios', label: 'Horarios & cupos' },
  { id: 'feriados', label: 'Feriados' },
  { id: 'planes', label: 'Planes & precios' },
  { id: 'politicas', label: 'Políticas' },
  { id: 'cupones', label: 'Cupones' },
  { id: 'saldo', label: 'Saldo & Puntos' },
  { id: 'lotes', label: 'Lotes' },
  { id: 'agente', label: 'Agente IA' },
] as const

export function SettingsPage({ data }: { data: ServiceConfigData }) {
  const [tab, setTab] = useState<string>('cobertura')

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-12 pt-4">
      <Toast.Provider />

      <p className="text-muted text-sm">
        Configura la operación del servicio: cobertura y días de reparto, horarios, precios y políticas.
      </p>

      <Tabs selectedKey={tab} onSelectionChange={(k: Key) => setTab(String(k))} variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Configuración del servicio" className="overflow-x-auto">
            {TABS.map((t) => (
              <Tabs.Tab key={t.id} id={t.id}>
                {t.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-4" id="cobertura">
          <CoverageTab zones={data.zones} zoneDays={data.zoneDays} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="horarios">
          <SlotsTab zones={data.zones} slots={data.slots} capacity={data.capacity} utilization={data.utilization} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="feriados">
          <BlackoutTab zones={data.zones} blackouts={data.blackouts} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="planes">
          <PlansTab plans={data.plans} products={data.products} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="politicas">
          <PolicyTab settings={data.settings} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="cupones">
          <CouponsTab coupons={data.coupons} redemptions={data.redemptions} customers={data.customers} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="saldo">
          <LedgersTab
            customers={data.customers}
            subscriptions={data.subscriptions}
            eggLedger={data.eggLedger}
            pointsLedger={data.pointsLedger}
          />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="lotes">
          <LotsTab lots={data.lots} products={data.products} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="agente">
          <AgentTab agentConfig={data.agentConfig} versions={data.agentConfigVersions} />
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
