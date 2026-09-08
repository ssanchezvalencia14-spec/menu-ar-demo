"use client";

import { useState } from "react";

/**
 * Campo de precio que se lee como un precio.
 *
 * Escribiendo 10000 se ve "10.000" con el simbolo de la moneda al lado, igual
 * que en la carta. Antes mostraba "10000" pelado y habia que aclarar por
 * escrito que no se pusieran puntos, que es pedirle al usuario que compense
 * una limitacion nuestra.
 *
 * Al servidor viajan los digitos con separadores y la accion los limpia, asi
 * que da igual si alguien pega "$ 10.000" desde otro lado.
 */
export function EntradaDePrecio({
  name,
  defaultValue,
  locale,
  moneda,
}: {
  name: string;
  defaultValue?: number;
  locale: string;
  moneda: string;
}) {
  const [digitos, setDigitos] = useState(
    defaultValue ? String(defaultValue) : "",
  );

  const formateado = digitos
    ? new Intl.NumberFormat(locale).format(Number(digitos))
    : "";

  // El simbolo solo, sin numero, para usarlo de prefijo dentro del campo.
  const simbolo =
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 0,
    })
      .format(0)
      .replace(/[\d\s.,]/g, "") || "$";

  return (
    <div className="border-borde-fuerte bg-superficie focus-within:border-tinta flex h-11 items-center gap-1 rounded-lg border pl-3">
      <span aria-hidden className="text-tinta-tenue shrink-0 text-base">
        {simbolo}
      </span>
      <input
        name={name}
        value={formateado}
        // El teclado numerico del celular, sin flechitas de incremento.
        inputMode="numeric"
        autoComplete="off"
        required
        onChange={(e) => setDigitos(e.target.value.replace(/\D/g, ""))}
        className="text-tinta h-full min-w-0 flex-1 bg-transparent pr-3 text-base tabular-nums outline-none"
      />
    </div>
  );
}
