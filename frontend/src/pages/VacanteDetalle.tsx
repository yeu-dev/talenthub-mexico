import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, CalendarDays, ArrowRight, Send, LogIn } from 'lucide-react';
import api from '../services/api';
import { showSuccess, showError } from '../utils/alerts';
import { Button, Card, EmptyState, SkeletonCard, Tag, TONO_MODALIDAD } from '../components/ui';
import PageHeader from '../components/PageHeader';
import { useTitulo } from '../hooks/useTitulo';
import { formatoSalario } from '../lib/vacantes';

interface Vacante {
  id: number;
  titulo: string;
  empresa_nombre: string;
  descripcion: string;
  /** Dashboard guarda `{lenguajes, experiencia, otros}`; las viejas pueden traer texto. */
  requisitos: any;
  salario_min: string;
  salario_max: string;
  modalidad: string;
  ubicacion: string;
  fecha_publicacion: string;
  activa: boolean;
}

/** La ruta de regreso depende del rol: cada uno llegó aquí desde otro lado. */
const REGRESO: Record<string, { ruta: string; texto: string }> = {
  empresa: { ruta: '/dashboard', texto: 'Mis vacantes' },
  validador: { ruta: '/validador', texto: 'Validación' },
};

/** "Nebula Labs" → "NL": el membrete de la empresa en el encabezado. */
const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '·';

const VacanteDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [enviando, setEnviando] = useState(false);
  useTitulo(vacante?.titulo);

  const userTipo = localStorage.getItem('user_tipo') ?? '';
  const { ruta: rutaRegreso, texto: textoRegreso } =
    REGRESO[userTipo] ?? { ruta: '/vacantes', texto: 'Vacantes' };

  const fetchVacante = useCallback(async () => {
    setEstado('cargando');
    try {
      const response = await api.get(`/vacantes/${id}/`);
      setVacante(response.data);
      setEstado('listo');
    } catch (error) {
      console.error('Error:', error);
      setEstado('error');
    }
  }, [id]);

  useEffect(() => {
    fetchVacante();
  }, [fetchVacante]);

  const handleAplicar = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');

    if (!token || !userId) {
      showError('Inicia sesión para postularte a esta vacante.', 'Falta un paso');
      navigate('/login');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/aplicaciones/', { vacante: id, usuario: userId, estado: 'pendiente' });
      showSuccess('Tu CV guardado se adjuntó automáticamente.', 'Postulación enviada');
      navigate('/mis-aplicaciones');
    } catch (error: any) {
      const errorData = error.response?.data;

      if (errorData?.error === 'CV_MISSING') {
        showError('Sube tu CV en Mi perfil antes de postularte.', 'No tienes un CV guardado');
        navigate('/mi-perfil');
      } else if (error.response?.status === 400) {
        showError(errorData?.detail || 'Ya te postulaste a esta vacante o faltan datos.');
      } else {
        showError('No se pudo enviar tu postulación. Inténtalo de nuevo.');
      }
      setEnviando(false);
    }
  };

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-surface">
        <div className="mx-auto max-w-page px-6 pb-20 pt-10 md:px-7 md:pt-12">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (estado === 'error' || !vacante) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="mx-auto max-w-page px-6 pb-20 pt-10 md:px-7 md:pt-12">
          <EmptyState
            title="No encontramos esta vacante"
            description="Puede que se haya despublicado o que el enlace esté mal."
            action={
              <Link to="/vacantes">
                <Button variant="ghost">
                  <ArrowRight size={15} strokeWidth={1.8} />
                  Ver todas las vacantes
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const requisitos = vacante.requisitos;
  const esObjeto = requisitos && typeof requisitos === 'object';
  const lenguajes: string[] = esObjeto && Array.isArray(requisitos.lenguajes) ? requisitos.lenguajes : [];
  const experiencia: string = esObjeto && typeof requisitos.experiencia === 'string' ? requisitos.experiencia : '';
  // `otros` lo guarda el dashboard de empresa y antes no se mostraba en ningún lado.
  const otros: string = esObjeto && typeof requisitos.otros === 'string' ? requisitos.otros : '';
  const textoLibre: string = !esObjeto && typeof requisitos === 'string' ? requisitos : '';
  const hayRequisitos = lenguajes.length > 0 || experiencia || otros || textoLibre;

  const modalidad = vacante.modalidad.charAt(0).toUpperCase() + vacante.modalidad.slice(1);
  const fecha = new Date(vacante.fecha_publicacion).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const etiqueta = 'text-[0.8125rem] uppercase tracking-[0.06em] text-muted';

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Membrete: se lee como la ficha de un puesto, no como otra portada ── */}
      <PageHeader
        migas={[{ etiqueta: textoRegreso, to: rutaRegreso }, { etiqueta: vacante.titulo }]}
        inicio={
          <span
            aria-hidden="true"
            className="flex h-14 w-14 flex-none items-center justify-center rounded-[14px] bg-accent/[0.08] text-[1.125rem] font-demi text-accent"
          >
            {iniciales(vacante.empresa_nombre)}
          </span>
        }
        titulo={vacante.titulo}
        detalle={vacante.empresa_nombre}
        acciones={
          <div className="text-left sm:text-right">
            <p className="tabular text-[1.375rem] font-demi leading-tight tracking-[-0.01em] text-ink">
              {formatoSalario(vacante.salario_min, vacante.salario_max)}
            </p>
            <p className="text-[0.8125rem] text-muted">al mes</p>
          </div>
        }
      />

      <div className="mx-auto grid max-w-page grid-cols-1 gap-5 px-6 pb-20 pt-6 md:px-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-5">
          {/* ── Resumen: dónde y cómo; el sueldo ya va en el membrete ── */}
          <Card className="p-7">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className={etiqueta}>Modalidad</dt>
                <dd className="mt-1.5 flex items-center gap-2 text-body text-ink">
                  <Tag tono={TONO_MODALIDAD[vacante.modalidad] ?? 'neutro'}>{modalidad}</Tag>
                </dd>
              </div>
              <div>
                <dt className={etiqueta}>Ubicación</dt>
                <dd className="mt-1.5 flex items-center gap-2 text-body text-ink">
                  <MapPin size={15} strokeWidth={1.7} className="text-muted" aria-hidden="true" />
                  {vacante.ubicacion}
                </dd>
              </div>
              <div>
                <dt className={etiqueta}>Publicada</dt>
                <dd className="tabular mt-1.5 flex items-center gap-2 text-body text-ink">
                  <CalendarDays size={15} strokeWidth={1.7} className="text-muted" aria-hidden="true" />
                  {fecha}
                </dd>
              </div>
            </dl>
          </Card>

          {/* ── Requisitos ── */}
          {hayRequisitos && (
            <Card className="p-7">
              <h2 className="text-h3 font-demi text-ink">Requisitos</h2>
              <div className="mt-5 flex flex-col gap-6">
                {lenguajes.length > 0 && (
                  <div>
                    <h3 className={etiqueta}>Tecnologías</h3>
                    <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                      {lenguajes.map((tech) => (
                        <li key={tech} className="rounded-pill bg-surface px-3 py-1 text-[0.875rem] text-ink-2">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {experiencia && (
                  <div>
                    <h3 className={etiqueta}>Experiencia</h3>
                    <p className="mt-2 max-w-[68ch] text-body leading-relaxed text-ink-2">{experiencia}</p>
                  </div>
                )}
                {otros && (
                  <div>
                    <h3 className={etiqueta}>Además</h3>
                    <p className="mt-2 max-w-[68ch] whitespace-pre-line text-body leading-relaxed text-ink-2">{otros}</p>
                  </div>
                )}
                {textoLibre && (
                  <p className="max-w-[68ch] whitespace-pre-line text-body leading-relaxed text-ink-2">{textoLibre}</p>
                )}
              </div>
            </Card>
          )}

          {/* ── Descripción ── */}
          <Card className="p-7">
            <h2 className="text-h3 font-demi text-ink">Descripción del puesto</h2>
            <p className="mt-4 max-w-[68ch] whitespace-pre-line text-[1.0625rem] leading-relaxed text-ink-2">
              {vacante.descripcion}
            </p>
          </Card>
        </div>

        {/* ── Acción según rol. En escritorio se queda a la vista al bajar. ── */}
        <aside className="lg:sticky lg:top-[calc(var(--nav-flow)+24px)]">
          {userTipo === 'aspirante' ? (
            <Card className="p-6">
              <p className="tabular text-[1.125rem] font-demi text-ink">
                {formatoSalario(vacante.salario_min, vacante.salario_max)}
              </p>
              <p className="mt-0.5 text-[0.875rem] text-muted">
                {vacante.empresa_nombre} · {modalidad}
              </p>
              <Button className="mt-5 w-full" onClick={handleAplicar} disabled={enviando}>
                <Send size={15} strokeWidth={1.8} />
                {enviando ? 'Enviando…' : 'Postularme'}
              </Button>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted">
                Tu perfil y tu CV guardado se envían a {vacante.empresa_nombre}.
              </p>
            </Card>
          ) : userTipo === 'empresa' ? (
            <Card className="p-6">
              <p className="text-body text-ink">Esta es una vacante publicada en la plataforma.</p>
              <p className="mt-2 text-[0.9375rem] text-ink-2">
                Puedes gestionar las tuyas desde{' '}
                <Link to="/dashboard" className="text-accent hover:underline">
                  Mis vacantes
                </Link>
                .
              </p>
            </Card>
          ) : userTipo === 'validador' ? (
            <Card className="p-6">
              <p className={etiqueta}>Vista de auditoría</p>
              <p className="mt-2 text-body text-ink">
                Estás viendo esta vacante como parte de tu revisión de calidad.
              </p>
            </Card>
          ) : (
            <Card className="p-6">
              <p className="text-body text-ink">¿Te interesa?</p>
              <p className="mt-1 text-[0.9375rem] text-ink-2">Inicia sesión o crea tu cuenta para postularte.</p>
              <Link to="/login" className="mt-5 block">
                <Button className="w-full">
                  <LogIn size={15} strokeWidth={1.8} />
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/register" className="mt-3 block text-center text-[0.875rem] text-accent hover:underline">
                Crear cuenta
              </Link>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};

export default VacanteDetalle;
