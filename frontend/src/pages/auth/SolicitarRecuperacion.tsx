import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, Send } from 'lucide-react';
import api from '../../services/api';
import { AuthShell, Button, Field, Input } from '../../components/ui';
import { cx } from '../../lib/cx';
import { useTitulo } from '../../hooks/useTitulo';

export default function SolicitarRecuperacion() {
  useTitulo('Recuperar contraseña');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [esError, setEsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');
    setEsError(false);

    try {
      const response = await api.post('/recuperar-password/', { email });
      setEsError(false);
      setMensaje(response.data.mensaje || 'Te enviamos un enlace para restablecer tu contraseña.');
    } catch (error: any) {
      setEsError(true);
      setMensaje(error.response?.data?.error || 'No pudimos conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviamos un enlace seguro a tu correo"
      footer={
        <>
          ¿Ya la recordaste?{' '}
          <Link to="/login" className="text-accent-on-dark hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field tone="dark" label="Correo electrónico" htmlFor="email">
          <Input
            tone="dark"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            autoFocus
            required
          />
        </Field>

        <Button type="submit" variant="accent" className="w-full" disabled={cargando}>
          <Send size={15} strokeWidth={1.8} />
          {cargando ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </form>

      {/* El mensaje se queda: es el resultado del envío, no un aviso pasajero.
          Un toast desaparecería justo cuando el usuario va a revisar su correo. */}
      {mensaje && (
        <div
          role="status"
          className={cx(
            'mt-6 flex items-start gap-3 rounded-ui border p-4 text-[0.875rem] leading-relaxed',
            esError ? 'border-danger-d/30 bg-danger-d/[0.08] text-ink-d' : 'border-ok-d/25 bg-ok-d/[0.08] text-ink-d'
          )}
        >
          {esError ? (
            <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-none text-danger-d" />
          ) : (
            <Info size={16} strokeWidth={1.8} className="mt-0.5 flex-none text-ok-d" />
          )}
          <span>{mensaje}</span>
        </div>
      )}
    </AuthShell>
  );
}
