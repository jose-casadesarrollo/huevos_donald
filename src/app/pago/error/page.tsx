import type { Metadata } from "next";
import Link from "next/link";

import { PAGO_CTA, PagoShell } from "@/components/tienda/pago/PagoShell";

export const metadata: Metadata = { title: "Pago no completado — Huevos Donald" };

export default function PagoErrorPage() {
  return (
    <PagoShell accent="red" eyebrow="Pago / No completado" title="No pudimos procesar el pago">
      <p>
        Tu pago no se completó y tu carro sigue intacto. Puedes intentar de nuevo con otro medio de
        pago.
      </p>
      <div className="flex flex-col items-center gap-2">
        <Link href="/tienda/checkout" className={PAGO_CTA}>
          Reintentar el pago
        </Link>
        <Link
          href="/tienda/carro"
          className="font-[var(--font-dm-sans)] text-[13px] font-semibold text-[var(--ink-soft)] underline"
        >
          Ver mi carro
        </Link>
      </div>
    </PagoShell>
  );
}
