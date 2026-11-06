import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronRight } from './icons';
import { motion } from 'framer-motion';
import { cx } from '../lib/cx';
import { SPRING } from '../lib/motion';
import FondoVivo from './fondos/FondoVivo';
import { useColumnaAviso } from './PromoApp';

export interface Miga {
  etiqueta: string;
  to?: string;
}

export interface Pestana {
  etiqueta: string;
  to: string;
}

/**
 * La familia de la página. Cada una combina tres cosas (velo, halo y altura)
 * y ninguna se repite con su vecina, para que las páginas no se lean iguales:
 *
 * | Familia    | Páginas                                | Velo | Halo                        | Franja |
 * |------------|----------------------------------------|------|-----------------------------|--------|
 * | `explorar` | Vacantes                               | 25%  | teal, arriba a la derecha   | baja, la barra de filtros pegada |
 * | `ficha`    | Detalle de vacante                     | 25%  | rojo, detrás del membrete   | alta, membrete |
 * | `venta`    | Planes                                 | 45%  | azul, centrado y amplio     | la más alta, título centrado |
 * | `trabajo`  | Postulaciones, vacantes, perfil, validador | —  | azul tenue a la izquierda   | compacta |
 * | `lectura`  | Privacidad                             | —    | —                           | sobria, ancho de documento |
 *
 * Las de `trabajo` van sin velo a propósito: son pantallas de uso diario y la
 * calma también es identidad.
 */
export type Familia = 'explorar' | 'ficha' | 'venta' | 'trabajo' | 'lectura';

interface Estilo {
  /** Opacidad del velo vivo; `null` = sin velo. */
  velo: number | null;
  /** Clases del halo; `null` = sin halo. */
  halo: string | null;
  arriba: string;
  /** Espacio de abajo cuando un panel de vidrio se monta sobre el filo. */
  abajo: string;
  centrado?: boolean;
}

const FAMILIAS: Record<Familia, Estilo> = {
  explorar: {
    velo: 0.25,
    halo: '-right-40 -top-48 h-[520px] w-[820px] bg-[radial-gradient(closest-side,rgba(45,212,191,0.16),transparent_72%)]',
    arriba: 'pt-[calc(var(--nav-flow)+2.25rem)]',
    abajo: 'pb-32',
  },
  ficha: {
    velo: 0.25,
    // Rojo fijo (el rosa de la paleta) y no uno por empresa: con miles de
    // empresas los tonos se repetirían igual y no le dirían nada a nadie. Al
    // 22% queda por debajo, en luminancia, del halo blanco al 15% que tenían
    // antes todas las franjas: las migas en `muted-d` siguen pasando.
    halo: '-left-48 -top-52 h-[600px] w-[880px] bg-[radial-gradient(closest-side,rgba(251,113,133,0.22),transparent_72%)]',
    arriba: 'pt-[calc(var(--nav-flow)+3.5rem)]',
    abajo: 'pb-36',
  },
  venta: {
    velo: 0.45,
    halo: 'left-1/2 -top-64 h-[680px] w-[1200px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(74,102,255,0.26),transparent_74%)]',
    arriba: 'pt-[calc(var(--nav-flow)+4.5rem)]',
    abajo: 'pb-36',
    centrado: true,
  },
  trabajo: {
    velo: null,
    halo: '-left-64 -top-56 h-[520px] w-[860px] bg-[radial-gradient(closest-side,rgba(74,102,255,0.12),transparent_72%)]',
    arriba: 'pt-[calc(var(--nav-flow)+1.75rem)]',
    abajo: 'pb-28',
  },
  lectura: {
    velo: null,
    halo: null,
    arriba: 'pt-[calc(var(--nav-flow)+2.75rem)]',
    abajo: 'pb-28',
  },
};

