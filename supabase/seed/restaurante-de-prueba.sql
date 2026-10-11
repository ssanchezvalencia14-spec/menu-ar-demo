-- ============================================================
-- Restaurante de prueba para el perfil de demostracion
--
-- Correr DESPUES de crear el usuario en Authentication > Users
-- (con "Auto Confirm User" marcado).
--
-- Por que un restaurante aparte y no el Demo: restaurants.owner_user_id es una
-- sola columna, asi que un restaurante tiene UN dueno. Si le asignaras el
-- usuario de prueba al Restaurante Demo, perderias el acceso a tu propio panel.
--
-- El menu publico que esta en "/" NO cambia: getPrimerSlug ordena por
-- created_at ascendente, y este restaurante se crea despues que el Demo.
-- Este queda en /prueba y el Demo sigue siendo el que se ve por defecto.
-- ============================================================

-- Si usaste otro correo al crear el usuario, cambialo en las DOS lineas de
-- abajo que dicen 'prueba@menup.test'.

do $$
declare
  v_usuario uuid;
  v_restaurante uuid;
  v_entradas uuid;
  v_principales uuid;
begin
  -- Guarda importante: si el correo no existe, el subselect daria NULL y
  -- dejaria el restaurante huerfano EN SILENCIO, invisible en el panel y sin
  -- forma de recuperarlo. Preferimos que falle con un mensaje claro.
  select id into v_usuario
  from auth.users
  where email = 'prueba@menup.test';

  if v_usuario is null then
    raise exception
      'No existe el usuario prueba@menup.test. Crealo primero en Authentication > Users con "Auto Confirm User" marcado.';
  end if;

  -- Si ya se habia corrido antes, se rehace desde cero.
  delete from restaurants where slug = 'prueba';

  insert into restaurants (slug, name, description, owner_user_id,
                           timezone, currency, locale)
  values ('prueba', 'Mi Restaurante de Prueba',
          'Local de practica: toca lo que quieras, no afecta al Demo',
          v_usuario, 'America/Bogota', 'COP', 'es-CO')
  returning id into v_restaurante;

  insert into categories (restaurant_id, name, icon, sort_order)
  values (v_restaurante, 'Entradas', 'entrada', 1)
  returning id into v_entradas;

  insert into categories (restaurant_id, name, icon, sort_order)
  values (v_restaurante, 'Principales', 'principal', 2)
  returning id into v_principales;

  insert into menu_items (restaurant_id, category_id, name, description, price,
                          model_glb_url, model_usdz_url, is_specialty, sort_order)
  values
    (v_restaurante, v_entradas, 'Entrada de prueba',
     'Plato de practica. Editalo o borralo sin miedo.', 12000,
     '/models/plato-demo.glb', '/models/plato-demo.usdz', false, 1),
    (v_restaurante, v_principales, 'Principal de prueba',
     'Plato de practica marcado como especialidad.', 35000,
     '/models/plato-demo.glb', '/models/plato-demo.usdz', true, 1);

  raise notice 'Listo. El menu quedo en /prueba y el panel en /admin.';
end $$;
