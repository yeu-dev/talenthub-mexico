import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  MotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { EASE } from '../../lib/motion';

export interface Diapositiva {
  /** "React", "Puebla", "Remoto". */
  titulo: string;
  /** "Stack", "Ciudad" o "Modalidad". */
  tipo: string;
  /** "$6,000 – $80,000 · 4 vacantes". */
  subtitulo: string;
  ruta: string;
}

/**
 * Cintas de color para el arte de cada tarjeta. Sin fotos de stock: cada
 * tarjeta es una composición de dos cintas que se cruzan sobre un fondo, con
 * su propia paleta y ángulo. Sin ámbar, que el sistema deja fuera.
 */
const PALETAS = [
  { fondo: '#ff3b5c', a: '#ff4fa3', b: '#5b21b6' },
  { fondo: '#0f2a5c', a: '#2dd4bf', b: '#3355ff' },
  { fondo: '#2e1065', a: '#a78bfa', b: '#fb7185' },
  { fondo: '#082f49', a: '#38bdf8', b: '#7c3aed' },
  { fondo: '#4c0519', a: '#fb7185', b: '#3355ff' },
  { fondo: '#042f2e', a: '#5eead4', b: '#a78bfa' },
  { fondo: '#1e1b4b', a: '#818cf8', b: '#f472b6' },
  { fondo: '#3b0764', a: '#e879f9', b: '#22d3ee' },
];

const Arte: React.FC<{ i: number }> = ({ i }) => {
  const p = PALETAS[i % PALETAS.length];
  const giro = -28 + ((i * 17) % 40);
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: p.fondo }}>
      <div
        className="absolute -left-1/4 top-[14%] h-[40%] w-[150%]"
        style={{ background: `linear-gradient(90deg, ${p.a}, ${p.fondo})`, transform: `rotate(${giro}deg)` }}
      />
      <div
        className="absolute -left-1/4 top-[46%] h-[34%] w-[150%] opacity-90"
        style={{ background: `linear-gradient(90deg, ${p.b}, ${p.a})`, transform: `rotate(${-giro / 2}deg)` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(255,255,255,0.18),transparent_60%)]" />
    </div>
  );
};

/** El ancho de las tarjetas de los lados, de la más cercana al centro a la más lejana. */
const LADOS = { escritorio: [190, 64, 22], celular: [16] };
const SEPARACION = 14;

/** Cuántos píxeles de scroll de la página pasan una tarjeta. */
export const PX_POR_TARJETA = 110;

/**
 * Lo que ocupa, en alto, todo lo que no es la tarjeta del centro en la
 * pantalla fija: la barra, el título y su párrafo, el texto de abajo y el aire.
 * Con eso la tarjeta se encoge en pantallas bajas y todo cabe en una pantalla.
 */
const ALTO_RESERVADO = 400;

