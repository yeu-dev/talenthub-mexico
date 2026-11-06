import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Banknote, Bell, MapPin, RotateCcw, Search, ShieldCheck } from "../components/icons";
import Explora from "../components/portada/Explora";
import ParaQuienBusca from "../components/portada/ParaQuienBusca";
import ParaEmpresas from "../components/portada/ParaEmpresas";
import api from "../services/api";
import { AvisoLento, Button, EmptyState, Skeleton } from "../components/ui";
import { chipsPopulares, rutaBusqueda, VacantePublica } from "../lib/vacantes";
import { riseGlass, riseVisible, stagger } from "../lib/motion";
import TitularGiratorio, { palabrasDelTitular } from "../components/TitularGiratorio";
import { useTitulo } from "../hooks/useTitulo";
import { useColumnaAviso } from "../components/PromoApp";

/**
 * La portada es una bolsa de trabajo, no una página de venta: un buscador y
 * debajo las vacantes que hay, con su sueldo. Nada más.
 *
 * Antes era la plantilla de landing generada: cejilla en versalitas, titular
 * gigante, dos botones, una tarjeta escrita a mano (una "Kavak" que no
 * existía), fila de cifras, tarjetas de "por qué nosotros" y halos que
 * seguían al cursor. Todo lo que se ve aquí sale de `/vacantes/`; si no hay
 * datos, se dice tal cual.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const aviso = useColumnaAviso();
  useTitulo();
  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [q, setQ] = useState("");
  const [lugar, setLugar] = useState("");

  // `vivo` evita escribir estado si la portada ya se desmontó a media carga.
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const cargar = useCallback(() => {
    setEstado("cargando");
    api
      .get<VacantePublica[]>("/vacantes/")
      .then(({ data }) => {
        if (!vivo.current) return;
        setVacantes(data);
        setEstado("listo");
      })
      // Antes el error ocultaba toda la sección y la portada se quedaba en el
      // buscador y el pie. Ahora se dice qué pasó y se ofrece reintentar.
      .catch(() => vivo.current && setEstado("error"));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const chips = useMemo(() => chipsPopulares(vacantes), [vacantes]);
  // Las palabras que giran en el titular salen de la misma lista: sin otra petición.
  const palabras = useMemo(() => palabrasDelTitular(vacantes), [vacantes]);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(rutaBusqueda({ q, lugar }));
  };

  // El input no dibuja foco propio (`focus:outline-none`): lo marca el campo
  // entero, con el mismo borde y halo que `Field` en tono oscuro. Solo el
  // cambio de fondo al 6% no alcanzaba a verse.
  const campo =
    "flex flex-1 items-center gap-3 rounded-ui border border-transparent px-4 py-3 transition-[background-color,border-color,box-shadow] focus-within:border-accent-on-dark/55 focus-within:bg-white/[0.06] focus-within:shadow-focus-accent-d";
  const input = "w-full bg-transparent text-body text-ink-d placeholder:text-muted-d focus:outline-none";

  // El margen negativo va en la raíz y no en el header: la raíz recorta los
  // halos (`overflow-hidden`) y recortaría también la parte que sube bajo la barra.
  return (
    // Sin `bg-night` propio: el body ya es negro, y un fondo aquí taparía el velo
    // vivo que `App` monta detrás de toda la portada.
    // Con el aviso de la app abierto, la página deja libre la columna derecha
    // (`Pagina` en App). La raíz se mete debajo de esa columna y lo devuelve
    // en padding, igual que las franjas de `PageHeader`: si no, recortaba en
    // seco los halos del bloque del buscador. Se desliza con la misma
    // transición que el padding de la página.
    // `overflow-clip` y no `overflow-hidden`: recorta los halos igual, pero no
    // vuelve a la raíz un contenedor de scroll, y así la sección fija del
    // carrusel (`position: sticky`) sí se pega a la ventana.
    <div
      className={`relative isolate mt-[calc(var(--nav-flow)*-1)] overflow-clip text-ink-d transition-[margin,padding] duration-500 ease-base motion-reduce:transition-none ${
        aviso ? "-mr-[340px] pr-[340px]" : ""
      }`}
    >
      {/* Halos fijos detrás del cuerpo: el vidrio oscuro necesita tono que
          refractar; sobre negro plano se vería igual que una tarjeta opaca.
          Sin `blur()`: el degradado radial ya se desvanece solo, y un filtro
          sobre un cuadro de 640px es caro de pintar en celular. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-48 top-[420px] h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.22),transparent_72%)]" />
        <div className="absolute -right-40 top-[900px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(56,190,178,0.14),transparent_72%)]" />
      </div>
      {/* ───────────── Banda oscura ───────────── */}
      {/* El bloque del buscador llena la primera pantalla (`100svh`, que en
          celular no cuenta la barra del navegador): la siguiente sección no se
          asoma abajo y la primera vista queda limpia. El contenido va centrado
          en el alto que queda bajo la barra de navegación. */}
      <header className="relative isolate flex min-h-[100svh] flex-col justify-center pb-12 pt-[calc(var(--nav-flow)+3.5rem)] md:pt-[calc(var(--nav-flow)+4.5rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[760px] w-[1100px] -translate-x-[64%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.17),rgba(255,255,255,0.04)_55%,transparent_78%)]"
        />
        <div className="relative mx-auto max-w-page px-6 md:px-7">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
          {/* `riseVisible` y no `rise`: el titular es el LCP de la portada y no
              puede arrancar invisible. Ver lib/motion.ts. */}
          <motion.h1
            variants={riseVisible}
            className="max-w-[20ch] font-heading text-[clamp(2.125rem,5vw,3.25rem)] font-mid leading-[1.05] tracking-[-0.02em]"
          >
            <TitularGiratorio palabras={palabras} />
          </motion.h1>
          {/* Lo que distingue al sitio, en íconos y no en un párrafo. */}
          <motion.ul variants={riseVisible} className="mt-6 flex list-none flex-wrap gap-x-6 gap-y-3 p-0 text-[0.9375rem] text-ink-2d">
            {[
              { Icono: Banknote, texto: "Sueldo siempre visible" },
              { Icono: ShieldCheck, texto: "Vacantes revisadas" },
              { Icono: Bell, texto: "Avisos de tu proceso" },
            ].map(({ Icono, texto }) => (
              <li key={texto} className="flex items-center gap-2">
                <Icono size={17} strokeWidth={1.7} className="text-accent-on-dark" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </motion.ul>

          {/* Buscador en vidrio oscuro */}
            <motion.div variants={riseGlass} initial="hidden" animate="show" className="mt-8 edge-d rounded-card bg-[rgba(16,16,18,0.5)] p-3 backdrop-blur-md backdrop-saturate-150 md:p-4 md:backdrop-blur-card">
              <form onSubmit={buscar} role="search" className="flex flex-col gap-1 md:flex-row md:items-center md:gap-0">
                <label className={campo}>
                  <Search size={18} strokeWidth={1.7} className="flex-none text-muted-d" aria-hidden="true" />
                  <span className="sr-only">Puesto o tecnología</span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Puesto, empresa o tecnología"
                    className={input}
                  />
                </label>
                <span className="mx-1 hidden h-8 w-px bg-hairline-d md:block" aria-hidden="true" />
                <label className={campo}>
                  <MapPin size={18} strokeWidth={1.7} className="flex-none text-muted-d" aria-hidden="true" />
                  <span className="sr-only">Ciudad o remoto</span>
                  <input
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    placeholder="Ciudad o remoto"
                    className={input}
                  />
                </label>
                <Button type="submit" className="md:ml-2">
                  <Search size={15} strokeWidth={1.8} />
                  Buscar vacantes
                </Button>
              </form>

              {chips.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline-d px-2 pt-3">
                  {chips.map((chip) => (
                    <Link
                      key={chip.etiqueta}
                      to={rutaBusqueda(chip.filtros)}
                      className="rounded-pill border border-hairline-d px-3.5 py-1.5 text-[0.875rem] text-ink-2d transition-[color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-hairline-d-strong hover:text-ink-d active:scale-95"
                    >
                      {chip.etiqueta}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
        </motion.div>

        </div>
      </header>

      {/* Cada sección de aquí abajo cambia de superficie y de composición
          respecto a la anterior (DESIGN.md, *Band Architecture*).

          Yeu quitó "Empresas que publican aquí" y "Vacantes recientes": la
          primera vista queda limpia (buscador y nada más) y lo que luce
          después es el carrusel. Las vacantes completas viven en /vacantes. */}

      {/* Mientras llegan las vacantes, el lugar del carrusel ya está tomado:
          así la página no brinca cuando aparece. Con error se dice qué pasó;
          el buscador de arriba sigue funcionando. */}
      {estado === "cargando" && (
        <section aria-label="Cargando" className="py-[clamp(3.5rem,7vw,6.5rem)]">
          <div className="mx-auto max-w-page px-6 md:px-7">
            <Skeleton className="mx-auto h-[min(400px,60vw)] w-full max-w-[600px] rounded-[20px] bg-white/[0.06]" />
            <AvisoLento cargando />
          </div>
        </section>
      )}

      {estado === "error" && (
        <section className="py-[clamp(3.5rem,7vw,6.5rem)]">
          <div className="mx-auto max-w-page px-6 md:px-7">
            <EmptyState
              tone="dark"
              title="No pudimos cargar las vacantes"
              description="El servidor no respondió. Puede ser una caída momentánea o tu conexión; el buscador de arriba sigue funcionando."
              action={
                <Button variant="ghost" tone="dark" onClick={cargar}>
                  <RotateCcw size={14} strokeWidth={1.8} />
                  Reintentar
                </Button>
              }
            />
          </div>
        </section>
      )}

      {/* ───────────── Busca por stack, ciudad o modalidad: banda surface ───────────── */}
      <Explora vacantes={vacantes} />

      {/* ───────────── Para quien busca: partida, halo azul ───────────── */}
      <ParaQuienBusca />

      {/* ───────────── Para empresas: espejo, con velo (antes era una línea suelta) ───────────── */}
      <ParaEmpresas vacantes={vacantes} />

    </div>
  );
};

export default Home;
