-- ============================================================
-- Copia la carta del Restaurante Demo a tu restaurante
-- ============================================================
--
-- Para que sirve: cuando creas un restaurante desde la pantalla de bienvenida
-- del panel, nace vacio. Es lo correcto (un local real carga su propia carta),
-- pero deja el panel sin nada que mirar ni con que probar.
--
-- Esto le copia las 4 secciones y los 15 platos del Demo, incluidos los
-- modelos 3D, para que puedas probar todas las pantallas con contenido.
--
-- Es seguro correrlo mas de una vez: primero borra las secciones del destino.
-- OJO: al borrar una seccion se borran sus platos (la clave foranea es
-- ON DELETE CASCADE). Si ya cargaste platos propios, se pierden.
--
-- Pegar en: Supabase > SQL Editor > New query > Run

do $$
declare
  -- Cambia 'menu' si tu restaurante tiene otra direccion web.
  v_slug_destino text := 'menu';
  v_slug_origen  text := 'demo';

  v_destino uuid;
  v_origen  uuid;
  v_copiadas int;
  v_platos   int;
begin
  select id into v_destino from restaurants where slug = v_slug_destino;
  select id into v_origen  from restaurants where slug = v_slug_origen;

  -- Avisar en vez de seguir: sin esto, un slug mal escrito haria un DELETE
  -- con `restaurant_id = null`, que no borra nada, y despues un INSERT que
  -- falla por la clave foranea. El mensaje de Postgres no diria por que.
  if v_destino is null then
    raise exception 'No existe ningun restaurante con la direccion "%". Miralo en el panel, en Mi local.', v_slug_destino;
  end if;
  if v_origen is null then
    raise exception 'No existe el restaurante de origen "%".', v_slug_origen;
  end if;
  if v_destino = v_origen then
    raise exception 'El origen y el destino son el mismo restaurante.';
  end if;

  delete from categories where restaurant_id = v_destino;

  -- Las secciones se copian con su orden e icono. El id es nuevo: son filas
  -- del restaurante destino, no referencias a las del Demo.
  insert into categories (restaurant_id, name, icon, sort_order)
  select v_destino, c.name, c.icon, c.sort_order
  from categories c
  where c.restaurant_id = v_origen;

  get diagnostics v_copiadas = row_count;

  -- Los platos se enganchan a la seccion NUEVA que tiene el mismo nombre.
  insert into menu_items (
    restaurant_id, category_id, name, description, price,
    image_url, model_glb_url, model_usdz_url,
    is_specialty, is_available, sort_order
  )
  select
    v_destino,
    destino.id,
    p.name, p.description, p.price,
    p.image_url, p.model_glb_url, p.model_usdz_url,
    p.is_specialty, p.is_available, p.sort_order
  from menu_items p
  join categories origen  on origen.id = p.category_id
  join categories destino on destino.restaurant_id = v_destino
                         and destino.name = origen.name
  where p.restaurant_id = v_origen;

  get diagnostics v_platos = row_count;

  raise notice 'Listo: % secciones y % platos copiados a "%".',
    v_copiadas, v_platos, v_slug_destino;
end $$;
