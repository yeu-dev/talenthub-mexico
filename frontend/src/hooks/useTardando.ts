import { useEffect, useState } from 'react';

/**
 * `true` cuando algo lleva cargando más de `ms` milisegundos.
 *
 * Existe por Render: el plan gratis duerme el servidor cuando nadie lo usa, y
 * la primera petición tarda entre 30 y 60 segundos en despertarlo. Sin aviso,
 * un esqueleto que no termina de cargar se lee como "esto está roto".
 * Se reinicia cada vez que `cargando` vuelve a ser `true` (un "Reintentar").
 */
export function useTardando(cargando: boolean, ms = 6000): boolean {
  const [tardando, setTardando] = useState(false);

  useEffect(() => {
    if (!cargando) {
      setTardando(false);
      return;
    }
    const id = window.setTimeout(() => setTardando(true), ms);
    return () => window.clearTimeout(id);
  }, [cargando, ms]);

  return tardando;
}
