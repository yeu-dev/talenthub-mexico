import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Eye, Send, UserPlus } from '../icons';
import { clasesBoton, ProcessTrack } from '../ui';
import type { EstadoPostulacion } from '../ui';
import Proceso from './Proceso';
import type { Paso } from './Proceso';
import { CONTENEDOR, PARTIDA, TITULO_SECCION } from './comun';
import SeccionFija from './SeccionFija';

/**
 * Para quien busca: qué pasa después de encontrar la vacante. Es el
 * equivalente a "Comienza tu historia de éxito", pero en lugar de una
 * ilustración enseña la pieza real del producto: el track de "Mis
 * postulaciones", con sus estados.
 *
 * Los tres pasos son una secuencia de verdad y se animan como tal
 * (`Proceso`): el ojo parpadea, el avión sale volando y la campana suena.
 * Todo lo que dicen lo hace el producto hoy: el sueldo es obligatorio en cada
 * vacante, la postulación lleva el CV del perfil y cada cambio de estado
 * manda una notificación.
 */

const PASOS: Paso[] = [
  {
    // El ojo y no el billete: el billete ya es el ícono de "Sueldo siempre
    // visible" en el hero, y el paso dice "a la vista".
    Icono: Eye,
    gesto: 'mirada',
    titulo: 'Buscas con el sueldo a la vista',
    texto: 'Toda vacante publica su rango. Filtra por stack, ciudad o modalidad.',
  },
  {
    Icono: Send,
    gesto: 'vuelo',
    titulo: 'Te postulas desde la vacante',
    texto: 'Tu perfil y tu CV van con la postulación; no llenas un formulario cada vez.',
  },
  {
    Icono: Bell,
    gesto: 'campana',
    titulo: 'Sigues tu proceso',
    texto: 'Ves en qué punto va cada postulación y te avisamos cuando cambia.',
  },
];

/** Vista de ejemplo: títulos genéricos y sin empresa, para no inventar registros. */
const EJEMPLO: { puesto: string; estado: EstadoPostulacion }[] = [
  { puesto: 'Desarrollador Backend', estado: 'revisado' },
  { puesto: 'Frontend React', estado: 'aceptado' },
  { puesto: 'Analista de Datos', estado: 'pendiente' },
];

const ParaQuienBusca: React.FC = () => (
  // De vuelta a `night`, con el halo azul a la izquierda: sale de la banda
  // `surface` de "Explora" y entra al velo de "Para empresas". Fija mientras
  // el scroll recorre los pasos (`SeccionFija`). Sin grano: el grano es la
  // identidad de /empresas y el velo, la de la portada.
  <SeccionFija
    titulo="busca-titulo"
    pasos={PASOS.length}
    fondo={
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-56 top-1/2 -z-10 h-[680px] w-[680px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.2),transparent_72%)]"
      />
    }
  >
    {(progreso) => (
    <div className={`${CONTENEDOR} ${PARTIDA} w-full`}>
      <div>
        <h2 id="busca-titulo" className={TITULO_SECCION}>
          De la búsqueda a la respuesta, sin adivinar
        </h2>

        <Proceso pasos={PASOS} progreso={progreso} className="mt-10" />

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/register" className={clasesBoton({ tone: 'dark' })}>
            <UserPlus size={15} strokeWidth={1.8} />
            Crea tu cuenta
          </Link>
          <Link to="/vacantes" className={clasesBoton({ variant: 'ghost', tone: 'dark' })}>
            Ver vacantes
          </Link>
        </div>
      </div>

      {/* La pieza real del producto en lugar de una ilustración. Desde `lg`
          baja un poco para arrancar a la altura de los pasos, no del título. */}
      <figure className="edge-d rounded-card bg-white/[0.05] p-5 backdrop-blur-md md:p-6 md:backdrop-blur-card lg:mt-[4.5rem]">
        <p className="text-[0.9375rem] font-mid text-ink-d">Mis postulaciones</p>
        <ul className="mt-4 list-none p-0">
          {EJEMPLO.map(({ puesto, estado }) => (
            <li
              key={puesto}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline-d py-4"
            >
              <span className="text-[0.9375rem] text-ink-d">{puesto}</span>
              <ProcessTrack estado={estado} tone="dark" />
            </li>
          ))}
        </ul>
        <figcaption className="mt-2 text-[0.8125rem] text-muted-d">Vista de ejemplo de tu panel</figcaption>
      </figure>
    </div>
    )}
  </SeccionFija>
);

export default ParaQuienBusca;
