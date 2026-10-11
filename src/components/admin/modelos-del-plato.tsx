"use client";

import { useState } from "react";
import { Check, Lightbulb, Smartphone } from "lucide-react";

import { ConvertirAUsdz } from "@/components/admin/convertir-a-usdz";
import { SubirArchivo } from "@/components/admin/subir-archivo";

/**
 * Escaneo 3D del plato, de punta a punta, para alguien sin conocimientos.
 *
 * Una aclaracion que conviene no perder: el escaneo en si NO ocurre aca. No
 * existe forma de hacer fotogrametria dentro del navegador sin contratar un
 * servicio de pago; lo que necesita un escaneo decente es la camara con sensor
 * de profundidad del telefono, y a eso solo llega una app nativa.
 *
 * Entonces lo que resuelve esta pantalla es todo lo demas, que es donde la
 * gente se traba: que app usar, como mover el telefono, que tamano tiene que
 * tener el modelo, y sobre todo el segundo archivo. Las apps gratuitas exportan
 * .glb; el .usdz que pide el iPhone suele estar detras de una suscripcion. Por
 * eso el panel lo genera solo a partir del .glb.
 */

const PASOS = [
  "Pone el plato sobre una mesa despejada, con buena luz y sin brillos.",
  "Abri la app y elegi el modo de escanear un objeto.",
  "Camina alrededor del plato despacio, dando una vuelta completa.",
  "Da una segunda vuelta mas alta, apuntando hacia abajo.",
  "Exporta el resultado en formato GLB y subilo aca abajo.",
];

export function ModelosDelPlato({
  restauranteId,
  glbInicial,
  usdzInicial,
}: {
  restauranteId: string;
  glbInicial: string | null;
  usdzInicial: string | null;
}) {
  const [glb, setGlb] = useState(glbInicial ?? "");
  const [usdz, setUsdz] = useState(usdzInicial ?? "");

  const puedeConvertir = Boolean(glb) && !usdz;

  return (
    <div className="flex flex-col gap-5 px-4 pb-4">
      <p className="text-tinta-suave text-xs">
        Se necesitan dos archivos, uno para cada tipo de celular. Si falta el de
        iPhone, en esos telefonos el boton no abre la camara.
      </p>

      {/* La guia va plegada: quien ya escaneo una vez no necesita releerla, y
          abierta empujaba los campos fuera de la pantalla en un celular. */}
      <details className="border-borde group rounded-lg border">
        <summary className="text-tinta cursor-pointer list-none p-3 text-sm font-semibold">
          <span className="flex items-center gap-2">
            <Smartphone className="size-4 shrink-0" aria-hidden />
            Como escanear un plato con el celular
          </span>
        </summary>

        <div className="flex flex-col gap-3 px-3 pb-3">
          <p className="text-tinta-suave text-xs">
            El escaneo se hace con una app en el telefono, no desde esta
            pantalla. <strong className="text-tinta">Scaniverse</strong> es
            gratuita, esta en iPhone y en Android, y permite exportar el archivo
            sin pagar suscripcion.
          </p>

          <ol className="flex flex-col gap-2">
            {PASOS.map((paso, i) => (
              <li key={paso} className="flex gap-2.5 text-xs">
                <span className="bg-lienzo text-tinta flex size-5 shrink-0 items-center justify-center rounded-full font-bold tabular-nums">
                  {i + 1}
                </span>
                <span className="text-tinta-suave pt-0.5">{paso}</span>
              </li>
            ))}
          </ol>

          <p className="text-tinta-suave flex gap-2 text-xs">
            <Lightbulb className="text-destacado size-4 shrink-0" aria-hidden />
            <span>
              Lo que mas arruina un escaneo es la luz: un plato brillante o una
              mesa oscura y reflectante confunden al telefono. Mantel mate y luz
              pareja.
            </span>
          </p>
        </div>
      </details>

      <SubirArchivo
        nombreDelCampo="modeloGlb"
        etiqueta="Archivo para Android"
        extensiones={[".glb"]}
        carpeta="modelos"
        restauranteId={restauranteId}
        valorInicial={glbInicial}
        onCambio={setGlb}
      />

      {puedeConvertir && (
        <ConvertirAUsdz
          urlGlb={glb}
          restauranteId={restauranteId}
          onGenerado={setUsdz}
        />
      )}

      <SubirArchivo
        nombreDelCampo="modeloUsdz"
        etiqueta="Archivo para iPhone"
        extensiones={[".usdz"]}
        carpeta="modelos"
        restauranteId={restauranteId}
        valorInicial={usdzInicial}
        valorForzado={usdz || null}
        onCambio={setUsdz}
      />

      {glb && usdz && (
        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <Check className="size-4 shrink-0" aria-hidden />
          Listo: el plato se va a poder ver en la mesa desde los dos tipos de
          celular.
        </p>
      )}

      <p className="text-tinta-tenue text-xs">
        Importante: el modelo tiene que estar hecho al tamano real del plato. Si
        es mas grande, en el celular no se apoya sobre la mesa sino en el piso.
      </p>
    </div>
  );
}
