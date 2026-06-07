'use client'

import { useState } from 'react'
import { Button, Chip, Input, Label, ListBox, NumberField, Select, Switch, TextArea, TextField } from '@heroui/react'
import type { Key } from '@heroui/react'

import type { Enums, Plan, Product } from '@/lib/admin/config/types'
import { PLAN_FREQUENCY_LABEL } from '@/lib/admin/config/labels'
import { formatCurrencyCents } from '@/lib/metrics/format'
import { setPlanActive, upsertPlan, upsertProduct } from '@/app/admin/settings/actions'

import { FormModal, Hint, Section, useSave } from './_shared'

const FREQUENCIES: Enums['plan_frequency'][] = ['weekly', 'biweekly', 'monthly']

export function PlansTab({ plans, products }: { plans: Plan[]; products: Product[] }) {
  const [planEditing, setPlanEditing] = useState<{ mode: 'new' } | { mode: 'edit'; plan: Plan } | null>(null)
  const [productEditing, setProductEditing] = useState<{ mode: 'new' } | { mode: 'edit'; product: Product } | null>(null)

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Productos"
        description="El producto base que venden los planes."
        actions={
          <Button variant="ghost" onPress={() => setProductEditing({ mode: 'new' })}>
            Agregar producto
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="border-default-200 bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-foreground font-medium">{p.name}</span>
                <span className="text-muted text-xs">{p.sku}</span>
                {!p.active ? (
                  <Chip color="default" size="sm" variant="soft">
                    Inactivo
                  </Chip>
                ) : null}
              </div>
              <Button size="sm" variant="ghost" onPress={() => setProductEditing({ mode: 'edit', product: p })}>
                Editar
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Planes & precios"
        description="Precio, frecuencia y cantidad de cada plan de suscripción."
        actions={<Button onPress={() => setPlanEditing({ mode: 'new' })}>Agregar plan</Button>}
      >
        <Hint>Editar un precio no cambia pedidos ya creados (el precio se congela al momento de la compra).</Hint>
        <div className="border-default-200 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-default-200 border-b">
                <th className="text-muted p-3 text-left font-medium">Plan</th>
                <th className="text-muted p-3 text-left font-medium">Frecuencia</th>
                <th className="text-muted p-3 text-right font-medium">Huevos</th>
                <th className="text-muted p-3 text-right font-medium">Precio</th>
                <th className="text-muted p-3 text-center font-medium">Activo</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <PlanRow key={plan.id} plan={plan} onEdit={() => setPlanEditing({ mode: 'edit', plan })} />
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {planEditing ? (
        <PlanModal
          key={planEditing.mode === 'edit' ? planEditing.plan.id : 'new'}
          plan={planEditing.mode === 'edit' ? planEditing.plan : null}
          products={products}
          onClose={() => setPlanEditing(null)}
        />
      ) : null}
      {productEditing ? (
        <ProductModal
          key={productEditing.mode === 'edit' ? productEditing.product.id : 'new'}
          product={productEditing.mode === 'edit' ? productEditing.product : null}
          onClose={() => setProductEditing(null)}
        />
      ) : null}
    </div>
  )
}

