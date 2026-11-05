import React from 'react';
import { cx } from '../../lib/cx';
import { AlertTriangle, Inbox, Search, type LucideIcon } from '../icons';

interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: 'light' | 'dark';
  /** Ícono de arriba. Sin él se elige por el título: error, búsqueda o vacío. */
  icono?: LucideIcon;
}

/**
 * Sin ilustración: un ícono grande en un círculo dice de qué tipo es el
 * mensaje antes de leerlo. Error ("No pudimos…") lleva el triángulo, una
 * búsqueda sin resultados ("Ninguna…") la lupa, y una lista que todavía no
 * tiene nada, la bandeja.
 */
const iconoPorTitulo = (title: string): LucideIcon => {
  if (/^no pudimos|^no encontramos/i.test(title)) return AlertTriangle;
  if (/^ningun/i.test(title)) return Search;
  return Inbox;
};

const EmptyState: React.FC<Props> = ({ title, description, action, tone = 'light', icono }) => {
  const Icono = icono ?? iconoPorTitulo(title);
  const oscuro = tone === 'dark';
  return (
    <div
      className={cx(
        'flex flex-col items-center rounded-card border border-dashed px-6 py-12 text-center',
        oscuro ? 'border-hairline-d' : 'border-hairline'
      )}
    >
      <span
        className={cx(
          'mb-5 flex h-14 w-14 items-center justify-center rounded-pill border',
          oscuro ? 'border-hairline-d bg-white/[0.04]' : 'border-hairline bg-white/[0.04]'
        )}
      >
        <Icono size={26} className={oscuro ? 'text-ink-2d' : 'text-ink-2'} aria-hidden="true" />
      </span>
      <h3 className={cx('text-h3 font-demi', oscuro ? 'text-ink-d' : 'text-ink')}>{title}</h3>
      {description && (
        <p className={cx('mt-2 max-w-[46ch] text-body', oscuro ? 'text-ink-2d' : 'text-ink-2')}>{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
