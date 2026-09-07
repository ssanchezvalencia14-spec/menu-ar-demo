"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Aviso, Entrada } from "@/components/admin/campos";
import { guardarHorarios } from "@/lib/admin/acciones";
import { RESULTADO_INICIAL } from "@/lib/admin/tipos";
import { DIAS, NOMBRE_DEL_DIA, aMinutos } from "@/lib/horarios";
import type { Horarios } from "@/types/menu";

export function FormularioDeHorarios({
  horarios,
  zonaHoraria,
}: {
  horarios: Horarios;
  zonaHoraria: string;
}) {
  const [resultado, enviar, enviando] = useActionState(
    guardarHorarios,
    RESULTADO_INICIAL,
  );
  const [estado, setEstado] = useState(horarios);

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <ul className="flex flex-col gap-2">
        {DIAS.map((dia) => {
          const franja = estado[dia];
          const cruzaMedianoche =
            !franja.cerrado &&
            aMinutos(franja.abre) !== null &&
            aMinutos(franja.cierra) !== null &&
            aMinutos(franja.cierra)! <= aMinutos(franja.abre)!;

          return (
            <li
              key={dia}
              className="border-borde bg-superficie flex flex-col gap-2 rounded-card border p-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-tinta w-24 shrink-0 text-sm font-semibold">
                  {NOMBRE_DEL_DIA[dia]}
                </span>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name={`${dia}-cerrado`}
                    checked={franja.cerrado}
                    onChange={(e) =>
                      setEstado((previo) => ({
                        ...previo,
                        [dia]: { ...previo[dia], cerrado: e.target.checked },
                      }))
                    }
                    className="accent-tinta size-4"
                  />
                  <span className="text-tinta-suave text-sm">Cerrado</span>
                </label>

                {!franja.cerrado && (
                  <div className="flex items-center gap-2">
                    <Entrada
                      type="time"
                      name={`${dia}-abre`}
                      value={franja.abre}
                      onChange={(e) =>
                        setEstado((previo) => ({
                          ...previo,
                          [dia]: { ...previo[dia], abre: e.target.value },
                        }))
                      }
                      aria-label={`Hora de apertura del ${NOMBRE_DEL_DIA[dia]}`}
                      className="h-10 w-32"
                    />
                    <span className="text-tinta-tenue text-sm">a</span>
                    <Entrada
                      type="time"
                      name={`${dia}-cierra`}
                      value={franja.cierra}
                      onChange={(e) =>
                        setEstado((previo) => ({
                          ...previo,
                          [dia]: { ...previo[dia], cierra: e.target.value },
                        }))
                      }
                      aria-label={`Hora de cierre del ${NOMBRE_DEL_DIA[dia]}`}
                      className="h-10 w-32"
                    />
                  </div>
                )}

                {/* Los campos ocultos mantienen el valor cuando el dia esta
                    cerrado, para no perder el horario configurado. */}
                {franja.cerrado && (
                  <>
                    <input type="hidden" name={`${dia}-abre`} value={franja.abre} />
                    <input
                      type="hidden"
                      name={`${dia}-cierra`}
                      value={franja.cierra}
                    />
                  </>
                )}
              </div>

              {cruzaMedianoche && (
                <p className="text-tinta-tenue text-xs">
                  Cierra despues de medianoche, ya del dia siguiente.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {resultado.estado === "error" && (
        <Aviso tipo="error">{resultado.mensaje}</Aviso>
      )}
      {resultado.estado === "ok" && resultado.mensaje && (
        <Aviso tipo="ok">{resultado.mensaje}</Aviso>
      )}

      <p className="text-tinta-tenue text-xs">
        El cartel de &quot;Abierto ahora&quot; se calcula con la hora de{" "}
        <span className="text-tinta font-semibold">{zonaHoraria}</span>. Si tu
        local esta en otra zona, cambiala en Mi local.
      </p>

      <Button type="submit" size="lg" disabled={enviando} className="w-fit">
        {enviando ? "Guardando..." : "Guardar horarios"}
      </Button>
    </form>
  );
}