/** Lo que tenían todas las páginas antes de las familias. */
const SIN_FAMILIA: Estilo = {
  velo: 0.25,
  halo: '-top-52 left-1/2 h-[560px] w-[1000px] -translate-x-[58%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.15),transparent_74%)]',
  arriba: 'pt-[calc(var(--nav-flow)+2.75rem)]',
  abajo: 'pb-32',
};

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
   * vidrio se monte sobre el filo (`glass-panel-overlap`). Es el que usan hoy
   * todas las páginas. `claro` queda del registro anterior y ya no se usa;
   * se conserva como valor por defecto para no romper llamadas viejas.
   */
  tono?: 'claro' | 'oscuro';
  /** Solo en oscuro: el velo, el halo y la altura de la franja (ver `Familia`). */
  familia?: Familia;
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
 * pestañas entre secciones hermanas y el título; lo que distingue a cada
 * página es su `familia`: el velo, el halo y la altura de la franja.
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
  familia,
  solapa = true,
  children,
}) => {
  const oscuro = tono === 'oscuro';
  // Con el aviso de la app abierto, la página deja libre la columna derecha
  // (`lg:pr-[340px]` en `Pagina`). La franja negra se mete debajo de esa
  // columna con el mismo ancho y lo devuelve en padding: así llega al borde
  // de la ventana en lugar de cortarse en seco, y su contenido no se mueve.
  // Se desliza con la misma transición que el padding de `Pagina`: así, al
  // cerrar el aviso, la orilla de la franja se queda pegada al borde.
  const aviso = useColumnaAviso();
  const estilo = familia ? FAMILIAS[familia] : SIN_FAMILIA;
  const centrado = !!estilo.centrado && !inicio && !acciones && !pestanas;
  return (
  <header
    className={cx(
      oscuro
        ? cx(
            'relative isolate mt-[calc(var(--nav-flow)*-1)] overflow-hidden bg-night text-ink-d',
            'transition-[margin,padding] duration-500 ease-base motion-reduce:transition-none',
            aviso && '-mr-[340px] pr-[340px]',
            estilo.arriba,
            solapa ? estilo.abajo : pestanas ? '' : 'pb-10'
          )
        : // También sube bajo el nav flotante: así los halos de la página se ven
          // detrás del pill y no queda una franja blanca del <body> arriba.
          cx(
            'mt-[calc(var(--nav-flow)*-1)] border-b border-hairline pt-[calc(var(--nav-flow)+1.75rem)]',
            pestanas ? '' : 'pb-7 md:pb-8'
          )
    )}
  >
    {oscuro && estilo.halo && (
      <div aria-hidden="true" className={cx('pointer-events-none absolute -z-10', estilo.halo)} />
    )}
    {/* El mismo velo vivo de la portada, más tenue. Solo en las familias que lo llevan. */}
    {oscuro && estilo.velo !== null && <FondoVivo alto="franja" opacidad={estilo.velo} />}
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

      <div
        className={cx(
          'relative flex flex-wrap items-center gap-x-6 gap-y-4',
          centrado ? 'justify-center text-center' : 'justify-between'
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          {inicio}
          <div className="min-w-0">
            <h1
              className={cx(
                'font-heading font-mid leading-tight tracking-[-0.02em]',
                familia === 'venta'
                  ? 'text-[clamp(2rem,4.6vw,3.25rem)]'
                  : familia === 'trabajo'
                    ? 'text-[clamp(1.625rem,3vw,2.125rem)]'
                    : 'text-[clamp(1.75rem,3.6vw,2.375rem)]',
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
          // `overflow-y-hidden`: con `overflow-x-auto` el eje vertical también
          // se vuelve desplazable, y en Windows salía una barrita de scroll junto
          // a las pestañas cuando la línea activa asomaba un pixel.
          className={cx(
            'mt-6 flex gap-6 overflow-x-auto overflow-y-hidden',
            oscuro ? 'border-b border-hairline-d' : '-mb-px'
          )}
        >
          {pestanas.map((p) => (
            <NavLink
              key={p.to}
              to={p.to}
              className={({ isActive }) =>
                cx(
                  'relative whitespace-nowrap pb-3 text-[0.9375rem] font-mid transition-colors',
                  isActive
                    ? oscuro
                      ? 'text-ink-d'
                      : 'text-ink'
                    : oscuro
                      ? 'text-muted-d hover:text-ink-d'
                      : 'text-muted hover:text-ink'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {p.etiqueta}
                  {/* La línea se desliza entre pestañas al cambiar de sección. */}
                  {isActive && (
                    <motion.span
                      layoutId="pestana-activa"
                      transition={SPRING}
                      className={cx(
                        'absolute bottom-0 left-0 right-0 h-[2px] rounded-pill',
                        oscuro ? 'bg-accent-on-dark' : 'bg-accent'
                      )}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  </header>
  );
};

export default PageHeader;
