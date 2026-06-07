-- Pass 2 — Hardening pass to clear the advisors on the new objects.
--   • SECURITY DEFINER functions exposed to anon/authenticated  (lints 0028/0029)
--   • RLS policies re-eval auth.uid() per row                    (auth_rls_initplan)
--   • multiple permissive policies per action                    (multiple_permissive_policies)
--   • unindexed foreign keys on the new tables                   (unindexed_foreign_keys)
-- Pre-existing findings on older tables + pg_net/leaked-password are out of scope.

-- ── Functions: sync_* don't need definer (only the service-role inserter fires
--    them, and it bypasses RLS); revoke API EXECUTE on all three. ────────────
create or replace function public.sync_egg_balance() returns trigger
language plpgsql security invoker set search_path = public as $fn$
begin
  if new.subscription_id is not null then
    update public.subscriptions
       set egg_balance = egg_balance + new.delta, updated_at = now()
     where id = new.subscription_id;
  end if;
  return new;
end $fn$;

create or replace function public.sync_points_balance() returns trigger
language plpgsql security invoker set search_path = public as $fn$
begin
  update public.profiles
     set points_balance = points_balance + new.delta, updated_at = now()
   where id = new.user_id;
  return new;
end $fn$;

revoke all on function public.sync_egg_balance()           from public, anon, authenticated;
revoke all on function public.sync_points_balance()        from public, anon, authenticated;
revoke all on function public.process_subscription_pauses() from public, anon, authenticated;

-- ── Covering indexes for the new foreign keys ──────────────────────────────
create index if not exists egg_ledger_delivery_idx          on public.egg_ledger (delivery_id);
create index if not exists egg_ledger_order_idx             on public.egg_ledger (order_id);
create index if not exists egg_ledger_payment_idx           on public.egg_ledger (payment_id);
create index if not exists points_ledger_order_idx          on public.points_ledger (order_id);
create index if not exists points_ledger_payment_idx        on public.points_ledger (payment_id);
create index if not exists points_ledger_sub_idx            on public.points_ledger (subscription_id);
create index if not exists notification_events_delivery_idx on public.notification_events (delivery_id);
create index if not exists notification_events_order_idx    on public.notification_events (order_id);
create index if not exists incidents_delivery_idx           on public.incidents (delivery_id);
create index if not exists incidents_order_idx              on public.incidents (order_id);
create index if not exists incidents_resolved_by_idx        on public.incidents (resolved_by);
create index if not exists incident_photos_incident_idx     on public.incident_photos (incident_id);
create index if not exists coupons_incident_idx             on public.coupons (incident_id);
create index if not exists coupon_redemptions_coupon_idx    on public.coupon_redemptions (coupon_id);
create index if not exists coupon_redemptions_order_idx     on public.coupon_redemptions (order_id);
create index if not exists coupon_redemptions_user_idx      on public.coupon_redemptions (user_id);
create index if not exists production_lots_product_idx      on public.production_lots (product_id);
create index if not exists deliveries_lot_idx               on public.deliveries (lot_id);

-- ── RLS: one policy per action, auth.uid()/is_admin() wrapped in a scalar
--    subquery so they're evaluated once per statement, not per row. ──────────

-- egg_ledger / points_ledger / notification_events / coupon_redemptions: read own (writes = service role)
drop policy if exists egg_ledger_select_own on public.egg_ledger;
create policy egg_ledger_select on public.egg_ledger for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists points_ledger_select_own on public.points_ledger;
create policy points_ledger_select on public.points_ledger for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists notif_select_own on public.notification_events;
create policy notification_events_select on public.notification_events for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists coupon_redemptions_select_own on public.coupon_redemptions;
create policy coupon_redemptions_select on public.coupon_redemptions for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

-- incidents: customer reads/files own; admin updates/deletes
drop policy if exists incidents_select_own on public.incidents;
drop policy if exists incidents_insert_own on public.incidents;
drop policy if exists incidents_admin_all on public.incidents;
create policy incidents_select on public.incidents for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy incidents_insert on public.incidents for insert to authenticated
  with check ((select auth.uid()) = user_id or (select public.is_admin()));
create policy incidents_update on public.incidents for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy incidents_delete on public.incidents for delete to authenticated
  using ((select public.is_admin()));

-- incident_photos: follow their incident
drop policy if exists incident_photos_select on public.incident_photos;
drop policy if exists incident_photos_insert on public.incident_photos;
create policy incident_photos_select on public.incident_photos for select to authenticated
  using ((select public.is_admin())
         or exists (select 1 from public.incidents i where i.id = incident_id and i.user_id = (select auth.uid())));
create policy incident_photos_insert on public.incident_photos for insert to authenticated
  with check ((select public.is_admin())
              or exists (select 1 from public.incidents i where i.id = incident_id and i.user_id = (select auth.uid())));

-- coupons: read own; admin manages
drop policy if exists coupons_select_own on public.coupons;
drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_select on public.coupons for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy coupons_insert on public.coupons for insert to authenticated
  with check ((select public.is_admin()));
create policy coupons_update on public.coupons for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy coupons_delete on public.coupons for delete to authenticated
  using ((select public.is_admin()));

-- production_lots: readable to all authenticated; admin manages
drop policy if exists lots_select_auth on public.production_lots;
drop policy if exists lots_admin_all on public.production_lots;
create policy production_lots_select on public.production_lots for select to authenticated
  using (true);
create policy production_lots_insert on public.production_lots for insert to authenticated
  with check ((select public.is_admin()));
create policy production_lots_update on public.production_lots for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy production_lots_delete on public.production_lots for delete to authenticated
  using ((select public.is_admin()));

-- storage evidence policies: wrap auth.uid() too
drop policy if exists "incident_evidence_read_own" on storage.objects;
create policy "incident_evidence_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'incident-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "incident_evidence_write_own" on storage.objects;
create policy "incident_evidence_write_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'incident-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
