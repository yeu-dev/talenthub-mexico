import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Clock, Download, Image, Map, MessageCircle, QrCode, ScanLine, X } from './icons';
import { PLAY_STORE_URL } from '../lib/app';
import { usePromoApp } from './PromoApp';

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
    className="mx-auto -mb-16 mt-6 h-[210px] w-[200px] animate-flotar rounded-t-[34px] border-[6px] border-b-0 border-[#161616] bg-white px-4 pt-3"
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
        {/* El anillo que late es un elemento aparte: se anima con transform y
            opacidad, y la imagen se queda quieta con su borde fijo. */}
        <span className="relative">
          <span aria-hidden="true" className="absolute inset-0 animate-latido rounded-[11px] border-2 border-accent opacity-0" />
          <img src="/icon-192.png" alt="" className="relative h-[42px] w-[42px] rounded-[11px] ring-2 ring-accent ring-offset-2" />
        </span>
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
 * El contenido de la tarjeta: QR, título y el celular. Es clara a propósito
 * sobre el sitio oscuro, por eso usa colores fijos y no los tokens.
 */
const TarjetaApp: React.FC<{ onCerrar?: () => void }> = ({ onCerrar }) => (
  <div className="relative w-[300px] px-6 pt-6 text-center">
    {onCerrar && (
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Minimizar aviso de la app"
        className="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-pill text-[#3f4045] transition-colors hover:bg-white hover:text-[#161616]"
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
  </div>
);

/** Resorte para el cambio de forma tarjeta ⇄ botón. */
const FORMA = { type: 'spring' as const, stiffness: 320, damping: 32, mass: 0.9 };

/**
 * Aviso para descargar la app, en todas las páginas públicas hasta que se
 * inicia sesión (la web no puede saber si alguien escaneó el QR: eso pasa en
 * el celular, así que la sesión es la señal).
 * - En escritorio flota en la esquina, abierta desde que se entra, y la página
 *   le deja libre esa columna (ver `Pagina` en App). Al minimizarla la tarjeta
 *   se encoge hasta volverse el botón —es el mismo elemento cambiando de
 *   forma, no uno que se va y otro que llega— y la página se estira.
 * - En celular un QR no sirve (no se escanea la propia pantalla): es una barra
 *   abajo con el botón que abre Google Play. Cerrarla dura lo que la visita.
 */
const AppPromo: React.FC = () => {
  const { mostrar, mini, encoger, abrir } = usePromoApp();
  const reducido = useReducedMotion();
  if (!mostrar) return null;

  return (
    <>
      {/* ── Escritorio ── */}
      <motion.div
        layout
        initial={reducido ? false : { y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1, backgroundColor: mini ? '#3355ff' : 'rgba(238,241,255,0.97)' }}
        transition={{ layout: FORMA, y: FORMA, opacity: { duration: 0.3 }, backgroundColor: { duration: 0.25 } }}
        style={{ borderRadius: mini ? 9999 : 24 }}
        className="fixed bottom-6 right-6 z-40 hidden overflow-hidden lg:block"
      >
        {/* `wait` y no `popLayout`: `popLayout` saca del flujo a la pieza que
            sale inyectando una etiqueta `<style>`, y la CSP de producción
            (vercel.json) la bloquea. Las dos piezas convivían en el
            contenedor y el cambio de forma brincaba. Con `wait` sale una
            (0.2 s) y luego entra la otra; el `layout` del contenedor sigue
            haciendo el cambio de forma. */}
        <AnimatePresence mode="wait" initial={false}>
          {mini ? (
            <motion.button
              key="mini"
              type="button"
              onClick={abrir}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-3 text-[0.9375rem] font-mid text-white"
            >
              <QrCode size={18} className="icono-claro" />
              Descarga la app
            </motion.button>
          ) : (
            <motion.div
              key="tarjeta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TarjetaApp onCerrar={encoger} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Celular ── */}
      {!mini && (
        <>
          {/* Hueco del alto de la barra, para que no tape el final de la página. */}
          <div aria-hidden="true" className="h-[76px] lg:hidden" />
          <motion.aside
            initial={reducido ? false : { y: 80 }}
            animate={{ y: 0 }}
            transition={FORMA}
            aria-label="Descarga la app de TalentHub"
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-hairline-d bg-night/80 px-4 py-3 backdrop-blur-nav backdrop-saturate-150 lg:hidden"
          >
            <span className="relative flex-none">
              <span aria-hidden="true" className="absolute inset-0 animate-latido rounded-[11px] border-2 border-accent opacity-0" />
              <img src="/icon-192.png" alt="" className="relative h-11 w-11 rounded-[11px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] font-demi text-ink-d">TalentHub</p>
              <p className="truncate text-[0.8125rem] text-muted-d">App para Android</p>
            </div>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-none items-center gap-1.5 rounded-pill bg-accent px-4 py-2 text-[0.875rem] font-mid text-white transition-transform active:scale-95"
            >
              <Download size={16} className="icono-claro" />
              Descargar
            </a>
            <button
              type="button"
              onClick={encoger}
              aria-label="Cerrar aviso de la app"
              className="-mr-2 flex h-11 w-11 flex-none items-center justify-center rounded-pill text-muted-d hover:text-ink-d"
            >
              <X size={18} />
            </button>
          </motion.aside>
        </>
      )}
    </>
  );
};

export default AppPromo;
