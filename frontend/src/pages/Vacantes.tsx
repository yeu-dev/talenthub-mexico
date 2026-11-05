import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, RotateCcw, Search, X } from 'lucide-react';
import api from '../services/api';
import { Button, EmptyState, Input, SkeletonList } from '../components/ui';
import VacanteCard from '../components/VacanteCard';
import { cx } from '../lib/cx';
import { coincide, VacantePublica } from '../lib/vacantes';

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
  const limpiarFiltros = () => setParams(new URLSearchParams(), { replace: true });

  const campo = 'flex flex-1 items-center gap-3 rounded-ui px-4 py-3 transition-colors focus-within:bg-surface';
  const input = 'w-full bg-transparent text-body text-ink placeholder:text-muted focus:outline-none';

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Franja oscura corta: título, conteo y el mismo buscador de la portada ── */}
      <header className="bg-night pb-10 pt-10 text-ink-d md:pt-12">
        <div className="mx-auto max-w-page px-6 md:px-7">
          <h1 className="font-heading text-[clamp(1.875rem,4vw,2.5rem)] font-mid leading-none tracking-[-0.02em]">
            Vacantes
          </h1>
          <p className="tabular mt-2.5 text-body text-ink-2d">
            {estado === 'listo'
              ? hayFiltros
                ? `${vacantesFiltradas.length} de ${vacantes.length} vacantes`
                : `${vacantes.length} ${vacantes.length === 1 ? 'vacante abierta' : 'vacantes abiertas'}`
              : 'Cargando vacantes…'}
          </p>

          <div
            role="search"
            className="mt-6 flex flex-col gap-1 rounded-card bg-canvas p-2 md:flex-row md:items-center md:gap-0"
          >
            <label className={campo}>
              <Search size={18} strokeWidth={1.7} className="flex-none text-muted" aria-hidden="true" />
              <span className="sr-only">Puesto, empresa o tecnología</span>
              <input
                value={q}
                onChange={(e) => cambiar('q', e.target.value)}
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
                onChange={(e) => cambiar('lugar', e.target.value)}
                placeholder="Ciudad o remoto"
                className={input}
              />
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-page px-6 pb-20 md:px-7">
        {/* ── Filtros secundarios: modalidad y sueldo, en una barra ── */}
        <div className="flex flex-col gap-4 border-b border-hairline py-5 md:flex-row md:items-center md:justify-between">
          <div role="radiogroup" aria-label="Modalidad" className="flex flex-wrap gap-2">
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
                    'rounded-pill border px-4 py-1.5 text-[0.875rem] font-mid transition-colors',
                    activo
                      ? 'border-accent bg-accent/[0.06] text-accent'
                      : 'border-hairline text-ink-2 hover:border-hairline-strong hover:text-ink'
                  )}
                >
                  {etiqueta}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="f-salario" className="whitespace-nowrap text-[0.875rem] text-ink-2">
              Sueldo mínimo
            </label>
            <div className="w-[140px]">
              <Input
                id="f-salario"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={salario}
                onChange={(e) => cambiar('salario', e.target.value)}
                placeholder="30000"
              />
            </div>
            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                <X size={14} strokeWidth={1.8} />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* ── Resultados ── */}
        <div className="pt-6">
          {estado === 'cargando' && <SkeletonList count={4} />}

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
            <ul className="grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2">
              {vacantesFiltradas.map((vacante) => (
                <li key={vacante.id}>
                  <VacanteCard vacante={vacante} conDescripcion />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vacantes;
