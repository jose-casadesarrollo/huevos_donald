"use client";

import type {
  ClientSubscription,
  SlotOption,
  ZoneOption,
} from "@/lib/admin/clients/types";

import {Alert, Input, Label, TextField} from "@heroui/react";
import {useState} from "react";

import {updateSubscription} from "@/app/admin/clients/actions";
import {FormModal, useSave} from "@/dashboard/views/settings/_shared";

import {SlotSelect, WeekdaySelect, ZoneSelect} from "./form-fields";

export function EditSubscriptionModal({
  subscription,
  zones,
  slots,
  onClose,
  onSaved,
}: {
  subscription: ClientSubscription;
  zones: ZoneOption[];
  slots: SlotOption[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const {pending, save} = useSave();
  const [zoneId, setZoneId] = useState<string | null>(
    subscription.deliveryZoneId,
  );
  const [slotId, setSlotId] = useState<string | null>(
    subscription.preferredSlotId,
  );
  const [weekday, setWeekday] = useState<number | null>(
    subscription.preferredWeekday,
  );
  const [phone, setPhone] = useState(subscription.contactPhone ?? "");
  const [email, setEmail] = useState(subscription.contactEmail ?? "");
  const [resumeAt, setResumeAt] = useState(
    subscription.resumeAt ? subscription.resumeAt.slice(0, 10) : "",
  );

  function submit() {
    save(
      () =>
        updateSubscription({
          id: subscription.id,
          deliveryZoneId: zoneId,
          preferredSlotId: slotId,
          preferredWeekday: weekday,
          contactPhone: phone.trim() || null,
          contactEmail: email.trim() || null,
          resumeAt: resumeAt || null,
        }),
      "Suscripción actualizada",
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
      title="Editar suscripción"
      onClose={onClose}
      onSubmit={submit}
    >
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>
            El estado y el plan se gestionan en MercadoPago
          </Alert.Title>
          <Alert.Description>
            Aquí solo cambias preferencias de entrega y contacto — el cobro y el
            plan no se modifican.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ZoneSelect value={zoneId} zones={zones} onChange={setZoneId} />
        <SlotSelect slots={slots} value={slotId} onChange={setSlotId} />
      </div>

      <WeekdaySelect value={weekday} onChange={setWeekday} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField value={phone} onChange={setPhone}>
          <Label>Teléfono de contacto</Label>
          <Input inputMode="tel" placeholder="56912345678" />
        </TextField>
        <TextField value={email} onChange={setEmail}>
          <Label>Correo de contacto</Label>
          <Input inputMode="email" placeholder="cliente@correo.cl" />
        </TextField>
      </div>

      <TextField value={resumeAt} onChange={setResumeAt}>
        <Label>Reactivar el (si está pausada)</Label>
        <Input type="date" />
      </TextField>
    </FormModal>
  );
}
