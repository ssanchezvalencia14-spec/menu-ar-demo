"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AreaDeTexto,
  Aviso,
  Campo,
  Entrada,
  Interruptor,
  Selector,
} from "@/components/admin/campos";
import { BotonDeBorrado } from "@/components/admin/confirmar";
import { EntradaDePrecio } from "@/components/admin/entrada-precio";
import { ModelosDelPlato } from "@/components/admin/modelos-del-plato";
import { SubirArchivo } from "@/components/admin/subir-archivo";
import {
  crearPlato,
  eliminarPlato,
  guardarPlato,
} from "@/lib/admin/acciones";
import { RESULTADO_INICIAL } from "@/lib/admin/tipos";
import type { CategoriaAdmin, PlatoAdmin } from "@/lib/admin/datos";

export function FormularioDePlato({
  plato,
  categorias,
  restauranteId,
  moneda,
  locale,
}: {
  /** undefined = alta. */
  plato?: PlatoAdmin;
  categorias: CategoriaAdmin[];
  restauranteId: string;
  moneda: string;
  locale: string;
}) {
  const [resultado, enviar, enviando] = useActionState(
    plato ? guardarPlato : crearPlato,
    RESULTADO_INICIAL,
  );

  if (categorias.length === 0) {
    return (
      <div className="border-borde rounded-card border border-dashed p-6 text-center">
        <p className="text-tinta text-base font-semibold">
          Primero necesitas una seccion
        </p>
        <p className="text-tinta-suave mt-1 mb-4 text-sm">
          Los platos van dentro de una seccion del menu (Entradas, Principales,
          y demas).
        </p>
        <Button asChild size="md">
          <Link href="/admin/secciones">Crear una seccion</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-5">
      {plato && <input type="hidden" name="id" value={plato.id} />}

      <Campo etiqueta="Nombre del plato">
        <Entrada
          name="nombre"
          defaultValue={plato?.nombre}
          required
          maxLength={120}
          autoFocus={!plato}
        />
      </Campo>

      <Campo
        etiqueta="Descripcion"
        ayuda="Una linea corta. Es lo que lee el cliente debajo del nombre."
      >
        <AreaDeTexto
          name="descripcion"
          defaultValue={plato?.descripcion}
          rows={2}
          maxLength={300}
        />
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Precio">
          <EntradaDePrecio
            name="precio"
            defaultValue={plato?.precio}
            locale={locale}
            moneda={moneda}
          />
        </Campo>

        <Campo etiqueta="Seccion">
          <Selector
            name="categoriaId"
            defaultValue={plato?.categoriaId ?? categorias[0].id}
            required
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Selector>
        </Campo>
      </div>

      <SubirArchivo
        nombreDelCampo="imagen"
        etiqueta="Foto del plato"
        ayuda="Si no cargas ninguna, se dibuja un fondo con el icono de la seccion."
        extensiones={[".jpg", ".jpeg", ".png", ".webp"]}
        carpeta="fotos"
        restauranteId={restauranteId}
        valorInicial={plato?.imagen ?? null}
        esImagen
        permitirCamara
      />

      {/* Casi ningun plato arranca con modelo 3D, asi que va plegado: si
          estuviera siempre abierto, el formulario mas comun quedaria el doble
          de largo por algo que la mayoria no va a completar. Se abre solo si
          el plato ya tiene alguno. */}
      <details
        open={Boolean(plato?.modeloGlb || plato?.modeloUsdz)}
        className="border-borde group rounded-card border"
      >
        <summary className="text-tinta cursor-pointer list-none p-4 text-sm font-semibold">
          <span className="flex items-center justify-between gap-2">
            <span className="flex flex-col gap-0.5">
              Ver el plato en la mesa (3D)
              <span className="text-tinta-tenue text-xs font-normal">
                {plato?.modeloGlb || plato?.modeloUsdz
                  ? "Ya tiene archivos cargados"
                  : "Opcional. Sin esto el plato se ve igual, pero sin el boton de realidad aumentada."}
              </span>
            </span>
            <ChevronDown
              className="text-tinta-tenue size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </span>
        </summary>

        <ModelosDelPlato
          restauranteId={restauranteId}
          glbInicial={plato?.modeloGlb ?? null}
          usdzInicial={plato?.modeloUsdz ?? null}
        />
      </details>

      <div className="grid gap-3 sm:grid-cols-2">
        <Interruptor
          name="disponible"
          etiqueta="Disponible"
          ayuda="Si lo apagas, el plato desaparece del menu al instante pero no se borra."
          defaultChecked={plato ? plato.disponible : true}
        />
        <Interruptor
          name="esEspecialidad"
          etiqueta="Especialidad de la casa"
          ayuda="Le pone una estrella en el menu."
          defaultChecked={plato?.esEspecialidad ?? false}
        />
      </div>

      {resultado.estado === "error" && (
        <Aviso tipo="error">{resultado.mensaje}</Aviso>
      )}
      {resultado.estado === "ok" && resultado.mensaje && (
        <Aviso tipo="ok">{resultado.mensaje}</Aviso>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Guardando..." : plato ? "Guardar cambios" : "Crear plato"}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/admin/platos">Cancelar</Link>
        </Button>
      </div>

      {plato && (
        <div className="border-borde border-t pt-5">
          <BotonDeBorrado
            titulo={`Eliminar "${plato.nombre}"`}
            advertencia="Se borran tambien sus resenas y sus estadisticas de vistas. Esto no se puede deshacer. Si solo queres sacarlo del menu, apaga el interruptor de Disponible."
            accion={async () => {
              await eliminarPlato(plato.id);
            }}
          >
            Eliminar este plato
          </BotonDeBorrado>
        </div>
      )}
    </form>
  );
}