/** Mide el ancho disponible y el alto de la ventana. */
const useMedidas = (ref: React.RefObject<HTMLDivElement | null>) => {
  const [medidas, setMedidas] = useState({ ancho: 0, alto: 800 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setMedidas({ ancho: el.clientWidth, alto: window.innerHeight });
    medir();
    window.addEventListener('resize', medir);
    // Sin ResizeObserver (navegadores viejos, el jsdom de las pruebas) basta
    // con el cambio de tamaño de la ventana.
    if (typeof ResizeObserver === 'undefined') return () => window.removeEventListener('resize', medir);
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [ref]);
  return medidas;
};

interface Medidas {
  anchos: number[]; // 0 = centro, luego los lados
  centros: number[]; // dónde queda el centro de la tarjeta a distancia k
  altoCentro: number;
  altoLado: number;
}

/** Interpola un arreglo por índice fraccionario: valor(1.4) cae entre [1] y [2]. */
const entre = (arr: number[], d: number) => {
  if (d >= arr.length - 1) return arr[arr.length - 1];
  const k = Math.floor(d);
  const t = d - k;
  return arr[k] + (arr[k + 1] - arr[k]) * t;
};

/**
 * Una tarjeta. Su tamaño, lugar y color salen de su distancia al centro, que
 * es fraccionaria mientras se hace scroll: así todo avanza continuo.
 */
const Tarjeta: React.FC<{
  i: number;
  s: Diapositiva;
  pos: MotionValue<number>;
  m: Medidas;
  esActual: boolean;
  alElegir: (i: number) => void;
}> = ({ i, s, pos, m, esActual, alElegir }) => {
  const visibles = m.anchos.length - 1;
  const ancho = useTransform(pos, (p) => entre([...m.anchos, 0], Math.abs(i - p)));
  const alto = useTransform(pos, (p) => m.altoCentro + (m.altoLado - m.altoCentro) * Math.min(1, Math.abs(i - p)));
  const x = useTransform(pos, (p) => {
    const d = i - p;
    return Math.sign(d) * entre(m.centros, Math.abs(d)) - entre([...m.anchos, 0], Math.abs(d)) / 2;
  });
  const gris = useTransform(pos, (p) => Math.min(1, Math.abs(i - p)));
  const filtro = useTransform(gris, (g) => `grayscale(${g}) brightness(${1 - g * 0.45})`);
  const opacidad = useTransform(pos, (p) => (Math.abs(i - p) > visibles + 0.5 ? 0 : 1));

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 overflow-hidden rounded-[20px]"
      style={{ width: ancho, height: alto, x, y: '-50%', filter: filtro, opacity: opacidad }}
    >
      <Link
        to={s.ruta}
        tabIndex={esActual ? 0 : -1}
        aria-hidden={!esActual}
        aria-label={esActual ? `${s.titulo}: ${s.subtitulo}. Ver vacantes` : undefined}
        draggable={false}
        onClick={(e) => {
          // Las de los lados no abren la búsqueda: se traen al centro.
          if (!esActual) {
            e.preventDefault();
            alElegir(i);
          }
        }}
        className="absolute inset-0 block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-on-dark"
      >
        {/* El arte siempre mide lo de la tarjeta del centro y va centrado:
            las angostas dejan ver solo su franja de en medio. */}
        <span
          className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2"
          style={{ width: m.anchos[0], height: m.altoCentro }}
        >
          <Arte i={i} />
        </span>
      </Link>
    </motion.div>
  );
};

/**
 * Carrusel de la portada (la mecánica del Prism Carousel de React Bits, con
 * código propio): una tarjeta grande al centro y, a cada lado, tarjetas cada
 * vez más angostas y en gris que dejan ver solo una franja de su arte, como
 * persianas. Debajo, el tipo, el título y los datos reales de la del centro.
 *
 * Avanza con el scroll de la página. Su sección (`Explora`) mide una pantalla
 * más `PX_POR_TARJETA` por tarjeta y su contenido va fijo (`sticky`): al
 * llegar, la sección se queda pegada, el scroll pasa las tarjetas de la
 * primera a la última, y al terminar se despega y la página sigue. Como es el
 * scroll nativo, funciona igual con rueda, trackpad, barra, teclado y el dedo,
 * y nada se queda atrapado.
 * - Arrastrar con el ratón mueve la página hasta la tarjeta que se arrastra.
 * - Clic en una tarjeta de un lado lleva la página hasta ella; la del centro
 *   abre su búsqueda.
 * - Teclado dentro del carrusel: flechas izquierda y derecha.
 * Con "reducir movimiento" salta de tarjeta en tarjeta, sin deslizarse.
 */
