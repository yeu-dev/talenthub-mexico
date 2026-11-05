import React, { useEffect, useState } from 'react';
import DarkVeil from './DarkVeil';

/**
 * El velo azul que se mueve detrás de la portada y de las pantallas de sesión
 * (Dark Veil, de React Bits).
 *
 * Reglas:
 * - solo desde `md`: en celular se quedan los halos quietos, que no gastan
 *   batería ni GPU;
 * - sin interacción con el cursor (DESIGN.md prohíbe lo que lo sigue);
 * - se pausa solo con "reducir movimiento", con la pestaña oculta y cuando sale
 *   de la pantalla (lo trae el componente);
 * - sin WebGL (apagado en el navegador o sin soporte), el lienzo queda
 *   transparente y se ven los halos de siempre;
 * - intensidad medida: al 45% y en su punto más brillante, el texto gris
 *   (`muted`) sobre los paneles oscurecidos da 4.97:1 y `muted-d` 4.66:1.
 *   Al 50% `muted-d` ya baja a 4.53: no subirla más sin oscurecer los paneles.
 */

/** `true` desde 768px. Se escucha el cambio para no montar WebGL al encoger la ventana. */
const useDesdeMd = () => {
  const consulta = '(min-width: 768px)';
  const [coincide, setCoincide] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(consulta).matches
      : false
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(consulta);
    const cambiar = () => setCoincide(mq.matches);
    mq.addEventListener('change', cambiar);
    return () => mq.removeEventListener('change', cambiar);
  }, []);
  return coincide;
};

/**
 * Detrás de todo (`-z-10`) y sin recibir clics.
 *
 * En la portada se monta desde `App`, fuera del contenedor de la página: ese
 * contenedor deja libre la columna derecha para el aviso de la app, y si el
 * velo viviera adentro se cortaría en seco donde empieza esa columna.
 * - `pagina` (portada): ocupa el hero y el buscador y se apaga antes de la
 *   lista de sueldos, donde el texto gris de las filas dejaría de leerse.
 * - `pantalla` (sesión): cubre toda la pantalla, que no hace scroll.
 * - `franja` (la banda oscura de arriba de las demás páginas): más tenue, al
 *   25%, porque ahí la ruta y las pestañas van en gris directo sobre el velo
 *   (`muted-d` 4.70:1 en su punto más brillante). Se apaga hacia abajo, donde
 *   se montan los paneles de vidrio, y hacia la derecha, donde la página deja
 *   la columna del aviso de la app: así no se corta en seco.
 */
const MASCARA_FRANJA = 'linear-gradient(to bottom, black 45%, transparent), linear-gradient(to right, black 78%, transparent)';

const FondoVivo: React.FC<{ alto?: 'pagina' | 'pantalla' | 'franja' }> = ({ alto = 'pagina' }) => {
  const desdeMd = useDesdeMd();
  if (!desdeMd) return null;

  return (
    <div
      aria-hidden="true"
      className={
        alto === 'pagina'
          ? 'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1000px] [mask-image:linear-gradient(to_bottom,black_35%,transparent_80%)]'
          : 'pointer-events-none absolute inset-0 -z-10'
      }
      style={
        alto === 'franja'
          ? { maskImage: MASCARA_FRANJA, WebkitMaskImage: MASCARA_FRANJA, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }
          : undefined
      }
    >
      <DarkVeil
        color="#3355ff"
        speed={0.3}
        brightness={0.85}
        glow={0.25}
        grain={0.03}
        opacity={alto === 'franja' ? 0.25 : 0.45}
        mouseInteraction={false}
      />
    </div>
  );
};

export default FondoVivo;
