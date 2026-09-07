"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Entrada } from "@/components/admin/campos";
import { getSupabaseNavegador } from "@/lib/supabase/navegador";
import { cn } from "@/lib/utils";

/**
 * Subida a Supabase Storage, directo del navegador.
 *
 * El tipo de contenido se fuerza a mano y no se deja inferir. Es la parte
 * critica: Supabase le pone `application/octet-stream` a las extensiones que
 * no conoce, y Quick Look en iPhone se niega a abrir un .usdz que no venga
 * como `model/vnd.usdz+zip`. Sin esto el AR deja de funcionar para todo lo
 * que suba el restaurante, y recien se nota frente al cliente.
 */
const TIPOS_FORZADOS: Record<string, string> = {
  glb: "model/gltf-binary",
  usdz: "model/vnd.usdz+zip",
};

export function SubirArchivo({
  nombreDelCampo,
  etiqueta,
  ayuda,
  extensiones,
  carpeta,
  restauranteId,
  valorInicial,
}: {
  nombreDelCampo: string;
  etiqueta: string;
  ayuda?: string;
  /** Ej: [".glb"] o [".jpg", ".png", ".webp"] */
  extensiones: string[];
  /** Subcarpeta dentro del restaurante: "fotos" o "modelos". */
  carpeta: string;
  restauranteId: string;
  valorInicial: string | null;
}) {
  const [valor, setValor] = useState(valorInicial ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entradaDeArchivo = useRef<HTMLInputElement>(null);

  async function subir(archivo: File) {
    setSubiendo(true);
    setError(null);

    const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!extensiones.includes(`.${extension}`)) {
      setSubiendo(false);
      setError(`Ese archivo no sirve aca. Tiene que ser ${extensiones.join(" o ")}.`);
      return;
    }

    // Nombre unico: si el restaurante sube dos veces "plato.jpg", el navegador
    // podria seguir mostrando la version vieja desde la cache.
    const nombre = `${restauranteId}/${carpeta}/${crypto.randomUUID()}.${extension}`;

    const supabase = getSupabaseNavegador();
    const { error: fallo } = await supabase.storage
      .from("menu")
      .upload(nombre, archivo, {
        contentType: TIPOS_FORZADOS[extension] ?? archivo.type,
        upsert: false,
      });

    if (fallo) {
      setSubiendo(false);
      setError("No pudimos subir el archivo. Intenta de nuevo.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("menu").getPublicUrl(nombre);

    setValor(publicUrl);
    setSubiendo(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-tinta text-sm font-semibold">{etiqueta}</span>

      {/* El valor real que viaja en el formulario. Se puede pegar una URL
          a mano si el archivo ya vive en otro lado. */}
      <div className="flex gap-2">
        <Entrada
          name={nombreDelCampo}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Pega una URL o subi un archivo"
          className="min-w-0 flex-1"
        />
        {valor && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Quitar ${etiqueta}`}
            onClick={() => setValor("")}
          >
            <X aria-hidden />
          </Button>
        )}
      </div>

      <input
        ref={entradaDeArchivo}
        type="file"
        accept={extensiones.join(",")}
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) void subir(archivo);
          e.target.value = "";
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="md"
        disabled={subiendo}
        onClick={() => entradaDeArchivo.current?.click()}
        className="w-fit"
      >
        {subiendo ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            Subiendo...
          </>
        ) : (
          <>
            <Upload aria-hidden />
            Subir archivo
          </>
        )}
      </Button>

      {error && (
        <span className="text-destacado text-xs font-semibold" role="alert">
          {error}
        </span>
      )}
      {ayuda && !error && (
        <span className={cn("text-tinta-tenue text-xs")}>{ayuda}</span>
      )}
    </div>
  );
}
