import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Search } from '../components/icons';
import { Button, clasesBoton } from '../components/ui';
import { useSinAvisoApp } from '../components/PromoApp';
import { rutaBusqueda } from '../lib/vacantes';
import { EASE } from '../lib/motion';
import { useTitulo } from '../hooks/useTitulo';
import FondoFiguras from '../components/fondos/FondoFiguras';

/** El halo que respira detrás del número. Quieto con "reducir movimiento". */
const Halo: React.FC = () => {
  const reducido = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[42%] -z-10 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,102,255,0.30),rgba(56,190,178,0.08)_55%,transparent_75%)]"
      animate={reducido ? undefined : { opacity: [0.75, 1, 0.75], scale: [0.96, 1.03, 0.96] }}
      transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
    />
  );
};

/**
 * La página para cualquier ruta que no existe.
 *
 * Antes no había: una URL mal escrita o un enlace viejo dejaba solo la barra y
 * el pie, con un hueco en medio. Ahora todo va centrado alrededor de un punto
 * focal, un "404" enorme en vidrio, y debajo solo lo que hace falta: qué pasó
 * y las dos salidas. El buscador queda al final, discreto, para quien llegó
 * por un enlace viejo buscando una vacante.
 *
 * La ruta que se escribió no se repite en pantalla a propósito: no aporta
 * nada y cualquiera podría poner ahí el texto que quisiera.
 *
 * Detrás, el halo que respira y una trama de figuras en movimiento
 * (`FondoFiguras`), tenue donde está el texto y completa a los costados.
 */
const NoEncontrada: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  useTitulo('Página no encontrada');
  // En la 404 nada debe competir con la salida: el aviso de la app se esconde.
  useSinAvisoApp();

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(rutaBusqueda({ q }));
  };

  return (
    // Sube bajo la barra de vidrio, como las demás bandas, para que el halo se
    // vea pasar por detrás de ella.
    <div className="relative isolate -mt-[var(--nav-flow)] flex min-h-[100svh] items-center justify-center overflow-hidden mesh-page px-6 pb-16 pt-[calc(var(--nav-flow)+3rem)] text-center">
      <Halo />
      {/* Zona tranquila al 10% donde está todo lo que se lee (número, texto,
          botones y buscador) y la trama completa solo a los costados. Peor
          caso medido (punto al 28% bajo la zona tranquila): `ink-2` sobre la
          trama da 10.6:1. En celular el texto ocupa casi todo el ancho, así
          que ahí la trama va a la mitad. */}
      <FondoFiguras className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-50 md:opacity-100 [mask-image:radial-gradient(ellipse_45%_73%_at_50%_55%,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.1)_55%,black_100%)]" />

      <div className="w-full max-w-2xl">
        <motion.p
          aria-hidden="true"
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.75, ease: EASE }}
          // Es ilustración, no un titular: por eso pasa del tope de 52px de
          // DESIGN.md y va oculto al lector de pantalla. El título real es el h1.
          className="select-none bg-gradient-to-b from-white/90 via-white/45 to-white/[0.04] bg-clip-text font-heading text-[clamp(7.5rem,24vw,15rem)] font-demi leading-none tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.16)]"
        >
          404
        </motion.p>

        <h1 className="mt-6 font-heading text-[clamp(1.75rem,3.6vw,2.375rem)] font-mid leading-tight tracking-[-0.02em] text-ink">
          Esta página no existe
        </h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-body text-ink-2">
          Puede que el enlace esté mal escrito o que la página haya cambiado de lugar.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/vacantes" className={clasesBoton()}>
            <ArrowRight size={15} strokeWidth={1.8} />
            Ver vacantes
          </Link>
          <Link to="/" className={clasesBoton({ variant: 'ghost' })}>
            <ArrowLeft size={15} strokeWidth={1.8} />
            Ir al inicio
          </Link>
        </div>

        {/* Secundario, como en GitHub: una línea discreta al final. */}
        <form
          role="search"
          onSubmit={buscar}
          className="mx-auto mt-12 flex max-w-md items-center gap-2 border-t border-hairline pt-8"
        >
          <label className="flex flex-1 items-center gap-2.5 rounded-pill border border-hairline bg-white/[0.04] px-4 py-2 transition-colors focus-within:border-accent focus-within:shadow-focus-accent">
            <Search size={16} strokeWidth={1.7} className="flex-none text-muted" aria-hidden="true" />
            <span className="sr-only">Buscar vacantes por puesto, empresa o tecnología</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca una vacante"
              className="w-full bg-transparent text-[0.9375rem] text-ink placeholder:text-muted focus:outline-none"
            />
          </label>
          <Button type="submit" variant="ghost" size="sm">
            <Search size={14} strokeWidth={1.8} />
            Buscar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NoEncontrada;
