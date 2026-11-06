import React from 'react';
import { cx } from '../lib/cx';

/**
 * Tonos para el cuadro de iniciales. Cada empresa cae siempre en el mismo
 * (sale de su nombre), así se reconoce de un vistazo en las listas sin leer.
 * Son tintes bajos sobre el vidrio oscuro con texto claro: dan color sin
 * competir con el azul de los botones.
 *
 * Sin ámbar: DESIGN.md lo deja fuera del sistema porque con daltonismo
 * rojo-verde se confunde con el rojo de "rechazada". En su lugar va un tono
 * neutro, que también sirve de respiro entre los de color.
 */
const TONOS = [
  'bg-[rgba(74,102,255,0.16)] text-[#b4c2ff]',
  'bg-[rgba(45,212,191,0.14)] text-[#7eecd9]',
  'bg-[rgba(167,139,250,0.16)] text-[#cfc2ff]',
  'bg-white/[0.07] text-ink-2',
  'bg-[rgba(251,113,133,0.14)] text-[#fdb1be]',
];

const tonoPara = (nombre: string) => {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONOS[h % TONOS.length];
};

/** "Nebula Labs" → "NL"; "Santander SA de CV" → "SS". */
export const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '·';

interface Props {
  nombre: string;
  /** Lado del cuadro en px. */
  tamano?: number;
  className?: string;
}

/** El membrete de una empresa: sus iniciales en un cuadro de su color. */
const Iniciales: React.FC<Props> = ({ nombre, tamano = 44, className }) => (
  <span
    aria-hidden="true"
    style={{ width: tamano, height: tamano, fontSize: Math.round(tamano * 0.34) }}
    className={cx(
      'flex flex-none items-center justify-center rounded-[12px] border border-white/[0.08] font-demi tracking-[0.02em]',
      tonoPara(nombre),
      className
    )}
  >
    {iniciales(nombre)}
  </span>
);

export default Iniciales;
