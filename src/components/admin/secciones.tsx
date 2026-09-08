"use client";

import { useActionState, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Aviso, Campo, Entrada, Selector } from "@/components/admin/campos";
import { ConfirmarBorrado } from "@/components/admin/confirmar";
import {
  crearCategoria,
  eliminarCategoria,
  moverCategoria,
  renombrarCategoria,
} from "@/lib/admin/acciones";
import { RESULTADO_INICIAL } from "@/lib/admin/tipos";
import type { CategoriaAdmin } from "@/lib/admin/datos";

/**
 * Dibujo que se usa de fondo en los platos que todavia no tienen foto.
 * Se nombra por lo que se ve, no por la categoria: el dueno elige mirando
 * el dibujo, no adivinando a que tipo pertenece su seccion.
 */
const ICONOS = [
  { valor: "principal", etiqueta: "Cubiertos" },
  { valor: "entrada", etiqueta: "Plato hondo" },
  { valor: "postre", etiqueta: "Porcion de torta" },
  { valor: "bebida", etiqueta: "Vaso" },
];

export function GestionDeSecciones({
  categorias,
}: {
  categorias: CategoriaAdmin[];
}) {
  const [creando, setCreando] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {categorias.length === 0 ? (
        <p className="border-borde text-tinta-suave rounded-card border border-dashed p-6 text-center text-sm">
          Todavia no tenes secciones. Cre&aacute; la primera para poder cargar
          platos.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categorias.map((categoria, indice) => (
            <FilaDeSeccion
              key={categoria.id}
              categoria={categoria}
              esPrimera={indice === 0}
              esUltima={indice === categorias.length - 1}
            />
          ))}
        </ul>
      )}

      {creando ? (
        <FormularioDeAlta onListo={() => setCreando(false)} />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setCreando(true)}
          className="w-fit"
        >
          <Plus aria-hidden />
          Nueva seccion
        </Button>
      )}
    </div>
  );
}

function FormularioDeAlta({ onListo }: { onListo: () => void }) {
  const [resultado, enviar, enviando] = useActionState(
    crearCategoria,
    RESULTADO_INICIAL,
  );

  if (resultado.estado === "ok") {
    // Se cierra sola al crear, para poder encadenar varias altas.
    queueMicrotask(onListo);
  }

  return (
    <form
      action={enviar}
      className="border-borde bg-superficie flex flex-col gap-4 rounded-card border p-4"
    >
      <Campo etiqueta="Nombre de la seccion" ayuda="Ej: Entradas, Para compartir, Cafeteria">
        <Entrada name="nombre" required autoFocus maxLength={60} />
      </Campo>

      <Campo
        etiqueta="Dibujo para los platos sin foto"
        ayuda="Se usa de fondo mientras no cargues la foto real del plato."
      >
        <Selector name="icono" defaultValue="principal">
          {ICONOS.map((i) => (
            <option key={i.valor} value={i.valor}>
              {i.etiqueta}
            </option>
          ))}
        </Selector>
      </Campo>

      {resultado.estado === "error" && (
        <Aviso tipo="error">{resultado.mensaje}</Aviso>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="md" disabled={enviando}>
          {enviando ? "Creando..." : "Crear seccion"}
        </Button>
        <Button type="button" variant="outline" size="md" onClick={onListo}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function FilaDeSeccion({
  categoria,
  esPrimera,
  esUltima,
}: {
  categoria: CategoriaAdmin;
  esPrimera: boolean;
  esUltima: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [moviendo, mover] = useTransition();
  const [borrando, setBorrando] = useState(false);

  if (editando) {
    return (
      <li>
        <FormularioDeEdicion
          categoria={categoria}
          onListo={() => setEditando(false)}
        />
      </li>
    );
  }

  return (
    <li className="border-borde bg-superficie flex flex-col gap-3 rounded-card border p-3">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            aria-label={`Subir ${categoria.nombre}`}
            disabled={esPrimera || moviendo}
            onClick={() => mover(() => void moverCategoria(categoria.id, "arriba"))}
            className="text-tinta-suave hover:bg-lienzo hover:text-tinta flex size-8 items-center justify-center rounded disabled:opacity-20"
          >
            <ChevronUp className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Bajar ${categoria.nombre}`}
            disabled={esUltima || moviendo}
            onClick={() => mover(() => void moverCategoria(categoria.id, "abajo"))}
            className="text-tinta-suave hover:bg-lienzo hover:text-tinta flex size-8 items-center justify-center rounded disabled:opacity-20"
          >
            <ChevronDown className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-tinta truncate text-base font-semibold">
            {categoria.nombre}
          </p>
          <p className="text-tinta-tenue text-xs">
            {categoria.cantidadDePlatos === 0
              ? "Sin platos. No se muestra en el menu."
              : `${categoria.cantidadDePlatos} ${categoria.cantidadDePlatos === 1 ? "plato" : "platos"}`}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Editar ${categoria.nombre}`}
          onClick={() => setEditando(true)}
        >
          <Pencil aria-hidden />
        </Button>

        {!borrando && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Eliminar ${categoria.nombre}`}
            onClick={() => setBorrando(true)}
            className="text-destacado"
          >
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>

      {borrando && (
        <ConfirmarBorrado
          titulo={`Eliminar la seccion "${categoria.nombre}"`}
          advertencia={
            categoria.cantidadDePlatos > 0
              ? `Se van a borrar tambien sus ${categoria.cantidadDePlatos} platos, con sus resenas. Esto no se puede deshacer. Si solo queres sacarla del menu por un tiempo, pausa sus platos en vez de borrarla.`
              : "Esta seccion no tiene platos. Esto no se puede deshacer."
          }
          accion={async () => {
            await eliminarCategoria(categoria.id);
          }}
          onCancelar={() => setBorrando(false)}
        />
      )}
    </li>
  );
}

function FormularioDeEdicion({
  categoria,
  onListo,
}: {
  categoria: CategoriaAdmin;
  onListo: () => void;
}) {
  const [resultado, enviar, enviando] = useActionState(
    renombrarCategoria,
    RESULTADO_INICIAL,
  );

  if (resultado.estado === "ok") queueMicrotask(onListo);

  return (
    <form
      action={enviar}
      className="border-tinta bg-superficie flex flex-col gap-4 rounded-card border p-4"
    >
      <input type="hidden" name="id" value={categoria.id} />

      <Campo etiqueta="Nombre de la seccion">
        <Entrada
          name="nombre"
          defaultValue={categoria.nombre}
          required
          autoFocus
          maxLength={60}
        />
      </Campo>

      <Campo etiqueta="Dibujo para los platos sin foto">
        <Selector name="icono" defaultValue={categoria.icono}>
          {ICONOS.map((i) => (
            <option key={i.valor} value={i.valor}>
              {i.etiqueta}
            </option>
          ))}
        </Selector>
      </Campo>

      {resultado.estado === "error" && (
        <Aviso tipo="error">{resultado.mensaje}</Aviso>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="md" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" size="md" onClick={onListo}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
