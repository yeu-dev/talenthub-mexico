import React from 'react';
import { Link } from 'react-router-dom';
import Iniciales from '../Iniciales';
import { Skeleton } from '../ui';
import FondoSeccion from './FondoSeccion';
import { empresasQuePublican, rutaBusqueda, VacantePublica } from '../../lib/vacantes';
import { CONTENEDOR, vacantesTexto } from './comun';

/**
 * La franja de empresas, el equivalente a los logos de "trabaja con las
 * mejores empresas". Solo empresas con vacantes publicadas, con su membrete
 * de iniciales (el mismo de las filas) y cuántas tienen. Cada una lleva a sus
 * vacantes. Sin carrusel: se lee de un vistazo y no se mueve sola.
 */
const EmpresasQuePublican: React.FC<{ vacantes: VacantePublica[]; cargando?: boolean }> = ({ vacantes, cargando = false }) => {
  const empresas = empresasQuePublican(vacantes);

  // Mientras carga, la franja ocupa su lugar con esqueletos: en la portada va
  // entre el hero y la lista, y si apareciera de golpe al llegar los datos
  // empujaría todo lo de abajo.
  if (cargando) {
    return (
      <div aria-hidden="true" className="relative isolate">
        <FondoSeccion className="border-y border-hairline-d" />
        <div className={`${CONTENEDOR} flex flex-col items-center gap-5 py-8`}>
          <Skeleton className="h-4 w-48" />
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} height={34} className="w-44" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (empresas.length === 0) return null;

  return (
    // Franja baja y centrada, como una línea de créditos, sin superficie propia:
    // se distingue del hero (alto, a la izquierda) y de la lista de abajo (panel
    // de vidrio) por la composición, no por otra caja.
    <section aria-labelledby="empresas-titulo" className="relative isolate">
      {/* Los hairlines en su propia capa: se apagan hacia la derecha si el
          aviso de la app ocupa esa columna (ver `FondoSeccion`). */}
      <FondoSeccion className="border-y border-hairline-d" />
      <div className={`${CONTENEDOR} flex flex-col items-center gap-5 py-8 text-center`}>
        <h2 id="empresas-titulo" className="text-[0.9375rem] font-mid text-ink-2d">
          Empresas que publican aquí
        </h2>
        <ul className="flex list-none flex-wrap justify-center gap-x-10 gap-y-4 p-0 text-left">
          {empresas.map((empresa) => (
            <li key={empresa.etiqueta}>
              <Link
                to={rutaBusqueda({ q: empresa.etiqueta })}
                className="group flex items-center gap-3 rounded-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-on-dark"
              >
                <Iniciales nombre={empresa.etiqueta} tamano={34} />
                <span className="flex flex-col leading-tight">
                  <span className="text-[0.9375rem] font-mid text-ink-d transition-colors group-hover:text-white">
                    {empresa.etiqueta}
                  </span>
                  <span className="text-[0.8125rem] text-muted-d">{vacantesTexto(empresa.n)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default EmpresasQuePublican;
