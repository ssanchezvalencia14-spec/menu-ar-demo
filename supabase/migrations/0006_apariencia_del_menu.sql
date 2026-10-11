-- ============================================================
-- Apariencia del menu, configurable por cada restaurante
-- ============================================================
--
-- Se guarda en UNA columna jsonb en vez de una columna por ajuste. Motivo: el
-- conjunto de opciones va a crecer, y cada opcion nueva como columna significa
-- una migracion mas, un GRANT mas y un lugar mas donde olvidarse. El jsonb lo
-- lee y escribe la aplicacion entera como un solo objeto.
--
-- El DEFAULT no es un lujo: `hours` ya rompio el alta de un restaurante nuevo
-- por ser NOT NULL sin valor por defecto. Esta columna arranca con el aspecto
-- actual del menu, asi que los restaurantes que ya existen no cambian de cara.

alter table restaurants
  add column if not exists tema jsonb not null default jsonb_build_object(
    'acento', 'ambar',
    'distribucion', 'grilla',
    'esquinas', 'redondeadas'
  );

comment on column restaurants.tema is
  'Apariencia del menu publico: acento, distribucion y esquinas. Lo edita el dueno desde /admin/apariencia.';

-- ------------------------------------------------------------------------
-- PASO QUE ES FACIL OLVIDAR
--
-- La migracion 0005 quito el SELECT sobre la tabla entera y lo reemplazo por
-- permisos columna por columna. Eso significa que una columna nueva NO es
-- visible para el publico hasta que se la agregue explicitamente aca.
--
-- Sin esta linea el menu no se cae: simplemente ignora el tema y todos los
-- restaurantes se ven iguales, que es un sintoma mucho mas dificil de rastrear
-- que un error.
-- ------------------------------------------------------------------------

grant select (tema) on restaurants to anon;
