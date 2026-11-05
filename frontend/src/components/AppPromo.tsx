import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Clock, Download, Image, Map, MessageCircle, QrCode, ScanLine, X } from 'lucide-react';
import { PLAY_STORE_URL } from '../lib/app';
import { cx } from '../lib/cx';
import { EASE } from '../lib/motion';

/** Cerrado en esta visita: en la siguiente vuelve a abrirse grande. */
const CLAVE = 'th_app_promo_mini';

const leer = () => {
  try {
    return sessionStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
};

const guardar = (mini: boolean) => {
  try {
    if (mini) sessionStorage.setItem(CLAVE, '1');
    else sessionStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento solo se olvida al recargar */
  }
};

/** Pantallas cerradas: ahí la única salida útil es la que da la página. */
const SIN_AVISO = ['/login', '/register', '/olvide-password', '/restablecer-password', '/checkout'];

/** Los íconos de relleno de la pantalla de inicio: grises, para que destaque el de TalentHub. */
const APPS = [
  { nombre: 'Cámara', Icono: Camera },
  { nombre: 'Mensajes', Icono: MessageCircle },
  { nombre: 'Fotos', Icono: Image },
  { nombre: 'Mapas', Icono: Map },
  { nombre: 'Reloj', Icono: Clock },
];

/**
 * Un celular dibujado con CSS en su pantalla de inicio, con TalentHub ya
 * instalada entre las apps de siempre: así se ve el resultado de escanear.
 * El de TalentHub es el ícono real (el mismo de Play Store); los demás van
 * en gris. Asoma desde abajo y la tarjeta lo corta a propósito.
 */
const Celular: React.FC = () => (
  <div
    aria-hidden="true"
    className="mx-auto -mb-16 mt-6 h-[210px] w-[200px] rounded-t-[34px] border-[6px] border-b-0 border-[#161616] bg-white px-4 pt-3"
  >
    <div className="relative flex items-center justify-between px-1 text-[9px] font-demi text-[#161616]">
      <span className="tabular">9:41</span>
      <span className="absolute left-1/2 top-0 h-[16px] w-[56px] -translate-x-1/2 rounded-pill bg-[#161616]" />
      <span className="flex items-center gap-[3px]">
        <span className="h-[6px] w-[3px] rounded-[1px] bg-[#161616]" />
        <span className="h-[8px] w-[3px] rounded-[1px] bg-[#161616]" />
        <span className="ml-0.5 h-[7px] w-[14px] rounded-[2px] border border-[#161616]" />
      </span>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-3">
      <div className="flex flex-col items-center gap-1">
        <img src="/icon-192.png" alt="" className="h-[42px] w-[42px] rounded-[11px] ring-2 ring-accent ring-offset-2" />
        <span className="text-[8.5px] font-demi text-[#161616]">TalentHub</span>
      </div>
      {APPS.map(({ nombre, Icono }) => (
        <div key={nombre} className="flex flex-col items-center gap-1">
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#f1f3f8]">
            <Icono size={19} strokeWidth={1.6} className="text-[#6b6b6b]" />
          </span>
          <span className="text-[8.5px] text-[#6b6b6b]">{nombre}</span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * La tarjeta con el QR y el celular. Es clara a propósito sobre el sitio
 * oscuro, por eso usa colores fijos y no los tokens (que ahora son oscuros).
 */
export const TarjetaApp: React.FC<{ onCerrar?: () => void; className?: string }> = ({ onCerrar, className }) => (
  <aside
    aria-label="Descarga la app de TalentHub"
    className={cx(
      'relative w-[300px] overflow-hidden rounded-card border border-white/40 bg-[rgba(238,241,255,0.96)] px-6 pt-6 text-center backdrop-blur-overlay backdrop-saturate-150',
      className
    )}
  >
    {onCerrar && (
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Minimizar aviso de la app"
        className="absolute right-3 top-3 rounded-pill p-1.5 text-[#3f4045] transition-colors hover:bg-white hover:text-[#161616]"
      >
        <X size={18} strokeWidth={1.8} />
      </button>
    )}

    <div className="mx-auto w-fit rounded-ui bg-white p-3">
      <QRCodeSVG value={PLAY_STORE_URL} size={120} bgColor="#ffffff" fgColor="#161616" level="M" />
    </div>

    <h2 className="mt-4 font-heading text-[1.375rem] font-demi leading-tight tracking-[-0.01em] text-[#161616]">
      Lleva TalentHub en tu celular
    </h2>
    <p className="mt-2 flex items-center justify-center gap-1.5 text-[0.875rem] text-[#3f4045]">
      <ScanLine size={15} strokeWidth={1.7} aria-hidden="true" />
      Escanéalo con tu cámara
    </p>
    <p className="mt-1 text-[0.75rem] text-[#6b6b6b]">Por ahora solo para testers</p>

    <Celular />
  </aside>
);

/**
 * Aviso para descargar la app, en todas las páginas públicas hasta que se
 * inicia sesión (la web no puede saber si alguien escaneó el QR: eso pasa en
 * el celular, así que la sesión es la señal).
 * - En escritorio la tarjeta flota en la esquina, abierta desde que se entra.
 *   Cerrarla la encoge a un botón que la vuelve a abrir; en la siguiente
 *   visita sale grande otra vez. La portada le deja libre esa columna para que
 *   no tape el buscador ni la lista.
 * - En celular un QR no sirve (no se escanea la propia pantalla): es una barra
 *   abajo con el botón que abre Google Play. Cerrarla dura lo que la visita.
 */
const AppPromo: React.FC = () => {
  const { pathname } = useLocation();
  const [mini, setMini] = useState(leer);
  const [listo, setListo] = useState(false);

  // Un momento después de cargar, para no competir con lo primero que se lee.
  useEffect(() => {
    const t = window.setTimeout(() => setListo(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  const conSesion = Boolean(localStorage.getItem('token'));
  const cerrada = SIN_AVISO.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
  if (!listo || conSesion || cerrada) return null;

  const encoger = () => {
    setMini(true);
    guardar(true);
  };
  const abrir = () => {
    setMini(false);
    guardar(false);
  };

  return (
    <>
      {/* ── Escritorio: flota en la esquina, abierta desde que se entra ──
          Entra subiendo y al cerrarse se encoge al botón, con movimiento. */}
      <div className="fixed bottom-6 right-6 z-40 hidden lg:block">
        <AnimatePresence mode="wait" initial>
          {mini ? (
            <motion.button
              key="mini"
              type="button"
              onClick={abrir}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="flex items-center gap-2 rounded-pill bg-accent px-4 py-3 text-[0.9375rem] font-mid text-white transition-colors hover:bg-accent-hover"
            >
              <QrCode size={17} strokeWidth={1.8} />
              Descarga la app
            </motion.button>
          ) : (
            <motion.div
              key="tarjeta"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <TarjetaApp onCerrar={encoger} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Celular ── */}
      {!mini && (
        <>
          {/* Hueco del alto de la barra, para que no tape el final de la página. */}
          <div aria-hidden="true" className="h-[76px] lg:hidden" />
          <aside
            aria-label="Descarga la app de TalentHub"
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-hairline-d bg-night/80 px-4 py-3 backdrop-blur-nav backdrop-saturate-150 lg:hidden"
          >
            <img src="/icon-192.png" alt="" className="h-11 w-11 flex-none rounded-[11px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] font-demi text-ink-d">TalentHub</p>
              <p className="truncate text-[0.8125rem] text-muted-d">App para Android</p>
            </div>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-none items-center gap-1.5 rounded-pill bg-accent px-4 py-2 text-[0.875rem] font-mid text-white"
            >
              <Download size={15} strokeWidth={1.8} />
              Descargar
            </a>
            <button
              type="button"
              onClick={encoger}
              aria-label="Cerrar aviso de la app"
              className="flex-none rounded-pill p-1.5 text-muted-d hover:text-ink-d"
            >
              <X size={17} strokeWidth={1.8} />
            </button>
          </aside>
        </>
      )}
    </>
  );
};

export default AppPromo;
