import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Banknote, Bell, Building2, MapPin, RotateCcw, Search, ShieldCheck } from "../components/icons";
import api from "../services/api";
import { AvisoLento, Button, EmptyState, Skeleton, Tag, TONO_MODALIDAD } from "../components/ui";
import { chipsPopulares, haceCuanto, partesSalario, rutaBusqueda, tecnologias, VacantePublica } from "../lib/vacantes";
import { riseGlass, riseVisible, stagger, subeResorte } from "../lib/motion";
import Iniciales from "../components/Iniciales";
import TitularGiratorio, { palabrasDelTitular } from "../components/TitularGiratorio";
import { useTitulo } from "../hooks/useTitulo";

const RECIENTES = 8;

const capital = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Una fila de la lista de sueldos. El sueldo es su propia columna, alineada a
 * la derecha con cifras tabulares, para que se lea de arriba abajo como una
 * pizarra de precios: es la promesa del sitio hecha forma.
 */
const Fila: React.FC<{ vacante: VacantePublica }> = ({ vacante }) => {
  const techs = tecnologias(vacante).slice(0, 3);
  const fecha = haceCuanto(vacante.fecha_publicacion);
  const salario = partesSalario(vacante.salario_min, vacante.salario_max);

  return (
    <motion.li
      variants={subeResorte}
      // `reflejo`: la misma franja de luz que las tarjetas de /vacantes (index.css).
      className="reflejo relative grid grid-cols-1 gap-x-8 gap-y-2 border-b border-hairline-d px-2 py-5 transition-colors hover:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_220px_180px] md:items-center md:px-4"
    >
      <div className="flex min-w-0 items-center gap-4">
        <Iniciales nombre={vacante.empresa_nombre} tamano={40} />
        <div className="min-w-0">
        <h3 className="text-[1.0625rem] font-demi leading-snug text-ink-d">
          {/* El `after` del enlace cubre la fila: toda es clicable, y el lector
              de pantalla anuncia un solo enlace con el nombre del puesto. */}
          <Link
            to={`/vacantes/${vacante.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-ui focus-visible:after:ring-2 focus-visible:after:ring-accent-on-dark"
          >
            {vacante.titulo}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-[0.875rem] text-muted-d">
          {vacante.empresa_nombre}
          {techs.length > 0 && <span className="text-ink-2d"> · {techs.join(", ")}</span>}
        </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.875rem] text-ink-2d">
        <span className="flex items-center gap-1">
          <MapPin size={13} strokeWidth={1.7} className="text-muted-d" aria-hidden="true" />
          {vacante.ubicacion}
        </span>
        <Tag tone="dark" tono={TONO_MODALIDAD[vacante.modalidad] ?? "neutro"}>{capital(vacante.modalidad)}</Tag>
      </div>

      <div className="md:text-right">
        <p className="tabular text-[1.125rem] font-demi tracking-[-0.01em] text-ink-d">
          {salario.cifra}
        </p>
        <p className="text-[0.8125rem] text-muted-d">
          {[salario.conMoneda && "MXN al mes", fecha].filter(Boolean).join(" · ")}
        </p>
      </div>
    </motion.li>
  );
};

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
  // El endpoint ya las entrega de la más nueva a la más vieja.
  const recientes = vacantes.slice(0, RECIENTES);

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
    <div className="relative isolate mt-[calc(var(--nav-flow)*-1)] overflow-hidden text-ink-d">
      {/* Halos fijos detrás del cuerpo: el vidrio oscuro necesita tono que
          refractar; sobre negro plano se vería igual que una tarjeta opaca.
          Sin `blur()`: el degradado radial ya se desvanece solo, y un filtro
          sobre un cuadro de 640px es caro de pintar en celular. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-48 top-[420px] h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.22),transparent_72%)]" />
        <div className="absolute -right-40 top-[900px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(56,190,178,0.14),transparent_72%)]" />
      </div>
      {/* ───────────── Banda oscura ───────────── */}
      <header className="relative isolate pb-8 pt-[calc(var(--nav-flow)+3.5rem)] md:pt-[calc(var(--nav-flow)+4.5rem)]">
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
            <motion.div variants={riseGlass} initial="hidden" animate="show" className="mt-8 edge-d rounded-card bg-white/[0.06] p-3 backdrop-blur-md backdrop-saturate-150 md:bg-[rgba(16,16,18,0.5)] md:p-4 md:backdrop-blur-card">
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
                <Button type="submit" destacado className="md:ml-2">
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


      {/* ───────────── Lista de sueldos ───────────── */}
      {/* La sección se queda siempre: con error dice qué pasó y deja a la
          vista el enlace para empresas, que no depende de la API. */}
        <section className="pb-20 pt-14 md:pb-24">
          <div className="mx-auto max-w-page px-6 md:px-7">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-heading text-[clamp(1.5rem,2.6vw,2rem)] font-demi leading-[1.1] tracking-[-0.015em] text-ink-d">
                Vacantes recientes
              </h2>
              {estado === "listo" && vacantes.length > 0 && (
                <Link to="/vacantes" className="flex items-center gap-1.5 text-[0.9375rem] font-mid text-accent-on-dark hover:text-ink-d">
                  Ver las {vacantes.length}
                  <ArrowRight size={15} strokeWidth={1.8} />
                </Link>
              )}
            </div>

            {estado === "cargando" && (
              <div className="flex flex-col gap-3 border-t border-hairline-d pt-5">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={56} className="bg-white/[0.06]" />
                ))}
                <AvisoLento cargando />
              </div>
            )}

            {estado === "error" && (
              <EmptyState
                tone="dark"
                title="No pudimos cargar las vacantes recientes"
                description="El servidor no respondió. Puede ser una caída momentánea o tu conexión; el buscador de arriba sigue funcionando."
                action={
                  <Button variant="ghost" tone="dark" onClick={cargar}>
                    <RotateCcw size={14} strokeWidth={1.8} />
                    Reintentar
                  </Button>
                }
              />
            )}

            {estado === "listo" && recientes.length === 0 && (
              <EmptyState
                tone="dark"
                title="Todavía no hay vacantes publicadas"
                description="Cuando una empresa publique una y se apruebe, aparecerá aquí."
              />
            )}

            {estado === "listo" && recientes.length > 0 && (
              <>
                {/* Encabezado de columnas: solo donde hay columnas. */}
                <div className="edge-d overflow-hidden rounded-card bg-white/[0.04] px-2 backdrop-blur-md md:backdrop-blur-card md:px-3">
                <div className="hidden grid-cols-[minmax(0,1fr)_220px_180px] gap-x-8 border-b border-hairline-d px-4 pb-2 pt-4 text-caption uppercase text-muted-d md:grid">
                  <span>Puesto</span>
                  <span>Lugar</span>
                  <span className="text-right">Sueldo</span>
                </div>
                <motion.ul
                  variants={stagger(0.07)}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.15 }}
                  className="list-none p-0 [&>li:last-child]:border-b-0"
                >
                  {recientes.map((vacante) => (
                    <Fila key={vacante.id} vacante={vacante} />
                  ))}
                </motion.ul>
                </div>
              </>
            )}

            {/* Una línea para empresas, no un bloque de venta. */}
            <Link
              to="/planes"
              className="mt-10 inline-flex items-center gap-2.5 text-[0.9375rem] font-mid text-accent-on-dark hover:text-ink-d"
            >
              <Building2 size={17} strokeWidth={1.7} aria-hidden="true" />
              ¿Contratas? Publica gratis
              <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </section>

    </div>
  );
};

export default Home;
