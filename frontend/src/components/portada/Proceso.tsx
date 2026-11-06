import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  MotionValue,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import type { TargetAndTransition, Variants } from 'framer-motion';
import type { LucideIcon } from '../icons';
import { cx } from '../../lib/cx';
import { EASE } from '../../lib/motion';

/**
 * Los pasos de un proceso (buscar → postularse → seguirlo; publicar → revisar
 * → responder), animados como UNA secuencia cuando entran en pantalla.
 *
 * Paso por paso: el círculo se enciende, su ícono hace el gesto de lo que
 * describe (el ojo parpadea, el avión de papel sale volando y regresa, la
 * campana suena, la flecha sube, el escudo se sella, la bandeja recibe; los
 * seis son distintos para que ningún paso se lea como otro) y el tramo de línea
 * hacia el siguiente se llena. Luego sigue el próximo. Pasa una sola vez: al
 * volver a la sección ya está todo encendido.
 *
 * - El texto se lee desde el primer cuadro: solo sube un poco y pasa de 55%
 *   a 100% de opacidad; nunca arranca invisible.
 * - Solo `transform`, `opacity` y colores: nada que repinte el layout.
 * - Con "reducir movimiento" no se mueve nada: los pasos aparecen ya
 *   encendidos y la línea, completa.
 * - `orientacion="horizontal"` va en columna hasta `lg` y en fila desde ahí;
 *   la línea cambia de eje con el mismo tiempo.
 * - Con `progreso` (lo da `SeccionFija`) la secuencia la lleva el scroll y
 *   no el reloj: cada paso se enciende al llegar su tramo de scroll, la línea
 *   se llena al ritmo del scroll (entre más rápido, más rápido) y al subir
 *   todo retrocede. El gesto del ícono suena cada vez que su paso se enciende.
 */

export type Gesto = 'mirada' | 'vuelo' | 'campana' | 'subida' | 'escudo' | 'bandeja';

export interface Paso {
  Icono: LucideIcon;
  titulo: string;
  texto: string;
  gesto: Gesto;
}

/** Segundos entre el arranque de un paso y el del siguiente. */
const ENTRE_PASOS = 1.5;
/** Cuánto tarda en llenarse el tramo de línea hacia el siguiente paso. */
const LLENADO = 0.9;

const GESTOS: Record<Gesto, TargetAndTransition> = {
  // Mira: parpadea dos veces y se abre un poco más, como quien mira de cerca.
  mirada: {
    scaleY: [1, 0.1, 1, 1, 0.1, 1, 1.15, 1],
    scaleX: [1, 1, 1, 1, 1, 1, 1.15, 1],
    transition: { duration: 1.5, times: [0, 0.1, 0.2, 0.35, 0.45, 0.55, 0.78, 1], ease: 'easeInOut' },
  },
  // Sube: la flecha se eleva y cae en su lugar con un rebote corto.
  subida: { y: [0, -8, 2, 0], transition: { duration: 1, times: [0, 0.45, 0.75, 1], ease: 'easeOut' } },
  // Sale volando por arriba a la derecha y entra de nuevo por abajo a la izquierda.
  vuelo: {
    x: [0, 15, -15, 0],
    y: [0, -15, 15, 0],
    opacity: [1, 0, 0, 1],
    transition: { duration: 1.2, times: [0, 0.42, 0.58, 1], ease: 'easeInOut' },
  },
  // Suena: oscila desde el asa, cada vez menos.
  campana: { rotate: [0, 20, -16, 11, -6, 2, 0], transition: { duration: 1.3, ease: 'easeOut' } },
  // Se sella: se encoge y rebota.
  escudo: { scale: [1, 0.78, 1.22, 1], transition: { duration: 1, ease: 'easeOut' } },
  // Recibe: baja como si algo cayera dentro y vuelve.
  bandeja: { y: [0, 5, -2, 0], scale: [1, 0.92, 1.06, 1], transition: { duration: 1, ease: 'easeOut' } },
};

/** El tramo de línea cuando lo lleva el scroll: se llena entre el paso `i` y el siguiente. */
const TramoGuiado: React.FC<{ progreso: MotionValue<number>; i: number; eje: 'x' | 'y'; className: string }> = ({
  progreso,
  i,
  eje,
  className,
}) => {
  const llenado = useTransform(progreso, (p) => Math.min(1, Math.max(0, (p - i - 0.2) / 0.7)));
  return <motion.span className={className} style={eje === 'x' ? { scaleX: llenado } : { scaleY: llenado }} />;
};

