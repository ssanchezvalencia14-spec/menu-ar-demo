# Guia para el equipo

Como arrancar, como trabajar y que cosas de este proyecto no son obvias y
cuestan horas si se descubren solas.

El README explica **que hace** el producto y como esta armado. Este archivo
explica **como trabajar en el**. Conviene leer los dos, en ese orden.

---

## 1. Arrancar en tu maquina

### Requisitos

- **Node 24.** No es un capricho: `@supabase/*` 2.115+ pide `node >=22`, y el
  despliegue corre con 24. Usar una version menor da errores que no se parecen
  a su causa.
- Una cuenta de GitHub (el repositorio es publico, pero para subir cambios hace
  falta permiso de escritura).

### Pasos

```bash
git clone https://github.com/ssanchezvalencia14-spec/menu-ar-demo.git
cd menu-ar-demo
npm install
```

Despues copiar `.env.example` a `.env.local` y completar dos valores:

| Variable | De donde sale |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | se la pide al responsable del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |

**La anon key no es un secreto.** Viaja al navegador de cada comensal: esta
dentro del JavaScript que descarga cualquiera que abra el menu. Lo que protege
los datos son las politicas de RLS de la base, no esa clave. Se puede compartir
por el canal interno del equipo sin drama.

**`SUPABASE_SERVICE_ROLE_KEY` si es secreta** y saltea todo el RLS. Solo hace
falta para `npm run seed`. Si no vas a resembrar la base, dejala vacia.

```bash
npm run dev
```

Abre http://localhost:3000

### Ojo: la base es compartida

Por ahora todo el equipo apunta al **mismo proyecto de Supabase que produccion**.
Es lo mas simple para empezar, pero significa que si entras al panel y pausas un
plato, eso se ve en el menu real al instante. No hay entorno de pruebas
separado.

Si vas a tocar datos, usa el restaurante **`menu`**, que es el de practica.
**No toques `demo`**: es el que se usa para mostrarle el producto a clientes, y
sus vistas y resenas son las que hacen que aparezca el ranking.

Cuando el equipo crezca, conviene que cada uno tenga su propio proyecto de
Supabase gratuito y corra las migraciones ahi. Ver la seccion 4.

---

## 2. Como trabajar

### No commitear directo a `main`

```bash
git switch -c descripcion-corta-del-cambio
# ... trabajar ...
npm run lint      # tiene que pasar sin errores
npx tsc --noEmit  # tiene que pasar sin errores
npm run build     # tiene que compilar
git push -u origin descripcion-corta-del-cambio
```

Y abrir un Pull Request.

### Antes de dar por terminado un cambio

El build pasando **no alcanza**. En este proyecto ya hubo tres fallas que
compilaban perfecto y solo aparecian al abrir la pagina:

- un archivo `"use server"` que exportaba una constante,
- `next/image` sin `remotePatterns`, que tiraba 500 en cuanto un plato tenia foto,
- una columna nueva que rompia el detalle del plato.

**Abri la pagina en el navegador y probá el flujo completo.** Si tocaste algo
del menu publico, probá el menu **y** el detalle de un plato: comparten codigo.

---

## 3. Las trampas del proyecto

Estas son las que mas tiempo cuestan si se descubren solas.

### Las consultas publicas piden columnas explicitas, nunca `*`

Desde la migracion 0005, el rol publico **no tiene permiso sobre la tabla
`restaurants` entera**, sino columna por columna. Eso se hizo para que
`owner_user_id` no salga en cada lectura.

Consecuencia: PostgREST traduce `select=*` a un `SELECT *`, que exige el permiso
amplio y **falla**. Por eso existe `COLUMNAS_PUBLICAS_DEL_RESTAURANTE` en
`src/lib/menu.ts`.

### Agregar una columna publica son DOS pasos

1. El `alter table` en una migracion nueva.
2. Agregarla al `grant select (...) on restaurants to anon` **en la misma
   migracion**, y a `COLUMNAS_PUBLICAS_DEL_RESTAURANTE`.

Si te olvidas del GRANT no vas a ver un error: el dato simplemente no llega y
todos los restaurantes se ven iguales. Es un sintoma dificil de rastrear.
La migracion `0006` es el ejemplo a copiar.

### `getMenu` y `getPlato` comparten la lista de columnas

Tocar esa lista afecta a las dos. Las dos pasan por
`conRespaldoDeColumnas()`, que reintenta sin las columnas nuevas si la base
todavia no tiene la migracion. **Cualquier consulta nueva que use la lista
completa tiene que pasar por ese helper.**

