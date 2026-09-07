-- Quita la adopcion automatica de restaurantes sin dueno.
--
-- El trigger de 0002 existia para una sola cosa: pasarle el restaurante demo
-- al primer usuario que se creara. Ya cumplio.
--
-- Dejarlo armado era un riesgo: si alguna vez se vuelve a correr el seed, el
-- restaurante queda sin dueno, y el proximo usuario que se registre se lo
-- queda solo. Con el registro de usuarios abierto, ese usuario podria ser
-- cualquiera.
--
-- Desde ahora la propiedad de un restaurante se asigna de forma explicita:
-- el dueno lo crea desde /admin/bienvenida, o se asigna a mano con
--
--   update restaurants set owner_user_id = (
--     select id from auth.users where email = 'correo@del.cliente'
--   ) where slug = 'su-local';

drop trigger if exists al_crear_usuario on auth.users;
drop function if exists adoptar_restaurante_huerfano();
