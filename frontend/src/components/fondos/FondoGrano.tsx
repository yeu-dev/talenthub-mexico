import React from 'react';
import Grainient from './Grainient';
import { useDesdeMd } from './FondoVivo';

/**
 * El grano de `/empresas` (Grainient, de React Bits), detrás del hero y del
 * panel (`banda`: a media página entra y sale suave). Es la identidad de esa
 * página; la portada tiene el velo. Un degradado oscuro de azul de marca y
 * violeta que fluye muy despacio, con grano de película encima.
 *
 * Es uno de los tres fondos que se probaron para la portada (Aurora, Velo y
 * Grano). La portada se quedó con el velo; a Yeu también le gustó el grano, y
 * aquí le da a la página de empresas una identidad propia. Los colores son los
 * de esa prueba, ya en intensidad baja, con violeta en lugar del teal (Yeu no
 * quería verde).
 *
 * - Sin seguir al cursor ni remolinos al hacer clic (DESIGN.md).
 * - Quieto con "reducir movimiento" (lo trae el componente) y en celular:
 *   hace su entrada y se queda en un cuadro fijo, sin gastar batería.
 * - El grano no se anima: un grano que parpadea cansa a los 10 segundos.
 * - Oscuro de origen (los extremos son `night`): el título en `ink-d` y el
 *   párrafo en `ink-2d` siguen leyéndose como sobre el fondo de siempre.
 * - Se apaga hacia abajo para que la sección de abajo entre sin filo.
 */
const MASCARA = 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)';
/** A media página entra y sale suave: sin filo arriba ni abajo. */
const MASCARA_BANDA = 'linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%)';

const FondoGrano: React.FC<{ banda?: boolean }> = ({ banda = false }) => {
  const mascara = banda ? MASCARA_BANDA : MASCARA;
  const desdeMd = useDesdeMd();

  return (
    <div
      aria-hidden="true"
      // A media página va más tenue (55%): en el panel, el azul quedaba muy
      // brillante detrás del enlace y del texto gris de las filas.
      className={`pointer-events-none absolute inset-0 -z-10 ${banda ? 'opacity-[0.55]' : ''}`}
      style={{ maskImage: mascara, WebkitMaskImage: mascara }}
    >
      <Grainient
        colors={['#0a0a0a', '#0c1236', '#1d32b8', '#3b1a78', '#0a0a0a']}
        angle={130}
        speed={desdeMd ? 0.35 : 0}
        flow={0.6}
        softness={1}
        grainAmount={0.05}
        saturation={0.85}
        grainAnimated={false}
        interactive={false}
        clickSwirl={false}
        dpr={desdeMd ? undefined : 1}
      />
    </div>
  );
};

export default FondoGrano;
