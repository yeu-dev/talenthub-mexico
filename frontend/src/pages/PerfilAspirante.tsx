import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Upload, Check, Save } from 'lucide-react';
import api, { getMediaUrl } from '../services/api';
import { showSuccess, showError } from '../utils/alerts';
import { Button, Card, Field, Input, Textarea, Skeleton } from '../components/ui';
import { prepararFoto, validarCv } from '../lib/archivos';
import { cx } from '../lib/cx';
import { mensajeDeError } from '../lib/errores';
import { rise, riseGlass, stagger } from '../lib/motion';

interface FormState {
  username: string;
  email: string;
  telefono: string;
  profesion: string;
  experiencia_resumen: string;
  habilidades: string;
}

const VACIO: FormState = {
  username: '',
  email: '',
  telefono: '',
  profesion: '',
  experiencia_resumen: '',
  habilidades: '',
};

const PerfilAspirante: React.FC = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState<FormState>(VACIO);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [cvUrlActual, setCvUrlActual] = useState('');
  const [fotoUrlActual, setFotoUrlActual] = useState('');
  const [fotoRota, setFotoRota] = useState(false);

  const cargarPerfil = useCallback(async () => {
    try {
      const [perfilResponse, userResponse] = await Promise.all([
        api.get('/perfil/aspirante/'),
        api.get('/user-info/'),
      ]);

      const data = perfilResponse.data;
      const userData = userResponse.data;

      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        telefono: userData.telefono || '',
        profesion: data.profesion || '',
        experiencia_resumen: data.experiencia_resumen || '',
        habilidades: Array.isArray(data.habilidades)
          ? data.habilidades.join(', ')
          : data.habilidades || '',
      });

      setCvUrlActual(data.cv_url || '');
      setFotoUrlActual(data.foto_url || '');
      setFotoRota(false);
    } catch (err: any) {
      // Un 404 solo significa "perfil aún sin crear": no es un error que reportar.
      if (err.response?.status !== 404) {
        showError('No pudimos cargar los datos de tu perfil.');
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const archivo = input.files?.[0];
    // Se vacia para que elegir el mismo archivo otra vez vuelva a disparar onChange.
    input.value = '';
    if (!archivo) return;

    if (input.name === 'cv') {
      const error = validarCv(archivo);
      if (error) {
        showError(error, 'Ese CV no se puede subir');
        return;
      }
      setCvFile(archivo);
      return;
    }

    if (input.name === 'foto') {
      const resultado = await prepararFoto(archivo);
      if ('error' in resultado) {
        showError(resultado.error, 'Esa foto no se puede subir');
        return;
      }
      setFotoFile(resultado.foto);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const data = new FormData();
    (Object.keys(formData) as Array<keyof FormState>).forEach((key) => {
      data.append(key, formData[key]);
    });
    if (cvFile) data.append('cv', cvFile);
    if (fotoFile) data.append('foto', fotoFile);

    try {
      await api.post('/perfil/aspirante/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      localStorage.setItem('user_username', formData.username);
      showSuccess('Tus cambios ya están guardados.', 'Perfil actualizado');
      setCvFile(null);
      setFotoFile(null);
      cargarPerfil();
    } catch (err: unknown) {
      showError(mensajeDeError(err, 'Revisa tus datos e intenta de nuevo.'), 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen mesh-page">
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-10 md:px-7 md:pt-12">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-pill" />
            <div className="flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="mt-2.5 h-4 w-32" />
            </div>
          </div>
          <Skeleton className="mt-10 h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }

  const inicial = formData.username?.charAt(0).toUpperCase() || '?';
  const mostrarFoto = Boolean(fotoUrlActual) && !fotoRota;

  /** Zona de carga: borde dashed, y colapsa a una fila cuando ya hay archivo. */
  const zonaArchivo = (
    nombre: 'cv' | 'foto',
    etiqueta: string,
    accept: string,
    ayuda: string,
    seleccionado: File | null,
    yaExiste: boolean
  ) => (
    <div>
      <p className="mb-2 text-caption text-ink-2">{etiqueta}</p>
      <label
        htmlFor={`file-${nombre}`}
        className={cx(
          'flex cursor-pointer flex-col items-center rounded-ui border border-dashed px-5 py-7 text-center',
          'transition-colors duration-200',
          seleccionado
            ? 'border-accent bg-accent/[0.06]'
            : 'border-hairline hover:border-hairline-strong hover:bg-black/[0.015]'
        )}
      >
        {seleccionado ? (
          <>
            <Check size={18} strokeWidth={1.8} className="mb-2 text-accent" />
            <span className="max-w-full truncate text-[0.875rem] text-ink">{seleccionado.name}</span>
            <span className="mt-1 text-[0.8125rem] text-muted">Se subirá al guardar</span>
          </>
        ) : (
          <>
            <Upload size={18} strokeWidth={1.6} className="mb-2 text-muted" />
            <span className="text-[0.875rem] text-ink-2">
              {yaExiste ? 'Reemplazar archivo' : 'Elegir archivo'}
            </span>
            <span className="mt-1 text-[0.8125rem] text-muted">{ayuda}</span>
          </>
        )}
      </label>
      <input
        id={`file-${nombre}`}
        type="file"
        name={nombre}
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
      />
    </div>
  );

  return (
    <div className="min-h-screen mesh-page">
      {/* ── Banda oscura ── */}
      <header className="relative isolate mt-[calc(var(--nav-flow)*-1)] overflow-hidden bg-night pb-32 pt-[140px] text-ink-d">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-52 left-1/2 -z-10 h-[560px] w-[1000px] -translate-x-[58%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.15),transparent_74%)] blur-[6px]"
        />
        <div className="relative mx-auto max-w-4xl px-6 md:px-7">
          <p className="mb-4 text-caption uppercase tracking-[0.06em] text-muted-d">Tu cuenta</p>
          <h1 className="font-heading text-[clamp(2rem,4.4vw,3rem)] font-mid leading-none tracking-[-0.035em]">
            Mi perfil
          </h1>
        </div>
      </header>

      <motion.div
        variants={stagger(0.07)}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl px-6 pb-20 md:px-7"
      >
        {/* ── Identidad en glass, a caballo entre la banda y el cuerpo.
             El panel existe porque es quién eres, no un adorno. ── */}
        <motion.header
          variants={riseGlass}
          className="glass-panel glass-panel-overlap edge-l mb-8 flex flex-wrap items-center gap-6 p-7"
        >
          <div className="h-20 w-20 flex-none overflow-hidden rounded-pill border border-hairline bg-surface">
            {mostrarFoto ? (
              <img
                src={getMediaUrl(fotoUrlActual) || ''}
                alt=""
                className="h-full w-full object-cover"
                // Sin servicio externo de avatares: si la imagen falla,
                // caemos a la inicial, que ya existe y no filtra el nombre.
                onError={() => setFotoRota(true)}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[1.75rem] font-mid text-ink-2">
                {inicial}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-h2 font-demi tracking-[-0.015em] text-ink">
              {formData.username || 'Tu perfil'}
            </h1>
            <p className="mt-1.5 text-body text-ink-2">
              {formData.profesion || 'Aspirante en TalentHub'}
            </p>
          </div>

          {cvUrlActual && (
            <a href={getMediaUrl(cvUrlActual) || '#'} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <FileText size={15} strokeWidth={1.7} />
                Ver mi CV
              </Button>
            </a>
          )}
        </motion.header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ── Cuenta ── */}
          <motion.div variants={rise}>
            <Card>
              <h2 className="mb-6 text-h3 font-demi text-ink">Información de cuenta</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Field label="Nombre de usuario" htmlFor="username">
                  <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
                </Field>
                <Field label="Correo electrónico" htmlFor="email">
                  <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                </Field>
                <Field label="Teléfono" htmlFor="telefono">
                  <Input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="2221234567"
                  />
                </Field>
              </div>
            </Card>
          </motion.div>

          {/* ── Perfil profesional ── */}
          <motion.div variants={rise}>
            <Card>
              <h2 className="mb-6 text-h3 font-demi text-ink">Perfil profesional</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Profesión o especialidad" htmlFor="profesion">
                  <Input id="profesion" name="profesion" value={formData.profesion} onChange={handleChange} required />
                </Field>
                <Field label="Habilidades" htmlFor="habilidades" hint="Sepáralas con comas">
                  <Input
                    id="habilidades"
                    name="habilidades"
                    value={formData.habilidades}
                    onChange={handleChange}
                    placeholder="React, Python, AWS, Docker"
                  />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Resumen de experiencia" htmlFor="experiencia_resumen">
                  <Textarea
                    id="experiencia_resumen"
                    name="experiencia_resumen"
                    rows={4}
                    value={formData.experiencia_resumen}
                    onChange={handleChange}
                    placeholder="Describe brevemente tu trayectoria y tus logros…"
                  />
                </Field>
              </div>
            </Card>
          </motion.div>

          {/* ── Archivos ── */}
          <motion.div variants={rise}>
            <Card>
              <h2 className="mb-6 text-h3 font-demi text-ink">Documentos</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {zonaArchivo('foto', 'Foto de perfil', 'image/jpeg,image/png', 'JPG o PNG; si pesa más de 2 MB se reduce sola', fotoFile, Boolean(fotoUrlActual))}
                {zonaArchivo('cv', 'Currículum', '.pdf', 'PDF, máximo 5 MB', cvFile, Boolean(cvUrlActual))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={rise} className="flex flex-wrap justify-end gap-3">
            {/* Antes iba a /dashboard, que rebota a quien no sea empresa */}
            <Button type="button" variant="ghost" onClick={() => navigate('/vacantes')}>
              Cancelar
            </Button>
            <Button type="submit" variant="accent" disabled={guardando}>
              <Save size={15} strokeWidth={1.8} />
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default PerfilAspirante;