function PlanRow({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
  const { pending, save } = useSave()
  return (
    <tr className="border-default-100 border-b last:border-0">
      <td className="text-foreground p-3 font-medium">{plan.name}</td>
      <td className="text-muted p-3">{PLAN_FREQUENCY_LABEL[plan.frequency]}</td>
      <td className="text-muted p-3 text-right tabular-nums">{plan.quantity_per_delivery}</td>
      <td className="text-foreground p-3 text-right tabular-nums">{formatCurrencyCents(plan.price_cents, plan.currency)}</td>
      <td className="p-3 text-center">
        <Switch
          aria-label="Plan activo"
          isSelected={plan.active}
          isDisabled={pending}
          onChange={(v) => save(() => setPlanActive(plan.id, v), v ? 'Plan activado' : 'Plan desactivado')}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </td>
      <td className="p-3 text-right">
        <Button size="sm" variant="ghost" onPress={onEdit}>
          Editar
        </Button>
      </td>
    </tr>
  )
}

function PlanModal({ plan, products, onClose }: { plan: Plan | null; products: Product[]; onClose: () => void }) {
  const { pending, save } = useSave()
  const [productId, setProductId] = useState<Key | null>(plan?.product_id ?? products[0]?.id ?? null)
  const [name, setName] = useState(plan?.name ?? '')
  const [slug, setSlug] = useState(plan?.slug ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [frequency, setFrequency] = useState<Key | null>(plan?.frequency ?? 'weekly')
  const [qty, setQty] = useState<number | undefined>(plan?.quantity_per_delivery ?? 12)
  const [pesos, setPesos] = useState<number | undefined>(plan ? plan.price_cents / 100 : undefined)

  function submit() {
    save(
      () =>
        upsertPlan({
          id: plan?.id,
          product_id: String(productId ?? ''),
          name: name.trim(),
          slug: slug.trim() || null,
          description: description.trim() || null,
          frequency: (frequency ?? 'weekly') as Enums['plan_frequency'],
          quantity_per_delivery: qty ?? 0,
          price_cents: Math.round((pesos ?? 0) * 100),
          active: plan?.active ?? true,
        }),
      plan ? 'Plan actualizado' : 'Plan creado',
      onClose,
    )
  }

  return (
    <FormModal title={plan ? 'Editar plan' : 'Agregar plan'} onClose={onClose} onSubmit={submit} pending={pending}>
      <Select value={productId} onChange={setProductId} placeholder="Selecciona un producto">
        <Label>Producto</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {products.map((p) => (
              <ListBox.Item key={p.id} id={p.id} textValue={p.name}>
                {p.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <TextField value={name} onChange={setName}>
        <Label>Nombre del plan</Label>
        <Input placeholder="Ej. Plan Familiar" />
      </TextField>

      <TextField value={slug} onChange={setSlug}>
        <Label>Slug</Label>
        <Input placeholder="ej. familiar-semanal" />
      </TextField>

      <TextField value={description} onChange={setDescription}>
        <Label>Descripción</Label>
        <TextArea className="min-h-16 resize-y" placeholder="Ej. 30 huevos de libre pastoreo por despacho" />
      </TextField>

      <div className="grid grid-cols-2 gap-3">
        <Select value={frequency} onChange={setFrequency}>
          <Label>Frecuencia</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {FREQUENCIES.map((f) => (
                <ListBox.Item key={f} id={f} textValue={PLAN_FREQUENCY_LABEL[f]}>
                  {PLAN_FREQUENCY_LABEL[f]}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <NumberField value={qty} minValue={1} step={1} onChange={setQty}>
          <Label>Huevos por entrega</Label>
          <NumberField.Group>
            <NumberField.Input />
          </NumberField.Group>
        </NumberField>
      </div>

      <NumberField value={pesos} minValue={0} step={100} formatOptions={{ style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }} onChange={setPesos}>
        <Label>Precio (CLP)</Label>
        <NumberField.Group>
          <NumberField.Input />
        </NumberField.Group>
      </NumberField>
    </FormModal>
  )
}

function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { pending, save } = useSave()
  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [active, setActive] = useState(product?.active ?? true)

  function submit() {
    save(
      () =>
        upsertProduct({
          id: product?.id,
          sku: sku.trim(),
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          active,
        }),
      product ? 'Producto actualizado' : 'Producto creado',
      onClose,
    )
  }

  return (
    <FormModal title={product ? 'Editar producto' : 'Agregar producto'} onClose={onClose} onSubmit={submit} pending={pending}>
      <TextField value={name} onChange={setName}>
        <Label>Nombre</Label>
        <Input placeholder="Ej. Huevos de libre pastoreo" />
      </TextField>
      <TextField value={sku} onChange={setSku}>
        <Label>SKU</Label>
        <Input placeholder="ej. huevos-libre-pastoreo" />
      </TextField>
      <TextField value={description} onChange={setDescription}>
        <Label>Descripción</Label>
        <TextArea className="min-h-16 resize-y" placeholder="Opcional" />
      </TextField>
      <TextField value={imageUrl} onChange={setImageUrl}>
        <Label>URL de imagen</Label>
        <Input placeholder="https://…" />
      </TextField>
      <Switch isSelected={active} onChange={setActive}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label>Producto activo</Label>
        </Switch.Content>
      </Switch>
    </FormModal>
  )
}
