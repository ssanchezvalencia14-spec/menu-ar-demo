"use client";

import { useState, useTransition } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Confirmacion de acciones destructivas.
 *
 * Nombra lo que se va a borrar y dice que se lleva puesto. Un dueno de
 * restaurante no deberia poder vaciar su menu con un toque distraido, pero
 * tampoco tiene que pelear tres clics para sacar una seccion vacia.
 */
export function ConfirmarBorrado({
  titulo,
  advertencia,
  accion,
  onCancelar,
  etiquetaConfirmar = "Si, eliminar",
}: {
  titulo: string;
  advertencia?: string;
  accion: () => Promise<void>;
  onCancelar: () => void;
  etiquetaConfirmar?: string;
}) {
  const [enCurso, iniciar] = useTransition();

  return (
    <div className="border-destacado bg-destacado-fondo flex flex-col gap-3 rounded-lg border p-4">
      <p className="text-tinta flex items-start gap-2 text-sm font-semibold">
        <TriangleAlert
          className="text-destacado mt-0.5 size-4 shrink-0"
          aria-hidden
        />
        <span>
          {titulo}
          {advertencia && (
            <span className="mt-1 block font-normal">{advertencia}</span>
          )}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={enCurso}
          onClick={() => iniciar(() => void accion())}
          className="bg-destacado"
        >
          {enCurso ? "Eliminando..." : etiquetaConfirmar}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={enCurso}
          onClick={onCancelar}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/** Boton que se despliega en la confirmacion de arriba. */
export function BotonDeBorrado({
  children,
  ...props
}: {
  children: React.ReactNode;
  titulo: string;
  advertencia?: string;
  accion: () => Promise<void>;
  etiquetaConfirmar?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <ConfirmarBorrado {...props} onCancelar={() => setConfirmando(false)} />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      onClick={() => setConfirmando(true)}
      className="text-destacado"
    >
      {children}
    </Button>
  );
}
