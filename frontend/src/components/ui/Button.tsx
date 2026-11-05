import React from 'react';
import { cx } from '../../lib/cx';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger';
type Tone = 'light' | 'dark';
type Size = 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Registro de la superficie donde vive el botón, no del botón. */
  tone?: Tone;
  size?: Size;
}

/**
 * Pill de 9999px en todas sus formas — es la silueta que define el sistema.
 *
 * `primary` es el azul de marca en los dos registros. Antes era negro sobre
 * claro y blanco sobre oscuro, y el azul casi no aparecía en el sitio: todo
 * se leía gris. `accent` se queda como alias para no tocar cada llamada.
 * `danger` es solo para confirmar algo destructivo. Uno por sección.
 */
const ACCENT = 'bg-accent text-white hover:bg-accent-hover';
const DANGER = 'bg-[#dc2626] text-white hover:bg-[#b91c1c]';

const VARIANTS: Record<Tone, Record<Variant, string>> = {
  light: {
    primary: ACCENT,
    accent: ACCENT,
    danger: DANGER,
    ghost: 'bg-transparent text-ink border border-hairline hover:border-hairline-strong hover:bg-white/[0.04]',
  },
  dark: {
    primary: ACCENT,
    accent: ACCENT,
    danger: DANGER,
    ghost: 'bg-transparent text-white/90 border border-hairline-d hover:border-hairline-d-strong hover:bg-white/[0.05]',
  },
};

const SIZES: Record<Size, string> = {
  sm: 'text-[0.875rem] px-[18px] py-2',
  md: 'text-[0.9375rem] px-[22px] py-[11px]',
};

/**
 * Las clases del botón, sueltas. Sirven para que un `<Link>` se vea como
 * botón sin meter un `<button>` dentro de un `<a>`: dos elementos
 * interactivos anidados hacen que el lector de pantalla anuncie dos cosas y
 * que el foco caiga dos veces en el mismo lugar.
 */
export const clasesBoton = ({
  variant = 'primary',
  tone = 'light',
  size = 'md',
  className,
}: { variant?: Variant; tone?: Tone; size?: Size; className?: string } = {}) =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-pill font-mid',
    // Curva base, no de rebote: un sobrepaso sobre `background-color` empuja
    // la interpolación MÁS ALLÁ del color destino y la regresa — un parpadeo
    // en cada hover. El overshoot solo tiene sentido físico en `transform`,
    // y ahí el press ya lo da `active:scale`.
    'transition-[transform,background-color,border-color,color] duration-150 ease-base',
    'active:scale-[0.96] disabled:opacity-45 disabled:pointer-events-none',
    SIZES[size],
    VARIANTS[tone][variant],
    className
  );

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', tone = 'light', size = 'md', className, type = 'button', children, ...rest }, ref) => (
    <button ref={ref} type={type} className={clasesBoton({ variant, tone, size, className })} {...rest}>
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export default Button;
