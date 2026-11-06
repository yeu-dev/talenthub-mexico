import React, { useRef } from 'react';
import {
  partesSalario,
  rutaBusqueda,
  stackConSueldos,
  vacantesPorCiudad,
  vacantesPorModalidad,
  VacantePublica,
} from '../../lib/vacantes';
import { CONTENEDOR, TITULO_SECCION, vacantesTexto } from './comun';
import FondoSeccion from './FondoSeccion';
import Carrusel, { Diapositiva, PX_POR_TARJETA } from './Carrusel';

/**
 * "Busca por stack, ciudad o modalidad", como carrusel (`Carrusel`).
 *
 * Antes era un índice de tres columnas con renglones; Yeu lo cambió por un
 * carrusel con la mecánica del Prism Carousel de React Bits, que avanza con
 * el scroll de la página mientras la sección se queda fija. Cada tarjeta es
 * un stack, una ciudad o una modalidad con sus datos reales, y lleva a la
 * búsqueda ya filtrada: el número es exactamente lo que se va a encontrar ahí
 * (`coincide` busca con las mismas reglas con las que se cuenta). El stack
 * lleva además el rango de sueldo de sus vacantes.
 */
const Explora: React.FC<{ vacantes: VacantePublica[] }> = ({ vacantes }) => {
  const seccion = useRef<HTMLElement>(null);
  const diapositivas: Diapositiva[] = [
    ...stackConSueldos(vacantes).map((s) => ({
      tipo: 'Stack',
      titulo: s.etiqueta,
      subtitulo:
        s.min || s.max
          ? `${partesSalario(String(s.min), String(s.max)).cifra} · ${vacantesTexto(s.n)}`
          : vacantesTexto(s.n),
      ruta: rutaBusqueda({ q: s.etiqueta }),
    })),
    ...vacantesPorCiudad(vacantes).map((c) => ({
      tipo: 'Ciudad',
      titulo: c.etiqueta,
      subtitulo: vacantesTexto(c.n),
      ruta: rutaBusqueda({ lugar: c.etiqueta }),
    })),
    ...vacantesPorModalidad(vacantes).map((m) => ({
      tipo: 'Modalidad',
      titulo: m.etiqueta,
      subtitulo: vacantesTexto(m.n),
      ruta: rutaBusqueda({ modalidad: m.valor }),
    })),
  ];

  if (diapositivas.length === 0) return null;

  return (
    // Banda `surface` a todo el ancho, con halo teal: la única sección de la
    // portada con fondo propio, para que se lea como otra cosa que la lista de
    // vidrio de arriba y el bloque partido de abajo.
    // Sección fija: mide una pantalla más un tramo de scroll por tarjeta, y
    // su contenido se queda pegado (`sticky`) mientras ese scroll pasa las
    // tarjetas. Lo pegado mide exactamente una pantalla y va bajo la barra.
    <section
      ref={seccion}
      aria-labelledby="explora-titulo"
      className="relative isolate"
      style={{ height: `calc(100svh + ${(diapositivas.length - 1) * PX_POR_TARJETA}px)` }}
    >
      <FondoSeccion className="border-y border-hairline-d bg-surface">
        <div className="absolute -right-40 -top-56 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(56,190,178,0.16),transparent_72%)]" />
      </FondoSeccion>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pb-6 pt-[calc(var(--nav-flow)+1.5rem)]">
      <div className={`${CONTENEDOR} w-full`}>
        <h2 id="explora-titulo" className={TITULO_SECCION}>
          Busca por stack, ciudad o modalidad
        </h2>
        <p className="mt-3 max-w-[60ch] text-body text-ink-2d">
          Cada número es lo que vas a encontrar al entrar. En el stack va el rango de sueldo que pagan sus vacantes.
        </p>
        <div className="mt-8">
          <Carrusel diapositivas={diapositivas} seccion={seccion} />
        </div>
      </div>
      </div>
    </section>
  );
};

export default Explora;
