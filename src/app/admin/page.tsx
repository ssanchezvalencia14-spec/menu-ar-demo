import Link from "next/link";
import { PauseCircle, Plus, Star, TrendingUp, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exigirRestaurante, getResumen } from "@/lib/admin/datos";
import { getMasMirados, getMenu } from "@/lib/menu";
import { estadoDeApertura } from "@/lib/horarios";
import { formatPrecio } from "@/lib/format";

export default async function PanelPage() {
  const restaurante = await exigirRestaurante();
  const resumen = await getResumen(restaurante.id);

  // El ranking sale de la misma funcion que usa el menu publico.
  const menu = await getMenu(restaurante.slug);
  const { platos: top, periodo } = menu
    ? await getMasMirados(menu)
    : { platos: [], periodo: "semana" as const };

  const estado = estadoDeApertura(
    restaurante.horarios,
    restaurante.zonaHoraria,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-tinta text-2xl font-bold">Resumen</h1>
          <p className="text-tinta-suave mt-1 text-sm">
            Tu local esta{" "}
            <span className="font-semibold">
              {estado.abierto ? "abierto" : "cerrado"}
            </span>{" "}
            ahora{estado.detalle ? `, ${estado.detalle}` : ""}.
          </p>
        </div>
        <Button asChild size="md">
          <Link href="/admin/platos/nuevo">
            <Plus aria-hidden />
            Agregar plato
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tarjeta
          icono={<UtensilsCrossed className="size-4" aria-hidden />}
          etiqueta="Platos activos"
          valor={String(resumen.platosActivos)}
        />
        <Tarjeta
          icono={<PauseCircle className="size-4" aria-hidden />}
          etiqueta="Pausados"
          valor={String(resumen.platosPausados)}
        />
        <Tarjeta
          icono={<Star className="size-4" aria-hidden />}
          etiqueta="Calificacion"
          valor={
            resumen.totalResenas
              ? resumen.promedioGeneral.toFixed(1)
              : "Sin datos"
          }
          detalle={
            resumen.totalResenas
              ? `${resumen.totalResenas} resenas`
              : "Todavia nadie califico"
          }
          href={resumen.totalResenas ? "/admin/opiniones" : undefined}
        />
        <Tarjeta
          etiqueta="Secciones"
          valor={String(resumen.categorias)}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-tinta flex items-center gap-2 text-lg font-bold">
          <TrendingUp className="size-5" aria-hidden />
          {periodo === "semana" ? "Los mas mirados esta semana" : "Los mas mirados"}
        </h2>

        {top.length === 0 ? (
          <p className="border-borde text-tinta-suave rounded-card border border-dashed p-6 text-center text-sm">
            Todavia no hay suficientes datos. La seccion aparece en tu menu
            cuando al menos tres platos distintos se hayan visto en Realidad
            Aumentada durante el ultimo mes.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {top.map(({ plato, vistas }, indice) => (
              <li
                key={plato.id}
                className="border-borde bg-superficie flex items-center gap-3 rounded-card border p-3"
              >
                <span className="text-tinta-tenue w-5 shrink-0 text-center text-lg font-bold tabular-nums">
                  {indice + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-tinta block truncate text-base font-semibold">
                    {plato.nombre}
                  </span>
                  <span className="text-tinta-suave block text-sm tabular-nums">
                    {formatPrecio(
                      plato.precio,
                      restaurante.moneda,
                      restaurante.locale,
                    )}
                  </span>
                </span>
                <span className="text-tinta-suave shrink-0 text-sm tabular-nums">
                  {vistas} {vistas === 1 ? "vista" : "vistas"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Tarjeta({
  icono,
  etiqueta,
  valor,
  detalle,
  href,
}: {
  icono?: React.ReactNode;
  etiqueta: string;
  valor: string;
  detalle?: string;
  /** Si viene, la tarjeta entera lleva a esa pantalla. */
  href?: string;
}) {
  const contenido = (
    <>
      <span className="text-tinta-tenue flex items-center gap-1.5 text-xs font-semibold">
        {icono}
        {etiqueta}
      </span>
      <span className="text-tinta text-2xl font-bold tabular-nums">{valor}</span>
      {detalle && (
        <span
          className={
            href
              ? "text-tinta-suave text-xs underline underline-offset-4"
              : "text-tinta-tenue text-xs"
          }
        >
          {detalle}
        </span>
      )}
    </>
  );

  const clases =
    "border-borde bg-superficie flex flex-col gap-1 rounded-card border p-4";

  return href ? (
    <Link href={href} className={`${clases} hover:border-borde-fuerte`}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}
