import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cx } from '../../lib/cx';
import { clasesBoton } from './Button';

/** Lo que hay que mantener presionado para confirmar. */
export const DURACION_MANTENER = 1200;

interface Props {
  /** Se llama una sola vez, cuando el relleno llega al final. */
  alConfirmar: () => void;
  /** Lo que se confirma, para el lector de pantalla: "eliminar la vacante". */
  accion: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * "Mantén presionado para confirmar" (Hold Button, de React Bits), en lugar
 * del diálogo "¿Estás seguro?" en las acciones que no se deshacen.
 *
 * Un diálogo se acepta por reflejo; mantener 1.2 s es una decisión que se
 * siente en el dedo, y no saca a nadie de la pantalla. Mientras se mantiene,
 * un relleno rojo cruza la píldora; si se suelta antes, regresa y no pasa nada.
 *
 * - Ratón y táctil: `pointerdown` empieza, soltar o salir del botón cancela.
 * - Teclado: mantener Espacio o Enter hace lo mismo (se ignoran las
 *   repeticiones del teclado y soltar la tecla cancela).
 * - Lector de pantalla: el botón anuncia "Mantén presionado para…".
 * - "Reducir movimiento": el relleno no cruza; el botón se tiñe completo
 *   mientras se mantiene. La espera es la misma: es la confirmación, no un
 *   adorno.
 */
const BotonMantener: React.FC<Props> = ({ alConfirmar, accion, disabled, className, children }) => {
  const [presionando, setPresionando] = useState(false);
  const temporizador = useRef<number | null>(null);
  const reducido = useReducedMotion();
  const idAyuda = useId();

  const cancelar = useCallback(() => {
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
    setPresionando(false);
  }, []);

  const empezar = useCallback(() => {
    if (disabled || temporizador.current !== null) return;
    setPresionando(true);
    temporizador.current = window.setTimeout(() => {
      temporizador.current = null;
      setPresionando(false);
      alConfirmar();
    }, DURACION_MANTENER);
  }, [alConfirmar, disabled]);

  // Si el botón desaparece a media presión (la fila se fue), no confirmar.
  useEffect(() => cancelar, [cancelar]);
  useEffect(() => {
    if (disabled) cancelar();
  }, [disabled, cancelar]);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-describedby={idAyuda}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        // Que el botón no pierda el puntero si el dedo se mueve un poco.
        e.currentTarget.setPointerCapture?.(e.pointerId);
        empezar();
      }}
      onPointerUp={cancelar}
      onPointerCancel={cancelar}
      onLostPointerCapture={cancelar}
      onKeyDown={(e) => {
        if (e.key !== ' ' && e.key !== 'Enter') return;
        e.preventDefault();
        if (!e.repeat) empezar();
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') cancelar();
      }}
      onBlur={cancelar}
      // El clic normal no hace nada: solo cuenta mantener.
      onClick={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      className={cx(
        clasesBoton({ variant: 'ghost', size: 'sm' }),
        'relative select-none overflow-hidden !text-danger hover:border-danger/40 [touch-action:none]',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 origin-left bg-danger/25"
        style={
          reducido
            ? { opacity: presionando ? 1 : 0, transition: 'opacity 120ms linear' }
            : {
                transform: `scaleX(${presionando ? 1 : 0})`,
                transition: presionando
                  ? `transform ${DURACION_MANTENER}ms linear`
                  : 'transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              }
        }
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
      <span id={idAyuda} className="sr-only">
        Mantén presionado para {accion}
      </span>
    </button>
  );
};

export default BotonMantener;
