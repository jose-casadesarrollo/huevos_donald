"use client";

import type {ReactNode} from "react";

import {AlertDialog, Button, Input, Label, TextField} from "@heroui/react";
import {useState} from "react";

/**
 * Reusable type-to-confirm dialog. The confirm button stays disabled until the
 * user types `token` (case-insensitive, trimmed). Built on `AlertDialog`, which
 * defaults to non-dismissable (no backdrop/ESC close) so the typed gate can't be
 * bypassed accidentally. Render only while open (mount = open), like `FormModal`.
 *
 * Pass form fields as `children` (they render above the confirm field), so the
 * same component gates simple confirmations and short forms alike.
 */
export function ConfirmDangerDialog({
  token,
  title,
  confirmLabel = "Confirmar",
  tone = "danger",
  size = "sm",
  pending,
  warning,
  children,
  onConfirm,
  onClose,
}: {
  token: string;
  title: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  size?: "xs" | "sm" | "md" | "lg";
  pending: boolean;
  warning?: ReactNode;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === token.trim().toLowerCase();

  return (
    <AlertDialog.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialog.Container placement="center" size={size}>
        <AlertDialog.Dialog>
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon
              status={tone === "danger" ? "danger" : "accent"}
            />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <div className="flex flex-col gap-4 py-1">
              {children}
              {warning}
              <TextField value={typed} onChange={setTyped}>
                <Label>
                  Escribe{" "}
                  <span className="text-foreground font-semibold">{token}</span>{" "}
                  para confirmar
                </Label>
                <Input autoFocus placeholder={token} />
              </TextField>
            </div>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary">
              Cancelar
            </Button>
            <Button
              isDisabled={!matches || pending}
              isPending={pending}
              variant={tone === "danger" ? "danger" : "primary"}
              onPress={onConfirm}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
