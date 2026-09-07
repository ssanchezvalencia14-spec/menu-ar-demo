-- Menu virtual con AR - esquema inicial (Parte 2)
--
-- Aplicar una sola vez sobre un proyecto de Supabase vacio.
-- Es idempotente: se puede volver a correr sin romper nada.

-- ---------------------------------------------------------------- Tablas ---

create table if not exists restaurants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  logo_url    text,
  schedule    text,
  currency    text not null default 'COP',
  locale      text not null default 'es-CO',
  created_at  timestamptz not null default now()
);

create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name          text not null,
  -- Controla el icono del placeholder de foto en la interfaz.
  icon          text not null default 'principal'
                check (icon in ('entrada', 'principal', 'postre', 'bebida')),
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table if not exists menu_items (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references restaurants (id) on delete cascade,
  category_id    uuid not null references categories (id) on delete cascade,
  name           text not null,
  description    text,
  -- Entero, sin decimales: el formateo de precios de la app usa 0 decimales.
  price          int  not null check (price >= 0),
  image_url      text,
  model_glb_url  text,
  model_usdz_url text,
  is_specialty   boolean not null default false,
  is_available   boolean not null default true,
  sort_order     int     not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items (id) on delete cascade,
  rating       int  not null check (rating between 1 and 5),
  comment      text check (char_length(comment) <= 500),
  created_at   timestamptz not null default now()
);

-- Un registro por cada toque en "Ver en tu mesa".
create table if not exists item_views (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items (id) on delete cascade,
  viewed_at    timestamptz not null default now()
);

-- --------------------------------------------------------------- Indices ---

create index if not exists menu_items_orden_idx
  on menu_items (restaurant_id, category_id, sort_order);

create index if not exists reviews_item_idx
  on reviews (menu_item_id);

-- El indice que sostiene el ranking semanal.
create index if not exists item_views_item_fecha_idx
  on item_views (menu_item_id, viewed_at desc);

-- ---------------------------------------------- Vista de calificaciones ---

-- security_invoker: la vista respeta el RLS de las tablas de abajo en vez de
-- correr con los permisos del duenio. Sin esto seria un agujero de seguridad.
create or replace view menu_item_ratings
with (security_invoker = true) as
select
  mi.id                                         as menu_item_id,
  coalesce(round(avg(r.rating)::numeric, 1), 0) as average_rating,
  count(r.id)                                   as review_count
from menu_items mi
left join reviews r on r.menu_item_id = mi.id
group by mi.id;

-- ------------------------------------------------- Ranking de la semana ---

-- item_views no tiene SELECT publico, asi que esta funcion es SECURITY DEFINER:
-- expone el conteo agregado sin exponer el historial de vistas crudo.
create or replace function get_weekly_top_items(
  p_restaurant_id uuid,
  p_days          int default 7,
  p_limit         int default 3
)
returns table (menu_item_id uuid, view_count bigint)
language sql
security definer
set search_path = public
as $$
  select iv.menu_item_id, count(*) as view_count
  from item_views iv
  join menu_items mi on mi.id = iv.menu_item_id
  where mi.restaurant_id = p_restaurant_id
    and mi.is_available
    and iv.viewed_at >= now() - make_interval(days => p_days)
  group by iv.menu_item_id
  order by view_count desc, iv.menu_item_id
  limit p_limit;
$$;

-- ------------------------------------------------------------------ RLS ---

alter table restaurants enable row level security;
alter table categories  enable row level security;
alter table menu_items  enable row level security;
alter table reviews     enable row level security;
alter table item_views  enable row level security;

-- La anon key viaja al navegador y es publica por diseno. Estas politicas son
-- lo unico que impide que cualquiera borre el menu desde la consola del browser.

drop policy if exists "lectura publica" on restaurants;
create policy "lectura publica" on restaurants
  for select to anon, authenticated using (true);

drop policy if exists "lectura publica" on categories;
create policy "lectura publica" on categories
  for select to anon, authenticated using (true);

drop policy if exists "lectura publica" on menu_items;
create policy "lectura publica" on menu_items
  for select to anon, authenticated using (true);

drop policy if exists "lectura publica" on reviews;
create policy "lectura publica" on reviews
  for select to anon, authenticated using (true);

-- Resenas: cualquiera puede dejar una, nadie puede editarla ni borrarla.
drop policy if exists "alta publica" on reviews;
create policy "alta publica" on reviews
  for insert to anon, authenticated with check (
    rating between 1 and 5
    and (comment is null or char_length(comment) <= 500)
  );

-- Vistas: solo se pueden insertar. No hay SELECT publico a proposito.
drop policy if exists "alta publica" on item_views;
create policy "alta publica" on item_views
  for insert to anon, authenticated with check (true);

grant execute on function get_weekly_top_items(uuid, int, int) to anon, authenticated;
