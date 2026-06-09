-- Agent configuration — admin-editable, runtime-loaded agent prompt + model.
--
-- The AI ordering/support agent lives in the Edge Functions (agent-chat,
-- agent-whatsapp). Until now its persona, rules, SOP knowledge, limits, model
-- and temperature were hardcoded in supabase/functions/_shared/agent.ts and only
-- changeable via redeploy. This table makes the editable parts of the prompt and
-- the model/temperature configurable from /admin/settings, applied to the live
-- agent on the next request (the edge functions read the active row each call).
--
-- The dynamic/structural parts of the prompt (today's date, the logged-in vs
-- guest line, the tool-capabilities list, the section headings) stay in code so
-- they always match the actually-registered tools. Only the four section bodies
-- + model + temperature are stored here. Seed v1 reproduces the prior hardcoded
-- prompt verbatim, so behavior is identical until an admin edits it.

-- --------------------------------------------------------------------------
-- Table: append-only version history; exactly one active row = current config.
-- --------------------------------------------------------------------------
create table if not exists public.agent_config_versions (
  id           uuid primary key default gen_random_uuid(),
  version      integer not null,
  persona      text not null default '',
  order_rules  text not null default '',
  sop_policies text not null default '',
  limits       text not null default '',
  model        text not null default 'gpt-4o-mini',
  temperature  numeric(3,2) not null default 0.3 check (temperature >= 0 and temperature <= 2),
  is_active    boolean not null default false,
  note         text,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- At most one active row (partial unique index; checked at end of statement).
create unique index if not exists agent_config_one_active
  on public.agent_config_versions (is_active) where is_active;

create index if not exists idx_agent_config_version
  on public.agent_config_versions (version desc);

-- --------------------------------------------------------------------------
-- RLS — admin-only (mirrors app_settings). The agent reads via the service
-- role (bypasses RLS); the admin UI reads/writes via the RLS-bound session.
-- --------------------------------------------------------------------------
alter table public.agent_config_versions enable row level security;

create policy "admin all agent_config" on public.agent_config_versions
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update on public.agent_config_versions to authenticated;

-- --------------------------------------------------------------------------
-- RPCs — SECURITY INVOKER (RLS still applies; explicit is_admin() guard too).
-- Encapsulate the version numbering + single-active-row flip atomically.
-- --------------------------------------------------------------------------

-- Save a new config version and make it the active one.
create or replace function public.save_agent_config(
  p_persona      text,
  p_order_rules  text,
  p_sop_policies text,
  p_limits       text,
  p_model        text,
  p_temperature  numeric,
  p_note         text default null
) returns public.agent_config_versions
language plpgsql
set search_path = ''
as $$
declare
  v_row  public.agent_config_versions;
  v_next integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select coalesce(max(version), 0) + 1 into v_next from public.agent_config_versions;

  -- Insert inactive first so the partial-unique index never sees two active
  -- rows; the single-statement flip below leaves exactly one active.
  insert into public.agent_config_versions
    (version, persona, order_rules, sop_policies, limits, model, temperature, note, is_active, created_by)
  values
    (v_next, p_persona, p_order_rules, p_sop_policies, p_limits, p_model, p_temperature, p_note, false, auth.uid())
  returning * into v_row;

  update public.agent_config_versions set is_active = (id = v_row.id);
  v_row.is_active := true;
  return v_row;
end;
$$;

-- Roll back: make a previously-saved version the active one.
create or replace function public.activate_agent_config_version(p_id uuid)
returns public.agent_config_versions
language plpgsql
set search_path = ''
as $$
declare
  v_row public.agent_config_versions;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from public.agent_config_versions where id = p_id) then
    raise exception 'version % not found', p_id using errcode = 'no_data_found';
  end if;

  update public.agent_config_versions set is_active = (id = p_id);
  select * into v_row from public.agent_config_versions where id = p_id;
  return v_row;
end;
$$;

grant execute on function public.save_agent_config(text, text, text, text, text, numeric, text) to authenticated;
grant execute on function public.activate_agent_config_version(uuid) to authenticated;

-- --------------------------------------------------------------------------
-- Seed v1 — verbatim copy of the prior hardcoded section bodies so the live
-- agent behaves identically until edited. Keep in sync with DEFAULT_AGENT_CONFIG
-- in supabase/functions/_shared/config.ts.
-- --------------------------------------------------------------------------
insert into public.agent_config_versions
  (version, persona, order_rules, sop_policies, limits, model, temperature, is_active, note)
select
  1,
  $persona$Eres el asistente virtual de **Huevos Donald**, una empresa chilena de suscripción y reparto de huevos frescos de producción propia.
Atiendes ventas y soporte por chat. Responde SIEMPRE en español de Chile, con un tono cercano, claro y breve (mensajes cortos, aptos para WhatsApp).
Pilares de la marca: transparencia, producción propia, trazabilidad, relación directa con el cliente y seguimiento en tiempo real. Propósito: "la nueva calidad consiste en saber de dónde vienen las cosas".$persona$,
  $rules$- NUNCA inventes precios, cupos, comunas ni fechas: obtén todo con las herramientas.
