import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Pencil, EyeOff, RotateCcw, ExternalLink, Trash2, Check } from 'lucide-react';
import api from '../services/api';
import { showSuccess, showError, showConfirm } from '../utils/alerts';
import { Button, Card, EmptyState, Field, Input, Select, Textarea, SkeletonList, Tag } from '../components/ui';
import type { TagTono } from '../components/ui';
import { rise, stagger, EASE, DUR } from '../lib/motion';
import PageHeader from '../components/PageHeader';
import { useTitulo } from '../hooks/useTitulo';
import { migasDeCuenta, pestanasDeCuenta } from '../lib/cuenta';

interface Vacante {
  id: number;
  titulo: string;
  descripcion: string;
  salario_min: string;
  salario_max: string;
  modalidad: string;
  ubicacion: string;
  activa: boolean;
  requisitos: any;
  estado_validacion: string;
}

const MXN = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

const FORM_VACIO = {
  titulo: '',
  descripcion: '',
  salario_min: '',
  salario_max: '',
  modalidad: 'remoto',
  ubicacion: '',
  tecnologias: '',
  experiencia: '',
  otros_requisitos: '',
  activa: true,
};

/** Estado de la vacante ante el validador y ante el público. */
const estadoDe = (v: Vacante): { label: string; tono: TagTono } => {
  if (v.estado_validacion === 'pendiente') return { label: 'En revisión', tono: 'curso' };
  if (v.estado_validacion === 'rechazada') return { label: 'Rechazada', tono: 'mal' };
  return v.activa ? { label: 'Publicada', tono: 'bien' } : { label: 'Cerrada', tono: 'neutro' };
};

