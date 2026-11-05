import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Search } from "lucide-react";
import api from "../services/api";
import { Button, EmptyState, Skeleton, Tag, TONO_MODALIDAD } from "../components/ui";
import AppPromo from "../components/AppPromo";
import { chipsPopulares, formatoSalario, haceCuanto, rutaBusqueda, tecnologias, VacantePublica } from "../lib/vacantes";
import { rise, stagger } from "../lib/motion";

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
    <li className="relative grid grid-cols-1 gap-x-8 gap-y-2 border-b border-hairline px-2 py-5 transition-colors hover:bg-surface md:grid-cols-[minmax(0,1fr)_280px_200px] md:items-center md:px-4">
      <div className="min-w-0">
        <h3 className="text-[1.0625rem] font-demi leading-snug text-ink">
          {/* El `after` del enlace cubre la fila: toda es clicable, y el lector
              de pantalla anuncia un solo enlace con el nombre del puesto. */}
          <Link
            to={`/vacantes/${vacante.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-ui focus-visible:after:ring-2 focus-visible:after:ring-accent"
          >
            {vacante.titulo}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-[0.875rem] text-muted">
          {vacante.empresa_nombre}
          {techs.length > 0 && <span className="text-ink-2"> · {techs.join(", ")}</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.875rem] text-ink-2">
        <span className="flex items-center gap-1">
          <MapPin size={13} strokeWidth={1.7} className="text-muted" aria-hidden="true" />
          {vacante.ubicacion}
        </span>
        <Tag tono={TONO_MODALIDAD[vacante.modalidad] ?? "neutro"}>{capital(vacante.modalidad)}</Tag>
      </div>

      <div className="md:text-right">
        <p className="tabular text-[1.125rem] font-demi tracking-[-0.01em] text-ink">
          {formatoSalario(vacante.salario_min, vacante.salario_max).replace(" MXN", "")}
        </p>
        <p className="text-[0.8125rem] text-muted">MXN al mes{fecha && ` · ${fecha}`}</p>
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

  const campo = "flex flex-1 items-center gap-3 rounded-ui px-4 py-3 transition-colors focus-within:bg-surface";
  const input = "w-full bg-transparent text-body text-ink placeholder:text-muted focus:outline-none";

  return (
    <div className="bg-canvas">
      {/* ───────────── Franja oscura con el buscador ───────────── */}
      <header className="bg-night pb-14 pt-12 text-ink-d md:pb-16 md:pt-14">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="mx-auto max-w-page px-6 md:px-7">
          <motion.h1
            variants={rise}
            className="max-w-[20ch] font-heading text-[clamp(2rem,4.6vw,3rem)] font-mid leading-[1.05] tracking-[-0.02em]"
          >
            Empleo en TI con el sueldo a la vista
          </motion.h1>

          <motion.form
            variants={rise}
            onSubmit={buscar}
            role="search"
            className="mt-8 flex flex-col gap-1 rounded-card bg-canvas p-2 md:flex-row md:items-center md:gap-0"
          >
            <label className={campo}>
              <Search size={18} strokeWidth={1.7} className="flex-none text-muted" aria-hidden="true" />
              <span className="sr-only">Puesto o tecnología</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Puesto, empresa o tecnología"
                className={input}
              />
            </label>
            <span className="mx-1 hidden h-8 w-px bg-hairline md:block" aria-hidden="true" />
            <label className={campo}>
              <MapPin size={18} strokeWidth={1.7} className="flex-none text-muted" aria-hidden="true" />
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
          </motion.form>

          {chips.length > 0 && (
            <motion.div variants={rise} className="mt-5 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.etiqueta}
                  to={rutaBusqueda(chip.filtros)}
                  className="rounded-pill border border-hairline-d px-3.5 py-1.5 text-[0.875rem] text-ink-2d transition-colors hover:border-hairline-d-strong hover:text-ink-d"
                >
                  {chip.etiqueta}
                </Link>
              ))}
            </motion.div>
          )}
        </motion.div>
      </header>

      {/* ───────────── Lista de sueldos ───────────── */}
      {estado !== "error" && (
        <section className="pb-16 pt-12 md:pb-20">
          <div className="mx-auto max-w-page px-6 md:px-7">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-heading text-[clamp(1.5rem,2.6vw,2rem)] font-demi leading-[1.1] tracking-[-0.015em] text-ink">
                Vacantes recientes
              </h2>
              {estado === "listo" && vacantes.length > 0 && (
                <Link to="/vacantes" className="flex items-center gap-1.5 text-[0.9375rem] font-mid text-accent hover:text-accent-hover">
                  Ver las {vacantes.length}
                  <ArrowRight size={15} strokeWidth={1.8} />
                </Link>
              )}
            </div>

            {estado === "cargando" && (
              <div className="flex flex-col gap-3 border-t border-hairline pt-5">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={56} />
                ))}
              </div>
            )}

            {estado === "listo" && recientes.length === 0 && (
              <EmptyState
                title="Todavía no hay vacantes publicadas"
                description="Cuando una empresa publique una y se apruebe, aparecerá aquí."
              />
            )}

            {estado === "listo" && recientes.length > 0 && (
              <>
                {/* Encabezado de columnas: solo donde hay columnas. */}
                <div className="hidden grid-cols-[minmax(0,1fr)_280px_200px] gap-x-8 border-b border-hairline px-4 pb-2 text-caption uppercase text-muted md:grid">
                  <span>Puesto</span>
                  <span>Lugar</span>
                  <span className="text-right">Sueldo</span>
                </div>
                <ul className="list-none p-0">
                  {recientes.map((vacante) => (
                    <Fila key={vacante.id} vacante={vacante} />
                  ))}
                </ul>
              </>
            )}

            {/* Una línea para empresas, no un bloque de venta. */}
            <p className="mt-10 text-[0.9375rem] text-ink-2">
              ¿Contratas talento de TI?{" "}
              <Link to="/planes" className="font-mid text-accent hover:text-accent-hover">
                Publica tu vacante desde el plan gratuito
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      <AppPromo />
    </div>
  );
};

export default Home;
