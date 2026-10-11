"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Aviso } from "@/components/admin/campos";
import { guardarApariencia } from "@/lib/admin/acciones";
import { RESULTADO_INICIAL } from "@/lib/admin/tipos";
import {
  ACENTOS,
  DISTRIBUCIONES,
  ESQUINAS,
  type Acento,
  type Distribucion,
  type Esquinas,
  type Tema,
} from "@/lib/tema";
import { cn } from "@/lib/utils";

/**
 * Apariencia del menu.
 *
 * Todo se elige tocando algo que ya se parece al resultado, nunca escribiendo
 * un valor. Quien usa esto no sabe que es un hexadecimal ni un radio de borde,
 * y no tiene por que saberlo: ve el color, ve la forma, toca y listo.
 *
 * La vista previa se actualiza al instante, antes de guardar. Sin eso habria
 * que guardar, abrir el menu en otra pestana y volver, por cada prueba.
 */
export function FormularioDeApariencia({ tema }: { tema: Tema }) {
  const [resultado, enviar, enviando] = useActionState(
    guardarApariencia,
    RESULTADO_INICIAL,
  );

  const [acento, setAcento] = useState<Acento>(tema.acento);
  const [distribucion, setDistribucion] = useState<Distribucion>(
    tema.distribucion,
  );
  const [esquinas, setEsquinas] = useState<Esquinas>(tema.esquinas);

  return (
    <form action={enviar} className="flex flex-col gap-8">
      {/* Los valores viajan en campos ocultos: los controles visibles son
          botones, no radios, porque un radio nativo no se puede pintar como
          una muestra de color sin pelear con el navegador. */}
      <input type="hidden" name="acento" value={acento} />
      <input type="hidden" name="distribucion" value={distribucion} />
      <input type="hidden" name="esquinas" value={esquinas} />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-tinta text-sm font-semibold">
          Color de la marca
        </legend>
        <p className="text-tinta-tenue text-xs">
          Se usa en la estrella de la especialidad y en los detalles del menu.
        </p>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(ACENTOS) as Acento[]).map((clave) => {
            const opcion = ACENTOS[clave];
            const elegido = acento === clave;
            return (
              <button
                key={clave}
                type="button"
                onClick={() => setAcento(clave)}
                aria-pressed={elegido}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold",
                  "transition-[border-color,transform] duration-150 ease-out",
                  "motion-safe:active:scale-[0.97]",
                  elegido
                    ? "border-tinta text-tinta"
                    : "border-borde text-tinta-suave hover:border-borde-fuerte",
                )}
              >
                <span
                  aria-hidden
                  className="size-5 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: opcion.color }}
                />
                {opcion.nombre}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-tinta text-sm font-semibold">
          Como se ordenan los platos
        </legend>

        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(DISTRIBUCIONES) as Distribucion[]).map((clave) => {
            const opcion = DISTRIBUCIONES[clave];
            const elegido = distribucion === clave;
            return (
              <button
                key={clave}
                type="button"
                onClick={() => setDistribucion(clave)}
                aria-pressed={elegido}
                className={cn(
                  "flex flex-col gap-2 rounded-card border p-3 text-left",
                  "transition-[border-color,transform] duration-150 ease-out",
                  "motion-safe:active:scale-[0.99]",
                  elegido
                    ? "border-tinta bg-superficie"
                    : "border-borde hover:border-borde-fuerte",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-tinta text-sm font-semibold">
                    {opcion.nombre}
                  </span>
                  {elegido && (
                    <Check className="text-tinta size-4 shrink-0" aria-hidden />
                  )}
                </span>

                {/* Dibujo del acomodo, no una captura: comunica la idea en un
                    golpe de vista y no se desactualiza con el diseno. */}
                <span aria-hidden className="flex gap-1">
                  {clave === "grilla" ? (
                    <>
                      <span className="bg-borde-fuerte h-10 flex-1 rounded" />
                      <span className="bg-borde-fuerte h-10 flex-1 rounded" />
                    </>
                  ) : (
                    <span className="flex w-full flex-col gap-1">
                      <span className="bg-borde-fuerte h-3 w-full rounded" />
                      <span className="bg-borde-fuerte h-3 w-full rounded" />
                      <span className="bg-borde-fuerte h-3 w-full rounded" />
                    </span>
                  )}
                </span>

                <span className="text-tinta-tenue text-xs">{opcion.ayuda}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-tinta text-sm font-semibold">
          Forma de las esquinas
        </legend>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(ESQUINAS) as Esquinas[]).map((clave) => {
            const opcion = ESQUINAS[clave];
            const elegido = esquinas === clave;
            return (
              <button
                key={clave}
                type="button"
                onClick={() => setEsquinas(clave)}
                aria-pressed={elegido}
                className={cn(
                  "flex items-center gap-2 border px-3 py-2 text-sm font-semibold",
                  "transition-[border-color,transform] duration-150 ease-out",
                  "motion-safe:active:scale-[0.97]",
                  elegido
                    ? "border-tinta text-tinta"
                    : "border-borde text-tinta-suave hover:border-borde-fuerte",
                )}
                style={{ borderRadius: opcion.radio }}
              >
                {opcion.nombre}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Vista previa en vivo. Usa las mismas variables CSS que el menu real,
          asi que lo que se ve aca es literalmente lo que va a ver el cliente. */}
      <div className="flex flex-col gap-3">
        <span className="text-tinta text-sm font-semibold">Vista previa</span>
        <div
          className="bg-lienzo border-borde border p-4"
          style={
            {
              "--color-destacado": ACENTOS[acento].color,
              "--color-destacado-fondo": ACENTOS[acento].fondo,
              "--radius-card": ESQUINAS[esquinas].radio,
              borderRadius: ESQUINAS[esquinas].radio,
            } as React.CSSProperties
          }
        >
          <div
            className={
              distribucion === "lista"
                ? "flex flex-col gap-2"
                : "grid grid-cols-2 gap-3"
            }
          >
            {["Plato de carne", "Postre de chocolate"].map((nombre, i) => (
              <div
                key={nombre}
                className={cn(
                  "bg-superficie border-borde rounded-card flex border",
                  distribucion === "lista" ? "flex-row" : "flex-col",
                )}
              >
                <div
                  className={cn(
                    "bg-destacado-fondo shrink-0",
                    distribucion === "lista"
                      ? "aspect-square w-14"
                      : "aspect-4/3 w-full",
                  )}
                  style={{
                    borderTopLeftRadius: ESQUINAS[esquinas].radio,
                    borderTopRightRadius:
                      distribucion === "lista" ? 0 : ESQUINAS[esquinas].radio,
                    borderBottomLeftRadius:
                      distribucion === "lista" ? ESQUINAS[esquinas].radio : 0,
                  }}
                />
                <div className="flex flex-col gap-1 p-2.5">
                  <span className="text-tinta text-xs font-semibold">
                    {nombre}
                  </span>
                  <span className="text-tinta text-sm font-bold tabular-nums">
                    $ {i === 0 ? "46.000" : "16.000"}
                  </span>
                  {i === 0 && (
                    <span
                      className="w-fit rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: ACENTOS[acento].color,
                        backgroundColor: ACENTOS[acento].fondo,
                      }}
                    >
                      Especialidad
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {resultado.estado === "error" && (
        <Aviso tipo="error">{resultado.mensaje}</Aviso>
      )}
      {resultado.estado === "ok" && resultado.mensaje && (
        <Aviso tipo="ok">{resultado.mensaje}</Aviso>
      )}

      <Button type="submit" size="lg" disabled={enviando} className="w-fit">
        {enviando ? "Guardando..." : "Guardar apariencia"}
      </Button>
    </form>
  );
}
