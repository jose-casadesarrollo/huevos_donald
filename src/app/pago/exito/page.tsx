import type { Metadata } from "next";
import Link from "next/link";

import { ClearCartOnMount } from "@/components/tienda/pago/ClearCartOnMount";
import { PAGO_CTA, PagoShell } from "@/components/tienda/pago/PagoShell";

export const metadata: Metadata = { title: "Pago confirmado — Huevos Donald" };

export default function PagoExitoPage() {
  return (
    <PagoShell accent="moss" eyebrow="Pago / Confirmado" title="¡Gracias por tu compra!">
      <ClearCartOnMount />
      <p>
        Recibimos tu pago. Te enviamos un correo con el detalle del pedido y coordinaremos el
        despacho a tu comuna, en el día asignado.
      </p>
      <div>
        <Link href="/tienda" className={PAGO_CTA}>
          Volver a la tienda
        </Link>
      </div>
    </PagoShell>
  );
}
