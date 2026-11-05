import React, { useEffect, useMemo } from 'react';
import { Check } from './icons';
import { cx } from '../lib/cx';

interface PasswordValidatorProps {
  password: string;
  onValidationChange: (isValid: boolean) => void;
  /** Registro de la superficie que lo contiene. Auth vive en oscuro. */
  tone?: 'light' | 'dark';
}

const REGLAS: Array<{ label: string; test: (p: string) => boolean }> = [
  { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Una mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Un número', test: (p) => /[0-9]/.test(p) },
  { label: 'Un carácter especial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const NIVELES = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Segura'];

/**
 * Medidor de seguridad de contraseña.
 *
 * Los cuatro requisitos son una lista de verificación, no una secuencia, así que
 * aquí sí corresponde una marca por ítem — a diferencia del estado de una
 * postulación, que es un proceso. La barra usa segmentos y no un degradado
 * continuo: son cuatro condiciones discretas y se leen como tales.
 */
export default function PasswordValidator({
  password,
  onValidationChange,
  tone = 'light',
}: PasswordValidatorProps) {
  const cumplidas = useMemo(() => REGLAS.map((r) => r.test(password)), [password]);
  const score = cumplidas.filter(Boolean).length;
  const oscuro = tone === 'dark';

  useEffect(() => {
    onValidationChange(score === REGLAS.length);
  }, [score, onValidationChange]);

  const colorSegmento = (i: number) => {
    if (i >= score) return oscuro ? 'bg-white/[0.13]' : 'bg-white/[0.12]';
    if (score === 4) return oscuro ? 'bg-ok-d' : 'bg-ok';
    if (score === 3) return oscuro ? 'bg-accent-on-dark' : 'bg-accent';
    return oscuro ? 'bg-danger-d' : 'bg-danger';
  };

  return (
    <div
      className={cx(
        'rounded-ui border p-4',
        oscuro ? 'border-hairline-d bg-white/[0.035]' : 'border-hairline bg-surface'
      )}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span
          className={cx(
            'text-[0.8125rem] uppercase tracking-[0.06em]',
            oscuro ? 'text-muted-d' : 'text-muted'
          )}
        >
          Seguridad
        </span>
        <span
          className={cx(
            'text-[0.875rem] font-mid',
            score === 4
              ? oscuro ? 'text-ok-d' : 'text-ok'
              : score >= 2
                ? oscuro ? 'text-ink-d' : 'text-ink'
                : oscuro ? 'text-danger-d' : 'text-danger'
          )}
        >
          {NIVELES[score]}
        </span>
      </div>

      <div className="mb-4 flex gap-1.5" aria-hidden="true">
        {REGLAS.map((_, i) => (
          <span key={i} className={cx('h-[3px] flex-1 rounded-sm transition-colors duration-300', colorSegmento(i))} />
        ))}
      </div>

      <ul className="grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
        {REGLAS.map((regla, i) => (
          <li key={regla.label} className="flex items-center gap-2">
            <Check
              size={14}
              strokeWidth={2.2}
              className={cx(
                'flex-none transition-colors',
                cumplidas[i]
                  ? oscuro ? 'text-ok-d' : 'text-ok'
                  : oscuro ? 'text-white/25' : 'text-black/20'
              )}
            />
            <span
              className={cx(
                'text-[0.8125rem]',
                cumplidas[i]
                  ? oscuro ? 'text-ink-2d' : 'text-ink-2'
                  : oscuro ? 'text-muted-d' : 'text-muted'
              )}
            >
              {regla.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
