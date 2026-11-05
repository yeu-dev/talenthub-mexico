import React from 'react';
import { cx } from '../../lib/cx';
import { Clock } from '../icons';
import { useTardando } from '../../hooks/useTardando';

interface Props {
  /** Si la petición sigue en curso. El aviso aparece cuando pasa de `ms`. */
  cargando: boolean;
  ms?: number;
  className?: string;
}

/**
 * Una línea bajo el esqueleto cuando la carga se alarga: el servidor de
 * Render se duerme cuando nadie lo usa y tarda en despertar. Dice qué pasa y
 * cuánto puede tardar, para que nadie recargue la página a medio despertar.
 * `role="status"`: el lector de pantalla lo anuncia sin interrumpir.
 */
const AvisoLento: React.FC<Props> = ({ cargando, ms, className }) => {
  const tardando = useTardando(cargando, ms);
  if (!tardando) return null;

  return (
    <p role="status" className={cx('mt-4 flex items-center gap-2 text-[0.875rem] text-muted', className)}>
      <Clock size={15} strokeWidth={1.7} aria-hidden="true" className="flex-none" />
      El servidor está despertando. La primera carga puede tardar hasta un minuto.
    </p>
  );
};

export default AvisoLento;
