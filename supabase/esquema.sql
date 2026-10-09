-- ============================================================
--  FitTrack — esquema para Supabase (PostgreSQL)
--  Cómo usarlo: Supabase → SQL Editor → New query → pega TODO este
--  archivo → Run. Después haz lo mismo con datos.sql.
--  Se puede ejecutar varias veces sin romper nada.
-- ============================================================


-- ============================================================
-- 1. PERFILES (un perfil por cada usuario de Supabase Auth)
-- ============================================================
create table if not exists public.perfiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  nombre           text not null check (char_length(nombre) between 1 and 60),
  objetivo         text not null default 'grasa' check (objetivo in ('grasa', 'musculo', 'resistencia', 'movilidad')),
  objetivos_dias   jsonb check (objetivos_dias is null or (jsonb_typeof(objetivos_dias) = 'object' and pg_column_size(objetivos_dias) < 2000)),
  nivel            smallint not null default 1 check (nivel between 1 and 3),
  minutos          smallint not null default 20 check (minutos between 10 and 60),
  meta_semanal     smallint not null default 3 check (meta_semanal between 1 and 7),
  altura_cm        double precision check (altura_cm is null or altura_cm between 50 and 260),
  meta_peso        double precision check (meta_peso is null or meta_peso between 20 and 400),
  terminos_fecha   timestamptz,                         -- cuándo aceptó términos y política de datos
  sensibles_ok     boolean not null default false,      -- autorizó datos sensibles (peso, medidas, fotos)
  sensibles_fecha  timestamptz,
  creado_en        timestamptz not null default now()
);


-- ============================================================
-- 2. CATÁLOGOS (iguales para todos; se llenan con datos.sql)
-- ============================================================
create table if not exists public.ejercicios (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  grupo       text not null,
  nivel       smallint not null,
  objetivos   text not null,
  fase        text not null,
  descripcion text not null
);

create table if not exists public.recetas (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  tipo         text not null check (tipo in ('desayuno', 'almuerzo', 'cena', 'snack')),
  objetivos    text not null,
  kcal         integer not null,
  proteina     integer not null,
  minutos      integer not null,
  descripcion  text not null,
  ingredientes jsonb not null,
  pasos        jsonb not null
);

create table if not exists public.consejos (
  id        bigint generated always as identity primary key,
  categoria text not null,
  texto     text not null
);


-- ============================================================
-- 3. DATOS DE CADA USUARIO
--    usuario_id toma solo el id de quien está conectado (auth.uid()).
--    Si se borra el usuario, se borra todo lo suyo (on delete cascade).
-- ============================================================
create table if not exists public.rutinas (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre      text not null check (char_length(nombre) <= 80),
  objetivo    text not null,
  nivel       smallint not null,
  minutos     smallint not null,
  contenido   jsonb not null,
  creado_en   timestamptz not null default now()
);

create table if not exists public.sesiones (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rutina_id   bigint references public.rutinas (id) on delete set null,
  nombre      text not null check (char_length(nombre) <= 80),
  objetivo    text not null,
  minutos     integer not null check (minutos between 1 and 600),
  sensacion   smallint check (sensacion between 1 and 5),
  notas       text check (char_length(notas) <= 500),
  fecha       date not null default current_date
);

create table if not exists public.medidas (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null default current_date,
  peso        double precision check (peso > 0 and peso < 1000),
  cintura     double precision check (cintura > 0 and cintura < 1000),
  cadera      double precision check (cadera > 0 and cadera < 1000),
  pecho       double precision check (pecho > 0 and pecho < 1000),
  brazo       double precision check (brazo > 0 and brazo < 1000),
  muslo       double precision check (muslo > 0 and muslo < 1000),
  grasa       double precision check (grasa > 0 and grasa < 100),
  notas       text check (char_length(notas) <= 300)
);

create table if not exists public.fotos (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  archivo     text not null,          -- ruta dentro del bucket "fotos": <usuario_id>/<nombre>.jpg
  fecha       date not null default current_date,
  angulo      text not null default 'frente' check (angulo in ('frente', 'lado', 'espalda')),
  nota        text check (char_length(nota) <= 200)
);

-- Columnas que se agregaron con el onboarding (lugar, días, edad, semana,
-- equipo y músculos). "if not exists" permite ejecutar esto sobre una base vieja.
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

alter table public.perfiles
  add column if not exists objetivos_dias jsonb
  check (objetivos_dias is null or (jsonb_typeof(objetivos_dias) = 'object' and pg_column_size(objetivos_dias) < 2000));


-- ninguno = solo tu cuerpo · casa = silla, mesa, pared, toalla · gimnasio = máquinas y pesas
alter table public.ejercicios
  add column if not exists equipo text not null default 'ninguno'
  check (equipo in ('ninguno', 'casa', 'gimnasio'));

alter table public.ejercicios
  add column if not exists musculos text not null default '';



