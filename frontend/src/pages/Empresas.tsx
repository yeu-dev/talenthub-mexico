import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Inbox, ShieldCheck, Upload } from '../components/icons';
import { clasesBoton, ProcessTrack } from '../components/ui';
import type { EstadoPostulacion } from '../components/ui';
import VacanteCard from '../components/VacanteCard';
import Iniciales from '../components/Iniciales';
import FondoVivo from '../components/fondos/FondoVivo';
import FondoGrano from '../components/fondos/FondoGrano';
import Proceso from '../components/portada/Proceso';
import SeccionFija from '../components/portada/SeccionFija';
import type { Paso } from '../components/portada/Proceso';
import { AIRE_CIERRE, AIRE_SECCION, CONTENEDOR, PARTIDA, TITULO_SECCION } from '../components/portada/comun';
import { useSinAvisoApp } from '../components/PromoApp';
import { useTitulo } from '../hooks/useTitulo';
import api from '../services/api';
import { VacantePublica } from '../lib/vacantes';

/**
 * La portada para quien contrata (el equivalente a "OCC Empresas").
 *
 * Cada sección cambia de superficie y de composición respecto a la anterior
 * (DESIGN.md, *Band Architecture*):
 * hero con grano y partido → pasos en horizontal, fijos mientras el scroll
 * los recorre → panel en espejo sobre `night` → cierre centrado con velo.
 * Sin franja de empresas ni tablero de planes: los planes viven en /planes
 * (el hero lleva "Ver planes"), igual que las vacantes viven en /vacantes.
 *
 * Todo lo que afirma lo hace el producto: publicar no pide plan, toda vacante
 * nace pendiente y solo sale aprobada por un validador, cambiar puesto,
 * sueldo, requisitos, lugar o modalidad la regresa a revisión
 * (`CAMPOS_REVISADOS`), y cada respuesta a una postulación le llega al
 * aspirante como notificación. Las piezas de "postulaciones recibidas" son
 * vistas de ejemplo, marcadas como tales y sin nombres de personas.
 */

const REGISTRO_EMPRESA = '/register?rol=empresa';

const EJEMPLO_POSTULACIONES: { puesto: string; estado: EstadoPostulacion; conCv: boolean }[] = [
  { puesto: 'Desarrollador Backend', estado: 'pendiente', conCv: true },
  { puesto: 'Desarrollador Backend', estado: 'revisado', conCv: true },
  { puesto: 'Frontend React', estado: 'aceptado', conCv: true },
];

/**
 * La flecha sube, el escudo se sella y la bandeja recibe (ver `Proceso`).
 * "Subir" y no el avión: el avión ya es "te postulas" en la portada, y entre
 * los dos procesos ningún ícono se repite.
 */
const PASOS: Paso[] = [
  {
    Icono: Upload,
    gesto: 'subida',
    titulo: 'Publicas tu vacante',
    texto: 'Puesto, requisitos y sueldo. El sueldo es obligatorio: es lo primero que lee quien busca.',
  },
  {
    Icono: ShieldCheck,
    gesto: 'escudo',
    titulo: 'Un validador la revisa',
    texto: 'Sale al catálogo cuando la aprueba. Si cambias el puesto o el sueldo, vuelve a revisión.',
  },
  {
    Icono: Inbox,
    gesto: 'bandeja',
    titulo: 'Respondes desde tu panel',
    texto: 'Ves cada postulación con su CV y la marcas en revisión, aceptada o rechazada. El aspirante recibe el aviso.',
  },
];

/**
 * El botón principal de la pantalla. Sin borde de luz ni chispas: ese efecto
 * se reserva para Registrarse y Postularme (DESIGN.md, *Motion*).
 */
const BotonPublicar: React.FC = () => (
  <Link to={REGISTRO_EMPRESA} className={clasesBoton({ tone: 'dark' })}>
    Publica tu primera vacante
    <ArrowRight size={15} strokeWidth={1.8} />
  </Link>
);

