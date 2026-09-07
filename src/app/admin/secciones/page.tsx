import { GestionDeSecciones } from "@/components/admin/secciones";
import { exigirRestaurante, getCategoriasAdmin } from "@/lib/admin/datos";

export default async function SeccionesPage() {
  const restaurante = await exigirRestaurante();
  const categorias = await getCategoriasAdmin(restaurante.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-tinta text-2xl font-bold">Secciones del menu</h1>
        <p className="text-tinta-suave mt-1 text-sm">
          Son las pestanas que ve el cliente arriba del menu. El orden de esta
          lista es el orden en que aparecen. Las secciones sin platos no se
          muestran.
        </p>
      </div>

      <GestionDeSecciones categorias={categorias} />
    </div>
  );
}
