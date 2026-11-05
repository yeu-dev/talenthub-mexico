import React from 'react';
import { motion } from 'framer-motion';
import { cx } from '../../lib/cx';
import { rise, stagger } from '../../lib/motion';
import Brand from '../Brand';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Pie de la tarjeta: enlaces de cambio de flujo. */
  footer?: React.ReactNode;
  /** Los formularios largos (registro) necesitan más ancho. */
  wide?: boolean;
  /** Panel de contexto a la izquierda. Solo desde `lg`; abajo estorba. */
  aside?: React.ReactNode;
}

/**
 * Envoltorio de las cuatro pantallas de autenticación.
 *
 * Registro oscuro de pantalla completa con una tarjeta sólida `elevated`.
 * Antes llevaba tres auroras animadas detrás de una tarjeta de vidrio: el
 * vidrio necesitaba algo que refractar y las auroras existían solo para eso.
 * Sin vidrio no hacen falta, y la pantalla deja de parecer una plantilla.
 */
const AuthShell: React.FC<Props> = ({ title, subtitle, children, footer, wide = false, aside }) => {
  // La barra de navegacion no se pinta en login y registro, asi que aqui no
  // hay margen negativo que la compense: con el, la pantalla subia 64px y
  // dejaba una franja blanca abajo.
  return (
    <div className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-night px-6 py-16 text-ink-d">
      <div
        className={cx(
          'mx-auto flex w-full max-w-page items-center',
          aside ? 'lg:gap-20' : 'justify-center'
        )}
      >
        {aside && (
          <motion.aside
            variants={stagger(0.1, 0.15)}
            initial="hidden"
            animate="show"
            className="hidden flex-1 pr-6 lg:block"
          >
            {aside}
          </motion.aside>
        )}

        <motion.div
          variants={stagger(0.09)}
          initial="hidden"
          animate="show"
          className={cx('w-full', wide ? 'max-w-[520px]' : 'max-w-[430px]', Boolean(aside) && 'lg:flex-none')}
        >
          <motion.div variants={rise} className="mb-8 flex justify-center">
            <Brand />
          </motion.div>

          <motion.div
            variants={rise}
            className="rounded-card border border-hairline-d bg-elevated p-8 sm:p-9"
          >
            <div className="mb-7">
              <h1 className="text-h3 font-demi text-ink-d">{title}</h1>
              {subtitle && <p className="mt-1.5 text-[0.9375rem] text-muted-d">{subtitle}</p>}
            </div>

            {children}
          </motion.div>

          {footer && (
            <motion.div variants={rise} className="mt-6 text-center text-[0.9375rem] text-muted-d">
              {footer}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthShell;
