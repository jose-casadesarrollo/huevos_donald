"use client";

import type {ClientProfile, ZoneOption} from "@/lib/admin/clients/types";

import {Input, Label, TextArea, TextField} from "@heroui/react";
import {useState} from "react";

import {updateClientProfile} from "@/app/admin/clients/actions";
import {FormModal, useSave} from "@/dashboard/views/settings/_shared";

import {ZoneSelect} from "./form-fields";

export function EditClientModal({
  profile,
  zones,
  onClose,
  onSaved,
}: {
  profile: ClientProfile;
  zones: ZoneOption[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const {pending, save} = useSave();
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [zoneId, setZoneId] = useState<string | null>(profile.deliveryZoneId);
  const [address1, setAddress1] = useState(profile.addressLine1 ?? "");
  const [address2, setAddress2] = useState(profile.addressLine2 ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [notes, setNotes] = useState(profile.deliveryNotes ?? "");

  function submit() {
    save(
      () =>
        updateClientProfile({
          id: profile.id,
          fullName: fullName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          addressLine1: address1.trim() || null,
          addressLine2: address2.trim() || null,
          city: city.trim() || null,
          deliveryZoneId: zoneId,
          deliveryNotes: notes.trim() || null,
        }),
      "Cliente actualizado",
      () => {
        onSaved?.();
        onClose();
      },
    );
  }

  return (
    <FormModal
      pending={pending}
      size="lg"
      title="Editar cliente"
      onClose={onClose}
      onSubmit={submit}
    >
      <TextField value={fullName} onChange={setFullName}>
        <Label>Nombre</Label>
        <Input placeholder="Nombre del cliente" />
      </TextField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField value={phone} onChange={setPhone}>
          <Label>Teléfono (56XXXXXXXXX)</Label>
          <Input inputMode="tel" placeholder="56912345678" />
        </TextField>
        <TextField value={email} onChange={setEmail}>
          <Label>Correo</Label>
          <Input inputMode="email" placeholder="cliente@correo.cl" />
        </TextField>
      </div>

      <ZoneSelect value={zoneId} zones={zones} onChange={setZoneId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField value={address1} onChange={setAddress1}>
          <Label>Dirección</Label>
          <Input placeholder="Calle y número" />
        </TextField>
        <TextField value={address2} onChange={setAddress2}>
          <Label>Depto / referencia</Label>
          <Input placeholder="Depto, block, referencia" />
        </TextField>
      </div>

      <TextField value={city} onChange={setCity}>
        <Label>Comuna / ciudad</Label>
        <Input placeholder="Comuna" />
      </TextField>

      <TextField value={notes} onChange={setNotes}>
        <Label>Notas de entrega</Label>
        <TextArea placeholder="Instrucciones para el repartidor" />
      </TextField>
    </FormModal>
  );
}
