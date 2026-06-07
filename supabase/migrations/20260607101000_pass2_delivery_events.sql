-- Pass 2 — Delivery-stage side effects (SOP §14–15, §9).
--
-- A BEFORE UPDATE OF status trigger on deliveries: stamps the per-stage timestamp,
-- queues the customer notification, and on `delivered` debits the egg saldo once
-- (the egg_ledger sync trigger then decrements subscriptions.egg_balance). Fires
-- regardless of WHO advances the status (admin UI, future cron), so the ledger
-- and notifications stay consistent. SECURITY DEFINER so an admin acting via the
-- authenticated client can still write the RLS-protected ledger/notification rows;
-- EXECUTE revoked from the API roles (it's a trigger, never an RPC).

create or replace function public.on_delivery_status_change() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare
  v_unit_cents integer;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- 1) Stamp the stage timestamp (first time only).
  if new.status = 'preparing' and new.prepared_at is null then
    new.prepared_at := now();
  elsif new.status = 'out_for_delivery' and new.out_for_delivery_at is null then
    new.out_for_delivery_at := now();
  elsif new.status = 'delivered' and new.delivered_at is null then
    new.delivered_at := now();
  end if;

  -- 2) Queue the customer notification for the tracked stages.
  if new.status in ('preparing', 'out_for_delivery', 'delivered') then
    insert into public.notification_events (user_id, delivery_id, event_type, channel, status)
    values (
      new.user_id, new.id,
      (case new.status
         when 'preparing' then 'preparing'
         when 'out_for_delivery' then 'out_for_delivery'
         else 'delivered'
       end)::public.notification_event_type,
      'whatsapp', 'pending'
    );
  end if;

  -- 3) On delivered: debit the egg saldo once (idempotent guard).
  if new.status = 'delivered' and coalesce(new.quantity, 0) > 0 then
    if not exists (
      select 1 from public.egg_ledger
      where delivery_id = new.id and reason = 'delivery_debit'
    ) then
      select round(p.price_cents::numeric / nullif(p.quantity_per_delivery, 0))::int
        into v_unit_cents
      from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      where s.id = new.subscription_id;

      insert into public.egg_ledger
        (user_id, subscription_id, delta, reason, value_cents_per_unit, delivery_id, note)
      values
        (new.user_id, new.subscription_id, -new.quantity, 'delivery_debit', v_unit_cents, new.id,
         'Entrega completada');
    end if;
  end if;

  return new;
end $fn$;

revoke all on function public.on_delivery_status_change() from public, anon, authenticated;

drop trigger if exists deliveries_status_change on public.deliveries;
create trigger deliveries_status_change
  before update of status on public.deliveries
  for each row execute function public.on_delivery_status_change();
