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

- Escala real: 1 unidad = 1 metro. Un plato de 25 cm de diametro tiene que
  medir 0.25 en el modelo, si no aparece del tamano de un auto sobre la mesa.
- Origen en la base del plato y centrado, porque se apoya en el piso/mesa
  (ar-placement="floor").
- Peso: apuntar a menos de 5 MB por archivo. Se descargan con datos moviles,
  parados al lado de una mesa.
- Formato: .glb (glTF binario, con las texturas embebidas), no .gltf suelto.
