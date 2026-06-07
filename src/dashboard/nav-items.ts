import type {ComponentType} from "react";

import {
  ArrowRightFromSquare,
  CircleQuestion,
  Gear,
  Headphones,
  House,
  ListCheck,
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
  {href: "/support", icon: Headphones, label: "Soporte"},
  {badge: "Nuevo", href: "/tracker", icon: ListCheck, label: "Seguimiento"},
  {href: "/settings", icon: Gear, label: "Ajustes"},
] as const;

export const FOOTER_ITEMS: readonly NavItem[] = [
  {href: "/help", icon: CircleQuestion, label: "Ayuda e información"},
  {href: "/logout", icon: ArrowRightFromSquare, label: "Cerrar sesión"},
] as const;
