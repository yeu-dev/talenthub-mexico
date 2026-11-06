import React, { useRef } from 'react';
import { MotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { cx } from '../../lib/cx';
import { useMedia } from '../../hooks/useMedia';

/** Cuántos píxeles de scroll de la página avanza un paso del proceso. */
export const PX_POR_PASO = 320;

interface Props {
  /** El `id` del título de la sección, para `aria-labelledby`. */
  titulo: string;
  /** Cuántos pasos recorre el scroll. */
  pasos: number;
  /** Clases de la sección (su fondo, sus bordes). */
  className?: string;
  /** Una capa de fondo que se queda fija con el contenido (un velo, un halo). */
  fondo?: React.ReactNode;
  /**
   * El contenido. Recibe el avance del scroll, de 0 a `pasos`, cuando la
   * sección está fija; `null` cuando no (celular, "reducir movimiento").
   */
  children: (progreso: MotionValue<number> | null) => React.ReactNode;
}

/**
 * Una sección que se queda fija mientras el scroll la recorre, como el
 * carrusel de la portada.
 *
 * Mide una pantalla más `PX_POR_PASO` por paso; su contenido va `sticky`. Al
 * llegar, se pega; el scroll de la página avanza el proceso (entre más rápido
 * el scroll, más rápido avanza, y al subir retrocede); al terminar se despega.
 * Es el scroll nativo: rueda, trackpad, barra, teclado y dedo, sin atrapar a
 * nadie.
 *
 * Solo desde `lg` y sin "reducir movimiento". En pantallas angostas el
 * contenido apilado no cabe en una pantalla y quedaría recortado; ahí la
 * sección es normal y el proceso se anima solo al entrar, como antes.
 */
const SeccionFija: React.FC<Props> = ({ titulo, pasos, className, fondo, children }) => {
  const seccion = useRef<HTMLElement>(null);
  const desdeLg = useMedia('(min-width: 1024px)');
  const reducido = useReducedMotion();
  const fija = desdeLg && !reducido;

  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start start', 'end end'] });
  const progreso = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, v)) * pasos);

  return (
    <section
      ref={seccion}
      aria-labelledby={titulo}
      className={cx('relative isolate', className)}
      style={fija ? { height: `calc(100svh + ${pasos * PX_POR_PASO}px)` } : undefined}
    >
      <div
        className={cx(
          'relative flex flex-col justify-center overflow-hidden',
          fija
            ? 'sticky top-0 h-[100svh] pb-8 pt-[calc(var(--nav-flow)+1.5rem)]'
            : 'min-h-[100svh] py-[clamp(3.5rem,7vw,6.5rem)]'
        )}
      >
        {fondo}
        {children(fija ? progreso : null)}
      </div>
    </section>
  );
};

export default SeccionFija;
