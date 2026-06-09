"use client";

import type {ZoneOption, SlotOption} from "@/lib/admin/clients/types";
import type {Key} from "@heroui/react";

import {Label, ListBox, Select} from "@heroui/react";

const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** Delivery-zone picker with a "Sin asignar" (null) option. */
export function ZoneSelect({
  zones,
  value,
  onChange,
  label = "Zona de entrega",
}: {
  zones: ZoneOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}) {
  return (
    <Select
      value={value ?? "none"}
      onChange={(k: Key | null) => onChange(k === "none" ? null : String(k))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="none" textValue="Sin asignar">
            Sin asignar
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {zones.map((z) => (
            <ListBox.Item key={z.id} id={z.id} textValue={z.comuna ?? z.name}>
              {z.comuna ?? z.name}
              {z.active ? "" : " (inactiva)"}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/** Delivery-slot picker with a "Sin asignar" (null) option. */
export function SlotSelect({
  slots,
  value,
  onChange,
  label = "Horario preferido",
}: {
  slots: SlotOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}) {
  return (
    <Select
      value={value ?? "none"}
      onChange={(k: Key | null) => onChange(k === "none" ? null : String(k))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="none" textValue="Sin asignar">
            Sin asignar
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {slots.map((s) => (
            <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
              {s.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/** Weekday picker (0–6) with a "Sin preferencia" (null) option. */
export function WeekdaySelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <Select
      value={value == null ? "none" : String(value)}
      onChange={(k: Key | null) =>
        onChange(k === "none" || k == null ? null : Number(k))
      }
    >
      <Label>Día preferido</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="none" textValue="Sin preferencia">
            Sin preferencia
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {WEEKDAYS.map((day, idx) => (
            <ListBox.Item key={idx} id={String(idx)} textValue={day}>
              {day}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
