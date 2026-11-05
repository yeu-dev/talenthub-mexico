import React from 'react';
import { cx } from '../../lib/cx';

/** Los estados exactos que devuelve la API de postulaciones. */
export type EstadoPostulacion = 'pendiente' | 'revisado' | 'aceptado' | 'rechazado';

type Tono = 'neutro' | 'curso' | 'bien' | 'mal';

interface Step {
  label: string;
  /** Segmentos encendidos de 3. */
  filled: number;
  /** Color del último segmento: es el que carga el significado. */
  tono: Tono;
  dim: boolean;
}

/**
 * El color marca RESOLUCIÓN, no actividad.
 *
 * Los dos estados en curso van sin color: los distingue la posición en el
 * track, que es información más precisa que un tono. Solo los resueltos
 * llevan color, y son teal contra rojo — dos matices que siguen siendo
 * distinguibles con daltonismo rojo-verde porque difieren también en
 * luminancia. Ámbar contra rojo no lo eran.
 */
const STEPS: Record<EstadoPostulacion, Step> = {
  pendiente: { label: 'Enviada', filled: 1, tono: 'neutro', dim: true },
  revisado: { label: 'En revisión', filled: 2, tono: 'curso', dim: false },
  aceptado: { label: 'Aceptada', filled: 3, tono: 'bien', dim: false },
  rechazado: { label: 'Rechazada', filled: 3, tono: 'mal', dim: true },
};

const COLOR: Record<Tono, { claro: string; oscuro: string }> = {
  neutro: { claro: 'bg-ink-2', oscuro: 'bg-ink-2d' },
  curso: { claro: 'bg-ink', oscuro: 'bg-ink-d' },
  bien: { claro: 'bg-ok', oscuro: 'bg-ok-d' },
  mal: { claro: 'bg-danger', oscuro: 'bg-danger-d' },
};

const TEXTO: Record<Tono, { claro: string; oscuro: string }> = {
  neutro: { claro: 'text-muted', oscuro: 'text-muted-d' },
  curso: { claro: 'text-ink', oscuro: 'text-ink-d' },
  bien: { claro: 'text-ok', oscuro: 'text-ok-d' },
  mal: { claro: 'text-danger', oscuro: 'text-danger-d' },
};

interface Props {
  /** Se acepta `string` porque viene de la API; un estado desconocido cae en "Enviada". */
  estado: EstadoPostulacion | string;
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Sustituye al badge de punto + texto, que es el patrón de estado que usa
 * cualquier SaaS. Los cuatro estados no son categorías sueltas: son una
 * secuencia. El track dice en qué punto va, que es lo que realmente se
 * quiere saber — el punto de color solo repetía la etiqueta de al lado.
 */
const ProcessTrack: React.FC<Props> = ({ estado, tone = 'light', className }) => {
  const step = STEPS[estado as EstadoPostulacion] ?? STEPS.pendiente;
  const oscuro = tone === 'dark';
  const empty = oscuro ? 'bg-white/[0.14]' : 'bg-white/[0.14]';
  const neutro = oscuro ? COLOR.neutro.oscuro : COLOR.neutro.claro;
  const final = oscuro ? COLOR[step.tono].oscuro : COLOR[step.tono].claro;

  // Solo el ÚLTIMO segmento alcanzado lleva color: los anteriores son camino
  // recorrido, no significado. Si todos fueran del color del estado, el track
  // se leería como una barra de color y perdería la noción de avance.
  const fillFor = (i: number) => {
    if (i >= step.filled) return empty;
    return i === step.filled - 1 ? final : neutro;
  };

  return (
    <span className={cx('inline-flex items-center gap-[11px]', className)}>
      <span className="flex flex-none gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx('block h-[3px] w-[17px] rounded-sm', fillFor(i))} />
        ))}
      </span>
      <span className={cx('text-[0.875rem]', oscuro ? TEXTO[step.tono].oscuro : TEXTO[step.tono].claro)}>
        {step.label}
      </span>
    </span>
  );
};

export default ProcessTrack;
