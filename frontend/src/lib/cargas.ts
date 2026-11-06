import { useSyncExternalStore } from 'react';

/**
 * Cuántas peticiones a la API van en curso, para la barra de carga global
 * (`BarraCarga`, bajo la barra de navegación). Los interceptores de
 * `services/api.ts` suben y bajan el número.
 *
 * No cuentan las peticiones "silenciosas": el sondeo de la campana cada 60 s
 * y el aviso que despierta al servidor al abrir la app. Esas pasan en segundo
 * plano y nadie las está esperando.
 */
let enCurso = 0;
const oyentes = new Set<() => void>();

const avisar = () => oyentes.forEach((o) => o());

export const empezoPeticion = () => {
  enCurso += 1;
  avisar();
};

export const terminoPeticion = () => {
  enCurso = Math.max(0, enCurso - 1);
  avisar();
};

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};

/** Cuántas peticiones (no silenciosas) van en curso. */
export const usePeticionesEnCurso = () => useSyncExternalStore(suscribir, () => enCurso, () => 0);
