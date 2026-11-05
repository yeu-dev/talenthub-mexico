import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Inbox, ShieldCheck } from '../icons';
import type { LucideIcon } from '../icons';
import { clasesBoton } from '../ui';
import VacanteCard from '../VacanteCard';
import FondoVivo from '../fondos/FondoVivo';
import { VacantePublica } from '../../lib/vacantes';
import { AIRE_SECCION, CONTENEDOR, PARTIDA, TITULO_SECCION } from './comun';

/**
 * Para empresas: el cierre de la portada. Es la única sección con el velo
 * vivo detrás (variante `banda`, al 25%) y va en espejo respecto a "Para
 * quien busca": aquí la pieza visual queda a la izquierda y el texto a la
 * derecha. Así las dos secciones partidas no se leen como la misma dos veces.
 *
 * La pieza visual es una vacante real ya publicada, tal cual se ve en el
 * listado. Sobre el velo su vidrio se oscurece desde `md`
 * (`rgba(16,16,18,0.5)`, la misma regla que los paneles de la portada), para
 * que su texto gris siga pasando AA.
 *
 * Lo que promete lo cumple el backend: publicar no pide plan
 * (`perform_create` no revisa suscripción), toda vacante nace `pendiente` y
 * solo sale al catálogo aprobada por un validador, y las postulaciones se
 * contestan desde "Aplicaciones". De los planes no se promete nada concreto.
 */

const PUNTOS: { Icono: LucideIcon; texto: string }[] = [
  { Icono: Building2, texto: 'Publicas sin costo y sin tarjeta' },
  { Icono: ShieldCheck, texto: 'Un validador revisa cada vacante antes de que salga' },
  { Icono: Inbox, texto: 'Recibes y respondes las postulaciones desde tu panel' },
];

const ParaEmpresas: React.FC<{ vacantes: VacantePublica[] }> = ({ vacantes }) => {
  const muestra = vacantes[0];

  return (
    <section aria-labelledby="empresas-banda-titulo" className={`relative isolate overflow-hidden ${AIRE_SECCION}`}>
      <FondoVivo alto="banda" />
      <div className={CONTENEDOR}>
        {/* Apilada hasta `lg` (el texto primero); desde ahí, en espejo y
            alineada arriba: la vacante arranca a la altura del título. */}
        <div className={PARTIDA}>
          {muestra && (
            <figure className="order-2 hidden md:block lg:order-1 lg:mt-2">
              <div className="md:[&>article]:bg-[rgba(16,16,18,0.5)]">
                <VacanteCard vacante={muestra} />
              </div>
              <figcaption className="mt-3 text-[0.8125rem] text-muted-d">Así se ve una vacante publicada</figcaption>
            </figure>
          )}

          <div className="order-1 lg:order-2">
            <h2 id="empresas-banda-titulo" className={TITULO_SECCION}>
              ¿Contratas? Publica gratis
            </h2>
            <p className="mt-3 max-w-[52ch] text-body text-ink-2d">
              Llega a gente de TI que ya sabe cuánto pagas, porque aquí el sueldo siempre va a la vista.
            </p>
            <ul className="mt-8 flex list-none flex-col gap-4 p-0">
              {PUNTOS.map(({ Icono, texto }) => (
                <li key={texto} className="flex items-center gap-3 text-[0.9375rem] text-ink-d">
                  <Icono size={18} strokeWidth={1.7} className="flex-none text-accent-on-dark" aria-hidden="true" />
                  {texto}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/empresas" className={clasesBoton({ tone: 'dark' })}>
                Conoce TalentHub para empresas
                <ArrowRight size={15} strokeWidth={1.8} />
              </Link>
              <Link to="/planes" className={clasesBoton({ variant: 'ghost', tone: 'dark' })}>
                Ver planes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParaEmpresas;
