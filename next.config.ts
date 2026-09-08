import path from "node:path";
import type { NextConfig } from "next";

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
 */
const hostDeStorage = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  // La carpeta padre tiene su propio package-lock.json y Next infiere mal la
  // raiz del proyecto. Se la fijamos a mano.
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
