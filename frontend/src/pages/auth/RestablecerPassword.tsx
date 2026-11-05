import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check } from '../../components/icons';
import PasswordValidator from '../../components/PasswordValidator';
import api from '../../services/api';
import { showSuccess, showError } from '../../utils/alerts';
import { AuthShell, Button, Field, Input } from '../../components/ui';
import { useTitulo } from '../../hooks/useTitulo';

export default function RestablecerPassword() {
  useTitulo('Nueva contraseña');
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const noCoinciden = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // S-SDLC: la política se valida antes de mandar nada al backend.
    if (!isPasswordValid) {
      showError('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }
    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await api.post('/confirmar-password/', { uid, token, new_password: password });

      // El toast vive en App, así que sobrevive a la navegación: ya no hace
      // falta la pausa artificial que necesitaba el modal anterior.
      showSuccess('Ya puedes iniciar sesión con ella.', 'Contraseña actualizada');
      navigate('/login');
    } catch (error: any) {
      showError(error.response?.data?.error || 'No pudimos actualizar tu contraseña.');
      setCargando(false);
    }
  };

  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Define la contraseña con la que entrarás de ahora en adelante"
      footer={
        <Link to="/login" className="text-accent-on-dark hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field tone="dark" label="Nueva contraseña" htmlFor="password">
          <Input
            tone="dark"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
            required
          />
        </Field>

        {password.length > 0 && (
          <PasswordValidator tone="dark" password={password} onValidationChange={setIsPasswordValid} />
        )}

        <Field
          tone="dark"
          label="Confirmar contraseña"
          htmlFor="confirmPassword"
          error={noCoinciden ? 'Las contraseñas no coinciden.' : undefined}
        >
          <Input
            tone="dark"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <Button
          type="submit"
          variant="accent"
          className="mt-1 w-full"
          disabled={cargando || !isPasswordValid || noCoinciden}
        >
          <Check size={15} strokeWidth={2} />
          {cargando ? 'Actualizando…' : 'Actualizar contraseña'}
        </Button>
      </form>
    </AuthShell>
  );
}
