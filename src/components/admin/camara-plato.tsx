"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Captura la foto del plato con la camara del propio telefono.
 *
 * Por que existe: antes la unica via era "elegir un archivo", que en un celular
 * obliga a salir de la app, abrir la camara, volver y buscar la foto en la
 * galeria. El mesero que esta parado al lado del plato quiere apuntar y listo.
 *
 * getUserMedia exige contexto seguro: funciona en HTTPS y en localhost, y no
 * funciona si alguien abre el panel por IP de red local. Ese caso se detecta y
 * se avisa, en vez de dejar un boton que no hace nada.
 */

/** Lado mas largo de la foto que se sube. */
const LADO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.85;

type Estado = "pidiendo" | "filmando" | "revisando" | "sin-permiso" | "sin-camara";

export function CamaraPlato({
  onListo,
  onCerrar,
}: {
  /** Recibe la foto ya reducida y comprimida, lista para subir. */
  onListo: (archivo: File) => void;
  onCerrar: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const flujo = useRef<MediaStream | null>(null);

  const [estado, setEstado] = useState<Estado>("pidiendo");
  const [previa, setPrevia] = useState<string | null>(null);

  // Apagar la camara de verdad al salir. Si solo se oculta el video, el
  // indicador del telefono sigue encendido y el usuario cree que lo espiamos.
  const apagarCamara = useCallback(() => {
    flujo.current?.getTracks().forEach((pista) => pista.stop());
    flujo.current = null;
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function encender() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado("sin-camara");
        return;
      }

      try {
        // `environment` pide la camara trasera, que es la que apunta al plato.
        // Si el equipo solo tiene una, el navegador entrega esa igual.
        const medio = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (cancelado) {
          medio.getTracks().forEach((p) => p.stop());
          return;
        }

        flujo.current = medio;
        if (video.current) {
          video.current.srcObject = medio;
          await video.current.play().catch(() => {});
        }
        setEstado("filmando");
      } catch (fallo) {
        if (cancelado) return;
        const nombre = (fallo as DOMException)?.name;
        setEstado(
          nombre === "NotAllowedError" || nombre === "SecurityError"
            ? "sin-permiso"
            : "sin-camara",
        );
      }
    }

    void encender();
    return () => {
      cancelado = true;
      apagarCamara();
    };
  }, [apagarCamara]);

  // Cerrar con Escape: el panel se usa tambien desde una computadora.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  function capturar() {
    const v = video.current;
    const c = lienzo.current;
    if (!v || !c || !v.videoWidth) return;

    // Se reduce antes de subir: una foto de celular moderno pesa varios MB y
    // el menu la muestra, como mucho, a 600 px de ancho. Subirla entera gasta
    // los datos del restaurante y hace lento el menu del comensal.
    const escala = Math.min(1, LADO_MAXIMO / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * escala);
    c.height = Math.round(v.videoHeight * escala);

    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);

    setPrevia(c.toDataURL("image/jpeg", CALIDAD_JPEG));
    setEstado("revisando");
    apagarCamara();
  }

  function confirmar() {
    const c = lienzo.current;
    if (!c) return;

    c.toBlob(
      (blob) => {
        if (!blob) return;
        onListo(
          new File([blob], `plato-${Date.now()}.jpg`, { type: "image/jpeg" }),
        );
      },
      "image/jpeg",
      CALIDAD_JPEG,
    );
  }

  function repetir() {
    setPrevia(null);
    setEstado("pidiendo");
    // Vuelve a montar el efecto de encendido cambiando de estado: mas simple
    // y menos propenso a fugas que reabrir el flujo a mano.
    window.setTimeout(() => {
      void navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
        .then((medio) => {
          flujo.current = medio;
          if (video.current) {
            video.current.srcObject = medio;
            void video.current.play().catch(() => {});
          }
          setEstado("filmando");
        })
        .catch(() => setEstado("sin-camara"));
    }, 0);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tomar la foto del plato"
      className="animar-aparecer fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-sm font-semibold text-white">
          Foto del plato
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar la camara"
          onClick={onCerrar}
          className="text-white"
        >
          <X aria-hidden />
        </Button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* El video se mantiene montado aunque se este revisando: desmontarlo
            y volver a montarlo provoca un parpadeo negro al repetir la toma. */}
        <video
          ref={video}
          playsInline
          muted
          className={
            estado === "filmando"
              ? "h-full w-full object-contain"
              : "pointer-events-none absolute opacity-0"
          }
        />

        {previa && estado === "revisando" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previa}
            alt="Foto recien tomada, para revisar antes de guardarla"
            className="h-full w-full object-contain"
          />
        )}

        {estado === "pidiendo" && (
          <p className="px-8 text-center text-sm text-white/80">
            Pedimos permiso para usar la camara...
          </p>
        )}

        {estado === "sin-permiso" && (
          <p className="px-8 text-center text-sm text-white/80">
            No nos diste permiso para usar la camara. Podes habilitarlo desde
            los ajustes del navegador, o cerrar y elegir una foto de la galeria.
          </p>
        )}

        {estado === "sin-camara" && (
          <p className="px-8 text-center text-sm text-white/80">
            No pudimos abrir la camara en este dispositivo. Cerra esta ventana y
            elegi una foto de la galeria.
          </p>
        )}
      </div>

      <canvas ref={lienzo} className="hidden" />

      <div className="flex items-center justify-center gap-3 p-6 pb-10">
        {estado === "filmando" && (
          <button
            type="button"
            onClick={capturar}
            aria-label="Tomar la foto"
            className="size-18 rounded-full border-4 border-white bg-white/20 transition-transform duration-100 ease-out motion-safe:active:scale-90"
          >
            <Camera className="mx-auto size-7 text-white" aria-hidden />
          </button>
        )}

        {estado === "revisando" && (
          <>
            <Button type="button" variant="outline" size="md" onClick={repetir}>
              <RotateCcw aria-hidden />
              Repetir
            </Button>
            <Button type="button" size="md" onClick={confirmar}>
              Usar esta foto
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
