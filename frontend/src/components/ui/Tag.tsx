import React from 'react';
import { cx } from '../../lib/cx';

/** Los tres tonos de estado del sistema. Nunca visten algo clicable. */
export type TagTono = 'neutro' | 'curso' | 'bien' | 'mal' | 'marca';

interface Props {
  tone?: 'light' | 'dark';
  /** Significado, no decoración: define el color del texto y del borde. */
  tono?: TagTono;
  className?: string;
  children: React.ReactNode;
}

/**
 * El color marca RESOLUCIÓN, no actividad.
 *
 * `curso` no lleva color a propósito: usa tinta plena y borde reforzado, que
 * se lee como "activo" sin competir con los estados resueltos. La razón es
 * dura — ámbar (#c2410c) y rojo (#dc2626) están a 19° de matiz y son
 * indistinguibles para quien tiene daltonismo rojo-verde. Como aquí significan
 * lo contrario ("sigue vivo" vs "te rechazaron"), confundirlos es inaceptable.
 *
 * Teal y rojo sí se distinguen incluso con deuteranopia: difieren en matiz y
 * en luminancia a la vez.
 */
const ESTILO: Record<TagTono, { claro: string; oscuro: string }> = {
  neutro: { claro: 'border-hairline text-muted', oscuro: 'border-hairline-d text-muted-d' },
  curso: { claro: 'border-hairline-strong text-ink', oscuro: 'border-hairline-d-strong text-ink-d' },
  bien: { claro: 'border-ok/35 text-ok', oscuro: 'border-ok-d/35 text-ok-d' },
  mal: { claro: 'border-danger/35 text-danger', oscuro: 'border-danger-d/35 text-danger-d' },
  marca: { claro: 'border-accent/35 text-accent-on-dark', oscuro: 'border-accent-on-dark/35 text-accent-on-dark' },
};

/**
 * Pill de contorno, sin relleno.
 *
 * Sustituye a `getModalidadColor()` y sus pasteles: el color vive en el texto
 * y en el borde al 30%, no en un fondo saturado que compita con el contenido.
 */
const Tag: React.FC<Props> = ({ tone = 'light', tono = 'neutro', className, children }) => (
  <span
    className={cx(
      'inline-block whitespace-nowrap rounded-pill border px-3 py-1 text-[0.78rem]',
      tone === 'dark' ? ESTILO[tono].oscuro : ESTILO[tono].claro,
      className
    )}
  >
    {children}
  </span>
);

/** Modalidad de la vacante. El color codifica dónde trabajas, no adorna. */
export const TONO_MODALIDAD: Record<string, TagTono> = {
  remoto: 'bien',
  hibrido: 'marca',
  presencial: 'curso',
};

export default Tag;