const Proceso: React.FC<{
  pasos: Paso[];
  orientacion?: 'vertical' | 'horizontal';
  fondo?: 'night' | 'surface';
  /** El avance del scroll, de 0 a `pasos.length` (ver `SeccionFija`). */
  progreso?: MotionValue<number> | null;
  className?: string;
}> = ({ pasos, orientacion = 'vertical', fondo = 'night', progreso = null, className }) => {
  const ref = useRef<HTMLOListElement>(null);
  const visto = useInView(ref, { once: true, amount: 0.5 });
  const reducido = useReducedMotion();
  const horizontal = orientacion === 'horizontal';

  // Con scroll: cuántos pasos van encendidos. El primero se enciende en
  // cuanto la sección se pega; los demás, al llegar su tramo de scroll.
  const guiado = progreso !== null;
  const cero = useMotionValue(0);
  const fuente = progreso ?? cero;
  const contar = (p: number) => Math.min(pasos.length, Math.floor(p) + 1);
  const [encendidos, setEncendidos] = useState(() => contar(fuente.get()));
  useMotionValueEvent(fuente, 'change', (p) => setEncendidos(contar(p)));
  useEffect(() => setEncendidos(contar(fuente.get())), [fuente]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sin movimiento, todo encendido desde el inicio.
  const activo = (i: number) => (guiado ? i < encendidos : visto || Boolean(reducido));
  // Con scroll, sin retrasos: el ritmo lo pone el scroll, no el reloj.
  const retraso = (i: number, extra = 0) => (reducido || guiado ? 0 : i * ENTRE_PASOS + extra);

  const circulo: Variants = {
    off: { borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(157,176,255,0)' },
    on: (i: number) => ({
      borderColor: 'rgba(157,176,255,0.55)',
      backgroundColor: 'rgba(157,176,255,0.10)',
      transition: { delay: retraso(i), duration: 0.5, ease: EASE },
    }),
  };

  const texto: Variants = {
    off: { opacity: 0.55, y: 8 },
    on: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: retraso(i, 0.15), duration: guiado ? 0.4 : 0.7, ease: EASE },
    }),
  };

  const tramo: Variants = {
    off: horizontal ? { scaleX: 0, scaleY: 0 } : { scaleY: 0, scaleX: 1 },
    on: (i: number) => ({
      scaleX: 1,
      scaleY: 1,
      transition: { delay: reducido ? 0 : i * ENTRE_PASOS + 0.5, duration: reducido ? 0 : LLENADO, ease: 'easeInOut' },
    }),
  };

  return (
    <ol
      ref={ref}
      className={cx(
        'list-none p-0',
        horizontal ? 'grid gap-10 lg:grid-cols-3 lg:gap-8' : 'flex flex-col',
        className
      )}
    >
      {pasos.map(({ Icono, titulo, texto: descripcion, gesto }, i) => {
        const ultimo = i === pasos.length - 1;
        return (
          <li key={titulo} className={cx('relative flex gap-5', horizontal ? 'lg:flex-col lg:gap-0' : '', !ultimo && (horizontal ? 'pb-0' : 'pb-9'))}>
            {/* El tramo de línea hacia el siguiente paso: una base tenue y,
                encima, el azul que se llena. Vertical siempre en la lista
                vertical; en la horizontal, vertical hasta `lg` y en fila desde ahí. */}
            {!ultimo && (
              <>
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute left-[19px] top-11 w-px bg-hairline-d',
                    // `-bottom-10` = el `gap-10` de la cuadrícula: llega justo al siguiente círculo.
                    horizontal ? '-bottom-10 lg:hidden' : 'bottom-1'
                  )}
                >
                  {guiado ? (
                    <TramoGuiado progreso={fuente} i={i} eje="y" className="absolute inset-0 origin-top bg-accent-on-dark/60" />
                  ) : (
                    <motion.span
                      className="absolute inset-0 origin-top bg-accent-on-dark/60"
                      variants={tramo}
                      custom={i}
                      initial="off"
                      animate={activo(i) ? 'on' : 'off'}
                    />
                  )}
                </span>
                {horizontal && (
                  <span aria-hidden="true" className="absolute left-12 right-[-1.5rem] top-5 hidden h-px bg-hairline-d lg:block">
                    {guiado ? (
                      <TramoGuiado progreso={fuente} i={i} eje="x" className="absolute inset-0 origin-left bg-accent-on-dark/60" />
                    ) : (
                      <motion.span
                        className="absolute inset-0 origin-left bg-accent-on-dark/60"
                        variants={tramo}
                        custom={i}
                        initial="off"
                        animate={activo(i) ? 'on' : 'off'}
                      />
                    )}
                  </span>
                )}
              </>
            )}

            <motion.span
              className={cx(
                'relative z-[1] flex h-10 w-10 flex-none items-center justify-center rounded-full border',
                fondo === 'surface' ? 'bg-surface' : 'bg-night'
              )}
              variants={circulo}
              custom={i}
              initial="off"
              animate={activo(i) ? 'on' : 'off'}
            >
              <motion.span
                className="flex"
                style={gesto === 'campana' ? { transformOrigin: '50% 15%' } : undefined}
                // El retraso va dentro de la transición del gesto: si fuera en
                // la prop `transition`, la del gesto lo pisaría.
                animate={
                  reducido
                    ? undefined
                    : guiado
                      ? activo(i)
                        ? GESTOS[gesto]
                        : undefined
                      : visto
                        ? { ...GESTOS[gesto], transition: { ...GESTOS[gesto].transition, delay: i * ENTRE_PASOS } }
                        : undefined
                }
              >
                <Icono size={18} strokeWidth={1.7} className="text-accent-on-dark" aria-hidden="true" />
              </motion.span>
            </motion.span>

            <motion.div
              className={cx('pt-1.5', horizontal && 'lg:mt-5 lg:pt-0')}
              variants={texto}
              custom={i}
              initial="off"
              animate={activo(i) ? 'on' : 'off'}
            >
              <h3 className="text-[1.0625rem] font-demi text-ink-d">{titulo}</h3>
              <p className="mt-1.5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-2d">{descripcion}</p>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
};

export default Proceso;
