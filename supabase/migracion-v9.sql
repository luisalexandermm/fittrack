-- ============================================================
--  FitTrack — migración "recordatorios + asistente" (v9)
--
--  Para tu base que YA TIENE usuarios (ejecutaste antes las otras migraciones).
--  Solo AGREGA dos tablas nuevas y una función. No toca las tablas
--  que ya existen ni sus políticas RLS.
--  Supabase → SQL Editor → New query → pega TODO → Run.
--  Después ejecuta datos.sql (trae los ejercicios nuevos).
--  Se puede ejecutar varias veces sin problema.
-- ============================================================

-- ---------- Recordatorios: dónde mandar las notificaciones ----------
-- Un registro por cada celular o navegador donde el usuario activó los recordatorios.
-- Son las "llaves" que da el navegador para recibir notificaciones push (no son datos personales sensibles).
create table if not exists public.suscripciones_push (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint    text not null unique check (char_length(endpoint) <= 1000),
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  creado_en   timestamptz not null default now()
);
create index if not exists suscripciones_push_usuario on public.suscripciones_push (usuario_id);

alter table public.suscripciones_push enable row level security;
drop policy if exists "push_ver" on public.suscripciones_push;
create policy "push_ver" on public.suscripciones_push for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists "push_crear" on public.suscripciones_push;
create policy "push_crear" on public.suscripciones_push for insert to authenticated with check (usuario_id = (select auth.uid()));
drop policy if exists "push_borrar" on public.suscripciones_push;
create policy "push_borrar" on public.suscripciones_push for delete to authenticated using (usuario_id = (select auth.uid()));
-- Permisos mínimos (como el resto de tablas): ver, crear y borrar; nunca editar
revoke all on public.suscripciones_push from anon, authenticated;
grant select, insert, delete on public.suscripciones_push to authenticated;
grant usage, select on sequence public.suscripciones_push_id_seq to authenticated;

-- ---------- Asistente: cuántas preguntas hizo cada usuario cada día ----------
-- Solo guarda el número (para el límite diario), NUNCA el texto de las preguntas.
create table if not exists public.uso_asistente (
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null,
  preguntas   smallint not null default 0 check (preguntas between 0 and 10000),
  primary key (usuario_id, fecha)
);

alter table public.uso_asistente enable row level security;
-- El usuario solo puede LEER su contador. Sumar se hace con la función de abajo,
-- así nadie puede ponerse el contador en cero desde fuera de la app.
drop policy if exists "uso_asistente_ver" on public.uso_asistente;
create policy "uso_asistente_ver" on public.uso_asistente for select to authenticated using (usuario_id = (select auth.uid()));
revoke all on public.uso_asistente from anon, authenticated;
grant select on public.uso_asistente to authenticated;

-- Suma 1 pregunta al contador de HOY (hora de Colombia) y devuelve el total del día.
create or replace function public.contar_pregunta_asistente()
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.uso_asistente (usuario_id, fecha, preguntas)
  values (auth.uid(), (now() at time zone 'America/Bogota')::date, 1)
  on conflict (usuario_id, fecha) do update set preguntas = public.uso_asistente.preguntas + 1
  returning preguntas;
$$;
revoke all on function public.contar_pregunta_asistente() from public, anon;
grant execute on function public.contar_pregunta_asistente() to authenticated;
