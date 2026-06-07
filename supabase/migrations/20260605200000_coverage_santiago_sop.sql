-- Align delivery coverage + dispatch hours with the brand SOP (v1.0).
--
-- SOP §3 (Cobertura): delivery ONLY in 7 Santiago (RM) comunas.
-- SOP §4 (Horarios de despacho): Lun–Jue 10:00–17:00; Vie 10:00–13:00; no Sáb/Dom/feriados.
--
-- Knowledge+facts pass: data-only. No schema/enum changes, no new tables.
-- The legacy southern-Chile zones (Castro/Osorno/Pto Montt/Pto Varas) are
-- DEACTIVATED (not deleted) to preserve any historical FK references.
--
-- KNOWN LIMITATION (TODO): the slot model has no per-weekday hours, so the
-- "Tarde" (13:00–17:00) slot is technically offerable on Fridays even though
-- the SOP caps Friday dispatch at 13:00. The agent prompt + FAQ state the
-- Friday-morning-only rule; enforcing it in the availability engine needs a
-- per-weekday/per-slot model (out of scope for this pass).

begin;

-- 1) Tighten the two dispatch slots to the SOP window (10:00–17:00).
--    slot_ids are kept stable so existing slot_capacity rows stay valid.
update delivery_slots set start_time = '10:00', end_time = '13:00', updated_at = now()
where name = 'Mañana';
update delivery_slots set start_time = '13:00', end_time = '17:00', updated_at = now()
where name = 'Tarde';

-- 2) Deactivate legacy southern-Chile zones (SOP serves Santiago only).
update delivery_zones set active = false, updated_at = now()
where comuna in ('Castro', 'Osorno', 'Puerto Montt', 'Puerto Varas');

-- 3) Insert the 7 SOP comunas (idempotent by comuna).
with new_zones(name, comuna) as (
  values
    ('Lo Barnechea', 'Lo Barnechea'),
    ('Las Condes',   'Las Condes'),
    ('Vitacura',     'Vitacura'),
    ('Providencia',  'Providencia'),
    ('La Reina',     'La Reina'),
    ('Ñuñoa',        'Ñuñoa'),
    ('Peñalolén',    'Peñalolén')
)
insert into delivery_zones (name, comuna, active)
select nz.name, nz.comuna, true
from new_zones nz
where not exists (
  select 1 from delivery_zones dz where dz.comuna = nz.comuna
);

-- 4) Dispatch days: every Santiago comuna served Mon–Fri (weekday 1–5).
--    NO weekend (SOP forbids Sat/Sun dispatch). 0=Sun … 6=Sat.
insert into delivery_zone_days (zone_id, weekday, active)
select z.id, wd, true
from delivery_zones z
cross join (values (1), (2), (3), (4), (5)) as w(wd)
where z.comuna in ('Lo Barnechea', 'Las Condes', 'Vitacura', 'Providencia', 'La Reina', 'Ñuñoa', 'Peñalolén')
  and z.active = true
  and not exists (
    select 1 from delivery_zone_days d where d.zone_id = z.id and d.weekday = wd
  );

-- 5) Capacity: both active slots, 20 orders each, per Santiago comuna.
insert into slot_capacity (zone_id, slot_id, max_orders)
select z.id, s.id, 20
from delivery_zones z
cross join delivery_slots s
where z.comuna in ('Lo Barnechea', 'Las Condes', 'Vitacura', 'Providencia', 'La Reina', 'Ñuñoa', 'Peñalolén')
  and z.active = true
  and s.active = true
  and not exists (
    select 1 from slot_capacity c where c.zone_id = z.id and c.slot_id = s.id
  );

commit;
