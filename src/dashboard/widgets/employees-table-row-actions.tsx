"use client";

import {Eye, Pencil, TrashBin} from "@gravity-ui/icons";

import {IconButton} from "../components/icon-button";

export interface RowActionsProps {
  employeeId: string;
}

export function RowActions({employeeId}: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5" data-employee-id={employeeId}>
      <IconButton label="Ver" size="sm" variant="tertiary">
        <Eye className="size-4" />
      </IconButton>
      <IconButton label="Editar" size="sm" variant="tertiary">
        <Pencil className="size-4" />
      </IconButton>
      <IconButton label="Eliminar" size="sm" variant="danger-soft">
        <TrashBin className="size-4" />
      </IconButton>
    </div>
  );
}