### Un archivo `"use server"` solo puede exportar funciones async

Exportar una constante compila bien y revienta en ejecucion con
"can only export async functions, found object". Por eso `Resultado` y
`RESULTADO_INICIAL` viven en `src/lib/admin/tipos.ts` y no en `acciones.ts`.

### No tocar el tipo MIME del `.usdz` en `next.config.mjs`

Next sirve los archivos de `public/` y su tabla de tipos no conoce `.usdz`: lo
manda como `application/octet-stream`, y Quick Look en iPhone se niega a abrirlo
asi. Sin esa regla, **el AR en iPhone deja de funcionar**, que es la funcion que
vende el producto.

### `next.config.mjs` y `--webpack` no son arbitrarios

El hosting corre una glibc vieja, los binarios nativos de Next no cargan y cae
al backend WASM. Sin binarios no puede compilar un config en TypeScript, y
Turbopack directamente aborta. Si alguien "moderniza" esto a `.ts` o saca el
`--webpack`, el despliegue deja de compilar.

### El AR necesita HTTPS

- **iPhone (Quick Look)**: lo exige. Con `http://192.168.x.x:3000` el boton no
  abre la camara.
- **Android (Scene Viewer)**: en varios equipos tambien.

Para probarlo desde el celular: `npm run dev` y en otra terminal
`npx localtunnel --port 3000`. Pegar la URL `https://...` en `/demo/qr`.

**Desde la computadora no se pueden generar vistas** para el ranking, porque el
boton queda deshabilitado. Hay que usar el celular o insertar filas a mano en
`item_views`.

### La camara del panel solo aparece en contexto seguro

`getUserMedia` no existe fuera de HTTPS o localhost. Si abris el panel por IP de
red local, el boton de tomar foto no se muestra. Es a proposito, no un bug.

---

## 4. Trabajar con base propia (recomendado cuando sean varios)

1. Crear un proyecto gratuito en supabase.com.
2. SQL Editor > correr las migraciones de `supabase/migrations/` **en orden**,
   de la 0001 a la 0006. Cada una depende de la anterior.
3. Authentication > Users > Add user, con **"Auto Confirm User" marcado**. Sin
   eso el login falla con un error que no dice por que.
4. Asignarte el restaurante:
   ```sql
   update restaurants set owner_user_id = (
     select id from auth.users where email = 'tu@correo'
   ) where slug = 'demo';
   ```
   Si el correo no existe, el subselect da NULL y **deja el restaurante
   huerfano en silencio**, invisible en el panel. Verifica que exista primero.
5. Poner la URL y la anon key de *tu* proyecto en `.env.local`.

Para cargar una carta de ejemplo: `supabase/seed/llenar-mi-restaurante.sql`.

---

## 5. Publicar cambios

**El despliegue a produccion es manual**, no por push. Esta documentado en el
README, seccion "Desplegar en Hostinger". Lo hace quien tenga acceso al panel
de hosting.

**Cuidado**: el repositorio sigue conectado a un proyecto de Vercel, asi que un
push a `main` dispara un deploy ahi. Es un sitio distinto al de produccion y
apunta a la misma base.

---

## 6. Por donde seguir

Lo que esta identificado y sin hacer, de mas a menos concreto:

1. **Mostrar los comentarios de las resenas.** Hoy se guardan en la columna
   `comment` pero **nadie los lee nunca**: ni el menu ni el panel la consultan.
   Un comensal escribe "le faltaba sal" y ese texto queda enterrado en la base.
   Es la mejora con mejor relacion valor/esfuerzo: una pantalla en el panel.
2. **Moderacion de resenas.** Hoy cualquiera puede dejar una y no hay forma de
   ocultarla. Para vender a un restaurante real esto va a salir en la primera
   reunion.
3. **Varios restaurantes por cuenta.** El esquema lo soporta (cada fila tiene su
   `owner_user_id`), pero el panel asume uno por usuario.

### Criterio de producto que conviene respetar

El usuario pidio explicitamente que **el panel lo pueda usar gente sin
conocimientos tecnicos**. Nada de jerga en pantalla: ni "slug", ni "URL", ni
".glb". Los conceptos se nombran por lo que hacen. Al agregar pantallas nuevas,
mantener esa vara.

Por el mismo motivo la apariencia ofrece combinaciones cerradas y no un selector
de color libre: un dueno de restaurante no es disenador, y un color arbitrario
termina en menus ilegibles que despues parecen culpa del producto.
