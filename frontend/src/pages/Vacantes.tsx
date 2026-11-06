import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Plus, RotateCcw, Search, X } from '../components/icons';
import api from '../services/api';
import { AvisoLento, Button, EmptyState, SkeletonList, SliderElastico } from '../components/ui';
import PageHeader from '../components/PageHeader';
import VacanteCard from '../components/VacanteCard';
import { useTitulo } from '../hooks/useTitulo';
import { motion } from 'framer-motion';
import { cx } from '../lib/cx';
import { SPRING, stagger, subeResorte } from '../lib/motion';
import { coincide, VacantePublica } from '../lib/vacantes';

/** "25,000": los pesos del control de sueldo. */
const PESOS = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

/**
 * Cuántas tarjetas se pintan de una vez. Con las empresas de demostración hay
 * cientos de vacantes; pintarlas todas de golpe hacía la página lenta y
 * eterna. "Ver más" agrega otras tantas.
 */
const POR_PAGINA = 12;

const MODALIDADES = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'remoto', etiqueta: 'Remoto' },
  { valor: 'hibrido', etiqueta: 'Híbrido' },
  { valor: 'presencial', etiqueta: 'Presencial' },
];

/**
 * El listado de vacantes. Los filtros viven en la URL (`?q=&lugar=&modalidad=
 * &salario=`): así el buscador y los chips de la portada llegan ya aplicados,
 * y una búsqueda se puede compartir o recargar sin perderla.
 */
