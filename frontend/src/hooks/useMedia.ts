import { useEffect, useState } from 'react';

/** `true` mientras se cumple la media query. Escucha el cambio al redimensionar. */
export function useMedia(consulta: string): boolean {
  const [coincide, setCoincide] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(consulta).matches : false
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(consulta);
    const cambiar = () => setCoincide(mq.matches);
    cambiar();
    mq.addEventListener('change', cambiar);
    return () => mq.removeEventListener('change', cambiar);
  }, [consulta]);
  return coincide;
}
