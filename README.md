# Menu virtual con Realidad Aumentada

Menu digital de restaurante donde cada plato se puede ver en tamano real sobre
la mesa, desde el navegador del celular y sin instalar ninguna app. Con
resenas de clientes, ranking semanal y especialidad de la casa.

**Estado**: Partes 1 (menu + AR + QR), 2 (Supabase + resenas + ranking) y 4
(panel de administracion) terminadas. El restaurante administra su menu solo,
en `/admin`. Ya no hace falta tocar Supabase para operar un cliente.

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

En el dashboard, **SQL Editor** > New query, y ejecutar en orden:

1. `supabase/migrations/0001_init.sql`: tablas, indices, vista de
   calificaciones, funcion del ranking y lectura publica.
2. `supabase/migrations/0002_panel.sql`: dueno del restaurante, horarios,
   zona horaria, bucket de archivos y politicas de escritura.
3. `supabase/migrations/0003_quitar_adopcion_automatica.sql`: quita un trigger
   temporal que 0002 dejaba armado.

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

## El panel: /admin

El restaurante entra en `/login` y administra todo desde ahi.

| Pantalla | Que hace |
| --- | --- |
| `/admin` | platos activos y pausados, calificacion general, ranking semanal |
| `/admin/platos` | inventario completo; pausar un plato con un toque |
| `/admin/platos/nuevo` | alta: foto, precio, seccion, modelos 3D |
| `/admin/secciones` | crear, renombrar, reordenar y eliminar secciones |
| `/admin/horarios` | horario por dia, con dias cerrados |
| `/admin/restaurante` | nombre, logo, direccion, URL del menu, zona horaria |
| `/admin/bienvenida` | primer ingreso, cuando la cuenta todavia no tiene local |

**No hay boton de publicar.** Lo que se edita aparece en el menu del cliente al
instante: las paginas publicas se renderizan por pedido y cada accion del panel
revalida las rutas afectadas.

### Dar de alta un restaurante nuevo

1. **Supabase > Authentication > Users > Add user**: correo y contrasena del
   dueno, **con "Auto Confirm User" activado**. Sin eso no puede entrar hasta
   confirmar el correo, y el servicio de mail del plan gratuito esta limitado
   a unos pocos envios por hora: el mensaje puede no llegar nunca.
2. Le pasas esas credenciales. Entra a `/login`, cae en `/admin/bienvenida` y
   crea su local con dos datos: nombre y direccion web.
3. El resto lo hace el: secciones, platos, horarios.

No hay pantalla de registro publica a proposito. Un usuario por restaurante, y
las altas las das vos al vender. En **Authentication > Sign In / Up** conviene
dejar apagado *"Allow new users to sign up"*: la anon key viaja al navegador,
asi que con el registro abierto cualquiera con un correo real puede crearse una
cuenta y ocupar slugs en tu base.

### Asignar un restaurante existente a un usuario

La propiedad se asigna de forma explicita. No hay ningun automatismo que la
adivine: habia un trigger que le daba los restaurantes sin dueno al proximo
usuario que se registrara, y se quito en la migracion 0003 justamente por eso.

```sql
update restaurants set owner_user_id = (
  select id from auth.users where email = 'correo@del.cliente'
) where slug = 'su-local';
```

### Aislamiento entre restaurantes

Cada dueno solo ve y edita lo suyo. No lo garantiza el codigo del panel sino
las politicas de RLS: aunque alguien manipulara un id desde el navegador, la
base devuelve cero filas. Probado contra un segundo restaurante: renombrarlo
afecta 0 filas, crearle una seccion da 403 y subirle un archivo da 400.

### Recargar el menu desde cero

```bash
npm run seed
```

Borra el restaurante `demo` y lo vuelve a crear desde
`supabase/seed/datos-iniciales.ts`. **Esto borra tambien las resenas y las
vistas** (caen por `ON DELETE CASCADE`), asi que no lo corras despues de juntar
datos de una demo real.

Ademas **deja el restaurante sin dueno**, asi que despues del seed nadie lo ve
en el panel hasta que le asignes el `owner_user_id` con el SQL de mas arriba.

---

## Como funcionan las piezas

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

`menu_items.is_specialty`, editable desde el formulario del plato. Estrella en
la card, badge con texto en el detalle.

### Abierto / Cerrado

Se calcula con `restaurants.hours` (jsonb, una franja por dia) y
`restaurants.timezone`.

Dos cosas que suelen salir mal y aca estan contempladas:

- **La zona horaria.** El servidor de Vercel corre en UTC. Comparar el horario
  contra ese reloj mostraria "Cerrado" a las 19:00 de Bogota, en plena cena.
  Por eso el calculo usa `Intl.DateTimeFormat` fijado a la zona del local.
- **Los locales que cierran despues de medianoche.** Para un bar de 20:00 a
  02:00, la comparacion directa `abre <= ahora <= cierra` da falso siempre,
  porque 02:00 es menor que 20:00. `estadoDeApertura()` detecta el cruce y
  ademas revisa si la franja de ayer sigue vigente.

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
├── proxy.ts                 refresca la sesion y protege /admin
├── types/
│   ├── menu.ts              tipos del dominio (Restaurante, Categoria, Plato)
│   ├── database.ts          forma de las filas de Supabase
│   └── model-viewer.d.ts    tipos del web component de Google
├── lib/
│   ├── supabase/            clientes: publico, con sesion y de navegador
│   ├── menu.ts              lecturas del menu publico
│   ├── horarios.ts          abierto/cerrado con zona horaria
│   ├── actions.ts           resenas y registro de vistas
│   ├── admin/               lecturas y escrituras del panel
│   └── format.ts            formato de precios
├── app/
│   ├── page.tsx                        redirect + pantalla de setup
│   ├── login/                          ingreso del dueno
│   ├── admin/                          el panel
│   └── [restaurante]/
│       ├── page.tsx                    menu
│       ├── plato/[id]/page.tsx         detalle
│       └── qr/page.tsx                 cartel QR
└── components/
    ├── ui/          base tipo shadcn (button, card, badge, tabs, skeleton)
    ├── menu/        header, ranking, tabs + grilla, card, placeholder de foto
    ├── plato/       detalle y visor 3D/AR
    ├── resenas/     estrellas y formulario
    ├── admin/       campos, navegacion, listas y formularios del panel
    └── qr/          cartel imprimible

supabase/
├── migrations/
│   ├── 0001_init.sql             esquema, indices, vista, funcion y RLS
│   └── 0002_panel.sql            dueno, horarios, storage y RLS de escritura
└── seed/
    ├── datos-iniciales.ts         el menu de la demo (era src/data/menu.ts)
    └── seed.ts                    npm run seed
```

**Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 ·
componentes base al estilo shadcn/ui · Supabase (base, auth y storage) ·
`<model-viewer>` de Google · `qrcode.react`.

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
