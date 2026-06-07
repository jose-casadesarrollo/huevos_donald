-- Pass 2 — Policy configuration rows. SOP §4, §5, §10, §11, §20.
--
-- app_settings is key/value JSONB, so these are data rows, not schema. Values
-- marked `null` are the SOP's bracketed unknowns — fill them in once confirmed
-- (the agent/app must treat null as "no figure to quote"). dispatch_hours
-- mirrors the SOP §4 windows already enforced operationally.

insert into public.app_settings (key, value, description) values
  ('dispatch_hours',
   '{"mon":["10:00","17:00"],"tue":["10:00","17:00"],"wed":["10:00","17:00"],"thu":["10:00","17:00"],"fri":["10:00","13:00"]}'::jsonb,
   'SOP §4 dispatch windows per weekday (no Sat/Sun/feriados).'),
  ('order_cutoff_time',            'null'::jsonb, 'SOP §5 hora de corte for same-day dispatch (TBD).'),
  ('dispatch_sla',                 'null'::jsonb, 'SOP §5 SLA: same business day / X business days (TBD).'),
  ('pause_min_notice_days',        'null'::jsonb, 'SOP §11 min días notice to pause before next dispatch (TBD).'),
  ('pause_max_months',             'null'::jsonb, 'SOP §11 max pause length in months before expiry action (TBD).'),
  ('pause_expiry_action',          '"reactivate"'::jsonb, 'SOP §11 at max pause: "reactivate" | "cancel".'),
  ('refund_window_business_days',  'null'::jsonb, 'SOP §20 refund window in business days (TBD).'),
  ('saldo_delivery_window_days',   'null'::jsonb, 'SOP §20 window to deliver pending saldo after cancellation (TBD).'),
  ('points_earn_rate',             'null'::jsonb, 'SOP §10 Puntos earned per purchase/renewal — earn rule (TBD).')
on conflict (key) do nothing;
