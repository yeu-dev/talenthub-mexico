import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, CalendarDays, ArrowRight, Send, LogIn, Laptop, Code2, Briefcase, ListPlus, FileText } from '../components/icons';
import api from '../services/api';
import { showSuccess, showError } from '../utils/alerts';
import { AvisoLento, Button, clasesBoton, Card, EmptyState, Skeleton, Tag, TONO_MODALIDAD } from '../components/ui';
import Iniciales from '../components/Iniciales';
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

  // La franja está desde el primer cuadro, con la silueta del membrete y del
  // panel adentro: antes, mientras cargaba, no había franja y al llegar la
  // vacante todo brincaba hacia abajo.
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen mesh-page">
        <PageHeader
          tono="oscuro"
          familia="ficha"
          migas={[{ etiqueta: textoRegreso, to: rutaRegreso }, { etiqueta: 'Cargando vacante…' }]}
          inicio={<Skeleton className="h-14 w-14 flex-none rounded-[12px]" />}
          titulo={
            <>
              <span className="sr-only">Cargando vacante</span>
              <span aria-hidden="true" className="block h-9 w-[min(26rem,62vw)] animate-pulse rounded-ui bg-white/[0.06]" />
            </>
          }
          detalle={<Skeleton className="mt-1 h-4 w-40" />}
        />
        <div className="glass-panel-overlap mx-auto max-w-page px-6 pb-20 md:px-7">
          <div className="glass-panel edge-l p-7">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-5 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
          </div>
          <AvisoLento cargando />
        </div>
      </div>
    );
  }

  if (estado === 'error' || !vacante) {
    return (
      <div className="min-h-screen mesh-page">
        <div className="mx-auto max-w-page px-6 pb-20 pt-10 md:px-7 md:pt-12">
          <EmptyState
            title="No encontramos esta vacante"
            description="Puede que se haya despublicado o que el enlace esté mal."
            action={
              <Link to="/vacantes" className={clasesBoton({ variant: 'ghost' })}>
                <ArrowRight size={15} strokeWidth={1.8} />
                Ver todas las vacantes
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

  // Sobre el filo, el tercio de arriba del vidrio cae sobre negro: ahí `muted`
  // no llega a AA y el texto secundario sube a `ink-2`.
  const etiquetaFilo = 'text-[0.8125rem] uppercase tracking-[0.06em] text-ink-2';

  return (
    <div className="min-h-screen mesh-page">
      {/* ── Membrete: se lee como la ficha de un puesto, no como otra portada ── */}
      <PageHeader
        tono="oscuro"
        familia="ficha"
        migas={[{ etiqueta: textoRegreso, to: rutaRegreso }, { etiqueta: vacante.titulo }]}
        inicio={<Iniciales nombre={vacante.empresa_nombre} tamano={56} />}
        titulo={vacante.titulo}
        detalle={vacante.empresa_nombre}
        acciones={
          <div className="text-left sm:text-right">
            <p className="tabular text-[1.375rem] font-demi leading-tight tracking-[-0.01em] text-ink-d">
              {formatoSalario(vacante.salario_min, vacante.salario_max)}
            </p>
            <p className="text-[0.8125rem] text-muted-d">al mes</p>
          </div>
        }
      />

      {/* El resumen y la caja de postularse se montan sobre el filo de la banda:
          el degradado del vidrio es la banda negra refractada arriba. */}
      <div className="glass-panel-overlap mx-auto grid max-w-page grid-cols-1 gap-5 px-6 pb-20 md:px-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-5">
          {/* ── Resumen: dónde y cómo; el sueldo ya va en el membrete ── */}
          <div className="glass-panel edge-l p-7">
            {/* Íconos en vez de rótulos: el dato se entiende solo. El rótulo
                queda para lectores de pantalla. */}
            <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 text-body text-ink">
              <div className="flex items-center gap-2">
                <dt className="sr-only">Modalidad</dt>
                <Laptop size={17} strokeWidth={1.7} className="text-ink-2" aria-hidden="true" />
                <dd>
                  <Tag tono={TONO_MODALIDAD[vacante.modalidad] ?? 'neutro'}>{modalidad}</Tag>
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">Ubicación</dt>
                <MapPin size={17} strokeWidth={1.7} className="text-ink-2" aria-hidden="true" />
                <dd>{vacante.ubicacion}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">Publicada</dt>
                <CalendarDays size={17} strokeWidth={1.7} className="text-ink-2" aria-hidden="true" />
                <dd className="tabular">{fecha}</dd>
              </div>
            </dl>
          </div>

          {/* ── Requisitos ── */}
          {hayRequisitos && (
            <Card glass className="p-7">
              <h2 className="text-h3 font-demi text-ink">Requisitos</h2>
              <div className="mt-5 flex flex-col gap-6">
                {lenguajes.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-[0.9375rem] font-mid text-ink">
                      <Code2 size={16} strokeWidth={1.7} className="text-accent-on-dark" aria-hidden="true" />
                      Tecnologías
                    </h3>
                    <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                      {lenguajes.map((tech) => (
                        <li key={tech} className="rounded-pill bg-white/[0.06] px-3 py-1 text-[0.875rem] text-ink-2">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {experiencia && (
                  <div>
                    <h3 className="flex items-center gap-2 text-[0.9375rem] font-mid text-ink">
                      <Briefcase size={16} strokeWidth={1.7} className="text-accent-on-dark" aria-hidden="true" />
                      Experiencia
                    </h3>
                    <p className="mt-2 max-w-[68ch] text-body leading-relaxed text-ink-2">{experiencia}</p>
                  </div>
                )}
                {otros && (
                  <div>
                    <h3 className="flex items-center gap-2 text-[0.9375rem] font-mid text-ink">
                      <ListPlus size={16} strokeWidth={1.7} className="text-accent-on-dark" aria-hidden="true" />
                      Además
                    </h3>
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
          <Card glass className="p-7">
            <h2 className="text-h3 font-demi text-ink">Descripción del puesto</h2>
            <p className="mt-4 max-w-[68ch] whitespace-pre-line text-[1.0625rem] leading-relaxed text-ink-2">
              {vacante.descripcion}
            </p>
          </Card>
        </div>

        {/* ── Acción según rol. En escritorio se queda a la vista al bajar. ── */}
        <aside className="lg:sticky lg:top-[calc(var(--nav-flow)+24px)]">
          {userTipo === 'aspirante' ? (
            <div className="glass-panel edge-l p-6">
              <p className="tabular text-[1.125rem] font-demi text-ink">
                {formatoSalario(vacante.salario_min, vacante.salario_max)}
              </p>
              <p className="mt-0.5 text-[0.875rem] text-ink-2">
                {vacante.empresa_nombre} · {modalidad}
              </p>
              {/* El botón principal de la pantalla: destacado (borde de luz y chispas). */}
              <Button destacado className="mt-5 w-full" onClick={handleAplicar} disabled={enviando}>
                <Send size={15} strokeWidth={1.8} />
                {enviando ? 'Enviando…' : 'Postularme'}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.8125rem] text-muted">
                <FileText size={14} strokeWidth={1.7} aria-hidden="true" />
                Se envía tu CV guardado
              </p>
            </div>
          ) : userTipo === 'empresa' ? (
            <div className="glass-panel edge-l p-6">
              <p className="text-body text-ink">Esta es una vacante publicada en la plataforma.</p>
              <p className="mt-2 text-[0.9375rem] text-ink-2">
                Puedes gestionar las tuyas desde{' '}
                <Link to="/dashboard" className="text-accent-on-dark hover:underline">
                  Mis vacantes
                </Link>
                .
              </p>
            </div>
          ) : userTipo === 'validador' ? (
            <div className="glass-panel edge-l p-6">
              <p className={etiquetaFilo}>Vista de auditoría</p>
              <p className="mt-2 text-body text-ink">
                Estás viendo esta vacante como parte de tu revisión de calidad.
              </p>
            </div>
          ) : (
            <div className="glass-panel edge-l p-6">
              <p className="text-body font-mid text-ink">¿Te interesa?</p>
              <Link to="/login" className={clasesBoton({ className: 'mt-5 w-full' })}>
                <LogIn size={15} strokeWidth={1.8} />
                Iniciar sesión
              </Link>
              <Link to="/register" className="mt-3 block text-center text-[0.875rem] text-accent-on-dark hover:underline">
                Crear cuenta
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default VacanteDetalle;
