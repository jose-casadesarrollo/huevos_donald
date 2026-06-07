'use client'

import { useState } from 'react'
import { Button, Input, Label, ListBox, Select, TextArea, TextField } from '@heroui/react'
import type { Key } from '@heroui/react'

import type { ProductionLot, Product } from '@/lib/admin/config/types'
import { deleteLot, regenLotToken, upsertLot } from '@/app/admin/settings/actions'

import { FormModal, Section, useSave } from './_shared'

export function LotsTab({ lots, products }: { lots: ProductionLot[]; products: Product[] }) {
  const [editing, setEditing] = useState<{ mode: 'new' } | { mode: 'edit'; lot: ProductionLot } | null>(null)

  const productName = (id: string | null) => (id ? (products.find((p) => p.id === id)?.name ?? '—') : '—')

  return (
    <Section
      title="Lotes / Trazabilidad"
      description="Lotes de producción para trazabilidad (QR en la caja)."
      actions={<Button onPress={() => setEditing({ mode: 'new' })}>Agregar lote</Button>}
    >
      <div className="border-default-200 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-default-200 border-b">
              <th className="text-muted p-3 text-left font-medium">Código</th>
              <th className="text-muted p-3 text-left font-medium">Producto</th>
              <th className="text-muted p-3 text-left font-medium">Despacho</th>
              <th className="text-muted p-3 text-left font-medium">Token QR</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <LotRow key={lot.id} lot={lot} productName={productName(lot.product_id)} onEdit={() => setEditing({ mode: 'edit', lot })} />
            ))}
            {lots.length === 0 ? (
              <tr>
                <td className="text-muted p-3" colSpan={5}>
                  No hay lotes.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <LotModal
          key={editing.mode === 'edit' ? editing.lot.id : 'new'}
          lot={editing.mode === 'edit' ? editing.lot : null}
          products={products}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Section>
  )
}

function LotRow({ lot, productName, onEdit }: { lot: ProductionLot; productName: string; onEdit: () => void }) {
  const { pending, save } = useSave()
  return (
    <tr className="border-default-100 border-b last:border-0">
      <td className="text-foreground p-3 font-mono font-medium">{lot.lot_code}</td>
      <td className="text-muted p-3">{productName}</td>
      <td className="text-muted p-3 tabular-nums">{lot.dispatch_date ?? '—'}</td>
      <td className="text-muted p-3 font-mono text-xs">{lot.trace_token.slice(0, 8)}…</td>
      <td className="p-3 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onPress={onEdit}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isPending={pending}
            onPress={() => save(() => regenLotToken(lot.id), 'Token regenerado')}
          >
            Regenerar QR
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            isPending={pending}
            onPress={() => save(() => deleteLot(lot.id), 'Lote eliminado')}
          >
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  )
}

function LotModal({ lot, products, onClose }: { lot: ProductionLot | null; products: Product[]; onClose: () => void }) {
  const { pending, save } = useSave()
  const [lotCode, setLotCode] = useState(lot?.lot_code ?? '')
  const [productId, setProductId] = useState<Key | null>(lot?.product_id ?? 'none')
  const [postura, setPostura] = useState(lot?.postura_date ?? '')
  const [classification, setClassification] = useState(lot?.classification_date ?? '')
  const [prepared, setPrepared] = useState(lot?.prepared_date ?? '')
  const [dispatch, setDispatch] = useState(lot?.dispatch_date ?? '')
  const [notes, setNotes] = useState(lot?.notes ?? '')

  function submit() {
    save(
      () =>
        upsertLot({
          id: lot?.id,
          lot_code: lotCode.trim(),
          product_id: productId === 'none' ? null : String(productId),
          postura_date: postura || null,
          classification_date: classification || null,
          prepared_date: prepared || null,
          dispatch_date: dispatch || null,
          notes: notes.trim() || null,
        }),
      lot ? 'Lote actualizado' : 'Lote creado',
      onClose,
    )
  }

  return (
    <FormModal title={lot ? 'Editar lote' : 'Agregar lote'} onClose={onClose} onSubmit={submit} pending={pending}>
      <TextField value={lotCode} onChange={setLotCode}>
        <Label>Código de lote</Label>
        <Input placeholder="Ej. L-2026-06-07" />
      </TextField>

      <Select value={productId} onChange={setProductId}>
        <Label>Producto</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="none" textValue="Sin producto">
              Sin producto
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {products.map((p) => (
              <ListBox.Item key={p.id} id={p.id} textValue={p.name}>
                {p.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <TextField value={postura} onChange={setPostura}>
          <Label>Postura</Label>
          <Input type="date" />
        </TextField>
        <TextField value={classification} onChange={setClassification}>
          <Label>Clasificación</Label>
          <Input type="date" />
        </TextField>
        <TextField value={prepared} onChange={setPrepared}>
          <Label>Preparación</Label>
          <Input type="date" />
        </TextField>
        <TextField value={dispatch} onChange={setDispatch}>
          <Label>Despacho</Label>
          <Input type="date" />
        </TextField>
      </div>

      <TextField value={notes} onChange={setNotes}>
        <Label>Notas</Label>
        <TextArea className="min-h-16 resize-y" placeholder="Opcional" />
      </TextField>
    </FormModal>
  )
}
