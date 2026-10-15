# Pendientes del proyecto

Lista revisada contra el codigo, no de memoria. Cada punto dice **que hay hoy**
y **que falta**, porque varias funciones estan a medias y no se nota desde
afuera.

Ordenado por lo que mas duele al vender, no por dificultad.

---

## Bloquean una venta a un restaurante real

### 1. Resenas: tres agujeros en la misma funcion

**Hay**: formulario publico de 1 a 5 estrellas con comentario opcional, promedio
calculado en la vista `menu_item_ratings`, y estrellas en las tarjetas y el
detalle.

**Falta**:

- **Los comentarios no se leen nunca.** Se guardan en `reviews.comment` y **ni
  el menu ni el panel consultan esa columna**. Un comensal escribe "le faltaba
  sal" y el texto queda enterrado. Es la mejora con mejor relacion
  valor/esfuerzo de toda la lista: una pantalla en el panel.
- **No hay moderacion.** No existe forma de ocultar una resena. Para un
  restaurante real esto sale en la primera reunion.
- **No hay ninguna defensa contra abuso.** Comprobado: con la anon key, que
  viaja al navegador de cualquiera, se pueden insertar resenas y vistas sin
  limite. Un competidor puede hundir la calificacion de un plato, o inflar el
  ranking de "los mas mirados", con un script de cinco lineas.

Lo tercero es lo mas serio y lo menos visible. Opciones: limite por IP o por
dispositivo, ventana de tiempo entre resenas, o exigir que la resena venga
acompanada de una vista reciente de ese plato.

**Esfuerzo**: la pantalla de comentarios es chica. La moderacion es mediana
(columna de estado + politica de RLS + pantalla). El anti-abuso es el que hay
que pensar bien.

---

### 2. Fotos de los platos

**Hay**: camara integrada en el panel, que reduce a 1600 px antes de subir, y
subida desde la galeria. Si un plato no tiene foto se dibuja un fondo de color
con el icono de su seccion.

**Falta**:

- **Ningun plato tiene foto todavia.** El menu se ve entero con iconos. Para
  mostrarlo a un cliente, esto es lo primero que se nota.
- **La subida desde la galeria NO reduce la imagen.** Solo valida que pese
  menos de 20 MB. Una foto de celular moderno se sube entera y despues se le
  manda a cada comensal. Hay que pasarla por el mismo redimensionado que ya usa
  la camara: el codigo esta en `camara-plato.tsx`.
- **No hay recorte ni encuadre.** Las tarjetas usan proporcion 4:3 y la lista
  usa cuadrado; una foto vertical se recorta sola y puede cortar el plato.

**Esfuerzo**: reutilizar el redimensionado es chico. El recorte es mediano.

---

### 3. Alergenos e informacion dietetica

**Hay**: nada. `menu_items` tiene nombre, descripcion, precio, foto, modelos,
especialidad, disponible y orden.

**Falta**: marcar un plato como vegetariano, vegano, sin gluten, picante, y
poder listar alergenos. Es de lo primero que pregunta un restaurante, y en
varios paises hay obligacion de informarlo.

**Esfuerzo**: mediano. Columna nueva (ver la trampa del GRANT en
[EQUIPO.md](EQUIPO.md)), campo en el formulario, iconos en el menu y filtro.

---

## Limitan el crecimiento del producto

### 4. No hay ni una sola prueba automatizada

**Hay**: `npm run lint` y el typecheck.

**Falta**: todo. No hay carpeta de pruebas, ni dependencias de testing, ni
script `test`.

Esto importa mas que de costumbre en este proyecto, porque **ya hubo tres
fallas que compilaban perfecto** y solo se veian abriendo la pagina: un
`"use server"` exportando una constante, `next/image` sin `remotePatterns`, y
una columna nueva que rompia el detalle del plato. Con un equipo tocando el
mismo codigo, eso se va a repetir.

Lo minimo que cubre el 80%: una prueba de extremo a extremo que abra el menu,
entre a un plato y vuelva.

**Esfuerzo**: mediano para armarlo, chico para mantenerlo.

---

### 5. Un restaurante por cuenta

**Hay**: el esquema lo soporta. Cada fila de `restaurants` tiene su
`owner_user_id` y las politicas de RLS ya aislan bien (probado: sobre un
restaurante ajeno, renombrar afecta 0 filas y crear seccion da 403).

