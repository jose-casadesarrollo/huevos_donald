export interface StepTag {
  label: string;
  accent?: boolean;
}

export type VizKind = "saldo" | "agenda" | "notif";

export interface StepData {
  num: string; // "01" | "02" | "03"
  category: string; // "Plan" | "Agenda" | "Entrega"
  title: string;
  titleEm: string; // part of the title rendered italic + red
  desc: string;
  tags: StepTag[];
  vizComponent: VizKind;
}

export type { LifecycleState, LifecycleNotif } from "@/remotion/data";
