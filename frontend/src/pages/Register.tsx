import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { showSuccess } from '../utils/alerts';
import PasswordValidator from '../components/PasswordValidator';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, UserPlus, UserRound } from '../components/icons';
import { AuthShell, Button, ChoiceCards, Field, Input } from '../components/ui';
import { DUR, EASE } from '../lib/motion';
import { useTitulo } from '../hooks/useTitulo';

const Register: React.FC = () => {
  useTitulo('Crea tu cuenta');
  const navigate = useNavigate();
  // `?rol=empresa` llega desde /empresas con "Publico vacantes" ya elegido:
  // quien viene de ahí no tiene que escogerlo otra vez. Cualquier otro valor
  // cae en aspirante, como siempre.
  const [params] = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    tipo: params.get('rol') === 'empresa' ? 'empresa' : 'aspirante',
    telefono: '',
    nombre_empresa: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const noCoinciden =
    formData.password2.length > 0 && formData.password !== formData.password2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // S-SDLC: la política de contraseña se valida antes de mandar nada.
    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }
    if (formData.password !== formData.password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        tipo: formData.tipo,
        telefono: formData.telefono,
        nombre_empresa: formData.nombre_empresa,
      });

      showSuccess('Ya puedes iniciar sesión con tu cuenta.', 'Registro completo');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo completar el registro.');
      setLoading(false);
    }
  };

  return (
    <AuthShell
      wide
      title="Crea tu cuenta"
      subtitle="Gratis, y puedes cambiar de plan cuando quieras"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent-on-dark hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <ChoiceCards
          tone="dark"
          name="tipo"
          label="Tipo de cuenta"
          value={formData.tipo}
          onChange={(tipo) => {
            setFormData((prev) => ({ ...prev, tipo }));
            if (error) setError('');
          }}
          options={[
            {
              value: 'aspirante',
              label: 'Busco empleo',
              description: 'Aplica a vacantes y guarda tu perfil.',
              icon: UserRound,
            },
            {
              value: 'empresa',
              label: 'Publico vacantes',
              description: 'Recibe postulaciones y gestiona tu equipo.',
              icon: Building2,
            },
          ]}
        />

        {/* El campo aparece porque la elección de arriba lo trajo: animar la
            altura hace visible esa causa. Si simplemente apareciera, el
            formulario daría un brinco sin explicación. */}
        <AnimatePresence initial={false}>
          {formData.tipo === 'empresa' && (
            <motion.div
              key="empresa"
              initial={{ opacity: 0, height: 0, marginTop: -20 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: -20 }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="overflow-hidden"
            >
              <Field tone="dark" label="Nombre de la empresa" htmlFor="nombre_empresa">
                <Input
                  tone="dark"
                  id="nombre_empresa"
                  name="nombre_empresa"
                  value={formData.nombre_empresa}
                  onChange={handleChange}
                  placeholder="Tech Corp México"
                  required
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field tone="dark" label="Nombre de usuario" htmlFor="username">
            <Input
              tone="dark"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </Field>

          <Field tone="dark" label="Teléfono" htmlFor="telefono" hint="Opcional">
            <Input
              tone="dark"
              id="telefono"
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="5512345678"
            />
          </Field>
        </div>

        <Field tone="dark" label="Correo electrónico" htmlFor="email">
          <Input
            tone="dark"
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </Field>

        <Field tone="dark" label="Contraseña" htmlFor="password">
          <Input
            tone="dark"
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </Field>

        {formData.password.length > 0 && (
          <PasswordValidator tone="dark" password={formData.password} onValidationChange={setIsPasswordValid} />
        )}

        <Field
          tone="dark"
          label="Confirmar contraseña"
          htmlFor="password2"
          error={noCoinciden ? 'Las contraseñas no coinciden.' : error || undefined}
        >
          <Input
            tone="dark"
            id="password2"
            type="password"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </Field>

        <Button
          type="submit"
          variant="accent"
          className="mt-1 w-full"
          disabled={loading || !isPasswordValid || noCoinciden}
        >
          <UserPlus size={15} strokeWidth={1.8} />
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>

        <p className="text-center text-[0.8125rem] leading-relaxed text-muted-d">
          Al registrarte aceptas nuestro{' '}
          <Link to="/politicas" className="text-accent-on-dark hover:underline">
            aviso de privacidad
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
};

export default Register;
