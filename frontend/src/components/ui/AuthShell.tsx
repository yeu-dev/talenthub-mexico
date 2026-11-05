import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cx } from '../../lib/cx';
import { rise, riseGlass, stagger } from '../../lib/motion';
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
 * Registro oscuro de pantalla completa con una tarjeta de vidrio oscuro sobre
 * auroras que derivan despacio. El vidrio es una lente: sobre negro plano no
 * refractaría nada, por eso las auroras.
 */
const AuthShell: React.FC<Props> = ({ title, subtitle, children, footer, wide = false, aside }) => {
  const reduced = useReducedMotion();

  // La barra de navegacion no se pinta en login y registro, asi que aqui no
  // hay margen negativo que la compense: con el, la pantalla subia 64px y
  // dejaba una franja blanca abajo.
  return (
    <div className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-night px-6 py-16 text-ink-d">
      {/* ── Aurora ──
          El glass es una lente. Sobre un negro plano no refracta nada y la
          tarjeta se ve igual de translúcida que de opaca; estas manchas le dan
          variación de TONO —no solo de luz— que atravesar. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={reduced ? undefined : { x: [0, 60, -30, 0], y: [0, -40, 25, 0] }}
          transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-1/2 h-[900px] w-[1200px] -translate-x-1/2 -translate-y-[60%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.13),rgba(255,255,255,0.03)_50%,transparent_74%)]"
        />
        <motion.div
          animate={reduced ? undefined : { x: [0, -50, 30, 0], y: [0, 35, -25, 0] }}
          transition={{ duration: 42, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-40 top-[6%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.32),transparent_72%)]"
        />
        <motion.div
          animate={reduced ? undefined : { x: [0, 45, -20, 0], y: [0, -30, 40, 0] }}
          transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-32 bottom-[-8%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(56,190,178,0.18),transparent_72%)]"
        />
      </div>

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

          {/* `edge-d`: filo degradado de 1px que se apaga hacia abajo, no un
              rectángulo trazado. `riseGlass`: un fade aplanaría el vidrio. */}
          <motion.div
            variants={riseGlass}
            className="edge-d rounded-card bg-white/[0.045] p-8 backdrop-blur-overlay backdrop-saturate-150 sm:p-9"
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
