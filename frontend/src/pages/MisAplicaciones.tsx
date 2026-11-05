import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowRight, RotateCcw } from '../components/icons';
import api from '../services/api';
import { showError } from '../utils/alerts';
import { Button, Card, EmptyState, ProcessTrack, SkeletonList } from '../components/ui';
import { stagger, subeResorte } from '../lib/motion';
import PageHeader from '../components/PageHeader';
import { useTitulo } from '../hooks/useTitulo';
import { migasDeCuenta, pestanasDeCuenta } from '../lib/cuenta';

interface Aplicacion {
  id: number;
  vacante_titulo: string;
  estado: string;
  fecha_aplicacion: string;
  vacante: number;
}

/** El orden importa: es el avance real del proceso, no un alfabético. */
const RESUMEN: Array<{ estado: string; label: string }> = [
  { estado: 'pendiente', label: 'Enviadas' },
  { estado: 'revisado', label: 'En revisión' },
  { estado: 'aceptado', label: 'Aceptadas' },
  { estado: 'rechazado', label: 'Rechazadas' },
];

const MisAplicaciones: React.FC = () => {
  useTitulo('Mis postulaciones');
  const navigate = useNavigate();
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');

  const fetchAplicaciones = useCallback(async () => {
    setEstado('cargando');
    try {
      const response = await api.get('/aplicaciones/');
      setAplicaciones(response.data);
      setEstado('listo');
    } catch (error) {
      console.error('Error:', error);
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userTipo = localStorage.getItem('user_tipo');

    // Antes esto usaba alert() del navegador, que bloquea el hilo y se ve
    // como un error del sistema. Ahora es una notificación del propio sitio.
    if (!token) {
      showError('Inicia sesión para ver tus postulaciones.', 'Falta un paso');
      navigate('/login');
      return;
    }
    if (userTipo !== 'aspirante') {
      showError('Esta sección es solo para aspirantes.', 'Sin acceso');
      navigate('/dashboard');
      return;
    }

    fetchAplicaciones();
  }, [navigate, fetchAplicaciones]);

  const conteos = useMemo(
    () =>
      RESUMEN.map(({ estado: e, label }) => ({
        label,
        total: aplicaciones.filter((a) => a.estado === e).length,
      })),
    [aplicaciones]
  );

  return (
    <div className="min-h-screen mesh-page">
      <PageHeader
        tono="oscuro"
        migas={migasDeCuenta('Mis postulaciones')}
        titulo="Mis postulaciones"
        pestanas={pestanasDeCuenta(localStorage.getItem('user_tipo'))}
        detalle={
          estado === 'listo'
            ? aplicaciones.length === 1
              ? '1 postulación enviada'
              : `${aplicaciones.length} postulaciones enviadas`
            : 'Cargando tu historial…'
        }
      />

      <div className="mx-auto max-w-page px-6 pb-20 md:px-7">
        {/* ── Resumen: responde la pregunta real, ¿en qué voy? ── */}
        {estado === 'listo' && aplicaciones.length > 0 && (
          <div className="glass-panel glass-panel-overlap-sm edge-l mb-8 grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
            {conteos.map(({ label, total }) => (
              <div key={label} className="px-6 py-7">
                <p className="tabular text-[1.75rem] font-mid leading-none tracking-[-0.03em] text-ink">
                  {total}
                </p>
                <p className="mt-2 text-[0.8125rem] text-muted">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className={estado === 'listo' && aplicaciones.length > 0 ? '' : 'glass-panel glass-panel-overlap-sm edge-l p-2'}>
          {estado === 'cargando' && <SkeletonList count={3} />}

          {estado === 'error' && (
            <EmptyState
              title="No pudimos cargar tus postulaciones"
              description="El servidor no respondió. Puede ser una caída momentánea o tu conexión."
              action={
                <Button variant="ghost" onClick={fetchAplicaciones}>
                  <RotateCcw size={14} strokeWidth={1.8} />
                  Reintentar
                </Button>
              }
            />
          )}

          {estado === 'listo' && aplicaciones.length === 0 && (
            <EmptyState
              title="Todavía no te has postulado"
              description="Explora las vacantes abiertas y postúlate a las que encajen con tu perfil."
              action={
                <Link to="/vacantes">
                  <Button variant="accent">
                    <ArrowRight size={15} strokeWidth={1.8} />
                    Explorar vacantes
                  </Button>
                </Link>
              }
            />
          )}

          {estado === 'listo' && aplicaciones.length > 0 && (
            <motion.ul
              variants={stagger(0.06)}
              initial="hidden"
              animate="show"
              className="flex list-none flex-col gap-3.5 p-0"
            >
              {aplicaciones.map((aplicacion) => (
                <motion.li key={aplicacion.id} variants={subeResorte}>
                  <Card as="article" glass interactive>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-[1.3125rem] font-demi tracking-[-0.012em] text-ink">
                          {aplicacion.vacante_titulo}
                        </h2>
                        <p className="tabular mt-1.5 text-[0.875rem] text-muted">
                          Enviada el{' '}
                          {new Date(aplicacion.fecha_aplicacion).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <Link to={`/vacantes/${aplicacion.vacante}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink size={14} strokeWidth={1.8} />
                          Ver vacante
                        </Button>
                      </Link>
                    </div>

                    {/* El track dice en qué punto del proceso va, no solo la etiqueta */}
                    <div className="mt-5 border-t border-hairline pt-5">
                      <ProcessTrack estado={aplicacion.estado} />
                    </div>
                  </Card>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MisAplicaciones;
