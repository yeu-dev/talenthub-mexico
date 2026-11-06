import React, { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface Props {
  /** El número final. Si no es número (un "—" mientras carga), se muestra tal cual. */
  valor: number | string;
  className?: string;
}

/**
 * Count Up (React Bits): el número cuenta desde 0 hasta su valor al entrar en
 * pantalla, y si después cambia, cuenta desde el anterior hasta el nuevo.
 *
 * Solo en los paneles de métricas (Mis vacantes, Mis postulaciones y el
 * validador): ahí el número ES la noticia y verlo llegar le da peso. El texto
 * se escribe directo en el nodo (sin estado de React), así que no re-renderiza
 * la página en cada cuadro. Con "reducir movimiento" aparece el valor final.
 * El lector de pantalla siempre lee el valor final (`aria-label`).
 */
const Contador: React.FC<Props> = ({ valor, className }) => {
  const nodo = useRef<HTMLSpanElement>(null);
  const visto = useInView(nodo, { once: true });
  const reducido = useReducedMotion();
  const anterior = useRef(0);

  useEffect(() => {
    const el = nodo.current;
    if (!el || typeof valor !== 'number') return;
    if (!visto) return;
    if (reducido) {
      el.textContent = String(valor);
      anterior.current = valor;
      return;
    }
    const controles = animate(anterior.current, valor, {
      duration: 0.9,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    anterior.current = valor;
    return () => controles.stop();
  }, [valor, visto, reducido]);

  if (typeof valor !== 'number') return <span className={className}>{valor}</span>;

  return (
    <span ref={nodo} className={className} aria-label={String(valor)}>
      0
    </span>
  );
};

export default Contador;
