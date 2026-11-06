import React from 'react';
import { RotateCcw } from '../components/icons';
import { Button } from '../components/ui';

/**
 * Páginas que se descargan aparte, cuando se visitan.
 *
 * Antes todo el sitio viajaba en un solo archivo JS: quien abría la portada
 * también bajaba y ejecutaba el checkout, el panel del validador y el perfil.
 *
 * Dos casos en los que un pedazo puede no llegar:
 * - **Hubo un deploy** con la pestaña abierta: el index viejo pide un archivo
 *   con un hash que ya no existe. Se recarga la página una vez y ya trae el
 *   index nuevo. La marca en `sessionStorage` evita recargar en bucle.
 * - **No hay red** y esa página nunca se abrió (ni se alcanzó a precargar): en
 *   lugar de una pantalla en blanco, se muestra `PaginaSinCargar`.
 */
const LLAVE = 'talenthub:recarga-por-pagina';

const leerMarca = (): boolean => {
  try {
    return sessionStorage.getItem(LLAVE) === '1';
  } catch {
    return false;
  }
};

const escribirMarca = (valor: boolean) => {
  try {
    if (valor) sessionStorage.setItem(LLAVE, '1');
    else sessionStorage.removeItem(LLAVE);
  } catch {
    // Sin almacenamiento (modo privado estricto) no hay marca: a lo más se
    // recarga una vez de más.
  }
};

/** Lo que se ve si una página no se pudo descargar ni recargando. */
export const PaginaSinCargar: React.FC = () => (
  <div className="flex min-h-[70svh] items-center justify-center px-6 text-center">
    <div className="max-w-md">
      <h1 className="font-heading text-h3 font-mid text-ink">No pudimos abrir esta página</h1>
      <p className="mt-3 text-body text-ink-2">Revisa tu conexión a internet y vuelve a intentarlo.</p>
      <Button className="mt-7" onClick={() => window.location.reload()}>
        <RotateCcw size={15} strokeWidth={1.8} />
        Reintentar
      </Button>
    </div>
  </div>
);

export function diferida(importar: () => Promise<{ default: React.ComponentType }>) {
  return React.lazy(async () => {
    try {
      const modulo = await importar();
      escribirMarca(false);
      return modulo;
    } catch {
      if (!leerMarca()) {
        escribirMarca(true);
        window.location.reload();
        // La página se está recargando: nada que pintar mientras tanto.
        return new Promise<never>(() => {});
      }
      return { default: PaginaSinCargar };
    }
  });
}

/**
 * Lo que ocupa el lugar de la página mientras llega su archivo. Es alto a
 * propósito: así el pie no sube un instante para luego volver a bajar. Casi
 * nunca se ve, porque las páginas se precargan apenas termina la primera.
 */
export const EsperaPagina: React.FC = () => <div aria-busy="true" className="min-h-[100svh]" />;
