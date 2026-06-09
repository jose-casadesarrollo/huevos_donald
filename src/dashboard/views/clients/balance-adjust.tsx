"use client";

import type {
  ClientListItem,
  ClientSubscription,
} from "@/lib/admin/clients/types";
import type {Key} from "@heroui/react";

import {
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  TextField,
} from "@heroui/react";
import {useState} from "react";

import {adjustEggBalance, adjustPoints} from "@/app/admin/clients/actions";
import {useSave} from "@/dashboard/views/settings/_shared";

import {ConfirmDangerDialog} from "./confirm-danger-dialog";

export function BalanceAdjustModal({
  kind,
  client,
  subscriptions,
  onClose,
  onSaved,
}: {
  kind: "egg" | "points";
  client: ClientListItem;
  subscriptions: ClientSubscription[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const {pending, save} = useSave();
  const [delta, setDelta] = useState<number | undefined>(undefined);
  const [note, setNote] = useState("");
  const [subId, setSubId] = useState<Key | null>("none");

  const token = client.name || client.phone || client.email || "CONFIRMAR";

  function submit() {
    const userId = client.profileId ?? "";
    const fn =
      kind === "egg"
        ? () =>
            adjustEggBalance({
              user_id: userId,
              subscription_id:
                subId === "none" || subId == null ? null : String(subId),
              delta: delta ?? 0,
              note: note.trim() || null,
            })
        : () =>
            adjustPoints({
              user_id: userId,
              delta: delta ?? 0,
              note: note.trim() || null,
            });
    save(
      fn,
      kind === "egg"
        ? "Ajuste de saldo registrado"
        : "Ajuste de puntos registrado",
      () => {
        onSaved?.();
        onClose();
      },
    );
  }

  return (
    <ConfirmDangerDialog
      confirmLabel="Registrar ajuste"
      pending={pending}
      size="sm"
      title={kind === "egg" ? "Ajustar saldo de huevos" : "Ajustar puntos"}
      token={token}
      onClose={onClose}
      onConfirm={submit}
    >
      <NumberField step={1} value={delta} onChange={setDelta}>
        <Label>
          {kind === "egg" ? "Δ huevos" : "Δ puntos"} (+ crédito / − débito)
        </Label>
        <NumberField.Group>
          <NumberField.Input />
        </NumberField.Group>
      </NumberField>

      {kind === "egg" && subscriptions.length > 0 ? (
        <Select value={subId} onChange={setSubId}>
          <Label>Suscripción (opcional)</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="none" textValue="Sin suscripción">
                Sin suscripción
                <ListBox.ItemIndicator />
              </ListBox.Item>
              {subscriptions.map((s) => (
                <ListBox.Item
                  key={s.id}
                  id={s.id}
                  textValue={s.planName ?? s.id.slice(0, 8)}
                >
                  {s.planName ?? s.id.slice(0, 8)} · saldo {s.eggBalance}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      ) : null}

      <TextField value={note} onChange={setNote}>
        <Label>Nota</Label>
        <Input placeholder="Motivo del ajuste" />
      </TextField>
    </ConfirmDangerDialog>
  );
}
