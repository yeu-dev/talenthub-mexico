import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ExternalLink, FileText, Lock, RotateCcw, Search, X } from '../components/icons';
import api, { getMediaUrl } from '../services/api';
import { showError, showSuccess } from '../utils/alerts';
import {
  AvisoLento,
  BotonMantener,
  Button,
  Card,
  EmptyState,
  ProcessTrack,
  SkeletonList,
} from '../components/ui';
import type { EstadoPostulacion } from '../components/ui';
import { cx } from '../lib/cx';
import { DUR, EASE, stagger, subeResorte } from '../lib/motion';
import PageHeader from '../components/PageHeader';
import { useTitulo } from '../hooks/useTitulo';
import { migasDeCuenta } from '../lib/cuenta';

interface Aplicacion {
  id: number;
  usuario_nombre: string;
  vacante_titulo: string;
  vacante: number;
  estado: string;
  fecha_aplicacion: string;
  cv_url?: string;
  carta_presentacion?: string;
  usuario_email?: string;
  usuario_telefono?: string;
}

const FECHA = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Los filtros salen de los estados reales del modelo (`empleos/models.py`). */
const FILTROS: Array<{ id: string; label: string }> = [
  { id: '', label: 'Todas' },
  { id: 'pendiente', label: 'Sin abrir' },
  { id: 'revisado', label: 'En revisión' },
  { id: 'aceptado', label: 'Aceptadas' },
  { id: 'rechazado', label: 'Rechazadas' },
];

