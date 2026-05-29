"use client";

// TODO: Wire these form controls to your account/workspace store. The controls
// are currently uncontrolled and don't persist changes.

import type {ReactNode} from "react";

import {
  Button,
  Checkbox,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  TextArea,
  TextField,
} from "@heroui/react";

const REGIONS = [
  {id: "rm", label: "Región Metropolitana"},
  {id: "vs", label: "Valparaíso"},
  {id: "bb", label: "Biobío"},
  {id: "ar", label: "La Araucanía"},
  {id: "lr", label: "Los Ríos"},
  {id: "ll", label: "Los Lagos"},
] as const;

const CURRENCIES = [
  {id: "clp", label: "CLP - Peso chileno"},
  {id: "usd", label: "USD - Dólar estadounidense"},
  {id: "eur", label: "EUR - Euro"},
] as const;

export function SettingsPage() {
  return (
    <form className="mx-auto flex max-w-5xl flex-col gap-4 px-5 pb-10 pt-4">
      <p className="text-muted text-sm">Gestiona el perfil y las preferencias de tu organización.</p>

      <Separator />

      <SettingsRow
        description="Se mostrará en tu perfil público."
        label="Nombre de la organización"
      >
        <TextField name="org-name">
          <Label className="sr-only">Nombre de la organización</Label>
          <Input fullWidth placeholder="Tu organización" />
        </TextField>
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="Se mostrará en tu perfil público. Máximo 240 caracteres."
        label="Biografía de la organización"
      >
        <TextField name="org-bio">
          <Label className="sr-only">Biografía de la organización</Label>
          <TextArea
            fullWidth
            className="min-h-24 resize-y"
            maxLength={240}
            placeholder="Cuéntales a los clientes sobre tu organización"
          />
        </TextField>
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="Así pueden contactarte los clientes para soporte."
        label="Correo de la organización"
      >
        <TextField name="org-email">
          <Label className="sr-only">Correo de la organización</Label>
          <Input fullWidth placeholder="info@ejemplo.com" type="email" />
        </TextField>
        <Checkbox id="org-email-public" name="org-email-public">
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label htmlFor="org-email-public">Mostrar el correo en el perfil público</Label>
          </Checkbox.Content>
        </Checkbox>
      </SettingsRow>

      <Separator />

      <SettingsRow description="Lugar donde está registrada tu organización." label="Dirección">
        <TextField name="address-street">
          <Label className="sr-only">Dirección</Label>
          <Input fullWidth placeholder="Calle y número" />
        </TextField>
        <TextField name="address-city">
          <Label className="sr-only">Ciudad</Label>
          <Input fullWidth placeholder="Ciudad" />
        </TextField>
        <div className="grid grid-cols-[1fr_160px] gap-3">
          <Select name="address-region" placeholder="Región">
            <Label className="sr-only">Región</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {REGIONS.map((r) => (
                  <ListBox.Item key={r.id} id={r.id} textValue={r.label}>
                    {r.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <TextField name="address-postal">
            <Label className="sr-only">Código postal</Label>
            <Input fullWidth placeholder="Código postal" />
          </TextField>
        </div>
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="La moneda en la que cobrará tu organización."
        label="Moneda"
      >
        <Select name="currency" placeholder="Selecciona la moneda">
          <Label className="sr-only">Moneda</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {CURRENCIES.map((c) => (
                <ListBox.Item key={c.id} id={c.id} textValue={c.label}>
                  {c.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </SettingsRow>

      <Separator />

      <footer className="flex items-center justify-end gap-2 pt-2">
        <Button type="reset" variant="ghost">
          Restablecer
        </Button>
        <Button type="submit">Guardar cambios</Button>
      </footer>
    </form>
  );
}

interface SettingsRowProps {
  description: string;
  label: string;
  children: ReactNode;
}

function SettingsRow({children, description, label}: SettingsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-10">
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <p className="text-muted text-xs leading-snug">{description}</p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
