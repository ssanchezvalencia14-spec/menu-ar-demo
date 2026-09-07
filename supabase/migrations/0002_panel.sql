-- Panel de administracion (Parte 4)
--
-- Agrega: dueno del restaurante, horarios estructurados, zona horaria,
-- direccion, politicas de escritura y el bucket de archivos.
--
-- Lo que NO hace falta migrar: la tabla `categories` y `menu_items.category_id`
-- ya existen desde 0001. Nunca hubo categorias como texto libre.

-- ------------------------------------------------- Columnas nuevas ---

alter table restaurants
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null,
  add column if not exists address       text,
  -- Sin esto, "Abierto ahora" se calcularia contra el reloj del servidor
  -- (UTC en Vercel) y mostraria "Cerrado" en plena cena colombiana.
  add column if not exists timezone      text not null default 'America/Bogota',
  add column if not exists hours         jsonb;

-- Un usuario administra un restaurante.
create unique index if not exists restaurants_owner_idx
  on restaurants (owner_user_id)
  where owner_user_id is not null;

-- Horario por defecto, tomado del texto libre que habia antes.
update restaurants
set hours = '{
  "lunes":     {"abre":"12:00","cierra":"23:00","cerrado":false},
  "martes":    {"abre":"12:00","cierra":"23:00","cerrado":false},
  "miercoles": {"abre":"12:00","cierra":"23:00","cerrado":false},
  "jueves":    {"abre":"12:00","cierra":"23:00","cerrado":false},
  "viernes":   {"abre":"12:00","cierra":"23:00","cerrado":false},
  "sabado":    {"abre":"12:00","cierra":"23:00","cerrado":false},
  "domingo":   {"abre":"12:00","cierra":"23:00","cerrado":false}
}'::jsonb
where hours is null;

alter table restaurants alter column hours set not null;

-- Con NOT NULL pero sin default, crear un restaurante desde la pantalla de
-- bienvenida fallaba: el alta de un cliente nuevo no manda el horario.
alter table restaurants
  alter column hours set default '{
    "lunes":     {"abre":"12:00","cierra":"23:00","cerrado":false},
    "martes":    {"abre":"12:00","cierra":"23:00","cerrado":false},
    "miercoles": {"abre":"12:00","cierra":"23:00","cerrado":false},
    "jueves":    {"abre":"12:00","cierra":"23:00","cerrado":false},
    "viernes":   {"abre":"12:00","cierra":"23:00","cerrado":false},
    "sabado":    {"abre":"12:00","cierra":"23:00","cerrado":false},
    "domingo":   {"abre":"12:00","cierra":"23:00","cerrado":false}
  }'::jsonb;

-- `schedule` (texto libre) queda por compatibilidad pero ya no se usa:
-- el header publico ahora arma la leyenda desde `hours`.
comment on column restaurants.schedule is
  'OBSOLETO desde 0002. El horario real vive en hours (jsonb).';

-- --------------------------------------- Adopcion del restaurante demo ---

-- OJO: esto se revierte en 0003. Sirvio una sola vez, para pasarle el
-- restaurante demo al primer usuario. Si estas montando el proyecto de cero,
-- podes saltear este bloque: 0003 lo borra igual.
--
-- Cuando se crea el primer usuario, hereda el restaurante que quedo sin dueno.
create or replace function adoptar_restaurante_huerfano()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update restaurants
  set owner_user_id = new.id
  where id = (
    select id from restaurants
    where owner_user_id is null
    order by created_at
    limit 1
  );
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function adoptar_restaurante_huerfano();

-- --------------------------------------------- Politicas de escritura ---

-- Quien puede tocar este restaurante. Se usa en las politicas de las tablas
-- hijas, que no tienen owner_user_id propio.
create or replace function es_dueno(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from restaurants
    where id = p_restaurant_id
      and owner_user_id = auth.uid()
  );
$$;

grant execute on function es_dueno(uuid) to authenticated;

-- Las politicas de lectura publica de 0001 se mantienen intactas: el comensal
-- no esta autenticado y tiene que poder ver el menu.

drop policy if exists "el dueno edita" on restaurants;
create policy "el dueno edita" on restaurants
  for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "el dueno administra" on categories;
create policy "el dueno administra" on categories
  for all to authenticated
  using (es_dueno(restaurant_id))
  with check (es_dueno(restaurant_id));

drop policy if exists "el dueno administra" on menu_items;
create policy "el dueno administra" on menu_items
  for all to authenticated
  using (es_dueno(restaurant_id))
  with check (es_dueno(restaurant_id));

-- ------------------------------------------------------ Almacenamiento ---

insert into storage.buckets (id, name, public)
values ('menu', 'menu', true)
on conflict (id) do nothing;

-- Las fotos y los modelos se sirven al comensal sin autenticar.
drop policy if exists "lectura publica del bucket menu" on storage.objects;
create policy "lectura publica del bucket menu" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'menu');

-- Cada restaurante solo escribe dentro de su carpeta: menu/{restaurant_id}/...
drop policy if exists "el dueno sube a su carpeta" on storage.objects;
create policy "el dueno sube a su carpeta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'menu'
    and es_dueno(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "el dueno reemplaza en su carpeta" on storage.objects;
create policy "el dueno reemplaza en su carpeta" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'menu'
    and es_dueno(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "el dueno borra de su carpeta" on storage.objects;
create policy "el dueno borra de su carpeta" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'menu'
    and es_dueno(((storage.foldername(name))[1])::uuid)
  );

-- Un usuario autenticado puede crear su restaurante, siempre poniendose a si
-- mismo como dueno. El indice unico sobre owner_user_id impide que tenga dos.
drop policy if exists "el dueno crea el suyo" on restaurants;
create policy "el dueno crea el suyo" on restaurants
  for insert to authenticated
  with check (owner_user_id = auth.uid());