/** Una postulación recibida, como se ve en el panel. Solo para las vistas de ejemplo. */
const FilaPostulacion: React.FC<{ n: number; puesto: string; estado: EstadoPostulacion; conCv: boolean }> = ({
  n,
  puesto,
  estado,
  conCv,
}) => (
  <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline-d py-4 first:border-t-0">
    <Iniciales nombre={`Aspirante ${n}`} tamano={36} />
    <div className="min-w-[8rem] flex-1">
      <p className="whitespace-nowrap text-[0.9375rem] font-mid text-ink-d">Aspirante {n}</p>
      {/* El CV va en la línea del puesto: suelto al final se iba a otro renglón. */}
      <p className="flex items-center gap-2 text-[0.8125rem] text-muted-d">
        <span className="truncate">{puesto}</span>
        {conCv && (
          <span className="flex flex-none items-center gap-1 text-ink-2d">
            <FileText size={13} strokeWidth={1.7} aria-hidden="true" />
            CV
          </span>
        )}
      </p>
    </div>
    <ProcessTrack estado={estado} tone="dark" />
  </li>
);

/**
 * Cada sección de esta página mide al menos una pantalla y centra su
 * contenido en vertical: se lee como bloques, uno por pantalla. Antes eran
 * franjas cortas y la siguiente siempre se asomaba a medias.
 */
const PANTALLA = 'flex min-h-[100svh] flex-col justify-center';

