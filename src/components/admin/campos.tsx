import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Campos del panel. Mas densos que el menu publico (esto lo usa el dueno, no
 * el comensal) pero con el mismo criterio: etiquetas visibles siempre, nada
 * de placeholders que hagan de etiqueta y desaparezcan al escribir.
 */

export function Campo({
  etiqueta,
  ayuda,
  children,
  className,
}: {
  etiqueta: string;
  ayuda?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-tinta text-sm font-semibold">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-tinta-tenue text-xs">{ayuda}</span>}
    </label>
  );
}

export function Entrada({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-borde-fuerte bg-superficie text-tinta h-11 rounded-lg border px-3 text-base",
        "disabled:bg-lienzo disabled:text-tinta-tenue",
        className,
      )}
      {...props}
    />
  );
}

export function AreaDeTexto({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-borde-fuerte bg-superficie text-tinta rounded-lg border px-3 py-2 text-base",
        className,
      )}
      {...props}
    />
  );
}

export function Selector({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-borde-fuerte bg-superficie text-tinta h-11 rounded-lg border px-3 text-base",
        className,
      )}
      {...props}
    />
  );
}

/** Interruptor con etiqueta al lado. El input real queda accesible. */
export function Interruptor({
  etiqueta,
  ayuda,
  ...props
}: React.ComponentProps<"input"> & { etiqueta: string; ayuda?: string }) {
  return (
    <label className="border-borde bg-superficie flex cursor-pointer items-start gap-3 rounded-lg border p-3">
      <input
        type="checkbox"
        className="accent-tinta mt-0.5 size-5 shrink-0"
        {...props}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-tinta text-sm font-semibold">{etiqueta}</span>
        {ayuda && <span className="text-tinta-tenue text-xs">{ayuda}</span>}
      </span>
    </label>
  );
}

/** Mensaje de resultado de un formulario. */
export function Aviso({
  tipo,
  children,
}: {
  tipo: "ok" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={cn(
        "animar-entrada rounded-lg px-3 py-2 text-sm font-semibold",
        tipo === "ok"
          ? "bg-emerald-50 text-emerald-800"
          : "bg-destacado-fondo text-destacado",
      )}
    >
      {children}
    </p>
  );
}