-- Sexo (opcional): solo se usa para estimar el % de grasa con la cintura
-- y el peso de referencia de las calorías si aún no registraste tu peso.
alter table public.perfiles
  add column if not exists sexo text
  check (sexo is null or sexo in ('hombre', 'mujer', 'otro'));

-- Calorías estimadas de cada sesión (MET × peso × tiempo). Se calcula en el servidor.
alter table public.sesiones
  add column if not exists kcal smallint
  check (kcal is null or kcal between 0 and 5000);

create index if not exists rutinas_usuario_idx  on public.rutinas  (usuario_id);
create index if not exists sesiones_usuario_idx on public.sesiones (usuario_id, fecha desc);
create index if not exists medidas_usuario_idx  on public.medidas  (usuario_id, fecha);
create index if not exists fotos_usuario_idx    on public.fotos    (usuario_id, fecha desc);


-- ============================================================
-- 4. PERFIL AUTOMÁTICO AL REGISTRARSE
--    Cuando Supabase Auth crea un usuario, este trigger crea su perfil
--    con los datos que mandó el formulario de registro.
-- ============================================================
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

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();


-- ============================================================
-- 5. SEGURIDAD POR FILAS (RLS)
--    Aunque alguien consiga la llave pública, la base solo le deja
--    ver y cambiar SUS propias filas.
-- ============================================================
alter table public.perfiles   enable row level security;
alter table public.ejercicios enable row level security;
alter table public.recetas    enable row level security;
alter table public.consejos   enable row level security;
alter table public.rutinas    enable row level security;
alter table public.sesiones   enable row level security;
alter table public.medidas    enable row level security;
alter table public.fotos      enable row level security;

-- Catálogos: cualquiera puede leerlos, nadie los modifica desde la app
drop policy if exists "catalogo_ejercicios" on public.ejercicios;
create policy "catalogo_ejercicios" on public.ejercicios for select to anon, authenticated using (true);
drop policy if exists "catalogo_recetas" on public.recetas;
create policy "catalogo_recetas" on public.recetas for select to anon, authenticated using (true);
drop policy if exists "catalogo_consejos" on public.consejos;
create policy "catalogo_consejos" on public.consejos for select to anon, authenticated using (true);

-- Perfil: ver y editar solo el propio (se crea con el trigger y se borra con la cuenta)
drop policy if exists "perfil_ver" on public.perfiles;
create policy "perfil_ver" on public.perfiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "perfil_editar" on public.perfiles;
create policy "perfil_editar" on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Rutinas y sesiones: todo sobre las propias
drop policy if exists "rutinas_propias" on public.rutinas;
create policy "rutinas_propias" on public.rutinas for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
drop policy if exists "sesiones_propias" on public.sesiones;
create policy "sesiones_propias" on public.sesiones for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

-- Medidas y fotos (datos sensibles): ver y borrar siempre las propias;
-- CREAR o CAMBIAR solo si el usuario autorizó el tratamiento de datos sensibles.
drop policy if exists "medidas_ver" on public.medidas;
create policy "medidas_ver" on public.medidas for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists "medidas_borrar" on public.medidas;
create policy "medidas_borrar" on public.medidas for delete to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists "medidas_crear" on public.medidas;
create policy "medidas_crear" on public.medidas for insert to authenticated
  with check (
    usuario_id = (select auth.uid())
    and exists (select 1 from public.perfiles p where p.id = (select auth.uid()) and p.sensibles_ok)
  );

drop policy if exists "fotos_ver" on public.fotos;
create policy "fotos_ver" on public.fotos for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists "fotos_borrar" on public.fotos;
create policy "fotos_borrar" on public.fotos for delete to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists "fotos_crear" on public.fotos;
create policy "fotos_crear" on public.fotos for insert to authenticated
  with check (
    usuario_id = (select auth.uid())
    and exists (select 1 from public.perfiles p where p.id = (select auth.uid()) and p.sensibles_ok)
  );

-- Permisos de la API de Supabase sobre cada tabla 
grant select on public.ejercicios, public.recetas, public.consejos to anon, authenticated;
grant select, update on public.perfiles to authenticated;
grant select, insert, update, delete on public.rutinas, public.sesiones to authenticated;
grant select, insert, delete on public.medidas, public.fotos to authenticated;
grant usage, select on all sequences in schema public to authenticated;


-- ============================================================
-- 6. STORAGE: bucket PRIVADO para las fotos de progreso
--    Cada usuario solo puede tocar su carpeta: fotos/<su id>/...
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos_storage_ver" on storage.objects;
create policy "fotos_storage_ver" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "fotos_storage_subir" on storage.objects;
create policy "fotos_storage_subir" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.perfiles p where p.id = (select auth.uid()) and p.sensibles_ok)
  );

drop policy if exists "fotos_storage_borrar" on storage.objects;
create policy "fotos_storage_borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
