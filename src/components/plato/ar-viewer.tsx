"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Smartphone, TriangleAlert, View } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DishImage } from "@/components/menu/dish-image";
import { registrarVista } from "@/lib/actions";
import type { CategoriaIcono, Plato } from "@/types/menu";

/** Estados del visor. La UI nunca queda en blanco: siempre hay uno activo. */
type Estado = "cargando" | "listo" | "error";

/**
 * Visor 3D + Realidad Aumentada.
 *
 * `<model-viewer>` es un Web Component de Google, no un paquete de React: lo
 * importamos por su efecto secundario (registra la etiqueta <model-viewer> en
 * el navegador) y recien despues lo renderizamos, para que el elemento ya este
 * definido cuando React lo monta.
 *
 * El modelo empieza a cargar apenas se abre la pagina, escondido detras de la
 * foto del plato. Asi, cuando el cliente toca "Ver en tu mesa", la camara se
 * abre en el mismo gesto: los navegadores moviles exigen que activateAR() salga
 * de una interaccion real del usuario, no de una promesa que se resolvio despues.
 */
export function ArViewer({
  plato,
  icono,
}: {
  plato: Plato;
  icono: CategoriaIcono;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [registrado, setRegistrado] = useState(false);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [arDisponible, setArDisponible] = useState(false);

  const tieneModelo = Boolean(plato.modelo3dGlb ?? plato.modelo3dUsdz);

  useEffect(() => {
    if (!tieneModelo) return;
    let cancelado = false;

    import("@google/model-viewer")
      .then(() => {
        if (!cancelado) setRegistrado(true);
      })
      .catch(() => {
        if (!cancelado) setEstado("error");
      });

    return () => {
      cancelado = true;
    };
  }, [tieneModelo]);

  // Los eventos de <model-viewer> no burbujean: hay que escucharlos sobre el
  // propio elemento, que recien existe cuando `registrado` es true.
  useEffect(() => {
    if (!registrado) return;
    const visor = contenedorRef.current?.querySelector("model-viewer") as
      | (HTMLElement & { loaded?: boolean; canActivateAR?: boolean })
      | null;
    if (!visor) return;

    const marcarListo = () => {
      setEstado("listo");
      // canActivateAR es false en escritorio y en navegadores sin soporte AR.
      setArDisponible(Boolean(visor.canActivateAR));
    };
    const alFallar = () => setEstado("error");

    // El modelo puede haber terminado de cargar antes de que corra este efecto.
    if (visor.loaded) {
      marcarListo();
      return;
    }

    visor.addEventListener("load", marcarListo);
    visor.addEventListener("error", alFallar);
    return () => {
      visor.removeEventListener("load", marcarListo);
      visor.removeEventListener("error", alFallar);
    };
  }, [registrado]);

  const abrirAr = useCallback(() => {
    const visor = contenedorRef.current?.querySelector("model-viewer") as
      | (HTMLElement & { activateAR?: () => Promise<void> })
      | null;

    // Primero el AR y despues la metrica, nunca al reves: activateAR() tiene
    // que salir dentro del gesto del usuario o el navegador no abre la camara.
    void visor?.activateAR?.();
    void registrarVista(plato.id);
  }, [plato.id]);

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={contenedorRef}
        className="border-borde bg-superficie relative aspect-square w-full overflow-hidden rounded-card border"
      >
        {/* Capa de fondo: la foto del plato (o su placeholder). Queda visible
            mientras el modelo carga y detras del modelo cuando termina. */}
        <div className="absolute inset-0">
          <DishImage
            plato={plato}
            icono={icono}
            priority
            sizes="(min-width: 640px) 640px, 100vw"
          />
        </div>

        {/*
          ar-placement="floor" significa "superficie horizontal", no el piso:
          la mesa entra. Solo lo leen WebXR y Scene Viewer; en iPhone, Quick
          Look lo ignora y decide solo donde apoyar el modelo.

          ar-scale="fixed" hace que el plato se vea a tamano real y que el
          cliente no pueda agrandarlo con los dedos. Es el punto de todo esto:
          mostrar la porcion que le van a servir. Si se puede redimensionar,
          el menu miente. Se traduce a resizable=false en Scene Viewer y a
          allowsContentScaling=0 en Quick Look.

          Que el modelo quede sobre la mesa y no en el piso depende de que
          este a escala real, no de estos atributos: un modelo de 2 m no entra
          en una mesa. Ver public/models/README.txt.
        */}
        {registrado && tieneModelo && (
          <model-viewer
            className="absolute inset-0"
            src={plato.modelo3dGlb ?? undefined}
            ios-src={plato.modelo3dUsdz ?? undefined}
            alt={`Modelo 3D de ${plato.nombre}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="floor"
            ar-scale="fixed"
            camera-controls
            touch-action="pan-y"
            shadow-intensity="1"
            exposure="1"
            loading="eager"
            interaction-prompt="none"
          />
        )}

        {estado === "cargando" && tieneModelo && (
          <div className="bg-superficie/85 absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
            <LoaderCircle
              className="text-tinta size-8 animate-spin"
              aria-hidden
            />
            <p
              className="text-tinta text-base font-semibold"
              role="status"
              aria-live="polite"
            >
              Cargando modelo 3D...
            </p>
            <Skeleton className="h-2 w-40" />
          </div>
        )}

        {estado === "error" && (
          <div className="bg-superficie/90 absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <TriangleAlert className="text-tinta-suave size-8" aria-hidden />
            <p className="text-tinta text-base font-semibold">
              No pudimos cargar el modelo 3D
            </p>
            <p className="text-tinta-suave text-sm">
              Revisa tu conexion y volve a intentar.
            </p>
          </div>
        )}
      </div>

      {/* Unico boton de accion de la pantalla. */}
      <Button
        size="lg"
        variant="primary"
        className="w-full"
        onClick={abrirAr}
        disabled={estado !== "listo" || !arDisponible}
      >
        {estado === "cargando" && tieneModelo ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            Cargando modelo 3D...
          </>
        ) : (
          <>
            <View aria-hidden />
            Ver en tu mesa
          </>
        )}
      </Button>

      {estado === "listo" && !arDisponible && (
        <p className="text-tinta-suave flex items-start gap-2 text-sm">
          <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Abri este menu desde tu celular para ver el plato en tu mesa.
            Mientras tanto, arrastra el modelo para girarlo.
          </span>
        </p>
      )}

      {!tieneModelo && (
        <p className="text-tinta-suave text-sm">
          Este plato todavia no tiene modelo 3D.
        </p>
      )}
    </div>
  );
}
