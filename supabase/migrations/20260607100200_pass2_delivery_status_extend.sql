-- Pass 2 — Extend the delivery lifecycle to cover the SOP's 6 customer-facing
-- states. SOP §14: Pedido recibido → Pago confirmado → En preparación →
-- Listo para despacho → En camino → Entregado.
--
-- delivery_status had: scheduled → out_for_delivery → delivered (+ failed/skipped).
-- This adds the two missing logistics stages. It MUST be its own migration:
-- Postgres forbids USING a newly added enum value in the same transaction it's
-- added, so nothing here references 'preparing'/'ready_for_dispatch'. The
-- columns/views/functions that use them live in the next migration.

alter type public.delivery_status add value if not exists 'preparing'          after 'scheduled';
alter type public.delivery_status add value if not exists 'ready_for_dispatch' after 'preparing';