const AplicacionesEmpresa: React.FC = () => {
  useTitulo('Postulaciones recibidas');
  const navigate = useNavigate();
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [filtro, setFiltro] = useState('');
  const [enCurso, setEnCurso] = useState<number | null>(null);

  const fetchAplicaciones = useCallback(async () => {
    setEstado('cargando');
    try {
      const userId = localStorage.getItem('user_id');
      const empresa = await api.get(`/empresas/?usuario=${userId}`);

      if (empresa.data?.length > 0) {
        const { data } = await api.get(`/aplicaciones/?empresa=${empresa.data[0].id}`);
        setAplicaciones(data);
      } else {
        setAplicaciones([]);
      }
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userTipo = localStorage.getItem('user_tipo');

    if (!token) {
      showError('Inicia sesión para ver las postulaciones.');
      navigate('/login');
      return;
    }
    if (userTipo !== 'empresa') {
      showError('Este panel es solo para empresas.');
      navigate('/vacantes');
      return;
    }

    fetchAplicaciones();
  }, [navigate, fetchAplicaciones]);

  const cambiarEstado = async (aplicacion: Aplicacion, nuevoEstado: string) => {
    setEnCurso(aplicacion.id);

    // Optimista: la tarjeta se mueve en el track antes de que responda el
    // servidor. Si falla, se revierte — es más honesto que un spinner que
    // congela la fila entera mientras el usuario ya decidió.
    const previo = aplicacion.estado;
    setAplicaciones((prev) =>
      prev.map((a) => (a.id === aplicacion.id ? { ...a, estado: nuevoEstado } : a))
    );

    try {
      await api.patch(`/aplicaciones/${aplicacion.id}/`, { estado: nuevoEstado });
      showSuccess(
        nuevoEstado === 'aceptado'
          ? `${aplicacion.usuario_nombre} ya puede ver que avanzó.`
          : nuevoEstado === 'rechazado'
            ? 'La persona verá el resultado en su panel.'
            : 'Ahora puedes ver sus datos de contacto.',
        nuevoEstado === 'aceptado'
          ? 'Candidatura aceptada'
          : nuevoEstado === 'rechazado'
            ? 'Candidatura rechazada'
            : 'Marcada en revisión'
      );
    } catch {
      setAplicaciones((prev) =>
        prev.map((a) => (a.id === aplicacion.id ? { ...a, estado: previo } : a))
      );
      showError('No pudimos actualizar la postulación.');
    } finally {
      setEnCurso(null);
    }
  };

  const conteo = (id: string) =>
    id === '' ? aplicaciones.length : aplicaciones.filter((a) => a.estado === id).length;

  const visibles = filtro ? aplicaciones.filter((a) => a.estado === filtro) : aplicaciones;

  return (
    <div className="min-h-screen mesh-page">
      <PageHeader
        tono="oscuro"
        familia="trabajo"
        migas={migasDeCuenta('Postulaciones')}
        titulo="Postulaciones recibidas"
        detalle={
          estado === 'cargando'
            ? 'Cargando candidaturas…'
            : aplicaciones.length === 0
              ? 'Todavía no llega ninguna'
              : aplicaciones.length === 1
                ? '1 persona ha aplicado a tus vacantes'
                : `${aplicaciones.length} personas han aplicado a tus vacantes`
        }
      />

      <div className="mx-auto max-w-page px-6 pb-20 md:px-7">
        {/* ── Filtros ── */}
        <div className="glass-panel glass-panel-overlap-sm edge-l mb-8 p-6">
          <p className="mb-4 text-caption uppercase tracking-[0.06em] text-ink-2">Filtrar</p>
          <div className="flex flex-wrap gap-2">
            {FILTROS.map(({ id, label }) => {
              const activo = filtro === id;
              const total = conteo(id);

              return (
                <button
                  key={id || 'todas'}
                  type="button"
                  onClick={() => setFiltro(id)}
                  aria-pressed={activo}
                  // Un filtro no es una pestaña: no cambia de vista, acota la
                  // lista. Por eso `aria-pressed` y no `role="tab"`.
                  className={cx(
                    'relative rounded-pill border px-4 py-2 text-[0.875rem] font-mid',
                    'transition-colors duration-200 ease-base',
                    activo
                      ? 'border-accent bg-accent text-white'
                      : 'border-hairline text-ink-2 hover:border-hairline-strong hover:bg-white/[0.04]',
                    total === 0 && !activo && 'opacity-45'
                  )}
                >
                  {label}
                  <span className={cx('tabular ml-2 text-[0.75rem]', activo ? 'text-white/70' : 'text-muted')}>
                    {total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {estado === 'error' ? (
          <EmptyState
            title="No pudimos cargar las postulaciones"
            description="La conexión con el servidor falló. Puede ser temporal."
            action={
              <Button variant="primary" onClick={fetchAplicaciones}>
                <RotateCcw size={15} strokeWidth={1.8} />
                Reintentar
              </Button>
            }
          />
        ) : estado === 'cargando' ? (
          <>
            <SkeletonList count={3} />
            <AvisoLento cargando />
          </>
        ) : visibles.length === 0 ? (
          <EmptyState
            title={filtro ? 'Ninguna postulación en este estado' : 'Todavía no recibes postulaciones'}
            description={
              filtro
                ? 'Prueba con otro filtro para ver el resto.'
                : 'Cuando alguien aplique a tus vacantes, su candidatura aparecerá aquí.'
            }
            action={
              filtro ? (
                <Button variant="ghost" onClick={() => setFiltro('')}>
                  <Search size={15} strokeWidth={1.8} />
                  Ver todas
                </Button>
              ) : undefined
            }
          />
        ) : (
          <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="flex flex-col gap-[18px]">
            <AnimatePresence initial={false}>
              {visibles.map((a) => {
                // El contacto se abre al pasar a revisión: hasta entonces la
                // empresa no tiene motivo para tener el teléfono de alguien.
                const contactoVisible = a.estado === 'revisado' || a.estado === 'aceptado';
                const resuelta = a.estado === 'aceptado' || a.estado === 'rechazado';
                const ocupada = enCurso === a.id;

                return (
                  <motion.div key={a.id} layout variants={subeResorte} exit={{ opacity: 0, scale: 0.98 }}>
                    <Card className="flex flex-col gap-5">
                      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                        <div>
                          <h2 className="text-h3 font-demi leading-tight text-ink">
                            {a.usuario_nombre}
                          </h2>
                          <p className="mt-1.5 text-[0.9375rem] text-muted">
                            Aplicó a{' '}
                            <Link
                              to={`/vacantes/${a.vacante}`}
                              className="text-accent-on-dark transition-opacity hover:opacity-70"
                            >
                              {a.vacante_titulo}
                            </Link>
                          </p>
                          <p className="tabular mt-1 text-[0.8125rem] text-muted">
                            {FECHA.format(new Date(a.fecha_aplicacion))}
                          </p>
                        </div>

                        <ProcessTrack estado={a.estado as EstadoPostulacion} className="shrink-0" />
                      </div>

                      {/* ── CV y contacto ── */}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {a.cv_url ? (
                          <a
                            href={getMediaUrl(a.cv_url) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-ui border border-hairline px-4 py-3 text-[0.9375rem] text-ink transition-colors duration-200 hover:border-accent/40 hover:bg-accent/[0.03]"
                          >
                            <FileText size={16} strokeWidth={1.7} className="flex-none text-accent-on-dark" />
                            Ver currículum
                            <ExternalLink size={13} strokeWidth={1.8} className="ml-auto flex-none text-muted" />
                          </a>
                        ) : (
                          <p className="flex items-center gap-2.5 rounded-ui border border-dashed border-hairline px-4 py-3 text-[0.9375rem] text-muted">
                            <FileText size={16} strokeWidth={1.7} className="flex-none" />
                            Sin currículum adjunto
                          </p>
                        )}

                        <AnimatePresence mode="wait" initial={false}>
                          {contactoVisible ? (
                            <motion.div
                              key="contacto"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: DUR.fast, ease: EASE }}
                              className="rounded-ui border border-hairline bg-surface px-4 py-3"
                            >
                              <p className="text-[0.9375rem] text-ink">
                                {a.usuario_email || 'Correo no disponible'}
                              </p>
                              <p className="tabular mt-0.5 text-[0.875rem] text-muted">
                                {a.usuario_telefono || 'Teléfono no proporcionado'}
                              </p>
                            </motion.div>
                          ) : (
                            <motion.p
                              key="bloqueado"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: DUR.fast, ease: EASE }}
                              className="flex items-center gap-2.5 rounded-ui border border-dashed border-hairline px-4 py-3 text-[0.875rem] leading-snug text-muted"
                            >
                              <Lock size={15} strokeWidth={1.7} className="flex-none" />
                              El contacto se abre al marcar en revisión.
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Acciones ── */}
                      <div className="flex flex-wrap gap-2.5 border-t border-hairline pt-[18px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={ocupada || a.estado !== 'pendiente'}
                          onClick={() => cambiarEstado(a, 'revisado')}
                        >
                          <Search size={14} strokeWidth={1.8} />
                          Revisar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!text-ok hover:border-ok/40"
                          disabled={ocupada || a.estado === 'aceptado'}
                          onClick={() => cambiarEstado(a, 'aceptado')}
                        >
                          <Check size={14} strokeWidth={2} />
                          Aceptar
                        </Button>
                        <BotonMantener
                          disabled={ocupada || a.estado === 'rechazado'}
                          accion={`rechazar a ${a.usuario_nombre}`}
                          alConfirmar={() => cambiarEstado(a, 'rechazado')}
                        >
                          <X size={14} strokeWidth={1.8} />
                          Mantén para rechazar
                        </BotonMantener>

                        {resuelta && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto"
                            disabled={ocupada}
                            onClick={() => cambiarEstado(a, 'revisado')}
                          >
                            <RotateCcw size={14} strokeWidth={1.8} />
                            Reabrir
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AplicacionesEmpresa;
