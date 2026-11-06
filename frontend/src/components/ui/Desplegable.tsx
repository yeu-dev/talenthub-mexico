import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cx } from '../../lib/cx';
import { DUR, EASE } from '../../lib/motion';

/**
 * Un panel que se abre desde un botón de la barra: el menú de cuenta y el de
 * la campana. Se llama Desplegable y no Menu para no chocar con el ícono
 * `Menu` (las tres líneas) que la barra ya importa.
 *
 * Lo que hace por su cuenta:
 * - Escape y clic afuera lo cierran, y el foco regresa al botón (como `Dialog`);
 * - con `rol="menu"`, las flechas mueven el foco entre las opciones
 *   (`role="menuitem"`), Inicio y Fin van a la primera y la última, y Tab lo
 *   cierra, que es lo que se espera de un menú;
 * - al abrirlo con teclado, el foco entra a la primera opción.
 *
 * El panel es opaco (`elevated`) con el filo de vidrio, y entra moviéndose,
 * sin desvanecerse. Y nada de `popLayout`: la CSP de producción bloquea el
 * `<style>` que inyecta (DESIGN.md, *Implementation Notes*).
 */

interface Props {
  /** Nombre del botón para el lector de pantalla. */
  etiqueta: string;
  /** Lo que se ve dentro del botón. */
  disparador: React.ReactNode;
  /** Clases del botón. */
  className?: string;
  /** Clases extra del panel (ancho, sobre todo). */
  panelClassName?: string;
  /** `menu`: lista de opciones navegable con flechas. `dialog`: contenido libre (avisos). */
  rol?: 'menu' | 'dialog';
  /** Se llama cada vez que se abre. */
  alAbrir?: () => void;
  /** El contenido; recibe `cerrar` para que una opción cierre el panel al elegirse. */
  children: (cerrar: () => void) => React.ReactNode;
}

const OPCION = '[role="menuitem"]:not([aria-disabled="true"])';

const Desplegable: React.FC<Props> = ({
  etiqueta,
  disparador,
  className,
  panelClassName,
  rol = 'menu',
  alAbrir,
  children,
}) => {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const porTeclado = useRef(false);
  const id = useId();

  const cerrar = useCallback((devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }, []);

  const abrir = () => {
    setAbierto(true);
    alAbrir?.();
  };

  // Clic afuera, Escape, Tab y flechas, solo mientras está abierto.
  useEffect(() => {
    if (!abierto) return;

    const alPresionar = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) cerrar(false);
    };

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cerrar();
        return;
      }
      if (rol !== 'menu' || !panel.current) return;
      if (e.key === 'Tab') {
        cerrar(false);
        return;
      }
      const opciones = Array.from(panel.current.querySelectorAll<HTMLElement>(OPCION));
      if (opciones.length === 0) return;
      const actual = opciones.indexOf(document.activeElement as HTMLElement);
      let siguiente = -1;
      if (e.key === 'ArrowDown') siguiente = actual < 0 ? 0 : (actual + 1) % opciones.length;
      else if (e.key === 'ArrowUp') siguiente = actual <= 0 ? opciones.length - 1 : actual - 1;
      else if (e.key === 'Home') siguiente = 0;
      else if (e.key === 'End') siguiente = opciones.length - 1;
      if (siguiente >= 0) {
        e.preventDefault();
        opciones[siguiente].focus();
      }
    };

    document.addEventListener('mousedown', alPresionar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alPresionar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto, cerrar, rol]);

  // Abierto con teclado: el foco entra a la primera opción (o al panel).
  useEffect(() => {
    if (!abierto || !porTeclado.current || !panel.current) return;
    const primera = panel.current.querySelector<HTMLElement>(rol === 'menu' ? OPCION : 'a, button');
    (primera ?? panel.current).focus();
  }, [abierto, rol]);

  return (
    <div ref={caja} className="relative">
      <button
        ref={boton}
        type="button"
        aria-label={etiqueta}
        aria-haspopup={rol === 'menu' ? 'menu' : 'dialog'}
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        className={className}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') porTeclado.current = true;
          if (e.key === 'ArrowDown' && !abierto) {
            e.preventDefault();
            abrir();
          }
        }}
        onPointerDown={() => {
          porTeclado.current = false;
        }}
        onClick={() => (abierto ? cerrar() : abrir())}
      >
        {disparador}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            ref={panel}
            id={id}
            role={rol}
            aria-label={etiqueta}
            tabIndex={-1}
            initial={{ y: -8, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -8, scale: 0.98, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.fast, ease: EASE }}
            className={cx(
              'absolute right-0 top-full z-[60] mt-3 origin-top-right rounded-card p-2',
              // Fondo sólido (`elevated`): un panel que se abre ENCIMA del
              // contenido tiene que taparlo. Con vidrio al 94% se leía el
              // texto de abajo entre las opciones ("Cerrar sesión" sobre
              // "Ver mi CV"). Se queda el filo de vidrio (`edge-d`).
              'edge-d bg-elevated',
              'focus:outline-none',
              panelClassName
            )}
          >
            {children(() => cerrar())}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Desplegable;

/** Clases de una opción del menú: píldora, gris que se aclara al pasar o con foco. */
export const claseOpcion =
  'flex w-full items-center gap-3 rounded-pill px-3.5 py-2.5 text-left text-[0.9375rem] text-ink-2d transition-colors duration-150 hover:bg-white/[0.06] hover:text-ink-d focus-visible:bg-white/[0.08] focus-visible:text-ink-d focus-visible:outline-none';
