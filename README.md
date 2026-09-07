# Menu virtual con Realidad Aumentada

Menu digital de restaurante donde cada plato se puede ver en tamano real sobre
la mesa, desde el navegador del celular y sin instalar ninguna app. Con
resenas de clientes, ranking semanal y especialidad de la casa.

**Estado**: Parte 1 (menu + AR + QR) y Parte 2 (Supabase + resenas + ranking)
terminadas. Todavia no hay panel de administracion: el contenido se edita
directo en Supabase.

**En produccion**: https://menu-ar-demo-ten.vercel.app/demo
(proyecto `utah1/menu-ar-demo` en Vercel, base `kganvantvhiurdxfuakv`).
Esa es la URL que hay que poner en el QR: tiene HTTPS, que es requisito para
que el AR abra en iPhone.

Repositorio: https://github.com/ssanchezvalencia14-spec/menu-ar-demo (privado).

Para publicar cambios alcanza con `git push`: el proyecto de Vercel esta
conectado a ese repositorio y cada push a `main` dispara un deploy a
produccion. Tambien sirve `npx vercel deploy --prod --yes` para publicar sin
pasar por Git.

Cuidado al correr `vercel link` de nuevo en esta carpeta: detecta el remoto y
puede reconectar el proyecto al repositorio equivocado. Se revisa con
`vercel git disconnect` y `vercel git connect`.

---

## Puesta en marcha

### 1. Crear el proyecto de Supabase

