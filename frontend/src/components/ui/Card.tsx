import React from 'react';
import { cx } from '../../lib/cx';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Registro de la banda que contiene la card. */
  tone?: 'light' | 'dark';
  /** Panel translúcido. Requiere sustrato con color detrás (ver `mesh-light`). */
  glass?: boolean;
  /** Lift al pasar el cursor: borde y fondo, nunca sombra. */
  interactive?: boolean;
  as?: 'div' | 'article' | 'li';
}

/**
 * Sin box-shadow de elevación. La profundidad la dan hairline, contraste
 * de superficie y translucidez. El único shadow permitido es el filo
 * `inset` del glass — que es también el único que definía la spec original.
 */
const Card: React.FC<CardProps> = ({
  tone = 'light',
  glass = false,
  interactive = false,
  as = 'div',
  className,
  children,
  ...rest
}) => {
  const Tag = as as React.ElementType;
  const base = 'rounded-card p-7 transition-[transform,background-color,border-color,box-shadow] duration-300 ease-base';

  // `backdrop-saturate` es lo que separa el vidrio del plástico esmerilado:
  // satura el tono que atraviesa el panel en vez de solo difuminarlo.
  const surface = glass
    ? tone === 'dark'
      // `edge-d` en vez de `border`: el borde parejo al 16% trazaba el
      // rectángulo entero y se leía antes que el contenido. Ver index.css.
      ? 'bg-white/[0.07] backdrop-blur-card backdrop-saturate-150 edge-d'
      // Blanco con un susurro de azul: la card no es neutra, pertenece al
      // sistema. A 0.46 de alfa el tinte es imperceptible como color y
      // perceptible como temperatura.
      : 'bg-[rgba(250,251,255,0.46)] backdrop-blur-card backdrop-saturate-[1.8] edge-l'
    : tone === 'dark'
      ? 'bg-elevated border border-hairline-d'
      : 'bg-canvas border border-hairline';

  const hover = interactive
    ? glass
      ? tone === 'dark'
        ? 'hover:-translate-y-1 hover:bg-white/[0.10] edge-d-hot'
        : 'hover:-translate-y-1 hover:bg-white/[0.74] edge-l-hot'
      : tone === 'dark'
        ? 'hover:-translate-y-0.5 hover:border-hairline-d-strong'
        : 'hover:-translate-y-0.5 hover:border-hairline-strong'
    : '';

  return (
    <Tag className={cx(base, surface, hover, className)} {...rest}>
      {children}
    </Tag>
  );
};

export default Card;
