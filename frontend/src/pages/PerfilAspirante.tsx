import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, ExternalLink, FileText, Pencil, RotateCcw, Save, Trash2, Upload } from '../components/icons';
import api, { getMediaUrl } from '../services/api';
import { showConfirm, showError, showSuccess } from '../utils/alerts';
import { AvisoLento, BotonMantener, Button, Card, Field, Input, Skeleton, Tag, Textarea, clasesBoton } from '../components/ui';
import EntradaChips from '../components/EntradaChips';
import { prepararFoto, validarCv } from '../lib/archivos';
import { mensajeDeError } from '../lib/errores';
import { rise, stagger } from '../lib/motion';
import PageHeader from '../components/PageHeader';
import { useTitulo } from '../hooks/useTitulo';
import { migasDeCuenta } from '../lib/cuenta';
import { avisarFotoCuenta } from '../lib/fotoCuenta';

/**
 * Mi perfil. Antes era un solo formulario con un botón al final: no se veía
 * qué CV o qué foto había, no se podía quitar nada, una foto nueva no se veía
 * hasta guardar y cambiar el teléfono reenviaba todo.
 *
 * Ahora cada bloque se guarda solo:
 * - la foto, desde el avatar (con vista previa al momento);
 * - "Información de cuenta" y "Perfil profesional", en modo lectura con un
 *   lápiz para editar, con su Guardar y su Cancelar;
 * - el CV, en una fila que dice cuál tienes, con Ver, Cambiar y Quitar.
 *
 * El backend (`mi_perfil_aspirante`) es una actualización parcial: cada bloque
 * manda solo sus campos. Si salir de la página dejaría cambios sin guardar,
 * el navegador lo pregunta (`beforeunload`).
 */

interface Cuenta {
  username: string;
  email: string;
  telefono: string;
}

interface Profesional {
  profesion: string;
  experiencia_resumen: string;
  habilidades: string[];
}

type Errores = Record<string, string>;

const CUENTA_VACIA: Cuenta = { username: '', email: '', telefono: '' };
const PROFESIONAL_VACIO: Profesional = { profesion: '', experiencia_resumen: '', habilidades: [] };

/** "cvs/Mi%20CV_x7Ab2.pdf" → "Mi CV_x7Ab2.pdf". */
const nombreDeArchivo = (ruta: string) => {
  const base = ruta.split('/').pop() || ruta;
  try {
    return decodeURIComponent(base);
  } catch {
    return base;
  }
};

/** Los errores por campo que manda DRF ({campo: ['mensaje']}), como texto. */
const erroresDeCampo = (err: unknown): Errores => {
  const datos = (err as { response?: { data?: unknown } })?.response?.data;
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return {};
  const salida: Errores = {};
  Object.entries(datos as Record<string, unknown>).forEach(([campo, valor]) => {
    const texto = Array.isArray(valor) ? valor[0] : valor;
    if (typeof texto === 'string') salida[campo] = texto;
  });
  return salida;
};

const habilidadesDe = (valor: unknown): string[] => {
  if (Array.isArray(valor)) return valor.map(String).map((h) => h.trim()).filter(Boolean);
  if (typeof valor === 'string') return valor.split(',').map((h) => h.trim()).filter(Boolean);
  return [];
};

const igual = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

/** El encabezado de cada bloque: título, "Cambios sin guardar" y el lápiz. */
const CabezaBloque: React.FC<{
  titulo: string;
  editando: boolean;
  sucio: boolean;
  onEditar?: () => void;
}> = ({ titulo, editando, sucio, onEditar }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="text-h3 font-demi text-ink">{titulo}</h2>
      {sucio && <Tag tono="curso">Cambios sin guardar</Tag>}
    </div>
    {!editando && onEditar && (
      <Button variant="ghost" size="sm" onClick={onEditar} aria-label={`Editar ${titulo.toLowerCase()}`}>
        <Pencil size={14} strokeWidth={1.8} />
        Editar
      </Button>
    )}
  </div>
);

