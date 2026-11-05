import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, RotateCcw, Search, X } from 'lucide-react';
import api from '../services/api';
import { Button, EmptyState, Input, SkeletonList } from '../components/ui';
import PageHeader from '../components/PageHeader';
import VacanteCard from '../components/VacanteCard';
import { useTitulo } from '../hooks/useTitulo';
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
  const limpiarFiltros = () => setParams(new URLSearchParams(), { replace: true });

  const campo =
    'flex flex-1 items-center gap-2.5 rounded-ui border border-hairline px-3.5 py-2.5 transition-colors focus-within:border-accent focus-within:shadow-focus-accent';
  const input = 'w-full bg-transparent text-body text-ink placeholder:text-muted focus:outline-none';

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Encabezado claro: es la herramienta de búsqueda, no una portada ── */}
      <PageHeader
        titulo="Vacantes"
        detalle={
          estado === 'listo'
            ? hayFiltros
              ? `${vacantesFiltradas.length} de ${vacantes.length} vacantes`
              : `${vacantes.length} ${vacantes.length === 1 ? 'vacante abierta' : 'vacantes abiertas'}`
            : 'Cargando vacantes…'
        }
      />

      {/* ── Barra de búsqueda y filtros: se queda pegada bajo la navegación al bajar ── */}
      <div className="sticky top-[var(--nav-flow)] z-30 border-b border-hairline bg-canvas">
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
                      'rounded-pill border px-3.5 py-1.5 text-[0.875rem] font-mid transition-colors',
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
            <div className="w-[150px]">
              <label htmlFor="f-salario" className="sr-only">
                Sueldo mínimo
              </label>
              <Input
                id="f-salario"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={salario}
                onChange={(e) => cambiar('salario', e.target.value)}
                placeholder="Sueldo mín."
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
      </div>

      <div className="mx-auto max-w-page px-6 pb-20 md:px-7">
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
