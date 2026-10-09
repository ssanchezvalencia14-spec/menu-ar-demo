import path from "node:path";

/**
 * Este archivo es .mjs y no .ts a proposito.
 *
 * El hosting de Hostinger corre sobre una glibc anterior a 2.29, asi que los
 * binarios nativos de Next (@next/swc-linux-x64-gnu) no cargan y Next cae al
 * backend WASM. Sin binarios nativos no puede compilar un config escrito en
 * TypeScript: falla con "Failed to load next.config.ts". Un config .mjs se
 * carga directo.
 *
 * Por el mismo motivo el script de build pasa --webpack: Turbopack exige los
 * binarios nativos y aborta con "Turbopack is not supported on this platform".
 */

/**
 * Host de Supabase Storage, derivado de la URL del proyecto.
 *
 * El optimizador de imagenes de Next se niega a servir cualquier host que no
 * este declarado aca. Sin esta configuracion, la pagina de un plato con foto
 * responde HTTP 500 apenas el restaurante sube una imagen.
 *
 * El patron esta atado al host Y a la carpeta publica del bucket a proposito.
 * Un patron abierto (hostname "**") convertiria a /_next/image en un proxy que
 * cualquiera puede usar para que NUESTRO servidor pida URLs arbitrarias:
 * intranet, servicios internos o el endpoint de metadatos del proveedor.
 *
 * Ojo: NEXT_PUBLIC_SUPABASE_URL tiene que existir EN EL MOMENTO DEL BUILD. Si
 * falta, la lista queda vacia y las fotos subidas por el restaurante dan 500.
 */
const hostDeStorage = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

/** @type {import("next").NextConfig} */
const nextConfig = {
  // La carpeta padre tiene su propio package-lock.json y Next infiere mal la
  // raiz del proyecto. Se la fijamos a mano. Solo aplica al dev server, que si
  // usa Turbopack; el build de produccion va por webpack.
  turbopack: {
    root: path.resolve("."),
  },

  images: {
    remotePatterns: hostDeStorage
      ? [
          {
            protocol: "https",
            hostname: hostDeStorage,
            pathname: "/storage/v1/object/public/menu/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