En [supabase.com/dashboard](https://supabase.com/dashboard) > **New project**.
Plan free, region la mas cercana.

### 2. Aplicar el esquema

En el dashboard, **SQL Editor** > New query, pegar todo el contenido de
`supabase/migrations/0001_init.sql` y ejecutarlo. Crea las tablas, los indices,
la vista de calificaciones, la funcion del ranking y las politicas de RLS.

### 3. Configurar las variables

```bash
cp .env.example .env.local
```

Los tres valores salen de **Project Settings > API**:

| Variable | Donde | Cuidado |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | publica |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public | publica, viaja al navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | **secreta**, saltea todo el RLS |

La `service_role` solo la usa el seed. Nunca va en codigo del cliente ni en el
repositorio.

### 4. Cargar el menu inicial y arrancar

```bash
npm install
npm run seed
npm run dev
```

Abre http://localhost:3000

| Ruta | Que es |
| --- | --- |
| `/` | redirige al primer restaurante |
| `/demo` | el menu: ranking + categorias + grilla |
| `/demo/plato/[id]` | detalle, AR, calificacion y formulario de resena |
| `/demo/qr` | el cartel con el QR para imprimir |

---

## Como editar el contenido (sin panel todavia)

Todo se edita en **Supabase > Table Editor**. El panel de administracion es una
fase posterior.

### Marcar un plato como especialidad de la casa

Tabla `menu_items`, columna **`is_specialty`**: ponerla en `true`. El plato
pasa a mostrar una estrella en la card del grid y un badge "Especialidad de la
casa" en el detalle.

Por SQL, para varios de una:

```sql
update menu_items set is_specialty = true
where name in ('Plato de carne', 'Postre de chocolate');
```

Los cambios se ven al recargar: las paginas del menu se renderizan por pedido,
no hay cache que invalidar.

### Otras columnas utiles

| Tabla | Columna | Para que |
| --- | --- | --- |
| `menu_items` | `is_available` | `false` saca el plato del menu sin borrarlo |
| `menu_items` | `sort_order` | orden dentro de la categoria |
| `menu_items` | `price` | entero, sin decimales ni separadores |
| `categories` | `sort_order` | orden de las tabs |
| `categories` | `icon` | `entrada`, `principal`, `postre` o `bebida`; define el icono del placeholder de foto |
| `restaurants` | `name`, `schedule`, `slug` | cabecera y URL del menu |

### Recargar el menu desde cero

```bash
npm run seed
```

Borra el restaurante `demo` y lo vuelve a crear desde
`supabase/seed/datos-iniciales.ts`. **Esto borra tambien las resenas y las
vistas** (caen por `ON DELETE CASCADE`), asi que no lo corras despues de juntar
datos de una demo real.

---

## Como funcionan las tres piezas nuevas

### Resenas

Formulario publico, sin login: 1 a 5 estrellas y un comentario opcional. Al
enviar, un Server Action inserta la fila y llama a `revalidatePath`, asi que el
promedio nuevo aparece al instante en el detalle y en el grid.

Las reglas (rating 1-5, comentario de hasta 500 caracteres) estan escritas tres
veces a proposito: en el formulario, en el Server Action y en el `CHECK` de la
tabla mas la politica de RLS. Cualquiera puede saltearse las dos primeras.

El promedio sale de la vista `menu_item_ratings`, que agrega una sola vez para
todos los platos. Sin eso, mostrar estrellas en el grid serian 15 consultas.

### Ranking semanal

Cada toque en "Ver en tu mesa" inserta una fila en `item_views`. La seccion
"Los mas mirados esta semana" muestra el top 3 de los ultimos 7 dias.

Tres decisiones que conviene conocer:

- **Dice "mirados", no "pedidos"**. Mide interes en el AR, no ventas: no hay
  integracion con el punto de venta. Prometer "los mas pedidos" a un dueno que
  sabe cual es su plato mas vendido es la forma rapida de perder la venta.
- **No se muestra con menos de 3 platos** con vistas en la semana. Un ranking
  de un solo plato no es un ranking, y un local recien abierto no deberia
  estrenar una seccion vacia.
- **Carga aparte del menu**, dentro de un `<Suspense>`. La grilla de platos se
  ve sin esperar esta consulta.

`item_views` no tiene permiso de lectura publica. El conteo se expone solo a
traves de la funcion `get_weekly_top_items`, que es `SECURITY DEFINER`: se
puede ver el ranking, no el historial crudo de vistas.

### Especialidad de la casa

`menu_items.is_specialty`. Estrella en la card, badge con texto en el detalle.

---

## Probar el AR en el celular

El boton **"Ver en tu mesa"** aparece deshabilitado en la computadora: ningun
navegador de escritorio soporta AR. Ahi solo se puede girar el modelo con el
mouse. **Esto tambien significa que desde la computadora no se pueden generar
vistas** para el ranking; para eso hay que usar el celular o insertar filas a
mano en `item_views`.

### Hace falta HTTPS

- **iPhone (Quick Look)**: exige HTTPS. Con `http://192.168.x.x:3000` el boton
  no abre la camara.
- **Android (Scene Viewer)**: en varios equipos tambien lo exige.

Abrir por la IP de la red local alcanza para ver el menu, **no para probar el
AR**. Dos caminos:

**Tunel HTTPS**, para probar ahora:

```bash
npm run dev
npx localtunnel --port 3000   # en otra terminal
```

Pega la URL `https://...` en `/demo/qr` y escanea el QR.

**Deploy a Vercel**, para ir a mostrarlo. HTTPS por defecto, URL estable y no
depende de tener la computadora prendida. Para una reunion de venta es lo unico
confiable. Hay que cargar las tres variables de entorno en Vercel.

**Solo ver el menu en la red local**: `npm run dev:red` y abrir
`http://<IP-de-tu-PC>:3000`. La IP sale con `ipconfig`.

---

## Modelos 3D

El que viene (`public/models/plato-demo.glb` y `.usdz`) es un plato de 24 cm de
diametro generado por codigo con `tools/generar-plato-demo.mjs`. Esta a escala
real, asi que se apoya sobre la mesa como corresponde, pero la comida es un
domo liso: sirve para probar el AR, no para vender.

Ver `public/models/README.txt`. Los dos requisitos que mas rompen el AR:
**escala real** (1 unidad = 1 metro) y **dos archivos por plato** (`.glb` para
Android, `.usdz` para iPhone). Despues se apuntan las columnas
`model_glb_url` y `model_usdz_url` del plato.

---

## Como esta armado

```
src/
├── types/
│   ├── menu.ts              tipos del dominio (Restaurante, Categoria, Plato)
│   ├── database.ts          forma de las filas de Supabase
│   └── model-viewer.d.ts    tipos del web component de Google
├── lib/
│   ├── supabase.ts          cliente con la anon key
│   ├── menu.ts              todas las consultas de lectura
│   ├── actions.ts           Server Actions: dejar resena, registrar vista
│   └── format.ts            formato de precios
├── app/
│   ├── page.tsx                        redirect + pantalla de setup
│   └── [restaurante]/
│       ├── page.tsx                    menu
│       ├── plato/[id]/page.tsx         detalle
│       └── qr/page.tsx                 cartel QR
└── components/
    ├── ui/          base tipo shadcn (button, card, badge, tabs, skeleton)
    ├── menu/        header, ranking, tabs + grilla, card, placeholder de foto
    ├── plato/       detalle y visor 3D/AR
    ├── resenas/     estrellas y formulario
    └── qr/          cartel imprimible

supabase/
├── migrations/0001_init.sql       esquema, indices, vista, funcion y RLS
└── seed/
    ├── datos-iniciales.ts         el menu de la demo (era src/data/menu.ts)
    └── seed.ts                    npm run seed
```

**Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 ·
componentes base al estilo shadcn/ui · Supabase · `<model-viewer>` de Google ·
`qrcode.react`.

### Dos decisiones que conviene no revertir

**El modelo 3D se precarga al abrir la pagina del plato**, escondido detras de
la foto, y `activateAR()` se llama **antes** de registrar la vista. Los
navegadores moviles solo permiten abrir la camara dentro de un gesto real del
usuario. Si el modelo cargara al tocar el boton, o si la metrica se enviara
primero con `await`, se pierde el gesto y la camara no abre.

**`<model-viewer>` es un Web Component, no un componente de React.** Se importa
por su efecto secundario (registra la etiqueta en el navegador) y recien
despues se renderiza. Sus eventos no burbujean, asi que se escuchan sobre el
propio elemento, con un chequeo de `.loaded` por si termino de cargar antes de
que corriera el efecto.

---

## Lo que todavia no existe

Panel de administracion · autenticacion · moderacion de resenas · generacion
automatica de modelos 3D · multiples restaurantes en la misma instalacion (el
esquema lo soporta, la interfaz muestra uno).
