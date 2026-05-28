import { Link } from "@heroui/react";
import { Instagram, TikTok, WhatsApp } from "./icons";

const columns = [
  {
    title: "Producto",
    links: [
      { label: "Cómo Funciona", href: "#como-funciona" },
      { label: "Planes y Precios", href: "#planes" },
      { label: "Nuestro Origen", href: "#origen" },
      { label: "Preguntas Frecuentes", href: "#faq" },
    ],
  },
  {
    title: "Tu Cuenta",
    links: [
      { label: "Iniciar Sesión", href: "/login" },
      { label: "Mi Suscripción", href: "/account" },
      { label: "Historial de Pedidos", href: "/account" },
      { label: "Soporte", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos del Servicio", href: "#" },
      { label: "Política de Privacidad", href: "#" },
      { label: "Política de Cancelación", href: "#" },
      { label: "Facturación", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-background border-t border-separator">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center text-lg font-extrabold tracking-tight">
              <span>HUEVOS</span>
              <span className="mx-1.5 inline-block size-2 rounded-full bg-accent align-middle" />
              <span>DONALD</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Suscripción de huevos frescos del sur de Chile.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { Icon: Instagram, label: "Instagram" },
                { Icon: TikTok, label: "TikTok" },
                { Icon: WhatsApp, label: "WhatsApp" },
              ].map(({ Icon, label }) => (
                <Link
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-surface-secondary"
                >
                  <Icon />
                </Link>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {col.title}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-foreground hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-separator pt-6 text-xs text-muted md:flex-row md:items-center">
          <span>© 2026 Huevos Donald. Todos los derechos reservados.</span>
          <span>Un producto de Casa Desarrollo SpA</span>
        </div>
      </div>
    </footer>
  );
}
