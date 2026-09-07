/**
 * Genera public/models/plato-demo.glb: un plato con una porcion de comida,
 * a escala real, para probar el AR mientras no haya modelos escaneados.
 *
 *   node tools/generar-plato-demo.mjs
 *
 * Existe porque los modelos de ejemplo publicos (el astronauta de
 * modelviewer.dev) miden 2 metros y nunca se apoyan sobre una mesa. Este mide
 * 24 cm de diametro y 7 cm de alto, como un plato principal de verdad.
 *
 * No reemplaza al escaneo: es geometria generada, no comida real. Sirve para
 * comprobar que el AR ubica bien el objeto en la mesa.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

// Medidas en metros. glTF trabaja en metros y el AR depende de eso.
const PLATO_RADIO = 0.12; // 24 cm de diametro
const SEGMENTOS = 64; // resolucion del giro

/**
 * Superficie de revolucion: gira un perfil (radio, altura) alrededor del eje Y.
 * Es como tornear el plato.
 */
function revolucionar(perfil, segmentos, cerrarAbajo = true) {
  const posiciones = [];
  const indices = [];

  for (let s = 0; s <= segmentos; s++) {
    const angulo = (s / segmentos) * Math.PI * 2;
    const cos = Math.cos(angulo);
    const sen = Math.sin(angulo);
    for (const [radio, altura] of perfil) {
      posiciones.push(radio * cos, altura, radio * sen);
    }
  }

  const porAnillo = perfil.length;
  for (let s = 0; s < segmentos; s++) {
    for (let p = 0; p < porAnillo - 1; p++) {
      const a = s * porAnillo + p;
      const b = (s + 1) * porAnillo + p;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  // Tapa inferior, para que el plato no se vea hueco desde abajo.
  if (cerrarAbajo) {
    const centro = posiciones.length / 3;
    posiciones.push(0, perfil[perfil.length - 1][1], 0);
    for (let s = 0; s < segmentos; s++) {
      const a = s * porAnillo + (porAnillo - 1);
      const b = (s + 1) * porAnillo + (porAnillo - 1);
      indices.push(a, centro, b);
    }
  }

  return { posiciones, indices };
}

/** Media esfera achatada: la porcion de comida sobre el plato. */
function domo(radio, alto, baseY, segmentos, anillos) {
  const posiciones = [];
  const indices = [];

  for (let a = 0; a <= anillos; a++) {
    const phi = (a / anillos) * (Math.PI / 2);
    const r = radio * Math.cos(phi);
    const y = baseY + alto * Math.sin(phi);
    for (let s = 0; s <= segmentos; s++) {
      const theta = (s / segmentos) * Math.PI * 2;
      posiciones.push(r * Math.cos(theta), y, r * Math.sin(theta));
    }
  }

  const porAnillo = segmentos + 1;
  for (let a = 0; a < anillos; a++) {
    for (let s = 0; s < segmentos; s++) {
      const i0 = a * porAnillo + s;
      const i1 = i0 + porAnillo;
      indices.push(i0, i1, i0 + 1, i0 + 1, i1, i1 + 1);
    }
  }

  return { posiciones, indices };
}

/** Normales suavizadas: promedio de las normales de las caras vecinas. */
function calcularNormales({ posiciones, indices }) {
  const normales = new Float32Array(posiciones.length);

  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
    const ux = posiciones[b] - posiciones[a];
    const uy = posiciones[b + 1] - posiciones[a + 1];
    const uz = posiciones[b + 2] - posiciones[a + 2];
    const vx = posiciones[c] - posiciones[a];
    const vy = posiciones[c + 1] - posiciones[a + 1];
    const vz = posiciones[c + 2] - posiciones[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const base of [a, b, c]) {
      normales[base] += nx;
      normales[base + 1] += ny;
      normales[base + 2] += nz;
    }
  }

  for (let i = 0; i < normales.length; i += 3) {
    const largo = Math.hypot(normales[i], normales[i + 1], normales[i + 2]);
    if (largo > 0) {
      normales[i] /= largo;
      normales[i + 1] /= largo;
      normales[i + 2] /= largo;
    } else {
      normales[i + 1] = 1;
    }
  }

  return normales;
}

// --------------------------------------------------------------- Geometria ---

// Perfil del plato, de adentro hacia afuera y despues por abajo.
// El origen (y = 0) es la base: asi el modelo se apoya sobre la mesa.
const plato = revolucionar(
  [
    [0.0, 0.012], // centro del hondo
    [0.045, 0.013],
    [0.075, 0.018],
    [0.095, 0.028],
    [0.11, 0.036],
    [PLATO_RADIO, 0.04], // borde exterior
    [0.118, 0.032], // arranca la parte de abajo
    [0.1, 0.016],
    [0.06, 0.004],
    [0.045, 0.0], // pie de apoyo
  ],
  SEGMENTOS,
);

const comida = domo(0.055, 0.042, 0.014, SEGMENTOS, 16);

const piezas = [
  { nombre: "plato", geometria: plato, material: 0 },
  { nombre: "comida", geometria: comida, material: 1 },
];

// ----------------------------------------------------------- Armado del GLB ---

const buffers = [];
const accessors = [];
const bufferViews = [];
let offset = 0;

function agregar(datos, tipoComponente, tipo, objetivo) {
  const bytes = Buffer.from(
    datos.buffer,
    datos.byteOffset,
    datos.byteLength,
  );
  // Todo desplazamiento tiene que quedar alineado a 4 bytes.
  const relleno = (4 - (offset % 4)) % 4;
  if (relleno) {
    buffers.push(Buffer.alloc(relleno));
    offset += relleno;
  }

  bufferViews.push({
    buffer: 0,
    byteOffset: offset,
    byteLength: bytes.length,
    target: objetivo,
  });
  buffers.push(bytes);
  offset += bytes.length;

  const cuenta = tipo === "SCALAR" ? datos.length : datos.length / 3;
  const accessor = {
    bufferView: bufferViews.length - 1,
    componentType: tipoComponente,
    count: cuenta,
    type: tipo,
  };

  // glTF exige min/max en el accessor de posiciones.
  if (tipo === "VEC3" && tipoComponente === 5126) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < datos.length; i += 3) {
      for (let e = 0; e < 3; e++) {
        min[e] = Math.min(min[e], datos[i + e]);
        max[e] = Math.max(max[e], datos[i + e]);
      }
    }
    accessor.min = min;
    accessor.max = max;
  }

  accessors.push(accessor);
  return accessors.length - 1;
}

