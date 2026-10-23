-- ============================================================
--  FitTrack — migración "onboarding + semana personalizada"
--
--  ¿Para quién es?  Para tu base de Supabase que YA TIENE usuarios.
--  ¿Qué hace?       Solo AGREGA columnas y amplía el trigger de registro.
--                   No borra tablas, columnas, usuarios ni datos.
--                   No cambia las políticas RLS.
--  ¿Cómo se usa?    Supabase → SQL Editor → New query → pega TODO → Run.
--                   Después ejecuta datos.sql (recarga el catálogo con
--                   los ejercicios de gimnasio y los músculos).
--  Se puede ejecutar varias veces sin problema.
-- ============================================================


-- ------------------------------------------------------------
-- 1. PERFILES: preferencias nuevas del onboarding
-- ------------------------------------------------------------
-- Dónde entrena: cambia qué ejercicios puede recibir.
alter table public.perfiles
  add column if not exists lugar text not null default 'casa'
  check (lugar in ('casa', 'gimnasio', 'ambos'));

-- Qué días entrena: 0 = lunes … 6 = domingo. Vacío (null) = se calcula con meta_semanal,
-- así los usuarios que ya existían siguen viendo su semana de siempre.
alter table public.perfiles
  add column if not exists dias_entreno smallint[]
  check (dias_entreno is null or (
    cardinality(dias_entreno) between 1 and 7
    and dias_entreno <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ));

-- Edad (opcional)
alter table public.perfiles
  add column if not exists edad smallint
  check (edad is null or edad between 14 and 100);

-- La semana generada: qué rutina toca cada día. La arma el servidor con el
-- mismo generador de siempre (rutas/rutinas.js). Máximo ~60 KB por usuario.
alter table public.perfiles
  add column if not exists plan_semanal jsonb
  check (plan_semanal is null or pg_column_size(plan_semanal) < 60000);


-- ------------------------------------------------------------
-- 2. EJERCICIOS: equipo necesario y músculos trabajados
-- ------------------------------------------------------------
-- ninguno = solo tu cuerpo · casa = silla, mesa, pared, toalla · gimnasio = máquinas y pesas
alter table public.ejercicios
  add column if not exists equipo text not null default 'ninguno'
  check (equipo in ('ninguno', 'casa', 'gimnasio'));

alter table public.ejercicios
  add column if not exists musculos text not null default '';


-- ------------------------------------------------------------
-- 3. TRIGGER DE REGISTRO: ahora también guarda lugar, días, edad y altura
--    (lo demás funciona exactamente igual que antes)
-- ------------------------------------------------------------
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  datos jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  sensibles boolean := coalesce((datos ->> 'acepta_sensibles')::boolean, false);
  dias smallint[] := null;
begin
  -- Días elegidos en el registro (si llegan bien formados)
  if jsonb_typeof(datos -> 'dias') = 'array' and jsonb_array_length(datos -> 'dias') between 1 and 7 then
    select array_agg(distinct d::smallint order by d::smallint) into dias
    from jsonb_array_elements_text(datos -> 'dias') as d
    where d ~ '^[0-6]$';
  end if;

  insert into public.perfiles (id, nombre, objetivo, nivel, minutos, meta_semanal, meta_peso,
                               lugar, dias_entreno, edad, altura_cm, terminos_fecha, sensibles_ok, sensibles_fecha)
  values (
    new.id,
    coalesce(nullif(left(datos ->> 'nombre', 60), ''), 'Atleta'),
    coalesce(datos ->> 'objetivo', 'grasa'),
    coalesce((datos ->> 'nivel')::smallint, 1),
    coalesce((datos ->> 'minutos')::smallint, 20),
    coalesce(cardinality(dias), 3),
    case when sensibles then nullif(datos ->> 'meta_peso', '')::double precision end,
    coalesce(datos ->> 'lugar', 'casa'),
    dias,
    nullif(datos ->> 'edad', '')::smallint,
    nullif(datos ->> 'altura', '')::double precision,
    now(),
    sensibles,
    case when sensibles then now() end
  )
  on conflict (id) do nothing;

  -- Si autorizó datos sensibles, su peso y medidas iniciales se guardan como primera medida
  if sensibles and (nullif(datos ->> 'peso', '') is not null or nullif(datos ->> 'cintura', '') is not null) then
    insert into public.medidas (usuario_id, fecha, peso, cintura, cadera, pecho, brazo, muslo)
    values (
      new.id,
      coalesce((datos ->> 'fecha')::date, current_date),
      nullif(datos ->> 'peso', '')::double precision,
      nullif(datos ->> 'cintura', '')::double precision,
      nullif(datos ->> 'cadera', '')::double precision,
      nullif(datos ->> 'pecho', '')::double precision,
      nullif(datos ->> 'brazo', '')::double precision,
      nullif(datos ->> 'muslo', '')::double precision
    );
  end if;

  return new;
end;
$$;
-- (El trigger "al_crear_usuario" ya apunta a esta función; no hace falta recrearlo.)
