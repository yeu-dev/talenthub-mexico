import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { stackPresente, VacantePublica } from '../lib/vacantes';

/**
 * El titular de la portada: "Tu siguiente empleo en ___ ya trae el sueldo",
 * con la palabra del hueco girando (Rotating Text, de React Bits, rehecho con
 * framer-motion).
 *
 * - Arranca en "TI" y después pasa por los lenguajes, bases de datos y stack
 *   web que mencionan las vacantes publicadas (`stackPresente`): los nombres
 *   salen de una lista curada, pero solo gira lo que de verdad se pide. Sin
 *   API se queda en "TI".
 * - Va en tres líneas fijas y la palabra vive sola en la de en medio. Así,
 *   cuando cambia de ancho ("TI" → "JavaScript"), nada más se reacomoda.
 * - Las letras suben desde abajo de una ventana con `overflow-hidden`:
 *   aparecen sin desvanecerse. El titular es el LCP de la portada y se lee
 *   completo desde el primer cuadro (ver `riseVisible` en lib/motion.ts).
 * - El lector de pantalla oye la frase una sola vez (`sr-only`); la parte que
 *   gira va oculta para que no la anuncie con cada cambio.
 * - Se pausa con la pestaña oculta y no gira con "reducir movimiento".
 */

/** La palabra con la que arranca: la frase de siempre. */
const BASE = 'TI';
const CADA_MS = 2800;
/** Con 8 más "TI", una vuelta completa dura unos 25 s. */
const MAXIMO = 8;

/** "TI" y luego el stack que piden las vacantes, de lo más pedido a lo menos. */
export const palabrasDelTitular = (vacantes: VacantePublica[]): string[] => [BASE, ...stackPresente(vacantes, MAXIMO)];

const TitularGiratorio: React.FC<{ palabras: string[] }> = ({ palabras }) => {
  const reducido = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reducido || palabras.length < 2) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setI((n) => (n + 1) % palabras.length);
    }, CADA_MS);
    return () => window.clearInterval(id);
  }, [reducido, palabras.length]);

  const palabra = (reducido ? palabras[0] : palabras[i % palabras.length]) ?? BASE;

  return (
    <>
      <span className="sr-only">Tu siguiente empleo en {BASE} ya trae el sueldo</span>
      <span aria-hidden="true">
        <span className="block">Tu siguiente empleo</span>
        <span className="block">
          en{' '}
          {/* `pb` y `-mb` iguales: la ventana baja lo suficiente para no
              cortar las colas (la "p" de "Python") sin mover la línea base.
              `popLayout`: la palabra que sale se aparta del flujo y sube
              mientras entra la nueva. Con `wait` el hueco se quedaba vacío
              un instante entre las dos. `relative` es el ancla de esa salida. */}
          <span className="relative -mb-[0.12em] inline-flex overflow-hidden whitespace-nowrap pb-[0.12em] align-bottom">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={palabra} className="inline-flex">
                {Array.from(palabra).map((letra, n) => (
                  <motion.span
                    key={n}
                    className="inline-block"
                    initial={{ y: '105%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-115%' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30, delay: n * 0.022 }}
                  >
                    {/* Un espacio suelto dentro de un inline-block mide cero. */}
                    {letra === ' ' ? ' ' : letra}
                  </motion.span>
                ))}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
        <span className="block">ya trae el sueldo</span>
      </span>
    </>
  );
};

export default TitularGiratorio;
