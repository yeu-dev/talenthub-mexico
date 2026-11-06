import React, { useEffect, useState } from 'react';
import { usePeticionesEnCurso } from '../lib/cargas';

/** Lo que tiene que tardar una petición para que aparezca la barra. */
const RETRASO = 300;

/**
 * La barra de carga global: una línea azul delgada en el borde de abajo de la
 * barra de navegación, mientras alguna petición a la API tarda más de 0.3 s
 * (cargar una página, iniciar sesión, guardar). Antes de 0.3 s no aparece,
 * para que lo rápido no parpadee.
 *
 * Así ninguna espera se ve congelada, aunque la página no tenga esqueleto.
 * Con "reducir movimiento" el tramo no cruza: se queda una línea quieta.
 * El lector de pantalla no la oye; lo que se anuncia es `AvisoLento`.
 */
const BarraCarga: React.FC = () => {
  const enCurso = usePeticionesEnCurso();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (enCurso === 0) {
      setVisible(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), RETRASO);
    return () => window.clearTimeout(id);
  }, [enCurso]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 -bottom-px h-[2px] overflow-hidden transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="block h-full w-2/5 animate-barra rounded-pill bg-accent-on-dark motion-reduce:w-full motion-reduce:opacity-60" />
    </div>
  );
};

export default BarraCarga;
