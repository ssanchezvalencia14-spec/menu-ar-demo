/**
 * Tipos y constantes de los formularios del panel.
 *
 * Viven aca y no en acciones.ts porque ese archivo lleva "use server", y en un
 * archivo asi todo lo exportado tiene que ser una funcion asincronica. Exportar
 * una constante desde ahi compila igual y revienta recien en ejecucion, con
 * "A use server file can only export async functions, found object".
 */

export type Resultado =
  | { estado: "inicial" }
  | { estado: "ok"; mensaje?: string }
  | { estado: "error"; mensaje: string };

export const RESULTADO_INICIAL: Resultado = { estado: "inicial" };
