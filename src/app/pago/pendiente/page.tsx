import type { Metadata } from "next";
import Link from "next/link";

import { PAGO_CTA, PagoShell } from "@/components/tienda/pago/PagoShell";

export const metadata: Metadata = { title: "Pago en revisión — Huevos Donald" };

export default function PagoPendientePage() {
  return (
    <PagoShell accent="yolk" eyebrow="Pago / En revisión" title="Tu pago está en revisión">
      <p>
        Algunos medios de pago (transferencia, efectivo) se confirman en unos minutos. Te avisaremos
        por correo apenas se acredite y tu pedido entre en preparación.
      </p>
      <div>
        <Link href="/tienda" className={PAGO_CTA}>
          Seguir comprando
        </Link>
      </div>
    </PagoShell>
  );
}
