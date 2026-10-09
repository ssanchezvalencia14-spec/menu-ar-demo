-- Oculta `restaurants.owner_user_id` al rol anonimo, de verdad esta vez.
--
-- La migracion 0004 intento esto con:
--
--     revoke select (owner_user_id) on restaurants from anon;
--
-- y eso es un no-op. En Postgres, si el rol ya tiene SELECT sobre la tabla
-- entera, el permiso amplio gana y el revoke por columna no cambia nada. Hay
-- que quitar primero el de tabla y despues otorgar las columnas una por una.
--
-- CONDICION PARA QUE ESTO FUNCIONE: las consultas publicas tienen que pedir
-- columnas explicitas. PostgREST traduce `select=*` a un `SELECT *`, que exige
-- permiso sobre la tabla completa y haria fallar el menu entero con un 500.
-- Por eso `src/lib/menu.ts` define COLUMNAS_PUBLICAS_DEL_RESTAURANTE y lo usa
-- en getMenu() y getPlato(). Si alguien vuelve a poner `select("*")` ahi, el
-- menu publico se cae.
--
-- `authenticated` conserva el permiso completo: el panel necesita buscar el
-- restaurante por su owner_user_id.

revoke select on restaurants from anon;

grant select (
  id, slug, name, description, logo_url, address,
  hours, timezone, currency, locale, created_at, schedule
) on restaurants to anon;
