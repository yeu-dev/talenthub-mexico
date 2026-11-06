import React, { useEffect, useState } from 'react';
import { cx } from '../../lib/cx';
import { RotateCcw } from '../icons';
import { useTardando } from '../../hooks/useTardando';
import Button from './Button';

interface Props {
  /** Si la petición sigue en curso. El aviso aparece cuando pasa de `ms`. */
  cargando: boolean;
  ms?: number;
  /** Qué hacer al tocar "Reintentar". Sin esto, recarga la página. */
  alReintentar?: () => void;
  className?: string;
}

/** A partir de aquí la espera ya no es normal y se ofrece reintentar. */
const LIMITE = 60;

/** Los segundos que lleva `cargando` en `true`, contados desde que empezó. */
const useSegundos = (cargando: boolean) => {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    if (!cargando) {
      setSegundos(0);
      return;
    }
    const inicio = Date.now();
    const id = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [cargando]);
  return segundos;
};

/**
 * Una tarjeta bajo el esqueleto cuando la carga se alarga.
 *
 * El servidor de Render (plan gratis) se duerme cuando nadie lo usa y tarda
 * hasta un minuto en despertar. Antes había una línea de texto gris, solo en
 * cuatro páginas; ahora es una tarjeta con una rueda y los segundos que lleva
 * la espera, para que se vea que algo avanza y nadie recargue a medias. Pasado
 * un minuto ofrece "Reintentar".
 *
 * Regla (DESIGN.md): toda espera dice algo, y una espera larga dice cuánto
 * lleva. `role="status"` se anuncia una vez; los segundos van ocultos al
 * lector de pantalla para que no repita el aviso cada segundo.
 */
const AvisoLento: React.FC<Props> = ({ cargando, ms = 4000, alReintentar, className }) => {
  const tardando = useTardando(cargando, ms);
  const segundos = useSegundos(cargando);
  if (!tardando) return null;

  return (
    <div
      role="status"
      className={cx('mt-5 flex items-start gap-4 rounded-card border border-hairline bg-white/[0.04] p-5', className)}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 h-8 w-8 flex-none animate-spin rounded-pill border-2 border-white/[0.12] border-t-accent-on-dark motion-reduce:border-t-white/[0.12]"
      />
      <div className="min-w-0">
        <p className="text-body text-ink">
          Despertando el servidor
          <span aria-hidden="true" className="tabular text-muted">
            {' '}
            · {segundos} s
          </span>
        </p>
        <p className="mt-1 text-[0.875rem] text-muted">
          El servidor se duerme cuando nadie lo usa y la primera carga puede tardar hasta un minuto. No recargues la
          página: en cuanto responda, esto se llena solo.
        </p>
        {segundos >= LIMITE && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => (alReintentar ? alReintentar() : window.location.reload())}
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
};

export default AvisoLento;
