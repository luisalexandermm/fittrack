-- ============================================================
--  FitTrack — migración "calorías + sexo" (v6)
--
--  Para tu base que YA TIENE usuarios y ya ejecutó migracion-onboarding.sql.
--  Solo AGREGA columnas y actualiza el trigger de registro.
--  No borra nada y no cambia las políticas RLS.
--  Supabase → SQL Editor → New query → pega TODO → Run.
--  Después ejecuta datos.sql (trae los 41 ejercicios nuevos).
--  Se puede ejecutar varias veces sin problema.
-- ============================================================

-- Sexo (opcional): solo se usa para estimar el % de grasa con la cintura
-- y el peso de referencia de las calorías si aún no registraste tu peso.
alter table public.perfiles
  add column if not exists sexo text
  check (sexo is null or sexo in ('hombre', 'mujer', 'otro'));

-- Metas de entrenamiento y días asignados a cada una.
alter table public.perfiles
  add column if not exists objetivos_dias jsonb
  check (objetivos_dias is null or (jsonb_typeof(objetivos_dias) = 'object' and pg_column_size(objetivos_dias) < 2000));

-- Calorías estimadas de cada sesión (MET × peso × tiempo). Se calcula en el servidor.
alter table public.sesiones
  add column if not exists kcal smallint
  check (kcal is null or kcal between 0 and 5000);


-- Trigger de registro: igual que antes, y ahora también guarda el sexo
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
  objetivos jsonb := datos -> 'objetivos_dias';
begin
  -- Días elegidos en el registro (si llegan bien formados)
  if jsonb_typeof(datos -> 'dias') = 'array' and jsonb_array_length(datos -> 'dias') between 1 and 7 then
    select array_agg(distinct d::smallint order by d::smallint) into dias
    from jsonb_array_elements_text(datos -> 'dias') as d
    where d ~ '^[0-6]$';
  end if;
  if coalesce(jsonb_typeof(objetivos), '') <> 'object' then
    objetivos := jsonb_build_object(coalesce(datos ->> 'objetivo', 'grasa'), to_jsonb(dias));
  end if;

  insert into public.perfiles (id, nombre, objetivo, objetivos_dias, nivel, minutos, meta_semanal, meta_peso,
                               lugar, dias_entreno, edad, altura_cm, sexo, terminos_fecha, sensibles_ok, sensibles_fecha)
  values (
    new.id,
    coalesce(nullif(left(datos ->> 'nombre', 60), ''), 'Atleta'),
    coalesce(datos ->> 'objetivo', 'grasa'),
    objetivos,
    coalesce((datos ->> 'nivel')::smallint, 1),
    coalesce((datos ->> 'minutos')::smallint, 20),
    coalesce(cardinality(dias), 3),
    case when sensibles then nullif(datos ->> 'meta_peso', '')::double precision end,
    coalesce(datos ->> 'lugar', 'casa'),
    dias,
    nullif(datos ->> 'edad', '')::smallint,
    nullif(datos ->> 'altura', '')::double precision,
    case when datos ->> 'sexo' in ('hombre', 'mujer', 'otro') then datos ->> 'sexo' end,
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

-- (El trigger "al_crear_usuario" ya apunta a esta función.)
