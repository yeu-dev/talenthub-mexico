import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Banknote, Bell, Building2, MapPin, Search, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { Button, EmptyState, Skeleton, Tag, TONO_MODALIDAD } from "../components/ui";
import { chipsPopulares, formatoSalario, haceCuanto, rutaBusqueda, tecnologias, VacantePublica } from "../lib/vacantes";
import { rise, riseGlass, stagger } from "../lib/motion";
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

  return (
    <li className="relative grid grid-cols-1 gap-x-8 gap-y-2 border-b border-hairline-d px-2 py-5 transition-colors hover:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_280px_200px] md:items-center md:px-4">
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.875rem] text-ink-2d">
        <span className="flex items-center gap-1">
          <MapPin size={13} strokeWidth={1.7} className="text-muted-d" aria-hidden="true" />
          {vacante.ubicacion}
        </span>
        <Tag tone="dark" tono={TONO_MODALIDAD[vacante.modalidad] ?? "neutro"}>{capital(vacante.modalidad)}</Tag>
      </div>

      <div className="md:text-right">
        <p className="tabular text-[1.125rem] font-demi tracking-[-0.01em] text-ink-d">
          {formatoSalario(vacante.salario_min, vacante.salario_max).replace(" MXN", "")}
        </p>
        <p className="text-[0.8125rem] text-muted-d">MXN al mes{fecha && ` · ${fecha}`}</p>
      </div>
    </li>
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

  useEffect(() => {
    let vivo = true;
    api
      .get<VacantePublica[]>("/vacantes/")
      .then(({ data }) => {
        if (!vivo) return;
        setVacantes(data);
        setEstado("listo");
      })
      // La lista se oculta: un error en la portada no merece un aviso, y el
      // buscador sigue funcionando porque lleva a /vacantes.
      .catch(() => vivo && setEstado("error"));
    return () => {
      vivo = false;
    };
  }, []);

  const chips = useMemo(() => chipsPopulares(vacantes), [vacantes]);
  // El endpoint ya las entrega de la más nueva a la más vieja.
  const recientes = vacantes.slice(0, RECIENTES);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(rutaBusqueda({ q, lugar }));
  };

  const campo = "flex flex-1 items-center gap-3 rounded-ui px-4 py-3 transition-colors focus-within:bg-white/[0.06]";
  const input = "w-full bg-transparent text-body text-ink-d placeholder:text-muted-d focus:outline-none";

  // El margen negativo va en la raíz y no en el header: la raíz recorta los
  // halos (`overflow-hidden`) y recortaría también la parte que sube bajo la barra.
  return (
    <div className="relative isolate mt-[calc(var(--nav-flow)*-1)] overflow-hidden bg-night text-ink-d">
      {/* Halos fijos detrás del cuerpo: el vidrio oscuro necesita tono que
          refractar; sobre negro plano se vería igual que una tarjeta opaca. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-48 top-[420px] h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.22),transparent_72%)] blur-[24px]" />
        <div className="absolute -right-40 top-[900px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(56,190,178,0.14),transparent_72%)] blur-[24px]" />
      </div>
      {/* ───────────── Banda oscura ───────────── */}
      <header className="relative isolate pb-8 pt-[calc(var(--nav-flow)+3.5rem)] md:pt-[calc(var(--nav-flow)+4.5rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[760px] w-[1100px] -translate-x-[64%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.17),rgba(255,255,255,0.04)_55%,transparent_78%)] blur-[6px]"
        />
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="relative mx-auto max-w-page px-6 md:px-7">
          <motion.h1
            variants={rise}
            className="max-w-[20ch] font-heading text-[clamp(2.125rem,5vw,3.25rem)] font-mid leading-[1.05] tracking-[-0.02em]"
          >
            Empleo en TI con el sueldo a la vista
          </motion.h1>
          {/* Lo que distingue al sitio, en íconos y no en un párrafo. */}
          <motion.ul variants={rise} className="mt-6 flex list-none flex-wrap gap-x-6 gap-y-3 p-0 text-[0.9375rem] text-ink-2d">
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
        </motion.div>
      </header>

      {/* ───────────── Buscador en vidrio oscuro ───────────── */}
      <section className="flow-root">
        <div className="mx-auto max-w-page px-6 md:px-7">
          <motion.div variants={riseGlass} initial="hidden" animate="show" className="edge-d rounded-card bg-white/[0.06] p-3 backdrop-blur-card backdrop-saturate-150 md:p-4">
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
                    className="rounded-pill border border-hairline-d px-3.5 py-1.5 text-[0.875rem] text-ink-2d transition-colors hover:border-hairline-d-strong hover:text-ink-d"
                  >
                    {chip.etiqueta}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ───────────── Lista de sueldos ───────────── */}
      {estado !== "error" && (
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
              </div>
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
                <div className="edge-d overflow-hidden rounded-card bg-white/[0.04] px-2 backdrop-blur-card md:px-3">
                <div className="hidden grid-cols-[minmax(0,1fr)_280px_200px] gap-x-8 border-b border-hairline-d px-4 pb-2 pt-4 text-caption uppercase text-muted-d md:grid">
                  <span>Puesto</span>
                  <span>Lugar</span>
                  <span className="text-right">Sueldo</span>
                </div>
                <ul className="list-none p-0 [&>li:last-child]:border-b-0">
                  {recientes.map((vacante) => (
                    <Fila key={vacante.id} vacante={vacante} />
                  ))}
                </ul>
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
      )}

    </div>
  );
};

export default Home;