const Vacantes: React.FC = () => {
  const [vacantes, setVacantes] = useState<VacantePublica[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [params, setParams] = useSearchParams();
  useTitulo('Vacantes');

  const q = params.get('q') ?? '';
  const lugar = params.get('lugar') ?? '';
  const modalidad = params.get('modalidad') ?? '';
  const salario = params.get('salario') ?? '';

  // `replace`: escribir en el buscador no debe llenar el historial; "atrás"
  // regresa a la página anterior, no a la letra anterior.
  const cambiar = (clave: string, valor: string) => {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set(clave, valor);
    else siguiente.delete(clave);
    setParams(siguiente, { replace: true });
  };

  const fetchVacantes = useCallback(async () => {
    setEstado('cargando');
    try {
      const response = await api.get<VacantePublica[]>('/vacantes/');
      setVacantes(response.data);
      setEstado('listo');
    } catch (error) {
      // El error se cuenta en la propia página, no en un toast que desaparece:
      // aquí el usuario necesita una salida (reintentar), no solo un aviso.
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    fetchVacantes();
  }, [fetchVacantes]);

  const vacantesFiltradas = useMemo(() => {
    const minimo = parseFloat(salario);
    return vacantes.filter(
      (v) =>
        coincide(v, { q, lugar, modalidad }) &&
        // Cuenta el tope del rango: una de $25k–$40k le sirve a quien pide $35k.
        (!Number.isFinite(minimo) || parseFloat(v.salario_max) >= minimo)
    );
  }, [vacantes, q, lugar, modalidad, salario]);

  const hayFiltros = Boolean(q || lugar || modalidad || salario);

  // Cada búsqueda nueva arranca otra vez con las primeras 12.
  const [mostradas, setMostradas] = useState(POR_PAGINA);
  useEffect(() => setMostradas(POR_PAGINA), [q, lugar, modalidad, salario]);

  // El tope del control de sueldo sale de las vacantes reales: el sueldo
  // máximo más alto, redondeado a los siguientes $5,000.
  const sueldoTope = useMemo(() => {
    const maximos = vacantes.map((v) => parseFloat(v.salario_max)).filter((n) => Number.isFinite(n) && n > 0);
    return maximos.length ? Math.ceil(Math.max(...maximos) / 5000) * 5000 : 100000;
  }, [vacantes]);
  const limpiarFiltros = () => setParams(new URLSearchParams(), { replace: true });

  const campo =
    'flex flex-1 items-center gap-2.5 rounded-ui border border-hairline bg-white/[0.04] px-3.5 py-2.5 transition-colors focus-within:border-accent focus-within:shadow-focus-accent';
  const input = 'w-full bg-transparent text-body text-ink placeholder:text-muted focus:outline-none';

  return (
    <div className="min-h-screen mesh-page">
      {/* ── Encabezado claro: es la herramienta de búsqueda, no una portada ── */}
      <PageHeader
        tono="oscuro"
        familia="explorar"
        solapa={false}
        titulo="Vacantes"
        detalle={
          estado === 'listo'
            ? hayFiltros
              ? `${vacantesFiltradas.length} de ${vacantes.length} vacantes`
              : `${vacantes.length} ${vacantes.length === 1 ? 'vacante abierta' : 'vacantes abiertas'}`
            : 'Cargando vacantes…'
        }
      />

      {/* ── Barra de búsqueda y filtros, en vidrio: se queda pegada bajo la navegación
           y las tarjetas se ven pasar desenfocadas por debajo. Solo desde `md`:
           en celular los filtros ocupan cinco renglones, casi media pantalla, y
           pegados tapaban las vacantes al bajar. ── */}
      <div className="md:sticky top-[var(--nav-flow)] z-30 border-b border-hairline bg-night/70 backdrop-blur-nav backdrop-saturate-150">
        <div className="mx-auto flex max-w-page flex-col gap-3 px-6 py-4 md:px-7 lg:flex-row lg:items-center">
          <div role="search" className="flex flex-1 flex-col gap-2 sm:flex-row">
            <label className={campo}>
              <Search size={17} strokeWidth={1.7} className="flex-none text-muted" aria-hidden="true" />
              <span className="sr-only">Puesto, empresa o tecnología</span>
              <input
                value={q}
                onChange={(e) => cambiar('q', e.target.value)}
                placeholder="Puesto, empresa o tecnología"
                className={input}
              />
            </label>
            <label className={cx(campo, 'sm:max-w-[260px]')}>
              <MapPin size={17} strokeWidth={1.7} className="flex-none text-muted" aria-hidden="true" />
              <span className="sr-only">Ciudad o remoto</span>
              <input
                value={lugar}
                onChange={(e) => cambiar('lugar', e.target.value)}
                placeholder="Ciudad o remoto"
                className={input}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Modalidad" className="flex flex-wrap gap-1.5">
              {MODALIDADES.map(({ valor, etiqueta }) => {
                const activo = modalidad === valor;
                return (
                  <button
                    key={etiqueta}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => cambiar('modalidad', valor)}
                    className={cx(
                      'relative rounded-pill border px-3.5 py-1.5 text-[0.875rem] font-mid transition-[color,border-color,background-color,transform] duration-200 active:scale-95',
                      activo
                        ? 'border-transparent text-accent-on-dark'
                        : 'border-hairline bg-white/[0.04] text-ink-2 hover:border-hairline-strong hover:text-ink'
                    )}
                  >
                    {/* La píldora activa se desliza de una opción a otra, como la
                        línea de la barra. Con "reducir movimiento" solo cambia. */}
                    {activo && (
                      <motion.span
                        layoutId="modalidad-activa"
                        transition={SPRING}
                        aria-hidden="true"
                        className="absolute inset-[-1px] rounded-pill border border-accent bg-accent/[0.08]"
                      />
                    )}
                    <span className="relative">{etiqueta}</span>
                  </button>
                );
              })}
            </div>
            {/* Elastic Slider: arrastrar es más claro que escribir una cifra. */}
            <SliderElastico
              id="f-salario"
              className="w-[200px] px-1"
              etiqueta="Sueldo mínimo"
              valor={Number(salario) || 0}
              min={0}
              max={sueldoTope}
              paso={1000}
              alCambiar={(n) => cambiar('salario', n > 0 ? String(n) : '')}
              formato={(n) => '$' + PESOS.format(n)}
              textoMinimo="Cualquiera"
            />
            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                <X size={14} strokeWidth={1.8} />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-page px-6 pb-20 md:px-7">
        {/* ── Resultados ── */}
        <div className="pt-6">
          {estado === 'cargando' && (
            <>
              <SkeletonList count={4} />
              <AvisoLento cargando />
            </>
          )}

          {estado === 'error' && (
            <EmptyState
              title="No pudimos cargar las vacantes"
              description="El servidor no respondió. Puede ser una caída momentánea o tu conexión."
              action={
                <Button variant="ghost" onClick={fetchVacantes}>
                  <RotateCcw size={14} strokeWidth={1.8} />
                  Reintentar
                </Button>
              }
            />
          )}

          {estado === 'listo' && vacantesFiltradas.length === 0 && (
            <EmptyState
              title={hayFiltros ? 'Ninguna vacante coincide' : 'Todavía no hay vacantes publicadas'}
              description={
                hayFiltros
                  ? 'Prueba con otros términos, otra ciudad o un sueldo mínimo más bajo.'
                  : 'En cuanto las empresas publiquen y se aprueben, aparecerán aquí.'
              }
              action={
                hayFiltros ? (
                  <Button variant="ghost" onClick={limpiarFiltros}>
                    <X size={14} strokeWidth={1.8} />
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
            />
          )}

          {estado === 'listo' && vacantesFiltradas.length > 0 && (
            <motion.ul
              // La llave cambia con los filtros: así cada búsqueda vuelve a
              // entrar escalonada en vez de que las tarjetas solo cambien.
              key={`${q}|${lugar}|${modalidad}|${salario}`}
              variants={stagger(0.05)}
              initial="hidden"
              animate="show"
              className="grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2"
            >
              {vacantesFiltradas.slice(0, mostradas).map((vacante) => (
                <motion.li key={vacante.id} variants={subeResorte}>
                  <VacanteCard vacante={vacante} conDescripcion />
                </motion.li>
              ))}
            </motion.ul>
          )}

          {estado === 'listo' && vacantesFiltradas.length > mostradas && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="tabular text-[0.875rem] text-muted" aria-live="polite">
                Ves {mostradas} de {vacantesFiltradas.length} vacantes
              </p>
              <Button variant="ghost" onClick={() => setMostradas((n) => n + POR_PAGINA)}>
                <Plus size={15} strokeWidth={1.8} />
                Ver más vacantes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vacantes;
