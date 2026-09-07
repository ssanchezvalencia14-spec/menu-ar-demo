"use client";

import { useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Restaurante } from "@/types/menu";

/**
 * Cartel de mesa: el QR que se imprime y se pone en cada mesa.
 *
 * La URL se calcula en el cliente a partir de la direccion actual, asi el QR
 * generado desde la red local ya apunta a la IP correcta. Igual se puede
 * escribir a mano cuando el menu este publicado en un dominio real.
 */
/** El origen del navegador. En el servidor no existe: devolvemos cadena vacia. */
const suscribirse = () => () => {};
const origenDelNavegador = () => window.location.origin;
const origenEnElServidor = () => "";

export function QrPoster({ restaurante }: { restaurante: Restaurante }) {
  const origen = useSyncExternalStore(
    suscribirse,
    origenDelNavegador,
    origenEnElServidor,
  );
  // `null` = todavia no la tocaron, va la direccion detectada sola.
  const [urlEditada, setUrlEditada] = useState<string | null>(null);

  const url = urlEditada ?? (origen ? `${origen}/${restaurante.slug}` : "");
  const esLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      {/* Bloque imprimible. */}
      <div className="border-borde bg-superficie flex flex-col items-center gap-6 rounded-card border px-6 py-10 text-center print:border-0 print:py-0">
        <div>
          <p className="text-tinta-suave text-sm font-semibold tracking-widest uppercase">
            {restaurante.nombre}
          </p>
          <h2 className="text-tinta mt-2 text-3xl leading-tight font-bold text-balance">
            Mira los platos en tu mesa
          </h2>
        </div>

        <div className="flex size-60 items-center justify-center">
          {url ? (
            <QRCodeSVG
              value={url}
              size={240}
              level="M"
              marginSize={4}
              bgColor="#ffffff"
              fgColor="#12100e"
              title={`Menu de ${restaurante.nombre}`}
            />
          ) : (
            <Skeleton className="size-60" />
          )}
        </div>

        <p className="text-tinta-suave max-w-xs text-base leading-relaxed">
          Apunta la camara de tu celular al codigo. No hace falta instalar
          ninguna aplicacion.
        </p>
      </div>

      {/* Controles: no se imprimen. */}
      <div className="flex flex-col gap-3 print:hidden">
        <label
          htmlFor="url-del-menu"
          className="text-tinta text-sm font-semibold"
        >
          A donde apunta el codigo
        </label>
        <input
          id="url-del-menu"
          type="url"
          value={url}
          onChange={(evento) => setUrlEditada(evento.target.value)}
          spellCheck={false}
          autoComplete="off"
          className="border-borde-fuerte bg-superficie text-tinta h-12 rounded-xl border px-4 text-base"
        />

        {esLocalhost && (
          <p className="text-destacado text-sm leading-relaxed">
            Este codigo apunta a tu computadora y no va a abrir desde el
            celular. Reemplaza la direccion por la IP de tu red (por ejemplo
            http://192.168.1.10:3000/{restaurante.slug}) o por la URL publica
            del menu.
          </p>
        )}

        <Button variant="outline" size="lg" onClick={() => window.print()}>
          <Printer aria-hidden />
          Imprimir el cartel
        </Button>
      </div>
    </div>
  );
}