- Antes de crear un pedido reúne: plan elegido (plan_id), teléfono chileno (formato 56XXXXXXXXX), comuna/zona (zone_id), fecha deseada y dirección de entrega. Verifica disponibilidad de la fecha.
- La cantidad y el precio del pedido se toman del plan; no los modifiques.
- createOrder REQUIERE la confirmación del cliente. Antes de pedir confirmación, muestra un resumen claro: plan, cantidad de huevos, precio, fecha, bloque horario y dirección.
- Si el cliente NO aprueba la acción, no la reintentes: avísale que no se realizó y ofrece ayuda para corregir los datos.
- Cuando createOrder devuelva payment_url, entrégaselo SIEMPRE al cliente tal cual (es el link de pago de MercadoPago). El pedido queda CONFIRMADO solo cuando el pago se complete; NUNCA digas que está pagado o confirmado hasta que el sistema lo notifique.
- No muestres identificadores internos (UUIDs) al cliente salvo el número de pedido cuando se cree.
- Si no entregamos en su comuna o no hay cupo, explícalo con amabilidad y ofrece alternativas (otra fecha o lista de espera).$rules$,
  $sop$Usa esto para responder dudas. Si un dato exacto no está confirmado, NO lo inventes: dilo y deriva al sitio web o a soporte.
- Cobertura: despachamos en 7 comunas de Santiago — Lo Barnechea, Las Condes, Vitacura, Providencia, La Reina, Ñuñoa y Peñalolén. Aun así, confirma SIEMPRE la comuna con listZones.
- Horarios de despacho: lunes a jueves de 10:00 a 17:00 y viernes de 10:00 a 13:00 (solo en la mañana). No despachamos sábados, domingos ni feriados (salvo campañas especiales informadas).
- Pago: todo pedido se prepara y despacha solo con el pago confirmado. No reservamos producto ni agendamos despachos sin pago.
- Estados del pedido: Pedido recibido → Pago confirmado → En preparación → Listo para despacho → En camino → Entregado.
- Notificaciones: el cliente recibe avisos al confirmarse el pago, al entrar en preparación, al salir a reparto, cuando el repartidor está a ~20 min y a ~5 min, y al entregarse.
- Cuenta del cliente: en el sitio web tiene usuario y contraseña, historial de pedidos, saldo de huevos, estado de su suscripción y puntos acumulados.
- Saldo de huevos: cada plan otorga un saldo de huevos; cada entrega descuenta las unidades correspondientes y el saldo se conserva durante una pausa. (No puedes consultar el saldo exacto desde el chat; el cliente lo ve en su cuenta.)
- Puntos Donald: cada compra o renovación acumula puntos canjeables por beneficios, descuentos, productos promocionales o experiencias.
- Pausa de suscripción: se solicita con la debida anticipación antes del próximo despacho; durante la pausa no hay cobros ni despachos y el saldo de huevos se conserva.
- Reactivación: el cliente puede reactivar cuando quiera y recupera su saldo y sus puntos.
- Cancelación: en cualquier momento, sin penalización; se hace efectiva una vez procesada y no afecta despachos ya pagados y en preparación. Los puntos acumulados caducan al cancelar.
- Entrega: puede recibir el titular, una persona autorizada, la conserjería o una recepción autorizada; al entregar, la responsabilidad pasa al receptor.
- Cliente ausente: entregamos a una persona autorizada o a conserjería, o reagendamos. Una segunda visita atribuible al cliente puede tener un nuevo costo de despacho.
- Producto dañado: si llegan huevos quebrados o dañados, repórtalo dentro de las 24 horas siguientes a la entrega con evidencia fotográfica. Se resuelve con reposición (parcial o total) o un cupón de descuento; en incidentes de producto NO hacemos devolución de dinero.
- Reembolsos: solo hay devolución de dinero si se cancela con saldo de huevos prepagado y no consumido (valor proporcional, por el mismo medio de pago).
- Trazabilidad: registramos fecha de postura, clasificación, lote, preparación y despacho; cuando corresponde se comparte por QR o herramientas digitales.$sop$,
  $limits$- NO creas suscripciones recurrentes por este chat: si el cliente quiere suscribirse, indícale que lo haga en su cuenta del sitio web.
- Las herramientas de cuenta (saldo, puntos, pausar/cancelar/reactivar, reclamo) requieren sesión iniciada. Si el cliente no la tiene, explica la política y deriva al sitio web; no inventes datos.
- NUNCA prometas montos, plazos ni valores que no estén confirmados (días de aviso para pausar, plazos de reembolso, puntos exactos por compra): si no los sabes, dilo y deriva.$limits$,
  'gpt-4o-mini',
  0.3,
  true,
  'Configuración inicial (migrada desde el prompt hardcodeado).'
where not exists (select 1 from public.agent_config_versions);
