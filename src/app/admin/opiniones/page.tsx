import { ListaDeOpiniones } from "@/components/admin/lista-opiniones";
import {
  exigirRestaurante,
  getOpiniones,
  MAXIMO_DE_OPINIONES,
} from "@/lib/admin/datos";

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * "hoy", "ayer", "hace 3 dias" durante la primera semana; despues la fecha.
 *
 * Se calcula aca, en el servidor, y no en el componente cliente: si se
 * calculara en los dos lados, el reloj del celular y el del servidor podrian
 * no coincidir y React se queja al hidratar.
 */
function fechaLegible(
  fechaIso: string,
  locale: string,
  zonaHoraria: string,
): string {
  const dia = (fecha: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: zonaHoraria }).format(fecha);

  const dias = Math.round(
    (Date.parse(dia(new Date())) - Date.parse(dia(new Date(fechaIso)))) /
      MILISEGUNDOS_POR_DIA,
  );

  if (dias < 7) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      -dias,
      "day",
    );
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: dias > 300 ? "numeric" : undefined,
    timeZone: zonaHoraria,
  }).format(new Date(fechaIso));
}

export default async function OpinionesPage() {
  const restaurante = await exigirRestaurante();
  const opiniones = await getOpiniones(restaurante.id);

  const conFecha = opiniones.map((opinion) => ({
    ...opinion,
    fecha: fechaLegible(
      opinion.fecha,
      restaurante.locale,
      restaurante.zonaHoraria,
    ),
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-tinta text-2xl font-bold">
          Opiniones de tus clientes
        </h1>
        <p className="text-tinta-suave mt-1 text-sm">
          Lo que escriben tus clientes al calificar un plato desde el menu. Las
          mas nuevas aparecen primero.
        </p>
      </div>

      {opiniones.length === 0 ? (
        <p className="border-borde text-tinta-suave rounded-card border border-dashed p-8 text-center text-sm">
          Todavia nadie califico tus platos. Cuando un cliente lo haga desde el
          menu, su opinion va a aparecer aca.
        </p>
      ) : (
        <ListaDeOpiniones
          opiniones={conFecha}
          hayMas={opiniones.length === MAXIMO_DE_OPINIONES}
        />
      )}
    </div>
  );
}
