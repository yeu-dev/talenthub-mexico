import React from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../lib/cx';

interface Props {
  to?: string;
  className?: string;
}

/**
 * El monograma "th" más el nombre. Es el mismo ícono de la app instalada, de
 * Play Store y del favicon: antes la web solo escribía "TalentHub" en texto y
 * no se reconocía como la misma marca. Vive siempre sobre superficie oscura
 * (barra, pie y acceso), donde el cuadro negro del ícono se funde con el fondo
 * y queda solo la marca; el borde fino le devuelve el contorno.
 */
const Brand: React.FC<Props> = ({ to = '/', className }) => (
  <Link
    to={to}
    aria-label="TalentHub, inicio"
    className={cx('inline-flex items-center gap-2.5 whitespace-nowrap transition-opacity hover:opacity-85', className)}
  >
    <img
      src="/icon-192.png"
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 rounded-[9px] border border-hairline-d"
    />
    <span className="text-[1.0625rem] font-demi tracking-[-0.015em] text-ink-d">TalentHub</span>
  </Link>
);

export default Brand;