const Dashboard: React.FC = () => {
  useTitulo('Mis vacantes');
  const navigate = useNavigate();
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState(FORM_VACIO);

  const fetchVacantes = useCallback(async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const empresaResponse = await api.get(`/empresas/?usuario=${userId}`);

      if (empresaResponse.data && empresaResponse.data.length > 0) {
        const empresaId = empresaResponse.data[0].id;
        const response = await api.get(`/vacantes/?empresa=${empresaId}`);
        setVacantes(response.data);
      } else {
        console.warn('Este usuario no tiene un perfil en la tabla Empresa');
        setVacantes([]);
      }
      setEstado('listo');
    } catch (error) {
      console.error('Error:', error);
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    const userTipo = localStorage.getItem('user_tipo');

    if (!localStorage.getItem('token')) {
      showError('Inicia sesión para ver tu dashboard.', 'Falta un paso');
      navigate('/login');
      return;
    }
    if (userTipo !== 'empresa') {
      showError('El dashboard es solo para empresas.', 'Sin acceso');
      navigate('/vacantes');
      return;
    }
    fetchVacantes();
  }, [navigate, fetchVacantes]);

  const resumen = useMemo(
    () => [
      { label: 'Publicadas', total: vacantes.filter((v) => v.estado_validacion === 'aprobada' && v.activa).length },
      { label: 'En revisión', total: vacantes.filter((v) => v.estado_validacion === 'pendiente').length },
      { label: 'Cerradas', total: vacantes.filter((v) => v.estado_validacion === 'aprobada' && !v.activa).length },
      { label: 'Rechazadas', total: vacantes.filter((v) => v.estado_validacion === 'rechazada').length },
    ],
    [vacantes]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const limpiarForm = () => setFormData(FORM_VACIO);

  const cerrarForm = () => {
    setShowForm(false);
    setEditando(null);
    limpiarForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Una vacante rechazada no se puede editar: el backend la rebota, así que
    // paramos aquí para dar un mensaje claro en vez de un error genérico.
    if (editando) {
      const original = vacantes.find((v) => v.id === editando);
      if (original?.estado_validacion === 'rechazada') {
        showError('Fue rechazada por el validador y ya no se puede modificar.', 'Vacante bloqueada');
        return;
      }
    }

    setGuardando(true);
    try {
      const userId = localStorage.getItem('user_id');
      const empresaResponse = await api.get(`/empresas/?usuario=${userId}`);
      if (!empresaResponse.data || empresaResponse.data.length === 0) {
        showError(
          'Tu usuario no tiene perfil de empresa. Crea una cuenta nueva desde Registro para generarlo.',
          'Falta el perfil de empresa'
        );
        setGuardando(false);
        return;
      }

      const empresaId = empresaResponse.data[0].id;
      const dataToSend = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        salario_min: formData.salario_min,
        salario_max: formData.salario_max,
        modalidad: formData.modalidad,
        ubicacion: formData.ubicacion,
        requisitos: {
          lenguajes: formData.tecnologias.split(',').map((t) => t.trim()).filter(Boolean),
          experiencia: formData.experiencia,
          otros: formData.otros_requisitos,
        },
        activa: editando ? formData.activa : false,
        empresa: empresaId,
      };

      if (editando) {
        await api.put(`/vacantes/${editando}/`, dataToSend);
        showSuccess('Los cambios ya están guardados.', 'Vacante actualizada');
      } else {
        await api.post('/vacantes/', dataToSend);
        showSuccess('Queda pendiente de validación por un administrador.', 'Vacante creada');
      }

      cerrarForm();
      fetchVacantes();
    } catch (error: any) {
      console.error('Error:', error);
      showError(error.response?.data?.detail || 'Inténtalo de nuevo.', 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = (vacante: Vacante) => {
    setFormData({
      titulo: vacante.titulo,
      descripcion: vacante.descripcion,
      salario_min: vacante.salario_min,
      salario_max: vacante.salario_max,
      modalidad: vacante.modalidad,
      ubicacion: vacante.ubicacion,
      tecnologias: vacante.requisitos?.lenguajes ? vacante.requisitos.lenguajes.join(', ') : '',
      experiencia: vacante.requisitos?.experiencia || '',
      otros_requisitos: vacante.requisitos?.otros || '',
      activa: vacante.activa,
    });
    setEditando(vacante.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const ok = await showConfirm(
      'Se eliminará de forma permanente junto con sus postulaciones.',
      '¿Eliminar esta vacante?',
      { confirmLabel: 'Sí, eliminar', destructive: true }
    );
    if (!ok) return;

    try {
      await api.delete(`/vacantes/${id}/`);
      showSuccess('La vacante ya no existe.', 'Vacante eliminada');
      fetchVacantes();
    } catch (error) {
      showError('No se pudo eliminar la vacante.');
    }
  };

  const handleReabrir = async (id: number) => {
    const ok = await showConfirm(
      'Volverá a ser visible para los aspirantes.',
      '¿Reabrir esta vacante?',
      { confirmLabel: 'Sí, reabrir', destructive: false }
    );
    if (!ok) return;

    try {
      const userId = localStorage.getItem('user_id');
      const empresaResponse = await api.get(`/empresas/?usuario=${userId}`);
      if (empresaResponse.data?.length > 0) {
        const empresaId = empresaResponse.data[0].id;
        await api.patch(`/vacantes/${id}/?empresa=${empresaId}`, { activa: true });
        showSuccess('Ya es visible para los aspirantes.', 'Vacante reabierta');
        fetchVacantes();
      }
    } catch (error: any) {
      console.error('Error del backend:', error.response?.data);
      const motivo = error.response?.data?.detail || 'Revisa la consola para el detalle.';
      showError(motivo, 'No se pudo reabrir');
    }
  };

  const handleCerrar = async (id: number) => {
    const ok = await showConfirm(
      'Dejará de aparecer a los aspirantes, pero conservarás sus postulaciones.',
      '¿Cerrar esta vacante?',
      { confirmLabel: 'Sí, cerrar', destructive: false }
    );
    if (!ok) return;

    try {
      await api.patch(`/vacantes/${id}/`, { activa: false });
      showSuccess('Ya no aparece en el listado público.', 'Vacante cerrada');
      fetchVacantes();
    } catch (error) {
      showError('Hubo un error al cerrar la vacante.');
    }
  };

  return (
    <div className="min-h-screen mesh-page">
      <PageHeader
        migas={migasDeCuenta('Mis vacantes')}
        titulo="Mis vacantes"
        pestanas={pestanasDeCuenta(localStorage.getItem('user_tipo'))}
        detalle={
          estado === 'listo'
            ? vacantes.length === 1
              ? '1 vacante publicada'
              : `${vacantes.length} vacantes publicadas`
            : 'Cargando tus vacantes…'
        }
        acciones={
          <Button
            variant={showForm ? 'ghost' : 'primary'}
            onClick={() => (showForm ? cerrarForm() : setShowForm(true))}
          >
            {showForm ? <X size={16} strokeWidth={1.8} /> : <Plus size={16} strokeWidth={1.8} />}
            {showForm ? 'Cancelar' : 'Nueva vacante'}
          </Button>
        }
      />

      <div className="mx-auto max-w-page px-6 pb-20 md:px-7">
        {/* ── Resumen ── */}
        {estado === 'listo' && vacantes.length > 0 && (
          <div className="mt-6 glass-panel edge-l mb-8 grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
            {resumen.map(({ label, total }) => (
              <div key={label} className="px-6 py-7">
                <p className="tabular text-[1.75rem] font-mid leading-none tracking-[-0.03em] text-ink">
                  {total}
                </p>
                <p className="mt-2 text-[0.8125rem] text-muted">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className={estado === 'listo' && vacantes.length > 0 ? '' : 'pt-6'}>
          {/* ── Formulario ── */}
          <AnimatePresence initial={false}>
            {showForm && (
              <motion.div
                key="form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: DUR.base, ease: EASE }}
                className="overflow-hidden"
              >
                <Card className="mb-8">
                  <h2 className="mb-7 text-h3 font-demi text-ink">
                    {editando ? 'Editar vacante' : 'Nueva vacante'}
                  </h2>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <Field label="Título del puesto" htmlFor="titulo">
                        <Input id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required />
                      </Field>
                      <Field label="Ubicación" htmlFor="ubicacion">
                        <Input
                          id="ubicacion"
                          name="ubicacion"
                          value={formData.ubicacion}
                          onChange={handleChange}
                          placeholder="Ciudad de México"
                          required
                        />
                      </Field>
                    </div>

                    <Field label="Descripción" htmlFor="descripcion">
                      <Textarea
                        id="descripcion"
                        name="descripcion"
                        rows={4}
                        value={formData.descripcion}
                        onChange={handleChange}
                        required
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      <Field label="Salario mínimo" htmlFor="salario_min" hint="En pesos mexicanos">
                        <Input
                          id="salario_min"
                          type="number"
                          name="salario_min"
                          value={formData.salario_min}
                          onChange={handleChange}
                          placeholder="30000"
                          required
                        />
                      </Field>
                      <Field label="Salario máximo" htmlFor="salario_max" hint="En pesos mexicanos">
                        <Input
                          id="salario_max"
                          type="number"
                          name="salario_max"
                          value={formData.salario_max}
                          onChange={handleChange}
                          placeholder="50000"
                          required
                        />
                      </Field>
                      <Field label="Modalidad" htmlFor="modalidad">
                        <Select id="modalidad" name="modalidad" value={formData.modalidad} onChange={handleChange} required>
                          <option value="remoto">Remoto</option>
                          <option value="presencial">Presencial</option>
                          <option value="hibrido">Híbrido</option>
                        </Select>
                      </Field>
                    </div>

                    <Field label="Tecnologías requeridas" htmlFor="tecnologias" hint="Sepáralas con comas">
                      <Input
                        id="tecnologias"
                        name="tecnologias"
                        value={formData.tecnologias}
                        onChange={handleChange}
                        placeholder="React, Node.js, Python, PostgreSQL"
                        required
                      />
                    </Field>

                    <Field label="Experiencia requerida" htmlFor="experiencia">
                      <Input
                        id="experiencia"
                        name="experiencia"
                        value={formData.experiencia}
                        onChange={handleChange}
                        placeholder="2-3 años de experiencia"
                        required
                      />
                    </Field>

                    <Field label="Otros requisitos" htmlFor="otros_requisitos" hint="Opcional">
                      <Textarea
                        id="otros_requisitos"
                        name="otros_requisitos"
                        rows={3}
                        value={formData.otros_requisitos}
                        onChange={handleChange}
                        placeholder="Inglés intermedio, disponibilidad para viajar…"
                      />
                    </Field>

                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                      <Button type="button" variant="ghost" onClick={cerrarForm}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="accent" disabled={guardando}>
                        <Check size={15} strokeWidth={2} />
                        {guardando ? 'Guardando…' : editando ? 'Actualizar vacante' : 'Crear vacante'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Listado ── */}
          {estado === 'cargando' && <SkeletonList count={3} />}

          {estado === 'error' && (
            <EmptyState
              title="No pudimos cargar tus vacantes"
              description="El servidor no respondió. Puede ser una caída momentánea o tu conexión."
              action={
                <Button variant="ghost" onClick={fetchVacantes}>
                  <RotateCcw size={14} strokeWidth={1.8} />
                  Reintentar
                </Button>
              }
            />
          )}

          {estado === 'listo' && vacantes.length === 0 && !showForm && (
            <EmptyState
              title="Todavía no has publicado vacantes"
              description="Crea la primera para empezar a recibir postulaciones de talento verificado."
              action={
                <Button variant="accent" onClick={() => setShowForm(true)}>
                  <Plus size={15} strokeWidth={1.8} />
                  Crear mi primera vacante
                </Button>
              }
            />
          )}

          {estado === 'listo' && vacantes.length > 0 && (
            <motion.ul
              variants={stagger(0.06)}
              initial="hidden"
              animate="show"
              className="flex list-none flex-col gap-3.5 p-0"
            >
              {vacantes.map((vacante) => {
                const est = estadoDe(vacante);
                const rechazada = vacante.estado_validacion === 'rechazada';
                const pendiente = vacante.estado_validacion === 'pendiente';

                return (
                  <motion.li key={vacante.id} variants={rise}>
                    <Card as="article" glass>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="text-[1.3125rem] font-demi tracking-[-0.012em] text-ink">
                            {vacante.titulo}
                          </h2>
                          <p className="mt-1 text-[0.875rem] text-muted">
                            {vacante.ubicacion} · {vacante.modalidad}
                          </p>
                          <p className="tabular mt-2.5 text-[1.03125rem] text-ink">
                            ${MXN.format(parseFloat(vacante.salario_min))} – $
                            {MXN.format(parseFloat(vacante.salario_max))} MXN
                          </p>
                        </div>
                        <Tag tono={est.tono}>{est.label}</Tag>
                      </div>

                      <p className="mt-4 line-clamp-2 max-w-[66ch] text-[0.90625rem] leading-relaxed text-ink-2">
                        {vacante.descripcion}
                      </p>

                      {/*
                        Identidad por FORMA, no por color: un ícono propio cada
                        acción. Cinco colores distintos volverían al ruido que
                        quitamos, y además fallan para quien no los distingue.
                        El violeta marca cuál es la acción principal; el rojo
                        queda solo para la destructiva, separada a la derecha.
                      */}
                      <div className="mt-5 flex flex-wrap gap-2.5 border-t border-hairline pt-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!text-accent hover:border-accent/40"
                          onClick={() => handleEdit(vacante)}
                          disabled={rechazada}
                        >
                          <Pencil size={14} strokeWidth={1.8} />
                          Editar
                        </Button>

                        {!pendiente &&
                          !rechazada &&
                          (vacante.activa ? (
                            <Button variant="ghost" size="sm" onClick={() => handleCerrar(vacante.id)}>
                              <EyeOff size={14} strokeWidth={1.8} />
                              Cerrar
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleReabrir(vacante.id)}>
                              <RotateCcw size={14} strokeWidth={1.8} />
                              Reabrir
                            </Button>
                          ))}

                        <Button variant="ghost" size="sm" onClick={() => navigate(`/vacantes/${vacante.id}`)}>
                          <ExternalLink size={14} strokeWidth={1.8} />
                          Ver
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          // El "!" no es capricho: gana a `text-ink` del ghost sin depender
                          // del orden en que Tailwind genere los colores.
                          className="ml-auto !text-danger hover:border-danger/40"
                          onClick={() => handleDelete(vacante.id)}
                        >
                          <Trash2 size={14} strokeWidth={1.8} />
                          Eliminar
                        </Button>
                      </div>
                    </Card>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