const Carrusel: React.FC<{
  diapositivas: Diapositiva[];
  /** La sección alta que se queda fija; su scroll mueve el carrusel. */
  seccion: React.RefObject<HTMLElement | null>;
}> = ({ diapositivas, seccion }) => {
  const total = diapositivas.length;
  const pista = useRef<HTMLDivElement>(null);
  const { ancho, alto: altoVentana } = useMedidas(pista);
  const reducido = useReducedMotion();

  // 0 al entrar la sección arriba, 1 al terminar: de la primera a la última.
  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start start', 'end end'] });
  const crudo = useTransform(scrollYProgress, (v) => {
    const p = Math.min(1, Math.max(0, v)) * (total - 1);
    return reducido ? Math.round(p) : p;
  });
  // Un resorte corto suaviza los saltos de la rueda sin sentirse atrasado.
  const suave = useSpring(crudo, { stiffness: 260, damping: 34, mass: 0.6 });
  const pos = reducido ? crudo : suave;

  const [actual, setActual] = useState(0);
  useMotionValueEvent(pos, 'change', (p) => setActual(Math.min(total - 1, Math.max(0, Math.round(p)))));

  /** Lleva la página al punto donde la tarjeta `i` queda al centro. */
  const irA = (i: number, comportamiento: ScrollBehavior = 'smooth') => {
    const el = seccion.current;
    if (!el) return;
    const destino = Math.min(total - 1, Math.max(0, i));
    const inicio = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: inicio + destino * PX_POR_TARJETA, behavior: reducido ? 'auto' : comportamiento });
  };

  // Arrastrar con el ratón: mueve la página como si se hiciera scroll. En
  // táctil el dedo ya hace scroll vertical solo; el horizontal se suma aquí.
  const arrastre = useRef<{ x: number; desde: number; movio: boolean } | null>(null);

  const celular = ancho > 0 && ancho < 640;
  const lados = celular ? LADOS.celular : LADOS.escritorio;
  const espacioLados = lados.reduce((s, w) => s + w + SEPARACION, 0) * 2;
  // La tarjeta del centro: lo que deje el ancho, pero sin pasarse del alto
  // disponible en la pantalla fija.
  const altoMaximo = Math.max(170, altoVentana - ALTO_RESERVADO);
  let anchoCentro = Math.max(240, Math.min(600, ancho - espacioLados));
  let altoCentro = Math.round(anchoCentro * (2 / 3));
  if (altoCentro > altoMaximo) {
    altoCentro = altoMaximo;
    anchoCentro = Math.round(altoCentro * 1.5);
  }
  const anchos = [anchoCentro, ...lados];
  const centros = anchos.reduce<number[]>((acc, w, k) => {
    if (k === 0) return [0];
    acc.push(acc[k - 1] + anchos[k - 1] / 2 + SEPARACION + w / 2);
    return acc;
  }, []);
  const medidas: Medidas = {
    anchos,
    centros: [...centros, centros[centros.length - 1] + 40],
    altoCentro,
    altoLado: Math.round(altoCentro * 0.66),
  };

  if (total === 0) return null;
  const d = diapositivas[actual];

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Busca por stack, ciudad o modalidad"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          irA(actual + 1);
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          irA(actual - 1);
        }
      }}
    >
      <div
        ref={pista}
        className="relative cursor-grab select-none overflow-hidden active:cursor-grabbing"
        style={{ height: altoCentro }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') return;
          arrastre.current = { x: e.clientX, desde: pos.get(), movio: false };
        }}
        onPointerMove={(e) => {
          const a = arrastre.current;
          if (!a) return;
          const dx = e.clientX - a.x;
          if (Math.abs(dx) > 6) a.movio = true;
          if (a.movio) irA(a.desde - dx / (lados[0] + SEPARACION), 'auto');
        }}
        onPointerUp={() => {
          if (arrastre.current?.movio) irA(Math.round(pos.get()));
          window.setTimeout(() => (arrastre.current = null), 0);
        }}
        onPointerLeave={() => {
          if (arrastre.current?.movio) irA(Math.round(pos.get()));
          arrastre.current = null;
        }}
        onClickCapture={(e) => {
          // Si se arrastró, el clic que sigue no abre la tarjeta.
          if (arrastre.current?.movio) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {diapositivas.map((s, i) => (
          <Tarjeta key={s.ruta} i={i} s={s} pos={pos} m={medidas} esActual={i === actual} alElegir={irA} />
        ))}
      </div>

      <div className="mt-6 text-center">
        <motion.div
          key={actual}
          initial={reducido ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          aria-live="polite"
        >
          <p className="text-[0.8125rem] uppercase tracking-[0.08em] text-muted-d">{d.tipo}</p>
          <p className="mt-1 font-heading text-[1.375rem] font-demi text-ink-d">{d.titulo}</p>
          <p className="tabular mt-1 text-[0.9375rem] text-ink-2d">{d.subtitulo}</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Carrusel;
