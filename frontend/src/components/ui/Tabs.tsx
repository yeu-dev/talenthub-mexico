import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { SPRING_SOFT } from '../../lib/motion';

export interface TabItem {
  id: string;
  label: string;
  /** Cifra al lado del rótulo. `0` se muestra; `undefined` no. */
  count?: number;
  icon?: LucideIcon;
}

interface Props {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Aísla el `layoutId` cuando hay más de un tablist en la página. */
  name: string;
  label: string;
  className?: string;
}

/**
 * Control segmentado con semántica de pestañas.
 *
 * Sustituye a la fila de botones con `border-b-4`: ese subrayado grueso es de
 * otro sistema — aquí nada lleva 4px de nada. El indicador es una píldora que
 * **viaja** entre segmentos (`layoutId`), no un borde que se prende y apaga:
 * el movimiento dice que es un solo selector cambiando de posición.
 *
 * Implementa roving tabindex: solo la pestaña activa es alcanzable con Tab, y
 * las flechas mueven entre pestañas. Es lo que espera un lector de pantalla de
 * un `role="tablist"`, y no viene gratis con `<button>`.
 */
const Tabs: React.FC<Props> = ({ items, value, onChange, name, label, className }) => {
  const mover = (e: React.KeyboardEvent, i: number) => {
    const teclas: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowLeft: i - 1,
      Home: 0,
      End: items.length - 1,
    };
    const destino = teclas[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    const siguiente = items[(destino + items.length) % items.length];
    onChange(siguiente.id);
    document.getElementById(`${name}-tab-${siguiente.id}`)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx(
        'inline-flex max-w-full flex-wrap gap-1 rounded-pill border border-hairline bg-surface p-1',
        className
      )}
    >
      {items.map((t, i) => {
        const activo = t.id === value;
        const Icon = t.icon;

        return (
          <button
            key={t.id}
            id={`${name}-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={activo}
            aria-controls={`${name}-panel-${t.id}`}
            tabIndex={activo ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => mover(e, i)}
            className="relative rounded-pill px-4 py-2 text-[0.875rem] font-mid"
          >
            {activo && (
              <motion.span
                layoutId={`tab-${name}`}
                aria-hidden="true"
                transition={SPRING_SOFT}
                className="edge-l absolute inset-0 rounded-pill bg-canvas"
              />
            )}
            <span
              className={cx(
                'relative flex items-center gap-2 whitespace-nowrap transition-colors duration-200',
                activo ? 'text-ink' : 'text-muted hover:text-ink-2'
              )}
            >
              {Icon && <Icon size={14} strokeWidth={1.8} />}
              {t.label}
              {t.count !== undefined && (
                <span className={cx('tabular text-[0.75rem]', activo ? 'text-muted' : 'text-muted/70')}>
                  {t.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
