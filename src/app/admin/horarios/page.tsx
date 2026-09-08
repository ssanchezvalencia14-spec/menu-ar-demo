import { FormularioDeHorarios } from "@/components/admin/formulario-horarios";
import { estadoDeApertura } from "@/lib/horarios";
import { nombreDelPais } from "@/lib/zonas";
import { exigirRestaurante } from "@/lib/admin/datos";

export default async function HorariosPage() {
  const restaurante = await exigirRestaurante();
  const estado = estadoDeApertura(
    restaurante.horarios,
    restaurante.zonaHoraria,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-tinta text-2xl font-bold">Horarios de atencion</h1>
        <p className="text-tinta-suave mt-1 text-sm">
          Con esto el menu le muestra al cliente si estas abierto. Ahora mismo
          figuras como{" "}
          <span className="text-tinta font-semibold">
            {estado.abierto ? "abierto" : "cerrado"}
          </span>
          .
        </p>
      </div>

      {/* La `key` fuerza a rearmar el formulario cuando cambian los horarios
          guardados. Sin esto, el estado local queda pegado al valor con el que
          se monto y despues de guardar dos veces seguidas muestra datos
          viejos. */}
      <FormularioDeHorarios
        key={JSON.stringify(restaurante.horarios)}
        horarios={restaurante.horarios}
        pais={nombreDelPais(restaurante.zonaHoraria)}
      />
    </div>
  );
}
