"use client";

import { useState } from "react";

import { Estrellas } from "@/components/resenas/estrellas";
import { cn } from "@/lib/utils";
import type { OpinionAdmin } from "@/lib/admin/datos";

const TODOS_LOS_PLATOS = "";

/**
 * Lista de opiniones con dos filtros: por plato, y solo las que traen texto.
 * Filtra en memoria: la pagina ya trae todas de una vez.
 */
export function ListaDeOpiniones({
  opiniones,
  hayMas,
}: {
  /** `fecha` ya viene escrita para leer ("ayer", "3 de octubre"). */
  opiniones: OpinionAdmin[];
  hayMas: boolean;
}) {
  // Por defecto solo las que tienen texto: es lo que el dueno viene a leer.
  const [soloConComentario, setSoloConComentario] = useState(true);
  const [platoId, setPlatoId] = useState(TODOS_LOS_PLATOS);

  const platos = Array.from(
    new Map(opiniones.map((o) => [o.platoId, o.platoNombre])),
  ).sort(([, a], [, b]) => a.localeCompare(b));

  const visibles = opiniones.filter(
    (o) =>
      (!soloConComentario || o.comentario) &&
      (platoId === TODOS_LOS_PLATOS || o.platoId === platoId),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Que opiniones mostrar"
          className="border-borde bg-superficie inline-flex rounded-lg border p-1"
        >
          <BotonFiltro
            activo={soloConComentario}
            onClick={() => setSoloConComentario(true)}
          >
            Con comentario
          </BotonFiltro>
          <BotonFiltro
            activo={!soloConComentario}
            onClick={() => setSoloConComentario(false)}
          >
            Todas
          </BotonFiltro>
        </div>

        <label className="text-tinta-suave flex min-w-0 items-center gap-2 text-sm">
          <span className="shrink-0">Plato:</span>
          <select
            value={platoId}
            onChange={(e) => setPlatoId(e.target.value)}
            className="border-borde bg-superficie text-tinta min-w-0 rounded-lg border px-3 py-2 text-sm"
          >
            <option value={TODOS_LOS_PLATOS}>Todos</option>
            {platos.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="border-borde text-tinta-suave rounded-card border border-dashed p-6 text-center text-sm">
          {soloConComentario
            ? "Ninguna opinion de este filtro trae comentario. Toca \"Todas\" para ver tambien las que solo dejaron estrellas."
            : "No hay opiniones para este plato."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibles.map((opinion) => (
            <li
              key={opinion.id}
              className="border-borde bg-superficie flex flex-col gap-2 rounded-card border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-tinta text-base font-semibold">
                  {opinion.platoNombre}
                </span>
                <span className="text-tinta-tenue text-xs">{opinion.fecha}</span>
              </div>
              <span className="flex items-center gap-2">
                <Estrellas promedio={opinion.calificacion} />
                <span className="sr-only">
                  {opinion.calificacion} de 5 estrellas
                </span>
              </span>
              {opinion.comentario ? (
                <p className="text-tinta text-sm whitespace-pre-line">
                  {opinion.comentario}
                </p>
              ) : (
                <p className="text-tinta-tenue text-sm italic">
                  Solo dejo estrellas, sin comentario.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {hayMas && (
        <p className="text-tinta-tenue text-center text-xs">
          Se muestran las {opiniones.length} opiniones mas recientes.
        </p>
      )}
    </div>
  );
}

function BotonFiltro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
        activo ? "bg-tinta text-white" : "text-tinta-suave hover:text-tinta",
      )}
    >
      {children}
    </button>
  );
}
