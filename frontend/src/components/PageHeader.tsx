import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cx } from '../lib/cx';

export interface Miga {
  etiqueta: string;
  to?: string;
}

export interface Pestana {
  etiqueta: string;
  to: string;
}

interface Props {
  titulo: React.ReactNode;
  /** Ruta de migas: "Mi cuenta › Mis postulaciones". La última es la página actual. */
  migas?: Miga[];
  /** Conteo o una línea de contexto bajo el título. */
  detalle?: React.ReactNode;
  /** Botones a la derecha del título. */
  acciones?: React.ReactNode;
  /** Pestañas entre las secciones hermanas; la activa se marca sola. */
  pestanas?: Pestana[];
  /** Algo a la izquierda del título: el membrete de la empresa en el detalle. */
  inicio?: React.ReactNode;
  /** Ancho del contenido: `page` (1200) o `doc` (896). */
  ancho?: 'page' | 'doc';
  /**
   * `oscuro`: banda negra bajo el nav, con espacio abajo para que un panel de
   * vidrio se monte sobre el filo (`glass-panel-overlap`). Es el membrete del
   * detalle de vacante. Por defecto, claro.
   */
  tono?: 'claro' | 'oscuro';
  /**
   * Solo en oscuro: deja abajo el espacio para que el primer panel de vidrio
   * se monte sobre el filo. Sin panel que montar (Vacantes), la banda es corta.
   */
  solapa?: boolean;
  children?: React.ReactNode;
}

/**
 * Encabezado de las páginas de la aplicación.
 *
 * Si todas las páginas abren con la misma franja oscura y un título, no se
 * distingue una de otra. Lo que orienta aquí es la ruta de migas, las
 * pestañas entre secciones hermanas y el título. El claro es translúcido para
 * que se asomen los halos de `mesh-page`; el oscuro es para el membrete del
 * detalle, donde el panel de vidrio cruza el filo.
 */
const PageHeader: React.FC<Props> = ({
  titulo,
  migas,
  detalle,
  acciones,
  pestanas,
  inicio,
  ancho = 'page',
  tono = 'claro',
  solapa = true,
  children,
}) => {
  const oscuro = tono === 'oscuro';
  return (
  <header
    className={cx(
      oscuro
        ? cx(
            'relative isolate mt-[calc(var(--nav-flow)*-1)] overflow-hidden bg-night pt-[calc(var(--nav-flow)+2.75rem)] text-ink-d',
            solapa ? 'pb-32' : pestanas ? '' : 'pb-10'
          )
        : // También sube bajo el nav flotante: así los halos de la página se ven
          // detrás del pill y no queda una franja blanca del <body> arriba.
          cx(
            'mt-[calc(var(--nav-flow)*-1)] border-b border-hairline pt-[calc(var(--nav-flow)+1.75rem)]',
            pestanas ? '' : 'pb-7 md:pb-8'
          )
    )}
  >
    {oscuro && (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-52 left-1/2 -z-10 h-[560px] w-[1000px] -translate-x-[58%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.15),transparent_74%)] blur-[6px]"
      />
    )}
    <div className={cx('mx-auto px-6 md:px-7', ancho === 'doc' ? 'max-w-4xl' : 'max-w-page')}>
      {migas && migas.length > 0 && (
        <nav aria-label="Ruta" className="mb-4">
          <ol className={cx('flex list-none flex-wrap items-center gap-1.5 p-0 text-[0.875rem]', oscuro ? 'text-muted-d' : 'text-muted')}>
            {migas.map((miga, i) => {
              const ultima = i === migas.length - 1;
              return (
                <li key={`${miga.etiqueta}-${i}`} className="flex items-center gap-1.5">
                  {miga.to && !ultima ? (
                    <Link to={miga.to} className={cx('transition-colors', oscuro ? 'hover:text-ink-d' : 'hover:text-ink')}>
                      {miga.etiqueta}
                    </Link>
                  ) : (
                    <span
                      aria-current={ultima ? 'page' : undefined}
                      className={ultima ? (oscuro ? 'text-ink-2d' : 'text-ink-2') : undefined}
                    >
                      {miga.etiqueta}
                    </span>
                  )}
                  {!ultima && <ChevronRight size={14} strokeWidth={1.7} aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4">
          {inicio}
          <div className="min-w-0">
            <h1
              className={cx(
                'font-heading text-[clamp(1.75rem,3.6vw,2.375rem)] font-mid leading-tight tracking-[-0.02em]',
                oscuro ? 'text-ink-d' : 'text-ink'
              )}
            >
              {titulo}
            </h1>
            {detalle && (
              <div className={cx('tabular mt-1.5 text-body', oscuro ? 'text-ink-2d' : 'text-ink-2')}>{detalle}</div>
            )}
          </div>
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-3">{acciones}</div>}
      </div>

      {children}

      {pestanas && pestanas.length > 0 && (
        <nav
          aria-label="Secciones"
          className={cx('mt-6 flex gap-6 overflow-x-auto', oscuro ? 'border-b border-hairline-d' : '-mb-px')}
        >
          {pestanas.map((p) => (
            <NavLink
              key={p.to}
              to={p.to}
              className={({ isActive }) =>
                cx(
                  'whitespace-nowrap border-b-2 pb-3 text-[0.9375rem] font-mid transition-colors',
                  isActive
                    ? oscuro
                      ? 'border-accent-on-dark text-ink-d'
                      : 'border-accent text-ink'
                    : oscuro
                      ? 'border-transparent text-muted-d hover:text-ink-d'
                      : 'border-transparent text-muted hover:text-ink'
                )
              }
            >
              {p.etiqueta}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  </header>
  );
};

export default PageHeader;
