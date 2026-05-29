"use client";

import {ArrowsRotateLeft, Calendar, ChevronDown} from "@gravity-ui/icons";
import {Button, ButtonGroup, Dropdown, Label, Tabs} from "@heroui/react";

import {IconButton} from "../components/icon-button";

export function DashboardToolbar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs defaultSelectedKey="overview">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Dashboard tabs">
            <Tabs.Tab id="overview">
              Resumen
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="sales">
              Ventas
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="expenses">
              Gastos
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="Actualizar" size="sm" variant="tertiary">
          <ArrowsRotateLeft className="size-4" />
        </IconButton>
        <ButtonGroup size="sm" variant="tertiary">
          <Button>
            <Calendar className="size-4" />
            Mensual
          </Button>
          <Dropdown>
            <Button isIconOnly aria-label="Cambiar período" size="sm" variant="tertiary">
              <ChevronDown className="size-4" />
            </Button>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu>
                <Dropdown.Item id="daily" textValue="Diario">
                  <Label>Diario</Label>
                </Dropdown.Item>
                <Dropdown.Item id="weekly" textValue="Semanal">
                  <Label>Semanal</Label>
                </Dropdown.Item>
                <Dropdown.Item id="monthly" textValue="Mensual">
                  <Label>Mensual</Label>
                </Dropdown.Item>
                <Dropdown.Item id="yearly" textValue="Anual">
                  <Label>Anual</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </ButtonGroup>
        <Button size="sm">Descargar</Button>
      </div>
    </div>
  );
}
