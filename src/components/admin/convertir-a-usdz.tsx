"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSupabaseNavegador } from "@/lib/supabase/navegador";

/**
 * Genera el archivo de iPhone (.usdz) a partir del de Android (.glb).
 *
 * Por que hace falta: el menu necesita los dos formatos, uno por plataforma.
 * Las apps de escaneo gratuitas exportan .glb, pero el .usdz suele quedar
 * detras de una suscripcion. Sin esto, un restaurante que escanea gratis se
 * queda sin realidad aumentada en iPhone, que es justo donde mejor funciona.
 *
 * Como lo hace: <model-viewer> trae un metodo publico `prepareUSDZ()` (existe
 * en la version 4.3.1, que es la instalada) que convierte en el navegador, sin
 * servidor ni servicio de terceros. Se carga el .glb en un visor fuera de
 * pantalla, se le pide el USDZ y se sube el resultado.
 *
 * El tipo de contenido se fuerza a `model/vnd.usdz+zip`: Quick Look en iPhone
 * se niega a abrir un USDZ servido como `application/octet-stream`, y Supabase
 * le pone ese tipo generico a las extensiones que no conoce.
 */

type VisorUSDZ = HTMLElement & {
  prepareUSDZ?: () => Promise<string>;
  loaded?: boolean;
};

export function ConvertirAUsdz({
  urlGlb,
  restauranteId,
  onGenerado,
}: {
  urlGlb: string;
  restauranteId: string;
  onGenerado: (urlUsdz: string) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convertir() {
    setError(null);
    setTrabajando(true);

    try {
      // Registrar la etiqueta. Es un Web Component, no un componente de React:
      // se importa por su efecto secundario, igual que en el menu publico.
      await import("@google/model-viewer");

      const visor = document.createElement("model-viewer") as VisorUSDZ;
      visor.setAttribute("src", urlGlb);
      // Fuera de la vista pero NO con display:none: un visor sin layout no
      // llega a montar la escena y `prepareUSDZ` devolveria vacio.
      visor.style.cssText =
        "position:fixed;left:-9999px;top:0;width:480px;height:480px;";
      contenedor.current?.appendChild(visor);

      await new Promise<void>((listo, fallo) => {
        if (visor.loaded) return listo();
        const tiempoLimite = window.setTimeout(
          () => fallo(new Error("tardo demasiado")),
          45_000,
        );
        // Los eventos de <model-viewer> no burbujean: hay que escucharlos
        // sobre el propio elemento.
        visor.addEventListener(
          "load",
          () => {
            window.clearTimeout(tiempoLimite);
            listo();
          },
          { once: true },
        );
        visor.addEventListener(
          "error",
          () => {
            window.clearTimeout(tiempoLimite);
            fallo(new Error("no se pudo leer el modelo"));
          },
          { once: true },
        );
      });

      if (typeof visor.prepareUSDZ !== "function") {
        throw new Error("esta version del visor no sabe convertir");
      }

      const urlTemporal = await visor.prepareUSDZ();
      if (!urlTemporal) throw new Error("la conversion vino vacia");

      const blob = await fetch(urlTemporal).then((r) => r.blob());
      URL.revokeObjectURL(urlTemporal);
      visor.remove();

      const nombre = `${restauranteId}/modelos/${crypto.randomUUID()}.usdz`;
      const supabase = getSupabaseNavegador();
      const { error: fallo } = await supabase.storage
        .from("menu")
        .upload(nombre, blob, {
          contentType: "model/vnd.usdz+zip",
          upsert: false,
        });

      if (fallo) throw new Error("no se pudo guardar el archivo");

      const {
        data: { publicUrl },
      } = supabase.storage.from("menu").getPublicUrl(nombre);

      onGenerado(publicUrl);
    } catch {
      setError(
        "No pudimos generar el archivo de iPhone. Podes subirlo a mano si lo tenes.",
      );
      contenedor.current?.querySelector("model-viewer")?.remove();
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={() => void convertir()}
        disabled={trabajando}
        className="w-full"
      >
        {trabajando ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            Generando...
          </>
        ) : (
          <>
            <Wand2 aria-hidden />
            Crear el archivo de iPhone a partir del de Android
          </>
        )}
      </Button>

      <span className="text-tinta-tenue text-xs">
        Se arma en este mismo telefono, sin enviar el plato a ningun servicio.
        Puede tardar un momento.
      </span>

      {error && (
        <span className="text-destacado text-xs font-semibold" role="alert">
          {error}
        </span>
      )}

      <div ref={contenedor} aria-hidden />
    </div>
  );
}
