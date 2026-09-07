import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * `<model-viewer>` es un Web Component, no un componente de React.
 * TypeScript no lo conoce, asi que declaramos aca los atributos que usamos.
 * Lista completa de atributos: https://modelviewer.dev/docs/
 */
export interface ModelViewerAttributes
  extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  src?: string;
  "ios-src"?: string;
  alt?: string;
  poster?: string;
  ar?: boolean;
  "ar-modes"?: string;
  /** "fixed" bloquea el tamano real; "auto" deja que el usuario redimensione. */
  "ar-scale"?: "auto" | "fixed";
  "ar-placement"?: "floor" | "wall";
  "camera-controls"?: boolean;
  "touch-action"?: string;
  "auto-rotate"?: boolean;
  "auto-rotate-delay"?: number;
  "rotation-per-second"?: string;
  "shadow-intensity"?: string;
  "shadow-softness"?: string;
  exposure?: string;
  "environment-image"?: string;
  "camera-orbit"?: string;
  "field-of-view"?: string;
  "interaction-prompt"?: "auto" | "none";
  "disable-zoom"?: boolean;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual";
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