const primitivas = piezas.map(({ geometria, material }) => {
  const posiciones = new Float32Array(geometria.posiciones);
  const normales = calcularNormales({
    posiciones,
    indices: geometria.indices,
  });
  const indices = new Uint32Array(geometria.indices);

  return {
    attributes: {
      POSITION: agregar(posiciones, 5126, "VEC3", 34962),
      NORMAL: agregar(normales, 5126, "VEC3", 34962),
    },
    indices: agregar(indices, 5125, "SCALAR", 34963),
    material,
  };
});

const binario = Buffer.concat(buffers);

const gltf = {
  asset: {
    version: "2.0",
    generator: "menu-ar-demo/tools/generar-plato-demo.mjs",
  },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "plato-demo" }],
  meshes: [{ name: "plato-demo", primitives: primitivas }],
  materials: [
    {
      name: "porcelana",
      pbrMetallicRoughness: {
        baseColorFactor: [0.94, 0.94, 0.92, 1],
        metallicFactor: 0,
        roughnessFactor: 0.35,
      },
    },
    {
      name: "comida",
      pbrMetallicRoughness: {
        baseColorFactor: [0.52, 0.28, 0.14, 1],
        metallicFactor: 0,
        roughnessFactor: 0.75,
      },
    },
  ],
  accessors,
  bufferViews,
  buffers: [{ byteLength: binario.length }],
};

// Estructura del contenedor GLB: cabecera + trozo JSON + trozo binario.
const json = Buffer.from(JSON.stringify(gltf), "utf8");
const jsonRelleno = Buffer.concat([
  json,
  Buffer.alloc((4 - (json.length % 4)) % 4, 0x20), // se rellena con espacios
]);
const binRelleno = Buffer.concat([
  binario,
  Buffer.alloc((4 - (binario.length % 4)) % 4, 0),
]);

const cabecera = Buffer.alloc(12);
cabecera.write("glTF", 0);
cabecera.writeUInt32LE(2, 4);
cabecera.writeUInt32LE(12 + 8 + jsonRelleno.length + 8 + binRelleno.length, 8);

function trozo(datos, tipo) {
  const encabezado = Buffer.alloc(8);
  encabezado.writeUInt32LE(datos.length, 0);
  encabezado.writeUInt32LE(tipo, 4);
  return Buffer.concat([encabezado, datos]);
}

const glb = Buffer.concat([
  cabecera,
  trozo(jsonRelleno, 0x4e4f534a), // JSON
  trozo(binRelleno, 0x004e4942), // BIN
]);

const salida = join(RAIZ, "public", "models", "plato-demo.glb");
mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, glb);

const alto = Math.max(...plato.posiciones.filter((_, i) => i % 3 === 1), 0.056);
console.log(`Escrito ${salida}`);
console.log(`  ${(glb.length / 1024).toFixed(1)} KB`);
console.log(
  `  ${(PLATO_RADIO * 200).toFixed(0)} cm de diametro, ${(alto * 100).toFixed(1)} cm de alto`,
);