/** Un dato en modo lectura. */
const Dato: React.FC<{ etiqueta: string; children: React.ReactNode }> = ({ etiqueta, children }) => (
  <div>
    <dt className="text-caption text-muted">{etiqueta}</dt>
    <dd className="mt-1.5 break-words text-body text-ink">{children}</dd>
  </div>
);

const Vacio: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="text-muted">{children}</span>;

const PerfilAspirante: React.FC = () => {
  useTitulo('Mi perfil');
  const [cargando, setCargando] = useState(true);

  // Lo que está guardado en el servidor.
  const [cuenta, setCuenta] = useState<Cuenta>(CUENTA_VACIA);
  const [profesional, setProfesional] = useState<Profesional>(PROFESIONAL_VACIO);
  const [fotoUrl, setFotoUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [cvNombre, setCvNombre] = useState('');
  const [completitud, setCompletitud] = useState<number | null>(null);

  // Borradores de cada bloque mientras se edita.
  const [editCuenta, setEditCuenta] = useState<Cuenta | null>(null);
  const [editProfesional, setEditProfesional] = useState<Profesional | null>(null);
  const [errores, setErrores] = useState<Errores>({});

  // Archivos pendientes.
  const [fotoNueva, setFotoNueva] = useState<File | null>(null);
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [cvNuevo, setCvNuevo] = useState<File | null>(null);
  const [quitarCv, setQuitarCv] = useState(false);
  const [fotoRota, setFotoRota] = useState(false);

  const [guardando, setGuardando] = useState<'' | 'cuenta' | 'profesional' | 'foto' | 'cv'>('');
  const [progresoCv, setProgresoCv] = useState<number | null>(null);

  const entradaFoto = useRef<HTMLInputElement>(null);
  const entradaCv = useRef<HTMLInputElement>(null);

  const cargarPerfil = useCallback(async () => {
    try {
      const [perfilResponse, userResponse] = await Promise.all([api.get('/perfil/aspirante/'), api.get('/user-info/')]);
      const data = perfilResponse.data;
      const userData = userResponse.data;

      setCuenta({ username: userData.username || '', email: userData.email || '', telefono: userData.telefono || '' });
      setProfesional({
        profesion: data.profesion || '',
        experiencia_resumen: data.experiencia_resumen || '',
        habilidades: habilidadesDe(data.habilidades),
      });
      setFotoUrl(data.foto_url || '');
      setCvUrl(data.cv_url || '');
      setCvNombre(data.cv ? nombreDeArchivo(String(data.cv)) : '');
      setCompletitud(typeof data.completitud === 'number' ? data.completitud : null);
      setFotoRota(false);
      // El avatar de la barra usa la misma foto: se entera aquí, al abrir el
      // perfil y después de cada guardado, sin recargar la página.
      avisarFotoCuenta(data.foto_url || null);
    } catch (err: any) {
      // Un 404 solo significa "perfil aún sin crear": no es un error que reportar.
      if (err.response?.status !== 404) showError('No pudimos cargar los datos de tu perfil.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // La vista previa de la foto nueva, y su limpieza.
  const fotoPrevia = useMemo(() => (fotoNueva ? URL.createObjectURL(fotoNueva) : null), [fotoNueva]);
  useEffect(() => () => {
    if (fotoPrevia) URL.revokeObjectURL(fotoPrevia);
  }, [fotoPrevia]);

  const cuentaSucia = editCuenta !== null && !igual(editCuenta, cuenta);
  const profesionalSucio = editProfesional !== null && !igual(editProfesional, profesional);
  const fotoPendiente = Boolean(fotoNueva) || quitarFoto;
  const cvPendiente = Boolean(cvNuevo) || quitarCv;
  const hayPendientes = cuentaSucia || profesionalSucio || fotoPendiente || cvPendiente;

  // Salir de la página con cambios pendientes: el navegador pregunta.
  useEffect(() => {
    if (!hayPendientes) return;
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [hayPendientes]);

  /** Manda un bloque. `datos` lleva solo los campos de ese bloque. */
  const guardar = async (
    bloque: 'cuenta' | 'profesional' | 'foto' | 'cv',
    datos: FormData,
    mensaje: string
  ): Promise<boolean> => {
    setGuardando(bloque);
    setErrores({});
    try {
      await api.post('/perfil/aspirante/', datos, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress:
          bloque === 'cv'
            ? (e) => setProgresoCv(e.total ? Math.round((e.loaded / e.total) * 100) : null)
            : undefined,
      });
      showSuccess(mensaje, 'Perfil actualizado');
      await cargarPerfil();
      return true;
    } catch (err) {
      const deCampo = erroresDeCampo(err);
      setErrores(deCampo);
      if (Object.keys(deCampo).length === 0 || bloque === 'foto' || bloque === 'cv') {
        showError(mensajeDeError(err, 'Revisa tus datos e intenta de nuevo.'), 'No se pudo guardar');
      }
      return false;
    } finally {
      setGuardando('');
      setProgresoCv(null);
    }
  };

  const guardarCuenta = async () => {
    if (!editCuenta) return;
    const datos = new FormData();
    datos.append('username', editCuenta.username.trim());
    datos.append('email', editCuenta.email.trim());
    datos.append('telefono', editCuenta.telefono.trim());
    if (await guardar('cuenta', datos, 'Tus datos de cuenta ya están guardados.')) {
      localStorage.setItem('user_username', editCuenta.username.trim());
      setEditCuenta(null);
    }
  };

  const guardarProfesional = async () => {
    if (!editProfesional) return;
    const datos = new FormData();
    datos.append('profesion', editProfesional.profesion.trim());
    datos.append('experiencia_resumen', editProfesional.experiencia_resumen.trim());
    datos.append('habilidades', JSON.stringify(editProfesional.habilidades));
    if (await guardar('profesional', datos, 'Tu perfil profesional ya está guardado.')) setEditProfesional(null);
  };

  const guardarFoto = async () => {
    const datos = new FormData();
    if (fotoNueva) datos.append('foto', fotoNueva);
    else if (quitarFoto) datos.append('quitar_foto', 'true');
    if (await guardar('foto', datos, quitarFoto ? 'Quitamos tu foto.' : 'Tu foto nueva ya está guardada.')) {
      setFotoNueva(null);
      setQuitarFoto(false);
    }
  };

  // Quitar el CV va en dos pasos, porque no tiene vuelta atrás: mantener
  // presionado (`BotonMantener`) y luego confirmar con el nombre del archivo.
  const guardarCv = async () => {
    if (quitarCv && !cvNuevo) {
      const ok = await showConfirm(
        `Se quitará "${cvNombre || 'tu CV'}". Sin CV no puedes postularte, y las empresas a las que ya te postulaste dejarán de verlo hasta que subas otro.`,
        '¿Quitar tu CV?',
        { confirmLabel: 'Sí, quitarlo', destructive: true }
      );
      if (!ok) return;
    }
    const datos = new FormData();
    if (cvNuevo) datos.append('cv', cvNuevo);
    else if (quitarCv) datos.append('quitar_cv', 'true');
    if (await guardar('cv', datos, quitarCv && !cvNuevo ? 'Quitamos tu CV.' : 'Tu CV nuevo ya está guardado.')) {
      setCvNuevo(null);
      setQuitarCv(false);
    }
  };

  const elegirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    // Se vacía para que elegir el mismo archivo otra vez vuelva a disparar onChange.
    e.target.value = '';
    if (!archivo) return;
    const resultado = await prepararFoto(archivo);
    if ('error' in resultado) {
      showError(resultado.error, 'Esa foto no se puede subir');
      return;
    }
    setQuitarFoto(false);
    setFotoNueva(resultado.foto);
  };

  const elegirCv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    const error = validarCv(archivo);
    if (error) {
      showError(error, 'Ese CV no se puede subir');
      return;
    }
    setQuitarCv(false);
    setCvNuevo(archivo);
  };

  /** Lo que le falta al perfil, con los mismos criterios que `completitud_perfil` del backend. */
  const faltantes = [
    !fotoUrl && 'foto',
    !cvUrl && 'CV',
    !cuenta.telefono && 'teléfono',
    !profesional.profesion && 'profesión',
    profesional.habilidades.length === 0 && 'habilidades',
    !profesional.experiencia_resumen && 'experiencia',
  ].filter(Boolean) as string[];

  const encabezado = (
    <PageHeader
      tono="oscuro"
      familia="trabajo"
      ancho="doc"
      migas={migasDeCuenta('Mi perfil')}
      titulo="Mi perfil"
    />
  );

  // La franja está desde el primer cuadro: antes, mientras cargaba, la página
  // no tenía franja y al llegar los datos todo brincaba.
  if (cargando) {
    return (
      <div className="min-h-screen mesh-page">
        {encabezado}
        <div className="mx-auto max-w-4xl px-6 pb-20 md:px-7">
          <div className="glass-panel glass-panel-overlap edge-l flex items-center gap-6 p-7">
            <Skeleton className="h-[88px] w-[88px] rounded-pill" />
            <div className="flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="mt-2.5 h-4 w-32" />
            </div>
          </div>
          <Skeleton className="mt-8 h-56 w-full rounded-card" />
          <AvisoLento cargando />
        </div>
      </div>
    );
  }

  const fotoMostrada = quitarFoto ? null : fotoPrevia || (fotoUrl && !fotoRota ? getMediaUrl(fotoUrl) : null);
  const inicial = cuenta.username.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen mesh-page">
      {encabezado}

      <motion.div variants={stagger(0.07)} initial="hidden" animate="show" className="mx-auto max-w-4xl px-6 pb-20 md:px-7">
        {/* ── Identidad y foto ── */}
        <motion.section
          variants={rise}
          aria-label="Tu foto y tu perfil"
          className="glass-panel glass-panel-overlap edge-l mb-8 flex flex-wrap items-center gap-6 p-7"
        >
          {/* El avatar ES el control para cambiar la foto: la cámara lo dice. */}
          <button
            type="button"
            onClick={() => entradaFoto.current?.click()}
            aria-label={fotoMostrada ? 'Cambiar foto' : 'Subir foto'}
            className="group relative h-[88px] w-[88px] flex-none overflow-hidden rounded-pill border border-hairline bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-on-dark"
          >
            {fotoMostrada ? (
              <img
                src={fotoMostrada}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setFotoRota(true)}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[1.75rem] font-mid text-ink-2">
                {inicial}
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-center bg-night/70 text-white transition-colors group-hover:bg-night/85">
              <Camera size={15} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </button>
          <input ref={entradaFoto} type="file" accept="image/jpeg,image/png" onChange={elegirFoto} className="sr-only" tabIndex={-1} aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-h2 font-demi tracking-[-0.015em] text-ink">{cuenta.username || 'Tu perfil'}</h2>
            <p className="mt-1.5 text-body text-ink-2">{profesional.profesion || 'Aspirante en TalentHub'}</p>
            {/* Lo que le falta, en palabras: sin anillo de progreso. */}
            {faltantes.length > 0 ? (
              <p className="mt-2 text-[0.875rem] text-muted">
                {completitud !== null && <>Tu perfil está al {completitud}%. </>}
                Te falta: {faltantes.join(', ')}.
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-1.5 text-[0.875rem] text-ink-2">
                <Check size={14} strokeWidth={1.8} className="text-accent-on-dark" aria-hidden="true" />
                Tu perfil está completo.
              </p>
            )}
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {fotoPendiente ? (
              <>
                <Button size="sm" onClick={guardarFoto} disabled={guardando === 'foto'}>
                  <Save size={14} strokeWidth={1.8} />
                  {guardando === 'foto' ? 'Guardando…' : quitarFoto ? 'Quitar foto' : 'Guardar foto'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFotoNueva(null);
                    setQuitarFoto(false);
                  }}
                >
                  <RotateCcw size={14} strokeWidth={1.8} />
                  Deshacer
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => entradaFoto.current?.click()}>
                  <Camera size={14} strokeWidth={1.8} />
                  {fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {fotoUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setQuitarFoto(true)}>
                    <Trash2 size={14} strokeWidth={1.8} />
                    Quitar
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.section>

        <div className="flex flex-col gap-6">
          {/* ── Cuenta ── */}
          <motion.div variants={rise}>
            <Card>
              <CabezaBloque
                titulo="Información de cuenta"
                editando={editCuenta !== null}
                sucio={cuentaSucia}
                onEditar={() => setEditCuenta({ ...cuenta })}
              />
              {editCuenta ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    guardarCuenta();
                  }}
                >
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <Field label="Nombre de usuario" htmlFor="username" error={errores.username}>
                      <Input
                        id="username"
                        value={editCuenta.username}
                        onChange={(e) => setEditCuenta({ ...editCuenta, username: e.target.value })}
                        required
                        autoFocus
                      />
                    </Field>
                    <Field label="Correo electrónico" htmlFor="email" error={errores.email}>
                      <Input
                        id="email"
                        type="email"
                        value={editCuenta.email}
                        onChange={(e) => setEditCuenta({ ...editCuenta, email: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Teléfono" htmlFor="telefono" error={errores.telefono}>
                      <Input
                        id="telefono"
                        type="tel"
                        value={editCuenta.telefono}
                        onChange={(e) => setEditCuenta({ ...editCuenta, telefono: e.target.value })}
                        placeholder="2221234567"
                      />
                    </Field>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditCuenta(null);
                        setErrores({});
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={!cuentaSucia || guardando === 'cuenta'}>
                      <Save size={15} strokeWidth={1.8} />
                      {guardando === 'cuenta' ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <Dato etiqueta="Nombre de usuario">{cuenta.username}</Dato>
                  <Dato etiqueta="Correo electrónico">{cuenta.email}</Dato>
                  <Dato etiqueta="Teléfono">{cuenta.telefono || <Vacio>Sin teléfono</Vacio>}</Dato>
                </dl>
              )}
            </Card>
          </motion.div>

          {/* ── Perfil profesional ── */}
          <motion.div variants={rise}>
            <Card>
              <CabezaBloque
                titulo="Perfil profesional"
                editando={editProfesional !== null}
                sucio={profesionalSucio}
                onEditar={() => setEditProfesional({ ...profesional, habilidades: [...profesional.habilidades] })}
              />
              {editProfesional ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    guardarProfesional();
                  }}
                >
                  <div className="grid grid-cols-1 gap-5">
                    <Field label="Profesión o especialidad" htmlFor="profesion" error={errores.profesion}>
                      <Input
                        id="profesion"
                        value={editProfesional.profesion}
                        onChange={(e) => setEditProfesional({ ...editProfesional, profesion: e.target.value })}
                        required
                        autoFocus
                      />
                    </Field>
                    <Field
                      label="Habilidades"
                      htmlFor="habilidades"
                      hint="Escribe una y presiona Enter o coma"
                      error={errores.habilidades}
                    >
                      <EntradaChips
                        id="habilidades"
                        valores={editProfesional.habilidades}
                        onChange={(habilidades) => setEditProfesional({ ...editProfesional, habilidades })}
                        placeholder="React, Python, AWS…"
                      />
                    </Field>
                    <Field label="Resumen de experiencia" htmlFor="experiencia_resumen" error={errores.experiencia_resumen}>
                      <Textarea
                        id="experiencia_resumen"
                        rows={4}
                        value={editProfesional.experiencia_resumen}
                        onChange={(e) => setEditProfesional({ ...editProfesional, experiencia_resumen: e.target.value })}
                        placeholder="Describe brevemente tu trayectoria y tus logros…"
                      />
                    </Field>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditProfesional(null);
                        setErrores({});
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={!profesionalSucio || guardando === 'profesional'}>
                      <Save size={15} strokeWidth={1.8} />
                      {guardando === 'profesional' ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid grid-cols-1 gap-5">
                  <Dato etiqueta="Profesión o especialidad">{profesional.profesion || <Vacio>Sin profesión</Vacio>}</Dato>
                  <Dato etiqueta="Habilidades">
                    {profesional.habilidades.length ? (
                      <span className="flex flex-wrap gap-2">
                        {profesional.habilidades.map((h) => (
                          <span key={h} className="rounded-pill bg-white/[0.06] px-3 py-1 text-[0.875rem] text-ink-2">
                            {h}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <Vacio>Sin habilidades</Vacio>
                    )}
                  </Dato>
                  <Dato etiqueta="Resumen de experiencia">
                    {profesional.experiencia_resumen ? (
                      <span className="whitespace-pre-line">{profesional.experiencia_resumen}</span>
                    ) : (
                      <Vacio>Sin resumen</Vacio>
                    )}
                  </Dato>
                </dl>
              )}
            </Card>
          </motion.div>

          {/* ── CV ── */}
          <motion.div variants={rise}>
            <Card>
              <CabezaBloque titulo="Currículum" editando={false} sucio={cvPendiente} />
              <input ref={entradaCv} type="file" accept=".pdf" onChange={elegirCv} className="sr-only" tabIndex={-1} aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-4 rounded-ui border border-hairline px-4 py-4">
                <FileText size={22} strokeWidth={1.6} className="flex-none text-accent-on-dark" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  {cvNuevo ? (
                    <>
                      <p className="truncate text-body text-ink">Nuevo: {cvNuevo.name}</p>
                      <p className="text-[0.8125rem] text-muted">Se sube al guardar · PDF</p>
                    </>
                  ) : quitarCv ? (
                    <>
                      <p className="truncate text-body text-ink line-through decoration-white/40">{cvNombre}</p>
                      <p className="text-[0.8125rem] text-muted">
                        Sin CV no puedes postularte, y las empresas dejarán de verlo hasta que subas otro.
                      </p>
                    </>
                  ) : cvUrl ? (
                    <>
                      <p className="truncate text-body text-ink">{cvNombre || 'Tu CV'}</p>
                      <p className="text-[0.8125rem] text-muted">PDF · las empresas lo ven al recibir tu postulación</p>
                    </>
                  ) : (
                    <>
                      <p className="text-body text-ink">Aún no subes tu CV</p>
                      <p className="text-[0.8125rem] text-muted">Lo necesitas para postularte · PDF, máximo 5 MB</p>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {quitarCv && !cvNuevo ? (
                    <>
                      <BotonMantener accion="quitar tu CV" alConfirmar={guardarCv} disabled={guardando === 'cv'}>
                        <Trash2 size={14} strokeWidth={1.8} />
                        {guardando === 'cv' ? 'Quitando…' : 'Mantén para quitar'}
                      </BotonMantener>
                      <Button variant="ghost" size="sm" onClick={() => setQuitarCv(false)}>
                        <RotateCcw size={14} strokeWidth={1.8} />
                        Deshacer
                      </Button>
                    </>
                  ) : cvPendiente ? (
                    <>
                      <Button size="sm" onClick={guardarCv} disabled={guardando === 'cv'}>
                        <Save size={14} strokeWidth={1.8} />
                        {guardando === 'cv'
                          ? progresoCv !== null && cvNuevo
                            ? `Subiendo ${progresoCv}%`
                            : 'Guardando…'
                          : 'Guardar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCvNuevo(null);
                          setQuitarCv(false);
                        }}
                      >
                        <RotateCcw size={14} strokeWidth={1.8} />
                        Deshacer
                      </Button>
                    </>
                  ) : (
                    <>
                      {cvUrl && (
                        <a
                          href={getMediaUrl(cvUrl) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={clasesBoton({ variant: 'ghost', size: 'sm' })}
                        >
                          <ExternalLink size={14} strokeWidth={1.8} />
                          Ver
                        </a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => entradaCv.current?.click()}>
                        <Upload size={14} strokeWidth={1.8} />
                        {cvUrl ? 'Cambiar' : 'Subir CV'}
                      </Button>
                      {cvUrl && (
                        <Button variant="ghost" size="sm" onClick={() => setQuitarCv(true)}>
                          <Trash2 size={14} strokeWidth={1.8} />
                          Quitar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PerfilAspirante;
