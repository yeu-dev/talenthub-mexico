import React, { useRef } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';

interface Props {
  id: string;
  /** Lo que mide, para el lector de pantalla: "Sueldo mínimo". */
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  alCambiar: (valor: number) => void;
  /** Cómo se lee el valor: "$25,000". El mínimo se lee como `textoMinimo`. */
  formato: (valor: number) => string;
  textoMinimo: string;
  className?: string;
}

/** Cuánto se estira la barra, en px, al jalar más allá del final. Con freno. */
const estiron = (exceso: number) => 14 * (1 - Math.exp(-exceso / 60));

/**
 * Elastic Slider (React Bits): un control deslizante que, si sigues jalando
 * más allá del final, se estira un poco hacia donde jalas y regresa con un
 * resorte al soltar. Es la sensación física de "ya llegaste al tope".
 *
 * Por dentro es un `<input type="range">` nativo, invisible y encima de todo:
 * teclado (flechas, Inicio, Fin), lector de pantalla y táctil funcionan como
 * siempre. Lo que se ve (barra, relleno y perilla) solo lo sigue. Con
 * "reducir movimiento" no se estira.
 */
const SliderElastico: React.FC<Props> = ({
  id,
  etiqueta,
  valor,
  min,
  max,
  paso,
  alCambiar,
  formato,
  textoMinimo,
  className,
}) => {
  const caja = useRef<HTMLDivElement>(null);
  const escala = useMotionValue(1);
  const origen = useMotionValue(0);
  const reducido = useReducedMotion();
  const porcentaje = max > min ? ((Math.min(Math.max(valor, min), max) - min) / (max - min)) * 100 : 0;
  const texto = valor <= min ? textoMinimo : formato(valor);

  const alMover = (e: React.PointerEvent) => {
    if (reducido || e.buttons !== 1 || !caja.current) return;
    const r = caja.current.getBoundingClientRect();
    if (e.clientX > r.right) {
      origen.set(0);
      escala.set(1 + estiron(e.clientX - r.right) / r.width);
    } else if (e.clientX < r.left) {
      origen.set(1);
      escala.set(1 + estiron(r.left - e.clientX) / r.width);
    } else {
      escala.set(1);
    }
  };

  const soltar = () => {
    animate(escala, 1, { type: 'spring', stiffness: 520, damping: 18 });
  };

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <label htmlFor={id} className="text-muted">
          {etiqueta}
        </label>
        <span className="tabular text-ink" aria-hidden="true">
          {texto}
        </span>
      </div>
      <motion.div
        ref={caja}
        style={{ scaleX: escala, originX: origen }}
        className="relative mt-1.5 flex h-6 items-center"
        onPointerMove={alMover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onLostPointerCapture={soltar}
      >
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={paso}
          value={Math.min(Math.max(valor, min), max)}
          aria-valuetext={texto}
          onChange={(e) => alCambiar(Number(e.target.value))}
          onPointerDown={(e) => e.currentTarget.setPointerCapture?.(e.pointerId)}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <span aria-hidden="true" className="block h-[5px] w-full overflow-hidden rounded-pill bg-white/[0.1]">
          <span className="block h-full rounded-pill bg-accent" style={{ width: `${porcentaje}%` }} />
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-white transition-shadow peer-focus-visible:shadow-focus-accent-d"
          style={{ left: `${porcentaje}%` }}
        />
      </motion.div>
    </div>
  );
};

export default SliderElastico;
