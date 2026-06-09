import type {ComponentType} from "react";

import {
  ArrowRightFromSquare,
  CircleQuestion,
  FaceRobot,
  Gear,
  Headphones,
  House,
  ListCheck,
  Persons,
  Receipt,
} from "@gravity-ui/icons";

export type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: ComponentType<{className?: string}>;
  readonly badge?: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {href: "/", icon: House, label: "Inicio"},
  {href: "/orders", icon: Receipt, label: "Pedidos"},
  {href: "/clients", icon: Persons, label: "Clientes"},
  {href: "/support", icon: Headphones, label: "Soporte"},
  {badge: "Nuevo", href: "/tracker", icon: ListCheck, label: "Seguimiento"},
  {href: "/agente", icon: FaceRobot, label: "Agente IA"},
  {href: "/settings", icon: Gear, label: "Ajustes"},
] as const;

export const FOOTER_ITEMS: readonly NavItem[] = [
  {href: "/help", icon: CircleQuestion, label: "Ayuda e información"},
  {href: "/logout", icon: ArrowRightFromSquare, label: "Cerrar sesión"},
] as const;
