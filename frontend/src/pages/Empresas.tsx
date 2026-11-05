import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Inbox, ShieldCheck, Upload } from '../components/icons';
import { clasesBoton, ProcessTrack } from '../components/ui';
import type { EstadoPostulacion } from '../components/ui';
import VacanteCard from '../components/VacanteCard';
import Iniciales from '../components/Iniciales';
import FondoVivo from '../components/fondos/FondoVivo';
import EmpresasQuePublican from '../components/portada/EmpresasQuePublican';
import Proceso from '../components/portada/Proceso';
import type { Paso } from '../components/portada/Proceso';
import { AIRE_CIERRE, AIRE_SECCION, CONTENEDOR, PARTIDA, TITULO_SECCION } from '../components/portada/comun';
import { useSinAvisoApp } from '../components/PromoApp';
import { useChispas } from '../hooks/useChispas';
import { useTitulo } from '../hooks/useTitulo';
import api from '../services/api';
import { VacantePublica } from '../lib/vacantes';

/**
 * La portada para quien contrata (el equivalente a "OCC Empresas").
 *
 * Cada sección cambia de superficie y de composición respecto a la anterior
 * (DESIGN.md, *Band Architecture*):
 * hero con velo y partido → franja de empresas centrada → pasos en horizontal
 * sobre banda `surface` → panel en espejo sobre `night` → tablero de planes
 * en vidrio → cierre centrado con velo.
 *
 * Todo lo que afirma lo hace el producto: publicar no pide plan, toda vacante
 * nace pendiente y solo sale aprobada por un validador, cambiar puesto,
 * sueldo, requisitos, lugar o modalidad la regresa a revisión
 * (`CAMPOS_REVISADOS`), y cada respuesta a una postulación le llega al
 * aspirante como notificación. Las piezas de "postulaciones recibidas" son
 * vistas de ejemplo, marcadas como tales y sin nombres de personas.
 */

/** Los planes tal como los sirve `/planes/`. */
interface Plan {
  id: number;
  nombre: string;
  tipo_usuario: 'aspirante' | 'empresa';
  precio: string;
}

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

/** El botón principal de la pantalla: destacado (borde de luz y chispas). */
const BotonPublicar: React.FC = () => {
  const { lienzo, disparar } = useChispas();
  return (
    <Link to={REGISTRO_EMPRESA} onClick={disparar} className={clasesBoton({ tone: 'dark', destacado: true })}>
      Publica tu primera vacante
      <ArrowRight size={15} strokeWidth={1.8} />
      {lienzo}
    </Link>
  );
};

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

/** "$399" + "MXN / mes", como en /planes. El gratuito dice "$0": su nombre ya dice "GRATIS". */
const precioTexto = (precio: string) => {
  const n = parseFloat(precio);
  return { cifra: `$${new Intl.NumberFormat('es-MX').format(Number.isFinite(n) ? n : 0)}`, sufijo: 'MXN / mes' };
};

const Empresas: React.FC = () => {
  useTitulo('Para empresas');
  // Aquí nada compite con "Publica tu primera vacante": el aviso de la app
  // (pensado para quien busca) se esconde, y el velo ocupa todo el ancho.
  useSinAvisoApp();

  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    api
      .get<VacantePublica[]>('/vacantes/')
      .then(({ data }) => vivo.current && setVacantes(data))
      .catch(() => undefined);
    api
      .get<Plan[]>('/planes/')
      .then(({ data }) => vivo.current && setPlanes(data.filter((p) => p.tipo_usuario === 'empresa')))
      // Sin planes no se pinta la sección: el resto de la página no depende de ellos.
      .catch(() => undefined);
    return () => {
      vivo.current = false;
    };
  }, []);

  const muestra = vacantes[0];

  return (
    <div className="relative isolate -mt-[var(--nav-flow)] overflow-hidden text-ink-d">
      {/* ───────────── Hero: velo, partido ───────────── */}
      <header className="relative isolate pb-[clamp(3.5rem,7vw,6.5rem)] pt-[calc(var(--nav-flow)+clamp(2.5rem,6vw,5rem))]">
        <FondoVivo />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-48 top-40 -z-10 h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.22),transparent_72%)]"
        />
        {/* Aquí sí va centrado en vertical: es el hero, y el texto y las piezas
            tienen alturas parecidas. Partido desde `lg`; en tablet, apilado. */}
        <div className={`${CONTENEDOR} grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16`}>
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
              <div className="md:[&>article]:bg-[rgba(16,16,18,0.5)]">
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

      {/* ───────────── Franja de empresas: centrada ───────────── */}
      <EmpresasQuePublican vacantes={vacantes} />

      {/* ───────────── Cómo funciona: horizontal, banda surface ───────────── */}
      <section aria-labelledby="pasos-titulo" className={`relative isolate border-b border-hairline-d bg-surface ${AIRE_SECCION}`}>
        <div className={CONTENEDOR}>
          <h2 id="pasos-titulo" className={TITULO_SECCION}>
            De la vacante a la contratación
          </h2>
          {/* En columna hasta `lg`, en fila desde ahí; cada tramo de línea
              termina en el siguiente círculo, no en el borde de la página. */}
          <Proceso pasos={PASOS} orientacion="horizontal" fondo="surface" className="mt-12" />
        </div>
      </section>

      {/* ───────────── Tu panel: espejo, night con halo ───────────── */}
      <section aria-labelledby="panel-titulo" className={`relative isolate ${AIRE_SECCION}`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 top-1/2 -z-10 h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.2),transparent_72%)]"
        />
        <div className={`${CONTENEDOR} ${PARTIDA}`}>
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

      {/* ───────────── Planes: tablero de vidrio ───────────── */}
      {planes.length > 0 && (
        // Solo aire abajo: arriba ya lo pone la sección del panel.
        <section aria-labelledby="planes-titulo" className="relative isolate pb-[clamp(3.5rem,7vw,6.5rem)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 bottom-0 -z-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(56,190,178,0.14),transparent_72%)]"
          />
          <div className={CONTENEDOR}>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="planes-titulo" className={TITULO_SECCION}>
                Empieza gratis y crece cuando lo necesites
              </h2>
              <Link to="/planes" className="flex items-center gap-1.5 text-[0.9375rem] font-mid text-accent-on-dark hover:text-ink-d">
                Qué incluye cada plan
                <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>
            {/* Un solo tablero partido por hairlines, no tres tarjetas iguales. */}
            <dl className="edge-d mt-8 grid rounded-card bg-white/[0.04] backdrop-blur-md md:grid-cols-3 md:backdrop-blur-card">
              {planes.map((plan) => {
                const { cifra, sufijo } = precioTexto(plan.precio);
                return (
                  <div
                    key={plan.id}
                    className="border-b border-hairline-d p-6 last:border-b-0 md:border-b-0 md:border-r md:p-8 md:last:border-r-0"
                  >
                    <dt className="text-[0.9375rem] font-mid text-ink-2d">{plan.nombre}</dt>
                    <dd className="mt-3 flex items-baseline gap-2">
                      <span className="tabular text-[2rem] font-mid leading-none tracking-[-0.03em] text-ink-d">{cifra}</span>
                      <span className="text-[0.875rem] text-muted-d">{sufijo}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>
      )}

      {/* ───────────── Cierre: centrado, con velo ───────────── */}
      <section aria-labelledby="cierre-titulo" className={`relative isolate overflow-hidden border-t border-hairline-d text-center ${AIRE_CIERRE}`}>
        <FondoVivo alto="banda" />
        <div className={CONTENEDOR}>
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
