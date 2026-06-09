"use client";

import type {ZoneOption} from "@/lib/admin/clients/types";

import {Input, Label, Radio, RadioGroup, TextField} from "@heroui/react";
import {useState} from "react";

import {createCustomer} from "@/app/admin/clients/actions";
import {useSave} from "@/dashboard/views/settings/_shared";

import {ConfirmDangerDialog} from "./confirm-danger-dialog";
import {ZoneSelect} from "./form-fields";

export type CreatePrefill = {
  idType: "email" | "phone";
  idValue: string;
  fullName: string | null;
};

export function CreateClientModal({
  zones,
  prefill,
  onClose,
}: {
  zones: ZoneOption[];
  prefill?: CreatePrefill;
  onClose: () => void;
}) {
  const {pending, save} = useSave();
  const [idType, setIdType] = useState<"email" | "phone">(
    prefill?.idType ?? "phone",
  );
  const [idValue, setIdValue] = useState(prefill?.idValue ?? "");
  const [fullName, setFullName] = useState(prefill?.fullName ?? "");
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  function submit() {
    save(
      () =>
        createCustomer({
          idType,
          idValue: idValue.trim(),
          fullName: fullName.trim() || null,
          phone: idType === "phone" ? idValue.trim() : null,
          email: idType === "email" ? idValue.trim() : null,
          addressLine1: address.trim() || null,
          city: city.trim() || null,
          deliveryZoneId: zoneId,
        }),
      "Cliente creado",
      onClose,
    );
  }

  return (
    <ConfirmDangerDialog
      confirmLabel="Crear cliente"
      pending={pending}
      size="md"
      title="Nuevo cliente"
      token="CREAR"
      tone="primary"
      onClose={onClose}
      onConfirm={submit}
    >
      <RadioGroup
        value={idType}
        onChange={(v) => setIdType(v as "email" | "phone")}
      >
        <Label>Identificador de la cuenta</Label>
        <div className="flex gap-4">
          <Radio value="phone">
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            <Radio.Content>
              <Label>Teléfono</Label>
            </Radio.Content>
          </Radio>
          <Radio value="email">
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            <Radio.Content>
              <Label>Correo</Label>
            </Radio.Content>
          </Radio>
        </div>
      </RadioGroup>

      <TextField value={idValue} onChange={setIdValue}>
        <Label>
          {idType === "phone" ? "Teléfono (56XXXXXXXXX)" : "Correo electrónico"}
        </Label>
        <Input
          inputMode={idType === "phone" ? "tel" : "email"}
          placeholder={idType === "phone" ? "56912345678" : "cliente@correo.cl"}
          type={idType === "phone" ? "tel" : "email"}
        />
      </TextField>

      <TextField value={fullName} onChange={setFullName}>
        <Label>Nombre</Label>
        <Input placeholder="Nombre del cliente" />
      </TextField>

      <ZoneSelect value={zoneId} zones={zones} onChange={setZoneId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField value={address} onChange={setAddress}>
          <Label>Dirección</Label>
          <Input placeholder="Calle y número" />
        </TextField>
        <TextField value={city} onChange={setCity}>
          <Label>Comuna / ciudad</Label>
          <Input placeholder="Comuna" />
        </TextField>
      </div>
    </ConfirmDangerDialog>
  );
}
