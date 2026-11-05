import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Laptop, MapPin } from '../icons';
import type { LucideIcon } from '../icons';
import {
  partesSalario,
  rutaBusqueda,
  stackConSueldos,
  vacantesPorCiudad,
  vacantesPorModalidad,
  VacantePublica,
} from '../../lib/vacantes';
import { AIRE_SECCION, CONTENEDOR, TITULO_SECCION, vacantesTexto } from './comun';
import FondoSeccion from './FondoSeccion';

/**
 * "Busca por stack, ciudad o modalidad": el equivalente a los sectores con
 * conteo. No es una cuadrícula de tarjetas iguales: es un índice de tres
 * columnas con renglones, como la lista de sueldos, que se lee de arriba
 * abajo. Cada renglón lleva a la búsqueda ya filtrada y su número es
 * exactamente lo que se va a encontrar ahí (`coincide` busca el stack con las
 * mismas reglas que lo cuenta `stackConSueldos`).
 *
 * El stack lleva además el rango de sueldo de sus vacantes: es la promesa del
 * sitio convertida en dato. Una columna vacía no se pinta.
 */

interface Renglon {
  etiqueta: string;
  n: number;
  ruta: string;
  /** Solo el stack: "$28,000 – $45,000". */
  sueldo?: string;
}

const Columna: React.FC<{ titulo: string; Icono: LucideIcon; renglones: Renglon[]; ancha?: boolean }> = ({
  titulo,
  Icono,
  renglones,
  ancha,
}) => {
  if (renglones.length === 0) return null;
  return (
    // En tablet el stack va arriba a todo el ancho y ciudad y modalidad debajo,
    // lado a lado; desde `lg`, las tres en fila.
    <div className={ancha ? 'md:col-span-2 lg:col-span-1' : undefined}>
      <h3 className="flex items-center gap-2 border-b border-hairline-d pb-3 text-[0.9375rem] font-mid text-ink-2d">
        <Icono size={17} strokeWidth={1.7} className="text-accent-on-dark" aria-hidden="true" />
        {titulo}
      </h3>
      <ul className="list-none p-0">
        {renglones.map((r) => (
          <li key={r.etiqueta}>
            <Link
              to={r.ruta}
              className="reflejo group relative flex items-baseline gap-4 border-b border-hairline-d px-1 py-3.5 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-on-dark"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[1.0625rem] font-demi text-ink-d">{r.etiqueta}</span>
                {/* En celular el sueldo baja bajo el nombre: es el dato que importa y no cabe al lado. */}
                {r.sueldo && <span className="tabular mt-0.5 block text-[0.875rem] text-ink-2d sm:hidden">{r.sueldo}</span>}
              </span>
              {r.sueldo && (
                <span className="tabular hidden whitespace-nowrap text-[0.9375rem] text-ink-2d sm:block">{r.sueldo}</span>
              )}
              {/* Ancho fijo solo junto al sueldo, para que las dos columnas de
                  cifras queden alineadas; en ciudad y modalidad el nombre
                  necesita ese espacio ("Ciudad de México"). */}
              <span
                className={`tabular flex-none whitespace-nowrap text-right text-[0.875rem] text-muted-d transition-colors group-hover:text-ink-2d ${r.sueldo ? 'w-[5.5rem]' : ''}`}
              >
                {vacantesTexto(r.n)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Explora: React.FC<{ vacantes: VacantePublica[] }> = ({ vacantes }) => {
  const stack: Renglon[] = stackConSueldos(vacantes).map((s) => ({
    etiqueta: s.etiqueta,
    n: s.n,
    ruta: rutaBusqueda({ q: s.etiqueta }),
    sueldo: s.min || s.max ? partesSalario(String(s.min), String(s.max)).cifra : undefined,
  }));
  const ciudades: Renglon[] = vacantesPorCiudad(vacantes).map((c) => ({
    etiqueta: c.etiqueta,
    n: c.n,
    ruta: rutaBusqueda({ lugar: c.etiqueta }),
  }));
  const modalidades: Renglon[] = vacantesPorModalidad(vacantes).map((m) => ({
    etiqueta: m.etiqueta,
    n: m.n,
    ruta: rutaBusqueda({ modalidad: m.valor }),
  }));

  if (stack.length + ciudades.length + modalidades.length === 0) return null;

  return (
    // Banda `surface` a todo el ancho, con halo teal: la única sección de la
    // portada con fondo propio, para que el índice se lea como otra cosa que la
    // lista de vidrio de arriba y el bloque partido de abajo.
    <section aria-labelledby="explora-titulo" className={`relative isolate ${AIRE_SECCION}`}>
      <FondoSeccion className="border-y border-hairline-d bg-surface">
        <div className="absolute -right-40 -top-56 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(56,190,178,0.16),transparent_72%)]" />
      </FondoSeccion>
      <div className={CONTENEDOR}>
        <h2 id="explora-titulo" className={TITULO_SECCION}>
          Busca por stack, ciudad o modalidad
        </h2>
        <p className="mt-3 max-w-[60ch] text-body text-ink-2d">
          Cada número es lo que vas a encontrar al entrar. En el stack va el rango de sueldo que pagan sus vacantes.
        </p>
        {/* El ancho se reparte por contenido: el stack lleva nombre, sueldo y
            cuenta; ciudad y modalidad, solo nombre y cuenta. */}
        <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-12">
          <Columna titulo="Stack" Icono={Code2} renglones={stack} ancha />
          <Columna titulo="Ciudad" Icono={MapPin} renglones={ciudades} />
          <Columna titulo="Modalidad" Icono={Laptop} renglones={modalidades} />
        </div>
      </div>
    </section>
  );
};

export default Explora;
