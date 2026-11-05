import React from 'react';
import { cx } from '../../lib/cx';
import { useColumnaAviso } from '../PromoApp';

/** Se apaga en el último 18% del ancho: donde empieza la columna del aviso. */
export const MASCARA_AVISO = 'linear-gradient(to right, black 82%, transparent)';

/**
 * El fondo de una sección a todo lo ancho (superficie y hairlines), en una
 * capa propia detrás del contenido.
 *
 * Va aparte de la `<section>` para poder desvanecerlo: mientras el aviso de la
 * app está abierto, la página deja libre la columna derecha y el fondo se
 * cortaría en seco ahí, igual que pasaba con el velo. Con la capa aparte se
 * apaga hacia la derecha, como las franjas de `PageHeader`.
 */
const FondoSeccion: React.FC<{ className: string; children?: React.ReactNode }> = ({ className, children }) => {
  const aviso = useColumnaAviso();
  return (
    <div
      aria-hidden="true"
      className={cx('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
      style={aviso ? { maskImage: MASCARA_AVISO, WebkitMaskImage: MASCARA_AVISO } : undefined}
    >
      {/* Los halos de la sección van aquí adentro para apagarse con el fondo. */}
      {children}
    </div>
  );
};

export default FondoSeccion;
