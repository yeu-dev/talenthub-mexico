import React, { useEffect, useRef } from 'react';

/**
 * Una trama fina de triángulos, círculos y cuadros en gris, cuyo tamaño
 * dibuja manchas de luz que se mueven despacio. Es la idea de "Shape Waves"
 * de React Bits rehecha en canvas 2D: el original dibuja con WebGPU y la
 * librería `vgpu` (versión 0.6, ~9 MB, con dependencias de Node que el build
 * de CRA no trae), y su licencia no está clara. Este no usa nada externo.
 *
 * Cómo se parece al original:
 * - celdas de 8 px: se lee como trama de imprenta, no como figuras sueltas;
 * - el brillo sale de ruido suave en dos capas que se desplazan en sentidos
 *   distintos (manchas grandes que respiran), no de ondas regulares;
 * - la figura de cada celda sale de otro ruido, más grande y más lento: se
 *   forman zonas de triángulos, de círculos y de cuadros;
 * - escala de grises.
 *
 * Para que miles de figuras no traben la página: se agrupan por figura y por
 * tono, y cada grupo se pinta con un solo `fill()` (unas 15 llamadas por
 * cuadro en lugar de miles). Corre a 30 cuadros por segundo.
 *
 * Reglas, las mismas que el velo: no sigue al cursor; se pausa con la pestaña
 * oculta o fuera de pantalla; con "reducir movimiento" y en celular dibuja un
 * solo cuadro quieto. Al montarse, la trama se abre desde el centro.
 */

const CELDA = 8; // px CSS
const FPS = 30;
const INTRO_MS = 1600;
const TONOS = 5; // niveles de brillo con los que se agrupa

// ── Ruido suave (value noise) ───────────────────────────────────────────────
const PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  // Barajado fijo: la misma trama en cada carga.
  let semilla = 7;
  for (let i = 255; i > 0; i -= 1) {
    semilla = (semilla * 16807) % 2147483647;
    const j = semilla % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
})();

const valor = (x: number, y: number) => PERM[(PERM[x & 255] + y) & 255] / 255;
const suave = (t: number) => t * t * (3 - 2 * t);

const ruido = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = suave(x - xi);
  const fy = suave(y - yi);
  const a = valor(xi, yi);
  const b = valor(xi + 1, yi);
  const c = valor(xi, yi + 1);
  const d = valor(xi + 1, yi + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

const FondoFiguras: React.FC<{ className?: string }> = ({ className }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = lienzo.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const quieto =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(min-width: 768px)').matches;

    let ancho = 0;
    let alto = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const medir = () => {
      const r = canvas.getBoundingClientRect();
      ancho = r.width;
      alto = r.height;
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Un camino por figura y por tono; se reusan en cada cuadro.
    const grupos: Path2D[][] = [];
    const inicio = performance.now();

    const dibujar = (ahora: number) => {
      const t = (ahora - inicio) / 1000;
      ctx.clearRect(0, 0, ancho, alto);
      for (let f = 0; f < 3; f += 1) {
        grupos[f] = [];
        for (let k = 0; k < TONOS; k += 1) grupos[f][k] = new Path2D();
      }

      const cx = ancho / 2;
      const cy = alto / 2;
      const radioMax = Math.hypot(cx, cy);
      const frente = quieto ? Infinity : ((ahora - inicio) / INTRO_MS) * radioMax;
      const columnas = Math.ceil(ancho / CELDA);
      const filas = Math.ceil(alto / CELDA);

      for (let j = 0; j < filas; j += 1) {
        for (let i = 0; i < columnas; i += 1) {
          const x = i * CELDA + CELDA / 2;
          const y = j * CELDA + CELDA / 2;
          const distancia = Math.hypot(x - cx, y - cy);
          if (distancia > frente) continue;

          // Dos capas que se desplazan en sentidos distintos: manchas que respiran.
          const n =
            ruido(i * 0.045 + t * 0.35, j * 0.045 - t * 0.12) * 0.65 +
            ruido(i * 0.11 - t * 0.25, j * 0.11 + t * 0.3) * 0.35;
          const v = Math.max(0, Math.min(1, (n - 0.25) / 0.6));
          if (v < 0.05) continue;

          const nacer = quieto ? 1 : Math.min(1, (frente - distancia) / 220);
          const tam = CELDA * 0.92 * Math.pow(v, 1.4) * nacer;
          if (tam < 1) continue;

          // La figura sale de un ruido grande y lento: zonas de cada forma.
          const zona = ruido(i * 0.018 + 50, j * 0.018 + t * 0.05);
          const figura = zona < 0.4 ? 0 : zona < 0.62 ? 1 : 2;
          const tono = Math.min(TONOS - 1, Math.floor(v * TONOS));
          const p = grupos[figura][tono];
          const m = tam / 2;

          if (figura === 0) {
            p.rect(x - m, y - m, tam, tam);
          } else if (figura === 1) {
            p.moveTo(x + m, y);
            p.arc(x, y, m, 0, Math.PI * 2);
          } else {
            p.moveTo(x, y - m);
            p.lineTo(x + m, y + m * 0.85);
            p.lineTo(x - m, y + m * 0.85);
            p.closePath();
          }
        }
      }

      // Tope del 28% de blanco (antes 72%): con más, la trama competía con
      // las letras que van encima. Así se lee como textura, no como imagen.
      for (let k = 0; k < TONOS; k += 1) {
        ctx.fillStyle = `rgba(237, 237, 237, ${0.06 + (k / (TONOS - 1)) * 0.22})`;
        for (let f = 0; f < 3; f += 1) ctx.fill(grupos[f][k]);
      }
    };

    medir();

    // ResizeObserver y no `resize` de la ventana: el lienzo puede cambiar de
    // tamaño sin que la ventana cambie, y con un tamaño viejo la trama se estira.
    if (quieto) {
      dibujar(inicio + 6000);
      const tamano = new ResizeObserver(() => {
        medir();
        dibujar(inicio + 6000);
      });
      tamano.observe(canvas);
      return () => tamano.disconnect();
    }

    let cuadro = 0;
    let ultimo = 0;
    let visible = true;

    const bucle = (ahora: number) => {
      cuadro = requestAnimationFrame(bucle);
      if (!visible || document.visibilityState !== 'visible') return;
      if (ahora - ultimo < 1000 / FPS) return;
      ultimo = ahora;
      dibujar(ahora);
    };
    cuadro = requestAnimationFrame(bucle);

    const observador = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
    });
    observador.observe(canvas);
    const tamano = new ResizeObserver(medir);
    tamano.observe(canvas);

    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      tamano.disconnect();
    };
  }, []);

  return <canvas ref={lienzo} aria-hidden="true" className={className} />;
};

export default FondoFiguras;