**Falta**: el panel asume uno por usuario. `getRestauranteDelDueno()` usa
`maybeSingle()`. Para una cadena con varios locales, o para que una agencia
administre varios clientes, hace falta un selector.

**Esfuerzo**: mediano.

---

### 6. Los precios no admiten decimales

**Hay**: `formatPrecio()` fuerza 0 decimales, y `price` es entero.

**Falta**: funciona bien para pesos colombianos, pero **bloquea vender en
dolares, euros o cualquier moneda donde los centavos importan**. Un plato de
USD 12.50 hoy no se puede representar.

**Esfuerzo**: chico en el formato, cuidadoso en la base (guardar centavos como
entero es lo correcto, pero hay que migrar los datos existentes).

---

### 7. No hay entorno de pruebas

**Hay**: un solo proyecto de Supabase, que es produccion.

**Falta**: todo el equipo apunta ahi. Si alguien pausa un plato probando, se ve
en el menu real al instante. Con una persona se convive; con cuatro, no.

**Esfuerzo**: chico. Un proyecto gratuito aparte y las migraciones corridas.
Esta explicado en [EQUIPO.md](EQUIPO.md), seccion 4.

---

## Mejoras que suman

### 8. Escaneo: no se valida la escala del modelo

**Hay**: camara para la foto, guia paso a paso apuntando a Scaniverse (gratuita
en iPhone y Android), y **conversion automatica de `.glb` a `.usdz`** con
`prepareUSDZ()` de model-viewer, que resuelve que las apps gratuitas solo
exporten GLB.

**Falta**: el requisito mas importante de un modelo para AR es que este **a
escala real**, y hoy nada lo verifica. Si el restaurante sube un plato de 2
metros, en el celular no se apoya en la mesa sino en el piso, y parece que el
producto esta roto. Se puede leer el tamano del modelo al cargarlo y avisar si
esta fuera de un rango razonable.

Aclaracion que conviene no olvidar: **el escaneo en si no se puede hacer en el
navegador**. La fotogrametria necesita el sensor de profundidad del telefono y
a eso solo llega una app nativa. El panel guia y convierte, no escanea.

**Esfuerzo**: chico. El visor ya expone las dimensiones.

---

### 9. Personalizacion del menu: falta lo visible

**Hay**: color de marca (5 opciones), distribucion (grilla o lista) y forma de
las esquinas, con vista previa en vivo.

**Falta**:

- **Logo.** La columna `logo_url` existe y el menu la usa, pero no hay campo
  para subirlo desde la pantalla de apariencia.
- **Tipografia.** Hoy es una sola para todos los restaurantes.
- **Imagen de portada** en la cabecera.

Criterio que conviene respetar: no agregar un selector de color libre. Las
opciones son cerradas a proposito, porque un color arbitrario termina en menus
ilegibles que despues parecen culpa del producto.

**Esfuerzo**: el logo es chico. La tipografia es mediana.

---

### 10. El comensal no puede buscar ni filtrar

**Hay**: pestanas por seccion.

**Falta**: una carta de 60 platos se recorre a mano. Buscador por nombre, y
filtros (vegetariano, sin gluten, rango de precio) cuando existan los campos
del punto 3.

**Esfuerzo**: chico.

---

### 11. La unica metrica es "vistas en AR"

**Hay**: `item_views` cuenta toques en "Ver en tu mesa", y de ahi sale el
ranking.

**Falta**: cuanta gente escaneo el QR, que platos se miran sin abrir el AR, a
que hora. Es informacion que le sirve al restaurante y es argumento de venta
para cobrar una suscripcion.

**Esfuerzo**: mediano.

---

## Cosas que NO estan rotas y conviene no "arreglar"

- **`next.config.mjs` en vez de `.ts` y `next build --webpack`.** La glibc del
  hosting es vieja; sin eso el despliegue no compila.
- **El tipo MIME del `.usdz` declarado en `headers()`.** Sin eso el AR en
  iPhone deja de abrir.
- **Que el ranking no aparezca con menos de 3 platos.** Es deliberado: un
  ranking de un plato no es un ranking.
- **Que las consultas publicas pidan columnas explicitas.** Es lo que impide que
  `owner_user_id` salga en cada lectura.

El detalle de cada una esta en [EQUIPO.md](EQUIPO.md), seccion 3.
