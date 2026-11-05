import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from '../icons';
import type { LucideIcon } from '../icons';
import { cx } from '../../lib/cx';
import { SPRING, SPRING_SOFT } from '../../lib/motion';

export interface Choice {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

interface Props {
  /** Nombre del grupo de radios. También aísla el `layoutId` del marco. */
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Elección entre pocas opciones excluyentes, en cajas visibles.
 *
 * Sustituye al `<select>` nativo cuando hay dos o tres opciones. Motivo doble:
 *
 * 1. El desplegable nativo lo dibuja el sistema operativo, no la página. Con
 *    dos opciones esconde la mitad de la decisión detrás de un clic, y ninguna
 *    cantidad de CSS puede darle el registro oscuro en todos los navegadores.
 * 2. Aquí la elección ramifica el formulario — de ella depende que aparezca el
 *    campo de empresa. Una decisión con consecuencias merece verse completa.
 *
 * Sigue siendo un grupo de radios de verdad: las flechas del teclado navegan
 * entre opciones sin que haya que implementarlo, y el formulario lo serializa
 * como siempre.
 */
export default function ChoiceCards({
  name,
  label,
  value,
  onChange,
  options,
  tone = 'light',
  className,
}: Props) {
  const oscuro = tone === 'dark';

  return (
    <div className={cx('flex flex-col gap-[7px]', className)}>
      <span className={cx('text-caption', oscuro ? 'text-ink-2d' : 'text-ink-2')} id={`${name}-label`}>
        {label}
      </span>

      <div role="radiogroup" aria-labelledby={`${name}-label`} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map(({ value: v, label: l, description, icon: Icon }) => {
          const activo = v === value;

          return (
            <motion.label
              key={v}
              whileTap={{ scale: 0.985 }}
              transition={SPRING}
              className={cx(
                'relative flex cursor-pointer flex-col gap-2 rounded-ui p-4',
                'transition-colors duration-200 ease-base',
                oscuro
                  ? activo
                    ? 'bg-white/[0.09]'
                    : 'bg-white/[0.03] hover:bg-white/[0.06]'
                  : activo
                    ? 'bg-accent/[0.05]'
                    : 'bg-canvas hover:bg-surface'
              )}
            >
              <input
                type="radio"
                name={name}
                value={v}
                checked={activo}
                onChange={() => onChange(v)}
                className="peer sr-only"
              />

              {/* El radio real es invisible, así que el foco tiene que verse
                  aquí o no se ve en ningún lado. */}
              <span
                aria-hidden="true"
                className={cx(
                  'pointer-events-none absolute inset-0 rounded-ui',
                  oscuro ? 'peer-focus-visible:shadow-focus-accent-d' : 'peer-focus-visible:shadow-focus-accent'
                )}
              />

              {/* Un solo marco que VIAJA entre las cajas. No son dos bordes que
                  se prenden y apagan: es el mismo objeto cambiando de sitio, y
                  eso es lo que hace legible que son excluyentes. */}
              {activo && (
                <motion.span
                  layoutId={`choice-${name}`}
                  aria-hidden="true"
                  transition={SPRING_SOFT}
                  className={cx(
                    'pointer-events-none absolute inset-0 rounded-ui border',
                    oscuro ? 'border-accent-on-dark/55' : 'border-accent/55'
                  )}
                />
              )}

              <span className="relative flex items-center justify-between gap-3">
                {Icon && (
                  <Icon
                    size={18}
                    strokeWidth={1.7}
                    className={cx(
                      'transition-colors duration-200',
                      activo
                        ? oscuro ? 'text-accent-on-dark' : 'text-accent-on-dark'
                        : oscuro ? 'text-muted-d' : 'text-muted'
                    )}
                  />
                )}

                <AnimatePresence initial={false}>
                  {activo && (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={SPRING}
                      className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-pill bg-accent"
                    >
                      <Check size={11} strokeWidth={2.8} className="text-white" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              <span
                className={cx(
                  'relative font-mid text-[0.9375rem]',
                  oscuro ? 'text-ink-d' : 'text-ink'
                )}
              >
                {l}
              </span>

              {description && (
                <span
                  className={cx(
                    'relative text-[0.8125rem] leading-snug',
                    oscuro ? 'text-muted-d' : 'text-muted'
                  )}
                >
                  {description}
                </span>
              )}
            </motion.label>
          );
        })}
      </div>
    </div>
  );
}
