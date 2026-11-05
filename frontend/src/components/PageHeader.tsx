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
  children?: React.ReactNode;
}

/**
 * Encabezado claro de las páginas de la aplicación.
 *
 * El negro se queda en la portada, el acceso y el pie: si todas las páginas
 * abren con la misma franja oscura y un título, no se distingue una de otra.
 * Aquí lo que orienta es la ruta de migas, las pestañas entre secciones
 * hermanas y el título; el fondo claro dice "estás dentro de la herramienta".
 */
const PageHeader: React.FC<Props> = ({ titulo, migas, detalle, acciones, pestanas, inicio, ancho = 'page', children }) => (
  <header className={cx('border-b border-hairline bg-canvas', pestanas ? 'pt-7' : 'py-7 md:py-8')}>
    <div className={cx('mx-auto px-6 md:px-7', ancho === 'doc' ? 'max-w-4xl' : 'max-w-page')}>
      {migas && migas.length > 0 && (
        <nav aria-label="Ruta" className="mb-4">
          <ol className="flex list-none flex-wrap items-center gap-1.5 p-0 text-[0.875rem] text-muted">
            {migas.map((miga, i) => {
              const ultima = i === migas.length - 1;
              return (
                <li key={`${miga.etiqueta}-${i}`} className="flex items-center gap-1.5">
                  {miga.to && !ultima ? (
                    <Link to={miga.to} className="transition-colors hover:text-ink">
                      {miga.etiqueta}
                    </Link>
                  ) : (
                    <span aria-current={ultima ? 'page' : undefined} className={ultima ? 'text-ink-2' : undefined}>
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

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4">
          {inicio}
          <div className="min-w-0">
            <h1 className="font-heading text-[clamp(1.75rem,3.6vw,2.375rem)] font-mid leading-tight tracking-[-0.02em] text-ink">
              {titulo}
            </h1>
            {detalle && <div className="tabular mt-1.5 text-body text-ink-2">{detalle}</div>}
          </div>
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-3">{acciones}</div>}
      </div>

      {children}

      {pestanas && pestanas.length > 0 && (
        <nav aria-label="Secciones" className="-mb-px mt-6 flex gap-6 overflow-x-auto">
          {pestanas.map((p) => (
            <NavLink
              key={p.to}
              to={p.to}
              className={({ isActive }) =>
                cx(
                  'whitespace-nowrap border-b-2 pb-3 text-[0.9375rem] font-mid transition-colors',
                  isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
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

export default PageHeader;