const Empresas: React.FC = () => {
  useTitulo('Para empresas');
  // Aquí nada compite con "Publica tu primera vacante": el aviso de la app
  // (pensado para quien busca) se esconde, y el velo ocupa todo el ancho.
  useSinAvisoApp();

  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    api
      .get<VacantePublica[]>('/vacantes/')
      .then(({ data }) => vivo.current && setVacantes(data))
      .catch(() => undefined);
    return () => {
      vivo.current = false;
    };
  }, []);

  const muestra = vacantes[0];

  return (
    // `overflow-clip` y no `overflow-hidden`: recorta igual, pero deja que la
    // sección fija de los pasos (`sticky`) se pegue a la ventana.
    <div className="relative isolate -mt-[var(--nav-flow)] overflow-clip text-ink-d">
      {/* ───────────── Hero: grano, partido, a pantalla completa ─────────────
          Cada sección de esta página mide al menos una pantalla (`100svh`) y
          centra su contenido: así se lee como bloques, uno por pantalla, y la
          siguiente no se asoma a medias. */}
      <header className={`relative isolate ${PANTALLA} pb-[clamp(3.5rem,7vw,6.5rem)] pt-[calc(var(--nav-flow)+clamp(2.5rem,6vw,5rem))]`}>
        <FondoGrano />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-48 top-40 -z-10 h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.22),transparent_72%)]"
        />
        {/* Aquí sí va centrado en vertical: es el hero, y el texto y las piezas
            tienen alturas parecidas. Partido desde `lg`; en tablet, apilado. */}
        <div className={`${CONTENEDOR} grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16`}>
          <div>
            <h1 className="max-w-[16ch] font-heading text-[clamp(2.125rem,5vw,3.25rem)] font-mid leading-[1.05] tracking-[-0.02em]">
              Contrata gente de TI que ya sabe cuánto pagas
            </h1>
            <p className="mt-5 max-w-[46ch] text-body text-ink-2d">
              Publicas gratis, un validador revisa cada vacante y tú respondes las postulaciones desde un solo panel.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <BotonPublicar />
              <Link to="/planes" className={clasesBoton({ variant: 'ghost', tone: 'dark' })}>
                Ver planes
              </Link>
            </div>
          </div>

          {/* Dos piezas reales del producto en lugar de una foto de stock. La
              postulación va en el flujo, debajo de la vacante, y solo se monta
              sobre su margen inferior (`-mt-4` < el `p-6` de la tarjeta): antes
              iba suelta encima y tapaba la ciudad y la fecha. */}
          <div className="hidden md:block">
            {muestra && (
              <div className="[&>article]:bg-[rgba(16,16,18,0.5)]">
                <VacanteCard vacante={muestra} />
              </div>
            )}
            <figure
              className={`edge-d relative ml-6 w-[min(26rem,calc(100%-1.5rem))] rounded-card bg-[rgba(16,16,18,0.72)] p-4 backdrop-blur-card lg:-ml-8 ${muestra ? '-mt-4' : ''}`}
            >
              <ul className="list-none p-0">
                {/* Puesto genérico a propósito: con el título de la vacante real de
                    al lado, parecería una postulación que de verdad existe. */}
                <FilaPostulacion n={1} puesto="Desarrollador Backend" estado="revisado" conCv />
              </ul>
              <figcaption className="mt-1 text-[0.75rem] text-muted-d">Postulación recibida · vista de ejemplo</figcaption>
            </figure>
          </div>
        </div>
      </header>

      {/* ───────────── Cómo funciona: horizontal, banda surface ───────────── */}
      {/* Fija mientras el scroll recorre los pasos (`SeccionFija`). Los fondos
          se alternan bloque a bloque: grano (hero) → `surface` (pasos) →
          grano (panel) → velo (cierre). */}
      <SeccionFija titulo="pasos-titulo" pasos={PASOS.length} className="border-b border-hairline-d bg-surface">
        {(progreso) => (
          <div className={`${CONTENEDOR} w-full`}>
            <h2 id="pasos-titulo" className={TITULO_SECCION}>
              De la vacante a la contratación
            </h2>
            {/* En columna hasta `lg`, en fila desde ahí; cada tramo de línea
                termina en el siguiente círculo, no en el borde de la página. */}
            <Proceso pasos={PASOS} orientacion="horizontal" fondo="surface" progreso={progreso} className="mt-12" />
          </div>
        )}
      </SeccionFija>

      {/* ───────────── Tu panel: espejo, night con halo ───────────── */}
      <section aria-labelledby="panel-titulo" className={`relative isolate ${PANTALLA} overflow-hidden ${AIRE_SECCION}`}>
        <FondoGrano banda />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 top-1/2 -z-10 h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.2),transparent_72%)]"
        />
        <div className={`${CONTENEDOR} ${PARTIDA} w-full`}>
          <figure className="order-2 edge-d rounded-card bg-white/[0.05] p-5 backdrop-blur-md md:p-6 md:backdrop-blur-card lg:order-1">
            <p className="text-[0.9375rem] font-mid text-ink-d">Postulaciones recibidas</p>
            <ul className="mt-3 list-none p-0">
              {EJEMPLO_POSTULACIONES.map((p, i) => (
                <FilaPostulacion key={i} n={i + 1} {...p} />
              ))}
            </ul>
            <figcaption className="mt-2 text-[0.8125rem] text-muted-d">Vista de ejemplo de tu panel</figcaption>
          </figure>
          <div className="order-1 lg:order-2 lg:mt-2">
            <h2 id="panel-titulo" className={TITULO_SECCION}>
              Todas tus postulaciones en un solo lugar
            </h2>
            <p className="mt-3 max-w-[48ch] text-body text-ink-2d">
              Cada aspirante llega con su CV. Lo marcas en revisión, aceptado o rechazado, y TalentHub le avisa en cuanto cambias su estado.
            </p>
            <Link
              to={REGISTRO_EMPRESA}
              className="mt-8 inline-flex items-center gap-2 text-[0.9375rem] font-mid text-accent-on-dark hover:text-ink-d"
            >
              Crea tu cuenta de empresa
              <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── Cierre: centrado, con velo ───────────── */}
      <section aria-labelledby="cierre-titulo" className={`relative isolate ${PANTALLA} overflow-hidden border-t border-hairline-d text-center ${AIRE_CIERRE}`}>
        <FondoVivo alto="banda" />
        <div className={`${CONTENEDOR} w-full`}>
          <h2 id="cierre-titulo" className="mx-auto max-w-[22ch] font-heading text-[clamp(1.75rem,3.6vw,2.5rem)] font-mid leading-[1.1] tracking-[-0.02em]">
            Tu próxima contratación empieza con una vacante
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] text-body text-ink-2d">Publicar es gratis y no pide tarjeta.</p>
          <div className="mt-9 flex justify-center">
            <Link to={REGISTRO_EMPRESA} className={clasesBoton({ tone: 'dark' })}>
              Crear cuenta de empresa
              <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Empresas;
