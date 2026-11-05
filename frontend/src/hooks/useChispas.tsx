import React, { useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Chispas al hacer clic (Click Spark, de React Bits, rehecho sin dependencias).
 *
 * Ocho trazos cortos salen del punto del clic y se apagan en 0.42 s. No siguen
 * al cursor: nacen donde se hizo clic y ya. El lienzo solo dibuja mientras hay
 * chispas vivas; el resto del tiempo no corre ningún cuadro.
 *
 * Uso: el lienzo va DENTRO del botón o enlace (que necesita `position:
 * relative`, la da la clase `borde-luz`) y `disparar` va en su `onClick`.
 * El lienzo sobresale 40px por lado para que las chispas no se corten.
 * Con "reducir movimiento" no sale ninguna.
 */

const CHISPAS = 8;
const DURACION = 420;
const RADIO = 22;
const LARGO = 9;
const MARGEN = 40;
/** `accent-on-dark`: el azul claro que se lee sobre el fondo oscuro. */
const COLOR = '#9db0ff';

interface Chispa {
  x: number;
  y: number;
  angulo: number;
  inicio: number;
}

export function useChispas() {
  const reducido = useReducedMotion();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const chispas = useRef<Chispa[]>([]);
  const cuadro = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (cuadro.current !== null) cancelAnimationFrame(cuadro.current);
    },
    []
  );

  const dibujar = useCallback((ahora: number) => {
    const canvas = lienzo.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      cuadro.current = null;
      chispas.current = [];
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    chispas.current = chispas.current.filter((c) => ahora - c.inicio < DURACION);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2 * dpr;
    ctx.lineCap = 'round';
    for (const c of chispas.current) {
      const t = Math.max(0, (ahora - c.inicio) / DURACION);
      const e = 1 - (1 - t) * (1 - t); // ease-out
      const d = e * RADIO;
      const largo = LARGO * (1 - e);
      const cos = Math.cos(c.angulo);
      const sen = Math.sin(c.angulo);
      ctx.beginPath();
      ctx.moveTo((c.x + d * cos) * dpr, (c.y + d * sen) * dpr);
      ctx.lineTo((c.x + (d + largo) * cos) * dpr, (c.y + (d + largo) * sen) * dpr);
      ctx.stroke();
    }
    cuadro.current = chispas.current.length ? requestAnimationFrame(dibujar) : null;
  }, []);

  const disparar = useCallback(
    (e: React.MouseEvent) => {
      const canvas = lienzo.current;
      if (reducido || !canvas) return;
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const ancho = Math.round(r.width * dpr);
      const alto = Math.round(r.height * dpr);
      if (canvas.width !== ancho || canvas.height !== alto) {
        canvas.width = ancho;
        canvas.height = alto;
      }
      // Un clic desde el teclado (Enter) llega sin coordenadas: sale del centro.
      const desdeTeclado = e.clientX === 0 && e.clientY === 0;
      const x = desdeTeclado ? r.width / 2 : e.clientX - r.left;
      const y = desdeTeclado ? r.height / 2 : e.clientY - r.top;
      const inicio = performance.now();
      for (let n = 0; n < CHISPAS; n += 1) {
        chispas.current.push({ x, y, angulo: (2 * Math.PI * n) / CHISPAS, inicio });
      }
      if (cuadro.current === null) cuadro.current = requestAnimationFrame(dibujar);
    },
    [reducido, dibujar]
  );

  const elemento = (
    <canvas
      ref={lienzo}
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ inset: -MARGEN, width: `calc(100% + ${MARGEN * 2}px)`, height: `calc(100% + ${MARGEN * 2}px)` }}
    />
  );

  return { lienzo: elemento, disparar };
}
