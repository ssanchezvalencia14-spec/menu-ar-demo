/**
 * Formatea un precio entero segun la moneda y el locale del restaurante.
 * Sin decimales: los menues de mesa no los usan y ocupan lectura.
 */
export function formatPrecio(
  precio: number,
  moneda: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}
