/**
 * Zonas horarias con nombre de pais.
 *
 * En el panel nunca se muestra el identificador tecnico:
 * "America/Argentina/Buenos_Aires" no le dice nada a un dueno de restaurante.
 * El valor que se guarda sigue siendo el identificador IANA, que es lo que
 * entiende Intl.DateTimeFormat.
 */

export const ZONAS = [
  { valor: "America/Bogota", etiqueta: "Colombia" },
  { valor: "America/Mexico_City", etiqueta: "Mexico (centro)" },
  { valor: "America/Lima", etiqueta: "Peru" },
  { valor: "America/Santiago", etiqueta: "Chile" },
  { valor: "America/Argentina/Buenos_Aires", etiqueta: "Argentina" },
  { valor: "America/Montevideo", etiqueta: "Uruguay" },
  { valor: "America/Caracas", etiqueta: "Venezuela" },
  { valor: "America/Guayaquil", etiqueta: "Ecuador" },
  { valor: "America/La_Paz", etiqueta: "Bolivia" },
  { valor: "America/Asuncion", etiqueta: "Paraguay" },
  { valor: "America/Panama", etiqueta: "Panama" },
  { valor: "America/Costa_Rica", etiqueta: "Costa Rica" },
  { valor: "America/Guatemala", etiqueta: "Guatemala" },
  { valor: "America/Santo_Domingo", etiqueta: "Republica Dominicana" },
  { valor: "Europe/Madrid", etiqueta: "Espana" },
] as const;

/** Nombre legible de una zona. Si no esta en la lista, devuelve la ciudad. */
export function nombreDelPais(zona: string): string {
  const conocida = ZONAS.find((z) => z.valor === zona);
  if (conocida) return conocida.etiqueta;
  return zona.split("/").pop()?.replace(/_/g, " ") ?? zona;
}
