"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  ImagePlus,
  Link2,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CamaraPlato } from "@/components/admin/camara-plato";
import { Entrada } from "@/components/admin/campos";
import { getSupabaseNavegador } from "@/lib/supabase/navegador";

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

const TAMANO_MAXIMO_MB = 20;

export function SubirArchivo({
  nombreDelCampo,
  etiqueta,
  ayuda,
  extensiones,
  carpeta,
  restauranteId,
  valorInicial,
  esImagen = false,
  permitirCamara = false,
  onCambio,
  valorForzado,
}: {
  nombreDelCampo: string;
  etiqueta: string;
  ayuda?: string;
  /** Ej: [".glb"] o [".jpg", ".png", ".webp"] */
  extensiones: string[];
  /** Subcarpeta dentro del restaurante: "fotos", "modelos" o "marca". */
  carpeta: string;
  restauranteId: string;
  valorInicial: string | null;
  /** Si es imagen se muestra la miniatura; si no, solo el estado "cargado". */
  esImagen?: boolean;
  /** Agrega el boton para tomar la foto con la camara del propio telefono. */
  permitirCamara?: boolean;
  /** Avisa al padre cada vez que cambia la URL, para que pueda reaccionar. */
  onCambio?: (url: string) => void;
  /** URL impuesta desde afuera (ej: el .usdz que genera el convertidor). */
  valorForzado?: string | null;
}) {
  const [valor, setValor] = useState(valorInicial ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pegandoEnlace, setPegandoEnlace] = useState(false);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [forzadoAnterior, setForzadoAnterior] = useState(valorForzado);
  const entradaDeArchivo = useRef<HTMLInputElement>(null);

  // El convertidor de .glb a .usdz escribe el resultado aca desde afuera.
  //
  // Se ajusta DURANTE el render y no en un useEffect. Un efecto que llama a
  // setState provoca un render extra: el usuario llega a ver el campo vacio
  // un instante antes de que aparezca el archivo. Ademas es la forma que
  // documenta React para reaccionar al cambio de una prop, y la que exige la
  // regla de lint react-hooks/set-state-in-effect.
  if (valorForzado !== forzadoAnterior) {
    setForzadoAnterior(valorForzado);
    if (valorForzado != null) setValor(valorForzado);
  }

  // Un solo lugar donde cambia la URL, para que el padre siempre se entere.
  // Antes `setValor` se llamaba desde tres sitios distintos y agregar un aviso
  // en cada uno es justo como se olvida uno.
  function aplicarValor(nueva: string) {
    setValor(nueva);
    onCambio?.(nueva);
  }

  // getUserMedia solo existe en contexto seguro. Si el panel se abrio por IP de
  // red local el boton no serviria, asi que directamente no se ofrece.
  const hayCamara =
    permitirCamara &&
    typeof window !== "undefined" &&
    window.isSecureContext &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  async function subir(archivo: File) {
    setError(null);

    const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!extensiones.includes(`.${extension}`)) {
      setError(
        `Ese archivo no sirve aca. Tiene que ser ${extensiones.join(" o ")}.`,
      );
      return;
    }

    if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      setError(
        `El archivo pesa demasiado (${Math.round(archivo.size / 1024 / 1024)} MB). El maximo son ${TAMANO_MAXIMO_MB} MB.`,
      );
      return;
    }

    setSubiendo(true);

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

    aplicarValor(publicUrl);
    setSubiendo(false);
  }

  const tieneArchivo = Boolean(valor);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-tinta text-sm font-semibold">{etiqueta}</span>

      {/* El valor que viaja en el formulario. Nunca se muestra crudo: una URL
          larga de Storage no le dice nada a un dueno de restaurante. */}
      <input type="hidden" name={nombreDelCampo} value={valor} />

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

      {tieneArchivo ? (
        <div className="border-borde bg-superficie flex items-center gap-3 rounded-lg border p-3">
          {esImagen ? (
            <span className="bg-lienzo relative size-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={valor}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </span>
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Check className="size-5" aria-hidden />
            </span>
          )}

          {/* Con la miniatura a la vista, el texto sobra y en pantallas
              angostas empujaba los botones. Solo se escribe cuando no hay
              nada visual que mostrar. */}
          <span className="text-tinta min-w-0 flex-1 text-sm font-semibold">
            {esImagen ? "" : "Archivo cargado"}
          </span>

          {hayCamara && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Tomar una foto nueva con la camara"
              onClick={() => setCamaraAbierta(true)}
              disabled={subiendo}
            >
              <Camera aria-hidden />
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => entradaDeArchivo.current?.click()}
            disabled={subiendo}
          >
            {subiendo ? "Subiendo..." : "Cambiar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Quitar ${etiqueta}`}
            onClick={() => aplicarValor("")}
            className="text-destacado"
          >
            <X aria-hidden />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* La camara va primero y como accion principal: el caso normal es
              un mesero parado al lado del plato con el telefono en la mano.
              Buscar un archivo en la galeria es el camino secundario. */}
          {hayCamara && !subiendo && (
            <Button
              type="button"
              size="md"
              onClick={() => setCamaraAbierta(true)}
              className="w-full"
            >
              <Camera aria-hidden />
              Tomar la foto ahora
            </Button>
          )}

        <button
          type="button"
          onClick={() => entradaDeArchivo.current?.click()}
          disabled={subiendo}
          className="border-borde-fuerte text-tinta-suave hover:border-tinta hover:text-tinta flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 transition-colors"
        >
          {subiendo ? (
            <>
              <LoaderCircle className="size-6 animate-spin" aria-hidden />
              <span className="text-sm font-semibold">Subiendo...</span>
            </>
          ) : (
            <>
              {esImagen ? (
                <ImagePlus className="size-6" aria-hidden />
              ) : (
                <Upload className="size-6" aria-hidden />
              )}
              <span className="text-sm font-semibold">
                {esImagen ? "Elegir una foto" : "Elegir el archivo"}
              </span>
              <span className="text-tinta-tenue text-xs">
                {extensiones.join(", ")}
              </span>
            </>
          )}
        </button>
        </div>
      )}

      {error && (
        <span className="text-destacado text-xs font-semibold" role="alert">
          {error}
        </span>
      )}
      {ayuda && !error && (
        <span className="text-tinta-tenue text-xs">{ayuda}</span>
      )}

      {/* Pegar una URL es para el caso raro en que el archivo ya vive en otro
          lado. Va escondido para no competir con el boton de subir. */}
      {pegandoEnlace ? (
        <Entrada
          value={valor}
          onChange={(e) => aplicarValor(e.target.value)}
          placeholder="https://..."
          aria-label={`Enlace de ${etiqueta}`}
          className="mt-1 text-sm"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => setPegandoEnlace(true)}
          className="text-tinta-tenue hover:text-tinta inline-flex w-fit items-center gap-1 text-xs underline-offset-4 hover:underline"
        >
          <Link2 className="size-3" aria-hidden />
          o pegar un enlace
        </button>
      )}

      {camaraAbierta && (
        <CamaraPlato
          onCerrar={() => setCamaraAbierta(false)}
          onListo={(archivo) => {
            setCamaraAbierta(false);
            void subir(archivo);
          }}
        />
      )}
    </div>
  );
}
