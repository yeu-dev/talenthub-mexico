import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, ChevronRight, CreditCard, Inbox, LogOut, Search, Send, ShieldCheck, UserRound } from './icons';
import type { LucideIcon } from './icons';
import { Desplegable, claseOpcion } from './ui';
import Iniciales from './Iniciales';
import { cx } from '../lib/cx';

/**
 * El menú de cuenta: el avatar de quien tiene sesión abre TODAS sus opciones.
 *
 * Con sesión la barra no lleva enlaces: logo, campana y avatar. Antes las
 * mismas secciones salían en la barra, en este menú y en las pestañas de la
 * página ("Mis postulaciones" tres veces). Ahora viven aquí, con la actual
 * marcada, que es lo que hacía la línea azul de la barra.
 */

export interface OpcionCuenta {
  etiqueta: string;
  to: string;
  Icono: LucideIcon;
}

/** Las opciones del menú según el rol. */
export function opcionesDeCuenta(tipo: string | null): OpcionCuenta[] {
  if (tipo === 'aspirante') {
    // "Mi perfil" primero: es lo que se busca al abrir el menú de la cuenta.
    return [
      { etiqueta: 'Mi perfil', to: '/mi-perfil', Icono: UserRound },
      { etiqueta: 'Vacantes', to: '/vacantes', Icono: Search },
      { etiqueta: 'Mis postulaciones', to: '/mis-aplicaciones', Icono: Send },
      { etiqueta: 'Planes', to: '/planes', Icono: CreditCard },
    ];
  }
  if (tipo === 'empresa') {
    return [
      { etiqueta: 'Mis vacantes', to: '/dashboard', Icono: Briefcase },
      { etiqueta: 'Postulaciones', to: '/aplicaciones-empresa', Icono: Inbox },
      { etiqueta: 'Planes', to: '/planes', Icono: CreditCard },
    ];
  }
  if (tipo === 'validador') {
    return [{ etiqueta: 'Panel de auditoría', to: '/validador', Icono: ShieldCheck }];
  }
  return [];
}

/**
 * El avatar de la cuenta: la foto si hay (solo el aspirante tiene), en
 * círculo; si no hay o no carga, las iniciales.
 */
export const AvatarCuenta: React.FC<{ nombre: string; foto?: string | null; tamano?: number }> = ({
  nombre,
  foto,
  tamano = 32,
}) => {
  const [rota, setRota] = useState(false);
  useEffect(() => setRota(false), [foto]);

  if (foto && !rota) {
    return (
      <img
        src={foto}
        alt=""
        width={tamano}
        height={tamano}
        onError={() => setRota(true)}
        style={{ width: tamano, height: tamano }}
        className="flex-none rounded-pill border border-white/[0.08] object-cover"
      />
    );
  }
  return <Iniciales nombre={nombre} tamano={tamano} className="!rounded-pill" />;
};

const MenuCuenta: React.FC<{
  username: string;
  tipo: string | null;
  foto: string | null;
  alCerrarSesion: () => void;
}> = ({ username, tipo, foto, alCerrarSesion }) => {
  const { pathname } = useLocation();

  return (
    <Desplegable
      etiqueta={`Cuenta de ${username}`}
      className="flex items-center gap-2.5 rounded-pill p-1 text-[0.9375rem] text-white/90 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white sm:pr-3"
      panelClassName="w-64"
      disparador={
        <>
          <AvatarCuenta nombre={username} foto={foto} />
          {/* En celular solo el avatar: el nombre ya va dentro del menú. */}
          <span className="hidden max-w-[10rem] truncate sm:inline">{username}</span>
          <ChevronRight size={14} strokeWidth={1.8} className="hidden rotate-90 text-white/60 sm:block" aria-hidden="true" />
        </>
      }
    >
      {(cerrar) => {
        const identidad = (
          <>
            <AvatarCuenta nombre={username} foto={foto} tamano={36} />
            <span className="min-w-0">
              <span className="block truncate text-[0.9375rem] font-mid text-ink-d">{username}</span>
              <span className="block text-[0.8125rem] capitalize text-muted-d">{tipo ?? 'Cuenta'}</span>
            </span>
          </>
        );
        return (
        <>
          {/* Tu foto y tu nombre también llevan a tu perfil (solo el
              aspirante tiene perfil). Es una opción más del menú. */}
          {tipo === 'aspirante' ? (
            <Link
              to="/mi-perfil"
              role="menuitem"
              onClick={cerrar}
              aria-label={`${username}, ver mi perfil`}
              className="flex items-center gap-3 rounded-[18px] px-3.5 pb-3 pt-2.5 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:outline-none"
            >
              {identidad}
            </Link>
          ) : (
            <div className="flex items-center gap-3 px-3.5 pb-3 pt-2.5">{identidad}</div>
          )}
          <div className="border-t border-hairline-d pt-1.5">
            {opcionesDeCuenta(tipo).map(({ etiqueta, to, Icono }) => {
              const actual = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  role="menuitem"
                  aria-current={actual ? 'page' : undefined}
                  onClick={cerrar}
                  // La sección actual, como antes la línea azul de la barra:
                  // texto blanco y el fondo de vidrio un poco más claro.
                  className={cx(claseOpcion, actual && 'bg-white/[0.07] text-ink-d')}
                >
                  <Icono size={17} strokeWidth={1.7} className="flex-none text-accent-on-dark" aria-hidden="true" />
                  {etiqueta}
                </Link>
              );
            })}
          </div>
          <div className="mt-1.5 border-t border-hairline-d pt-1.5">
            <button type="button" role="menuitem" onClick={alCerrarSesion} className={claseOpcion}>
              <LogOut size={17} strokeWidth={1.7} className="flex-none text-muted-d" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </>
        );
      }}
    </Desplegable>
  );
};

export default MenuCuenta;
