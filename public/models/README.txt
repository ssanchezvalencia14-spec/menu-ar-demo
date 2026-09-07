MODELOS 3D
==========

placeholder.glb  -> modelo de prueba para Android (Scene Viewer) y para el
                    visor 3D en el navegador.
placeholder.usdz -> modelo de prueba para iOS (Quick Look).

Los dos son el "Astronaut" de la documentacion oficial de model-viewer
(https://modelviewer.dev/shared-assets/models/). Estan aca solo para probar
que el flujo de Realidad Aumentada funciona de punta a punta. Obviamente hay
que reemplazarlos por los platos reales.


COMO REEMPLAZARLOS
------------------

1. Cada plato necesita DOS archivos:
     - un .glb  (Android y navegador)
     - un .usdz (iOS)
   Si falta el .usdz, en iPhone el boton "Ver en tu mesa" no va a abrir la
   camara.

2. Poner los archivos en esta carpeta, por ejemplo:
     public/models/hamburguesa.glb
     public/models/hamburguesa.usdz

3. Apuntar el plato a esos archivos en src/data/menu.ts:
     modelo3dGlb:  "/models/hamburguesa.glb",
     modelo3dUsdz: "/models/hamburguesa.usdz",


REQUISITOS DE LOS MODELOS
-------------------------

- ESCALA REAL: 1 unidad = 1 metro. Este es EL requisito que rompe todo cuando
  se ignora.

  Que el plato aparezca sobre la mesa y no en el piso NO se configura con
  ningun atributo: depende solo del tamano del modelo. Tanto Quick Look (iOS)
  como Scene Viewer (Android) buscan superficies horizontales y apoyan el
  objeto donde entra. Un modelo de 2 metros no entra en una mesa, asi que se
  va al piso; uno de 25 cm se apoya en la mesa solo.

  Referencias utiles:
    plato principal      24 - 28 cm de diametro,  6 - 10 cm de alto
    plato de postre      18 - 20 cm de diametro,  5 -  8 cm de alto
    vaso / copa           7 -  9 cm de diametro, 12 - 18 cm de alto
    hamburguesa          12 - 14 cm de ancho,    10 - 13 cm de alto

  Los archivos placeholder.glb/.usdz que vienen incluidos miden 2,01 m de
  alto (es un astronauta). Por eso en la demo aparece parado en el piso.

- Origen en la base del plato y centrado, porque el modelo se apoya sobre la
  superficie detectada.
- Peso: apuntar a menos de 5 MB por archivo. Se descargan con datos moviles,
  parados al lado de una mesa.
- Formato: .glb (glTF binario, con las texturas embebidas), no .gltf suelto.
