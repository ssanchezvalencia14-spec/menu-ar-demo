-- Cierra tres fugas encontradas en la revision de seguridad.
--
-- Contexto: la anon key viaja al navegador, asi que cualquiera puede consultar
-- la API REST de Supabase directamente. Todo lo que las politicas dejen leer,
-- se puede leer sin pasar por nuestra aplicacion.

-- ---------------------------------------------------- 1. Platos pausados ---

-- La politica anterior era `using (true)`: devolvia TODOS los platos de TODOS
-- los restaurantes, incluidos los pausados. Pausar un plato lo saca del menu
-- que dibuja la app, pero seguia siendo visible con una consulta directa.
-- Para un restaurante eso significa que un competidor podia ver que platos
-- retiro y a que precio los tenia.
--
-- El dueno sigue viendo los suyos, disponibles o no, por la politica
-- "el dueno administra": las politicas se combinan con OR.
drop policy if exists "lectura publica" on menu_items;
create policy "lectura publica" on menu_items
  for select to anon, authenticated
  using (is_available);

-- --------------------------------------------- 2. Identificador del dueno ---

-- `restaurants` tiene que seguir siendo de lectura publica (es el menu), pero
-- `owner_user_id` es el id interno del usuario en auth.users y no tiene por que
-- cruzar esa frontera. Se quita el permiso a nivel de columna: PostgREST lo
-- respeta y deja de devolverla a quien no esta autenticado.
revoke select (owner_user_id) on restaurants from anon;

-- ------------------------------------------- 3. Archivos que se pueden subir ---

-- La politica de storage solo comprobaba la carpeta, no el tipo de archivo. La
-- validacion de extensiones vive en el componente de React, y eso es codigo del
-- cliente: se puede saltear llamando a la API de Storage directamente.
--
-- Sin este limite, una cuenta de restaurante podia dejar un .html o un .svg con
-- script en un bucket publico, servido desde el dominio de Supabase, y usarlo
-- para alojar phishing con una URL de apariencia confiable.
--
-- SVG queda FUERA de la lista a proposito, aunque sea un formato de imagen: un
-- .svg puede llevar <script> adentro y se ejecuta si alguien abre el archivo
-- directamente en una pestana. Para un logo de restaurante, png o webp alcanzan.
update storage.buckets
set allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp',
      'model/gltf-binary', 'model/vnd.usdz+zip'
    ],
    file_size_limit = 20971520  -- 20 MB
where id = 'menu';
