import React from 'react';
import { cx } from '../../lib/cx';

type Tone = 'light' | 'dark';

const BASE =
  'w-full rounded-ui border px-[14px] py-[10px] text-body ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ease-base ' +
  'focus:outline-none disabled:opacity-50';

const TONES: Record<Tone, string> = {
  light:
    // Con el sitio en oscuro, el registro "claro" también es oscuro: lleva el
    // mismo parche de autofill.
    'input-dark border-hairline bg-canvas text-ink placeholder:text-muted ' +
    'hover:border-hairline-strong ' +
    'focus:border-accent focus:shadow-focus-accent disabled:bg-surface',
  // `input-dark` no es decorativa: lleva el parche de autofill de index.css.
  // Sin él Chrome pinta el campo de amarillo pálido y rompe la banda oscura
  // justo en el login, que es donde el autofill siempre dispara.
  dark:
    'input-dark border-hairline-d bg-white/[0.04] text-ink-d placeholder:text-muted-d ' +
    'hover:border-hairline-d-strong hover:bg-white/[0.06] ' +
    'focus:border-accent-on-dark/55 focus:bg-white/[0.07] focus:shadow-focus-accent-d ' +
    'disabled:bg-white/[0.02]',
};

interface ControlProps {
  /** Registro de la superficie donde vive el control, no del control. */
  tone?: Tone;
}

/** Borde de 1px, no de 2px. El placeholder va en muted para no confundirse con un valor real. */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & ControlProps
>(({ className, tone = 'light', ...rest }, ref) => (
  <input ref={ref} className={cx(BASE, TONES[tone], className)} {...rest} />
));
Input.displayName = 'Input';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & ControlProps
>(({ className, tone = 'light', children, ...rest }, ref) => (
  <select
    ref={ref}
    // El desplegable nativo lo pinta el sistema operativo, no Tailwind:
    // sin color-scheme la lista sale blanca sobre la tarjeta oscura.
    className={cx(BASE, TONES[tone], 'appearance-none pr-9', tone === 'dark' && '[color-scheme:dark]', className)}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps
>(({ className, tone = 'light', ...rest }, ref) => (
  <textarea ref={ref} className={cx(BASE, TONES[tone], 'min-h-[110px] resize-y', className)} {...rest} />
));
Textarea.displayName = 'Textarea';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  tone?: Tone;
  children: React.ReactNode;
}

/** Envoltorio label + control + ayuda. El error se anuncia, no solo se pinta. */
export const Field: React.FC<FieldProps> = ({ label, htmlFor, hint, error, tone = 'light', children }) => (
  <div className="flex flex-col gap-[7px]">
    <label htmlFor={htmlFor} className={cx('text-caption', tone === 'dark' ? 'text-ink-2d' : 'text-ink-2')}>
      {label}
    </label>
    {children}
    {hint && !error && (
      <p className={cx('text-caption', tone === 'dark' ? 'text-muted-d' : 'text-muted')}>{hint}</p>
    )}
    {error && (
      <p role="alert" className={cx('text-caption', tone === 'dark' ? 'text-danger-d' : 'text-danger')}>
        {error}
      </p>
    )}
  </div>
);

export default Field;
