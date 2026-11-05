import React from 'react';
import { cx } from '../../lib/cx';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Registro de la banda que contiene la card. */
  tone?: 'light' | 'dark';
  /**
   * Ya no hace nada: el vidrio salió del sistema. Se acepta para que las
   * llamadas que lo pasan sigan compilando mientras se limpian.
   */
  glass?: boolean;
  /** Al pasar el cursor cambia el borde; la card no se levanta. */
  interactive?: boolean;
  as?: 'div' | 'article' | 'li';
}

/**
 * Superficie sólida con un borde de 1px. Sin sombras, sin translucidez y sin
 * desenfoque: el vidrio sobre halos era justo lo que hacía que la web se viera
 * como plantilla generada. La profundidad la dan el borde y el contraste entre
 * `canvas` y `surface`.
 */
const Card: React.FC<CardProps> = ({
  tone = 'light',
  glass: _glass,
  interactive = false,
  as = 'div',
  className,
  children,
  ...rest
}) => {
  const Tag = as as React.ElementType;
  const base = 'rounded-card p-7 transition-[background-color,border-color] duration-200 ease-base';

  const surface = tone === 'dark' ? 'bg-elevated border border-hairline-d' : 'bg-canvas border border-hairline';

  const hover = interactive
    ? tone === 'dark'
      ? 'hover:border-hairline-d-strong'
      : 'hover:border-accent/40'
    : '';

  return (
    <Tag className={cx(base, surface, hover, className)} {...rest}>
      {children}
    </Tag>
  );
};

export default Card;
