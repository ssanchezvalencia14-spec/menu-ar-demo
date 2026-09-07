import { redirect } from "next/navigation";

import { getPrimerSlug } from "@/lib/menu";
import { supabaseConfigurado } from "@/lib/supabase/config";

/**
 * La raiz no tiene contenido propio: manda al menu del primer restaurante.
 * Si la base todavia no esta lista, explica que falta en vez de tirar un error.
 */

// Sin esto, un build hecho antes de configurar Supabase congelaria la pantalla
// de setup como HTML estatico y nunca redirigiria, aun con la base ya cargada.
export const dynamic = "force-dynamic";
export default async function Home() {
  if (!supabaseConfigurado) {
    return <PantallaDeSetup paso="env" />;
  }

  const slug = await getPrimerSlug();
  if (!slug) {
    return <PantallaDeSetup paso="seed" />;
  }

  redirect(`/${slug}`);
}

function PantallaDeSetup({ paso }: { paso: "env" | "seed" }) {
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center gap-5 px-6 py-16">
      <h1 className="text-tinta text-2xl font-bold">Falta un paso</h1>

      {paso === "env" ? (
        <>
          <p className="text-tinta-suave text-lg">
            Todavia no configuraste Supabase.
          </p>
          <ol className="text-tinta-suave flex list-decimal flex-col gap-2 pl-5 text-base">
            <li>
              Copia <code className="text-tinta">.env.example</code> a{" "}
              <code className="text-tinta">.env.local</code>
            </li>
            <li>
              Completa la URL y las claves desde Supabase, en Project Settings
              &gt; API
            </li>
            <li>
              Corre <code className="text-tinta">npm run seed</code> y volve a
              levantar el servidor
            </li>
          </ol>
        </>
      ) : (
        <>
          <p className="text-tinta-suave text-lg">
            Supabase esta conectado pero no hay ningun restaurante cargado.
          </p>
          <p className="text-tinta-suave text-base">
            Corre <code className="text-tinta">npm run seed</code> para cargar el
            menu inicial.
          </p>
        </>
      )}
    </main>
  );
}
