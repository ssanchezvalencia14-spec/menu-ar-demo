import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La carpeta padre tiene su propio package-lock.json y Next infiere mal la
  // raiz del proyecto. Se la fijamos a mano.
  turbopack: {
    root: path.resolve("."),
  },
};

export default nextConfig;
