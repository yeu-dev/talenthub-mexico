/**
 * Curvas y variantes compartidas del sistema.
 *
 * Existe para que el movimiento se sienta UN sistema y no doce decisiones
 * sueltas. Toda animación de la app sale de aquí.
 *
 * IMPORTANTE: importar siempre de `framer-motion`, nunca de `motion`.
 * `motion` es el wrapper que arrastró sileo y apunta al mismo paquete;
 * mezclarlos crearía dos contextos de animación.
 */
import type { Transition, Variants } from 'framer-motion';

/** Curva base: entradas y salidas de contenido. */
export const EASE: Transition['ease'] = [0.22, 0.61, 0.36, 1];

/** Resorte para lo que responde al dedo: botones, paneles, toasts. */
export const SPRING: Transition = { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 };

/** Resorte más suelto para paneles grandes. */
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 30, mass: 1 };

export const DUR = { fast: 0.18, base: 0.42, slow: 0.75 } as const;

/** Entrada estándar: sube y aparece. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

/** Contenedor que escalona a sus hijos. La orquestación es la firma, no el efecto suelto. */
export const stagger = (gap = 0.09, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Reveal al entrar en pantalla. Una sola vez: repetirlo marea. */
export const revealViewport = {
  initial: 'hidden' as const,
  whileInView: 'show' as const,
  viewport: { once: true, amount: 0.18 },
  variants: rise,
};
