import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  ListChecks,
  LogIn,
  ShieldCheck,
  TrendingUp,
  User,
} from 'lucide-react';
import api from '../services/api';
import { showSuccess } from '../utils/alerts';
import { AuthShell, Button, Field, Input } from '../components/ui';
import { DUR, EASE, rise } from '../lib/motion';
import { useTitulo } from '../hooks/useTitulo';

// Solo lo que la plataforma hace de verdad: aquí había "Datos del mercado"
// (no existe) y una línea con 1,240 vacantes y 380 empresas inventadas.
const PRUEBAS = [
  {
    icon: ShieldCheck,
    title: 'Ofertas verificadas',
    body: 'Cada vacante pasa por revisión manual antes de publicarse.',
  },
  {
    icon: TrendingUp,
    title: 'Rango salarial a la vista',
    body: 'Lo ves antes de aplicar, no después de cuatro entrevistas.',
  },
  {
    icon: ListChecks,
    title: 'Sigue tu proceso',
    body: 'Ves en qué etapa va cada postulación y te avisamos cuando la empresa la mueve.',
  },
];

const Login: React.FC = () => {
  useTitulo('Inicia sesión');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Bloq Mayús es la causa más común de "mi contraseña no sirve" y el campo
  // la oculta por definición. Avisar cuesta una línea y ahorra el intento fallido.
  const revisarMayusculas = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setMayusculas(e.getModifierState?.('CapsLock') ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login/', {
        username: formData.username,
        password: formData.password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user_tipo', response.data.tipo);
      localStorage.setItem('user_username', response.data.username);
      localStorage.setItem('user_id', response.data.id);

      // Sin esto, la primera petición tras el login sale sin token.
      api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;

      showSuccess(`Qué bueno verte, ${response.data.username}.`, 'Sesión iniciada');

      navigate(response.data.tipo === 'empresa' ? '/dashboard' : '/vacantes');
    } catch (err: any) {
      setError('Usuario o contraseña incorrectos.');
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Entra a tu cuenta de TalentHub"
      aside={
        <>
          <motion.div variants={rise}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[0.875rem] text-muted-d transition-colors hover:text-ink-d"
            >
              <ArrowLeft size={14} strokeWidth={1.8} />
              Volver al inicio
            </Link>
          </motion.div>

          <motion.h2
            variants={rise}
            className="mt-10 max-w-[13ch] font-heading text-[clamp(2rem,3.4vw,2.75rem)] font-mid leading-[1.05] tracking-[-0.03em] text-ink-d"
          >
            El portal de TI que sí dice cuánto paga
          </motion.h2>

          <motion.ul variants={rise} className="mt-11 flex list-none flex-col gap-7 p-0">
            {PRUEBAS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-pill border border-hairline-d bg-white/[0.04]">
                  <Icon size={16} strokeWidth={1.6} className="text-ink-d" />
                </span>
                <div>
                  <p className="font-mid text-[0.9375rem] text-ink-d">{title}</p>
                  <p className="mt-1 max-w-[38ch] text-[0.875rem] leading-relaxed text-muted-d">{body}</p>
                </div>
              </li>
            ))}
          </motion.ul>

        </>
      }
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-accent-on-dark hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* El error es del par usuario+contraseña, no de un campo: por eso vive
            arriba del formulario y no colgado de una etiqueta. */}
        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              key="error"
              role="alert"
              initial={{ opacity: 0, height: 0, marginBottom: -20 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: -20 }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 rounded-ui border border-danger-d/30 bg-danger-d/[0.08] p-3.5 text-[0.875rem] text-ink-d">
                <AlertTriangle size={16} strokeWidth={1.8} className="mt-px flex-none text-danger-d" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Usuario" htmlFor="username" tone="dark">
          <div className="relative">
            <User
              size={16}
              strokeWidth={1.7}
              aria-hidden="true"
              className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-muted-d"
            />
            <Input
              id="username"
              name="username"
              tone="dark"
              className="pl-11"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
              required
            />
          </div>
        </Field>

        <Field
          label="Contraseña"
          htmlFor="password"
          tone="dark"
          hint={mayusculas ? 'Bloq Mayús está activado.' : undefined}
        >
          <div className="relative">
            <Lock
              size={16}
              strokeWidth={1.7}
              aria-hidden="true"
              className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-muted-d"
            />
            <Input
              id="password"
              type={verPassword ? 'text' : 'password'}
              name="password"
              tone="dark"
              className="pl-11 pr-11"
              value={formData.password}
              onChange={handleChange}
              onKeyUp={revisarMayusculas}
              onBlur={() => setMayusculas(false)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={verPassword}
              className="absolute right-[10px] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-pill text-muted-d transition-colors hover:bg-white/[0.07] hover:text-ink-d"
            >
              {verPassword ? <EyeOff size={16} strokeWidth={1.7} /> : <Eye size={16} strokeWidth={1.7} />}
            </button>
          </div>
        </Field>

        <Button type="submit" variant="accent" className="mt-1 w-full" disabled={loading}>
          <LogIn size={15} strokeWidth={1.8} />
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </Button>

        <Link
          to="/olvide-password"
          className="text-center text-[0.875rem] text-muted-d transition-colors hover:text-ink-d"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </form>
    </AuthShell>
  );
};

export default Login;
