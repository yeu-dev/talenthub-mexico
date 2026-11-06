import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, RotateCcw } from './icons';
import { Desplegable } from './ui';
import { motion } from 'framer-motion';
import { cx } from '../lib/cx';
import { EASE } from '../lib/motion';
import { haceCuanto } from '../lib/vacantes';
import { useNotificaciones, Notificacion } from '../hooks/useNotificaciones';

/**
 * La campana de la barra, ya con su panel.
 *
 * Antes era un enlace a "Mis postulaciones": ningún lugar mostraba los avisos,
 * nada los marcaba como leídos (el número solo subía) y a la empresa y al
 * validador los mandaba a una página que no es suya. Ahora:
 * - el panel lista los avisos, de los más nuevos a los más viejos;
 * - al abrirlo se marcan todos como leídos y el número desaparece, pero los
 *   que estaban sin leer siguen resaltados mientras el panel esté abierto;
 * - cada aviso lleva a donde se resuelve: los de pagos a /planes y los de
 *   postulaciones (solo los recibe el aspirante) a /mis-aplicaciones.
 */

/** A dónde lleva un aviso, según lo que dice. Los mensajes salen de `empleos/views.py`. */
export const destinoDe = (n: Notificacion, tipo: string | null): string | null => {
  if (/pago|plan/i.test(n.mensaje)) return '/planes';
  if (tipo === 'aspirante' && /postulaci|vacante/i.test(n.mensaje)) return '/mis-aplicaciones';
  return null;
};

const Campana: React.FC<{ tipo: string | null }> = ({ tipo }) => {
  const { lista, estado, sinLeer, marcarLeidas, recargar } = useNotificaciones(true);
  // Los que estaban sin leer al abrir: siguen resaltados aunque ya se marcaron.
  const [resaltados, setResaltados] = useState<Set<number>>(new Set());

  const alAbrir = () => {
    setResaltados(new Set(lista.filter((n) => !n.leido).map((n) => n.id)));
    marcarLeidas();
  };

  return (
    <Desplegable
      rol="dialog"
      etiqueta={sinLeer > 0 ? `Notificaciones: ${sinLeer} sin leer` : 'Notificaciones'}
      alAbrir={alAbrir}
      // El padding agranda el área de toque a 44×44 y el margen negativo lo
      // compensa: la campana no se mueve.
      className="relative -m-3 rounded-pill p-3 text-white/90 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
      panelClassName="w-[min(22rem,calc(100vw-2rem))] -mr-2"
      disparador={
        <>
          <Bell size={20} strokeWidth={1.6} />
          {sinLeer > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-pill bg-accent px-1 text-[0.6875rem] font-mid text-white">
              {sinLeer > 9 ? '9+' : sinLeer}
            </span>
          )}
        </>
      }
    >
      {(cerrar) => (
        <div>
          <p className="px-3.5 pb-2 pt-2.5 text-[0.9375rem] font-mid text-ink-d">Notificaciones</p>

          {estado === 'error' && lista.length === 0 && (
            <div className="px-3.5 pb-3 text-[0.875rem] text-ink-2d">
              <p>No pudimos cargar tus avisos.</p>
              <button
                type="button"
                onClick={recargar}
                className="mt-2 inline-flex items-center gap-1.5 rounded-pill text-accent-on-dark hover:text-ink-d"
              >
                <RotateCcw size={13} strokeWidth={1.8} />
                Reintentar
              </button>
            </div>
          )}

          {estado !== 'error' && lista.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-3.5 pb-5 pt-3 text-center">
              <Bell size={22} strokeWidth={1.6} className="text-muted-d" aria-hidden="true" />
              <p className="text-[0.875rem] text-ink-2d">
                {estado === 'cargando' ? 'Cargando…' : 'Aún no tienes avisos. Aquí verás cuando cambie tu proceso.'}
              </p>
            </div>
          )}

          {lista.length > 0 && (
            <ul className="max-h-[22rem] list-none overflow-y-auto p-0">
              {lista.map((n, i) => {
                const destino = destinoDe(n, tipo);
                const nuevo = resaltados.has(n.id);
                const cuerpo = (
                  <>
                    <span
                      aria-hidden="true"
                      className={cx('mt-[7px] h-2 w-2 flex-none rounded-full', nuevo ? 'bg-accent-on-dark' : 'bg-transparent')}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-[0.875rem] leading-snug', nuevo ? 'text-ink-d' : 'text-ink-2d')}>
                        {n.mensaje}
                      </span>
                      <span className="mt-1 block text-[0.75rem] text-muted-d">
                        {nuevo && <span className="sr-only">Nuevo. </span>}
                        {haceCuanto(n.fecha)}
                      </span>
                    </span>
                  </>
                );
                const clase = 'flex gap-3 rounded-ui px-3.5 py-3';
                // Animated List: al abrir el panel, los avisos entran uno tras
                // otro (los primeros ocho; los demás ya están fuera de vista).
                return (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: Math.min(i, 8) * 0.045, ease: EASE }}
                  >
                    {destino ? (
                      <Link
                        to={destino}
                        onClick={cerrar}
                        className={cx(clase, 'transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:outline-none')}
                      >
                        {cuerpo}
                      </Link>
                    ) : (
                      <div className={clase}>{cuerpo}</div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Desplegable>
  );
};

export default Campana;
