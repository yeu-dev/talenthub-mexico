import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Ban,
  Check,
  Inbox,
  Layers,
  Plus,
  RotateCcw,
  ScrollText,
  Users,
  X,
} from 'lucide-react';
import api from '../services/api';
import { showSuccess, showError, showConfirm } from '../utils/alerts';
import {
  Button,
  Card,
  EmptyState,
  Input,
  SkeletonList,
  Tabs,
  Tag,
} from '../components/ui';
import type { TabItem } from '../components/ui';
import { DUR, EASE, rise, stagger } from '../lib/motion';
import PageHeader from '../components/PageHeader';
import { useTitulo } from '../hooks/useTitulo';

interface VacantePendiente {
  id: number;
  titulo: string;
  empresa_nombre: string;
  descripcion?: string;
  salario_min?: string;
  salario_max?: string;
  modalidad?: string;
  fecha_publicacion: string;
  estado_validacion?: string;
  activa?: boolean;
}

interface UsuarioAuditoria {
  id: number;
  username: string;
  email: string;
  tipo: string;
  is_active: boolean;
  date_joined: string;
}

interface Tecnologia {
  id: number;
  nombre: string;
}

type Pestana = 'vacantes' | 'usuarios' | 'historial' | 'stack';

const FECHA = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const DashboardValidador: React.FC = () => {
  useTitulo('Centro de validación');
  const navigate = useNavigate();
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [tab, setTab] = useState<Pestana>('vacantes');

  const [vacantes, setVacantes] = useState<VacantePendiente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAuditoria[]>([]);
  const [historial, setHistorial] = useState<VacantePendiente[]>([]);
  const [tecnologias, setTecnologias] = useState<Tecnologia[]>([]);
  const [nuevaTech, setNuevaTech] = useState('');

  const [metricas, setMetricas] = useState({
    total_usuarios: 0,
    total_empresas: 0,
    vacantes_activas: 0,
    total_postulaciones: 0,
  });

  const fetchMetricas = useCallback(async () => {
    const { data } = await api.get('/validador/metricas/');
    setMetricas(data);
  }, []);

  const fetchPendientes = useCallback(async () => {
    const { data } = await api.get('/vacantes/pendientes/');
    setVacantes(data);
  }, []);

  const fetchUsuarios = useCallback(async () => {
    const { data } = await api.get('/validador/usuarios/');
    setUsuarios(data);
  }, []);

  const fetchHistorial = useCallback(async () => {
    const { data } = await api.get('/validador/vacantes/historial/');
    setHistorial(data);
  }, []);

  const fetchTecnologias = useCallback(async () => {
    const { data } = await api.get('/validador/tecnologias/');
    setTecnologias(data);
  }, []);

  const cargarTodo = useCallback(async () => {
    setEstado('cargando');
    try {
      // En paralelo: son cuatro endpoints independientes y encadenarlos
      // multiplicaba por cuatro la espera del validador.
      await Promise.all([
        fetchMetricas(),
        fetchPendientes(),
        fetchUsuarios(),
        fetchHistorial(),
        fetchTecnologias(),
      ]);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, [fetchMetricas, fetchPendientes, fetchUsuarios, fetchHistorial, fetchTecnologias]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userTipo = localStorage.getItem('user_tipo');

    if (!token || userTipo !== 'validador') {
      showError('Esta área es solo para validadores.', 'Acceso denegado');
      navigate('/');
      return;
    }

    cargarTodo();
  }, [navigate, cargarTodo]);

  const handleValidacion = async (vacante: VacantePendiente, accion: 'aprobar' | 'rechazar') => {
    const confirmado = await showConfirm(
      accion === 'aprobar'
        ? `«${vacante.titulo}» quedará visible para todos los aspirantes.`
        : `«${vacante.titulo}» no se publicará y la empresa verá el rechazo.`,
      accion === 'aprobar' ? 'Publicar vacante' : 'Rechazar vacante',
      {
        confirmLabel: accion === 'aprobar' ? 'Publicar' : 'Rechazar',
        destructive: accion === 'rechazar',
      }
    );
    if (!confirmado) return;

    try {
      await api.post(`/vacantes/validar/${vacante.id}/`, { accion });
      showSuccess(
        accion === 'aprobar' ? 'La vacante ya es pública.' : 'La vacante quedó fuera del muro.',
        accion === 'aprobar' ? 'Aprobada' : 'Rechazada'
      );
      await Promise.all([fetchPendientes(), fetchHistorial(), fetchMetricas()]);
    } catch {
      showError(`No pudimos ${accion} la vacante.`);
    }
  };

  const handleSuspender = async (usuario: UsuarioAuditoria) => {
    const suspendiendo = usuario.is_active;
    const confirmado = await showConfirm(
      suspendiendo
        ? `${usuario.username} no podrá iniciar sesión hasta que lo reactives.`
        : `${usuario.username} recuperará el acceso a su cuenta.`,
      suspendiendo ? 'Suspender cuenta' : 'Reactivar cuenta',
      {
        confirmLabel: suspendiendo ? 'Suspender' : 'Reactivar',
        destructive: suspendiendo,
      }
    );
    if (!confirmado) return;

    try {
      await api.post(`/validador/usuarios/${usuario.id}/suspender/`, {});
      showSuccess(suspendiendo ? 'Cuenta suspendida.' : 'Cuenta reactivada.');
      await fetchUsuarios();
    } catch {
      showError('No pudimos cambiar el estado de la cuenta.');
    }
  };

  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTech.trim()) return;
    try {
      await api.post('/validador/tecnologias/', { nombre: nuevaTech.trim() });
      showSuccess(`${nuevaTech.trim()} entró al catálogo.`);
      setNuevaTech('');
      await fetchTecnologias();
    } catch (error: any) {
      showError(error.response?.data?.error || 'No pudimos agregar la tecnología.');
    }
  };

  const handleDeleteTech = async (tech: Tecnologia) => {
    const confirmado = await showConfirm(
      `${tech.nombre} dejará de estar disponible para empresas y aspirantes.`,
      'Quitar del catálogo',
      { confirmLabel: 'Quitar', destructive: true }
    );
    if (!confirmado) return;
    try {
      await api.delete(`/validador/tecnologias/${tech.id}/`);
      showSuccess('Tecnología eliminada.');
      await fetchTecnologias();
    } catch {
      showError('No pudimos eliminar la tecnología.');
    }
  };

  const PESTANAS: TabItem[] = [
    { id: 'vacantes', label: 'Cola', count: vacantes.length, icon: Inbox },
    { id: 'usuarios', label: 'Cuentas', count: usuarios.length, icon: Users },
    { id: 'historial', label: 'Historial', count: historial.length, icon: ScrollText },
    { id: 'stack', label: 'Catálogo', count: tecnologias.length, icon: Layers },
  ];

  const METRICAS = [
    { label: 'Usuarios', total: metricas.total_usuarios },
    { label: 'Empresas', total: metricas.total_empresas },
    { label: 'Vacantes públicas', total: metricas.vacantes_activas },
    { label: 'Postulaciones', total: metricas.total_postulaciones },
  ];

  const panelProps = (id: Pestana) => ({
    role: 'tabpanel' as const,
    id: `validador-panel-${id}`,
    'aria-labelledby': `validador-tab-${id}`,
  });

  return (
    <div className="min-h-screen mesh-page">
      <PageHeader
        tono="oscuro"
        migas={[{ etiqueta: 'Validación' }, { etiqueta: 'Centro de validación' }]}
        titulo="Centro de validación"
        detalle={
          estado === 'cargando'
            ? 'Cargando la cola…'
            : vacantes.length === 0
              ? 'Sin vacantes esperando revisión'
              : vacantes.length === 1
                ? '1 vacante espera revisión'
                : `${vacantes.length} vacantes esperan revisión`
        }
        acciones={
          <Link to="/vacantes">
            <Button variant="ghost" tone="dark">
              <ArrowLeft size={15} strokeWidth={1.8} />
              Muro público
            </Button>
          </Link>
        }
      />

      <div className="mx-auto max-w-page px-6 pb-20 md:px-7">
        {/* ── Métricas ── */}
        <div className="glass-panel glass-panel-overlap-sm edge-l mb-8 grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
          {METRICAS.map(({ label, total }) => (
            <div key={label} className="px-6 py-7">
              <span className="tabular block text-[1.75rem] font-mid leading-none tracking-[-0.03em] text-ink">
                {total}
              </span>
              <p className="mt-2 text-[0.8125rem] text-muted">{label}</p>
            </div>
          ))}
        </div>

        {estado === 'error' ? (
          <EmptyState
            title="No pudimos cargar el panel"
            description="La conexión con el servidor falló. Puede ser temporal."
            action={
              <Button variant="primary" onClick={cargarTodo}>
                <RotateCcw size={15} strokeWidth={1.8} />
                Reintentar
              </Button>
            }
          />
        ) : estado === 'cargando' ? (
          <SkeletonList count={3} />
        ) : (
          <>
            <Tabs
              name="validador"
              label="Secciones del centro de validación"
              items={PESTANAS}
              value={tab}
              onChange={(id) => setTab(id as Pestana)}
              className="mb-8"
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DUR.base, ease: EASE }}
              >
                {/* ───────────── Cola de revisión ───────────── */}
                {tab === 'vacantes' && (
                  <div {...panelProps('vacantes')}>
                    {vacantes.length === 0 ? (
                      <EmptyState
                        title="La cola está vacía"
                        description="Cuando una empresa publique algo nuevo, aparecerá aquí para su revisión."
                      />
                    ) : (
                      <motion.div
                        variants={stagger(0.07)}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 gap-[18px] lg:grid-cols-2"
                      >
                        {vacantes.map((v) => (
                          <motion.div key={v.id} variants={rise}>
                            <Card className="flex h-full flex-col">
                              <div className="mb-4 flex items-start justify-between gap-4">
                                <div>
                                  <h2 className="text-sub font-demi leading-snug text-ink">
                                    {v.titulo}
                                  </h2>
                                  <p className="mt-1 text-[0.875rem] text-muted">{v.empresa_nombre}</p>
                                </div>
                                <Tag tono="curso">En revisión</Tag>
                              </div>

                              {v.descripcion && (
                                <p className="mb-5 line-clamp-4 text-[0.90625rem] leading-relaxed text-ink-2">
                                  {v.descripcion}
                                </p>
                              )}

                              <div className="mt-auto flex flex-wrap gap-2.5 border-t border-hairline pt-[18px]">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!text-ok hover:border-ok/40"
                                  onClick={() => handleValidacion(v, 'aprobar')}
                                >
                                  <Check size={14} strokeWidth={2} />
                                  Aprobar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!text-danger hover:border-danger/40"
                                  onClick={() => handleValidacion(v, 'rechazar')}
                                >
                                  <X size={14} strokeWidth={1.8} />
                                  Rechazar
                                </Button>
                                <p className="tabular ml-auto self-center text-[0.8125rem] text-muted">
                                  {FECHA.format(new Date(v.fecha_publicacion))}
                                </p>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ───────────── Cuentas ───────────── */}
                {tab === 'usuarios' && (
                  <div {...panelProps('usuarios')}>
                    {usuarios.length === 0 ? (
                      <EmptyState title="Todavía no hay cuentas registradas" />
                    ) : (
                      // Filas OPACAS a propósito: `backdrop-filter` por fila
                      // obliga al navegador a recomponer la pila entera en cada
                      // scroll.
                      <div className="overflow-x-auto rounded-card border border-hairline bg-canvas">
                        <table className="w-full min-w-[640px] border-collapse text-left">
                          <thead>
                            <tr className="border-b border-hairline">
                              <th className="px-6 py-4 text-caption font-mid uppercase tracking-[0.06em] text-muted">
                                Cuenta
                              </th>
                              <th className="px-6 py-4 text-caption font-mid uppercase tracking-[0.06em] text-muted">
                                Rol
                              </th>
                              <th className="px-6 py-4 text-caption font-mid uppercase tracking-[0.06em] text-muted">
                                Estado
                              </th>
                              <th className="px-6 py-4 text-right text-caption font-mid uppercase tracking-[0.06em] text-muted">
                                Acción
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {usuarios.map((u) => (
                              <tr
                                key={u.id}
                                className="border-b border-hairline transition-colors duration-150 last:border-0 hover:bg-surface"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-mid text-ink">{u.username}</p>
                                  <p className="text-[0.8125rem] text-muted">{u.email}</p>
                                </td>
                                <td className="px-6 py-4 text-[0.875rem] capitalize text-ink-2">{u.tipo}</td>
                                <td className="px-6 py-4">
                                  <Tag tono={u.is_active ? 'bien' : 'mal'}>
                                    {u.is_active ? 'Activa' : 'Suspendida'}
                                  </Tag>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={
                                      u.is_active
                                        ? '!text-danger hover:border-danger/40'
                                        : '!text-ok hover:border-ok/40'
                                    }
                                    onClick={() => handleSuspender(u)}
                                  >
                                    {u.is_active ? (
                                      <Ban size={14} strokeWidth={1.8} />
                                    ) : (
                                      <RotateCcw size={14} strokeWidth={1.8} />
                                    )}
                                    {u.is_active ? 'Suspender' : 'Reactivar'}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ───────────── Historial ───────────── */}
                {tab === 'historial' && (
                  <div {...panelProps('historial')}>
                    {historial.length === 0 ? (
                      <EmptyState
                        title="Sin historial todavía"
                        description="Aquí queda registro de cada vacante que apruebes o rechaces."
                      />
                    ) : (
                      <div className="overflow-x-auto rounded-card border border-hairline bg-canvas">
                        <table className="w-full min-w-[760px] border-collapse text-left">
                          <thead>
                            <tr className="border-b border-hairline">
                              <th className="px-6 py-4 text-caption font-mid uppercase tracking-[0.06em] text-muted">
                                Vacante
                              </th>
                              <th className="px-6 py-4 text-caption font-mid uppercase tracking-[0.06em] text-muted">
                                Fecha
                              </th>
                              <th className="px-6 py-4 text-caption font-mid uppercase tracking-[0.06em] text-muted">
                                Resolución
                              </th>
                              <th className="px-6 py-4 text-caption font-mid uppercase tracking-[0.06em] text-muted">
                                En el muro
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {historial.map((h) => (
                              <tr
                                key={h.id}
                                className="border-b border-hairline transition-colors duration-150 last:border-0 hover:bg-surface"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-mid text-ink">{h.titulo}</p>
                                  <p className="text-[0.8125rem] text-muted">{h.empresa_nombre}</p>
                                </td>
                                <td className="tabular px-6 py-4 text-[0.875rem] text-ink-2">
                                  {FECHA.format(new Date(h.fecha_publicacion))}
                                </td>
                                <td className="px-6 py-4">
                                  <Tag tono={h.estado_validacion === 'aprobada' ? 'bien' : 'mal'}>
                                    {h.estado_validacion === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                                  </Tag>
                                </td>
                                <td className="px-6 py-4 text-[0.875rem] text-muted">
                                  {h.activa ? 'Visible' : 'Cerrada'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ───────────── Catálogo de tecnologías ───────────── */}
                {tab === 'stack' && (
                  <div {...panelProps('stack')} className="grid grid-cols-1 gap-[18px] lg:grid-cols-[340px_1fr]">
                    <Card>
                      <h2 className="mb-2 text-sub font-demi text-ink">Agregar tecnología</h2>
                      <p className="mb-5 text-[0.875rem] leading-relaxed text-muted">
                        Este catálogo es la lista cerrada de la que eligen empresas y aspirantes. Lo que
                        no esté aquí, no se puede etiquetar.
                      </p>

                      <form onSubmit={handleAddTech} className="flex flex-col gap-3">
                        <label htmlFor="nueva-tech" className="sr-only">
                          Nombre de la tecnología
                        </label>
                        <Input
                          id="nueva-tech"
                          value={nuevaTech}
                          onChange={(e) => setNuevaTech(e.target.value)}
                          placeholder="React, Django, Docker…"
                        />
                        <Button type="submit" variant="accent" disabled={!nuevaTech.trim()}>
                          <Plus size={15} strokeWidth={1.8} />
                          Añadir al catálogo
                        </Button>
                      </form>
                    </Card>

                    <Card>
                      <div className="mb-5 flex items-baseline justify-between gap-4">
                        <h2 className="text-sub font-demi text-ink">Stack oficial</h2>
                        <span className="tabular text-[0.8125rem] text-muted">
                          {tecnologias.length} {tecnologias.length === 1 ? 'entrada' : 'entradas'}
                        </span>
                      </div>

                      {tecnologias.length === 0 ? (
                        <p className="text-[0.9375rem] text-muted">
                          El catálogo está vacío. La primera que agregues aparecerá aquí.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <AnimatePresence initial={false}>
                            {tecnologias.map((t) => (
                              <motion.span
                                key={t.id}
                                layout
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: DUR.fast, ease: EASE }}
                                className="inline-flex items-center gap-1.5 rounded-pill border border-hairline py-1 pl-3.5 pr-1.5 text-[0.875rem] text-ink-2"
                              >
                                {t.nombre}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTech(t)}
                                  aria-label={`Quitar ${t.nombre} del catálogo`}
                                  className="flex h-6 w-6 items-center justify-center rounded-pill text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                                >
                                  <X size={13} strokeWidth={2} />
                                </button>
                              </motion.span>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardValidador;
