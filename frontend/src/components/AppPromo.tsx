import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Clock, Image, Map, MessageCircle, X } from 'lucide-react';
import { PLAY_STORE_URL } from '../lib/app';

const CLAVE = 'th_app_promo_cerrado';

const yaCerrado = () => {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
};

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
    className="mx-auto -mb-16 mt-6 h-[210px] w-[200px] rounded-t-[34px] border-[6px] border-b-0 border-ink bg-canvas px-4 pt-3"
  >
    <div className="relative flex items-center justify-between px-1 text-[9px] font-demi text-ink">
      <span className="tabular">9:41</span>
      <span className="absolute left-1/2 top-0 h-[16px] w-[56px] -translate-x-1/2 rounded-pill bg-ink" />
      <span className="flex items-center gap-[3px]">
        <span className="h-[6px] w-[3px] rounded-[1px] bg-ink" />
        <span className="h-[8px] w-[3px] rounded-[1px] bg-ink" />
        <span className="ml-0.5 h-[7px] w-[14px] rounded-[2px] border border-ink" />
      </span>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-3">
      <div className="flex flex-col items-center gap-1">
        <img src="/icon-192.png" alt="" className="h-[42px] w-[42px] rounded-[11px] ring-2 ring-accent ring-offset-2" />
        <span className="text-[8.5px] font-demi text-ink">TalentHub</span>
      </div>
      {APPS.map(({ nombre, Icono }) => (
        <div key={nombre} className="flex flex-col items-center gap-1">
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-surface">
            <Icono size={19} strokeWidth={1.6} className="text-muted" />
          </span>
          <span className="text-[8.5px] text-muted">{nombre}</span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Aviso para descargar la app, con un QR que abre la ficha de Google Play.
 *
 * Solo en pantallas grandes: quien ya está en el celular no puede escanear su
 * propia pantalla. Es una tarjeta en la esquina, no un modal: no tapa la
 * página ni obliga a cerrarla para seguir. Al cerrarla no vuelve a salir.
 */
const AppPromo: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (yaCerrado()) return;
    // Un momento después de cargar, para no competir con el buscador.
    const t = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  const cerrar = () => {
    setVisible(false);
    try {
      localStorage.setItem(CLAVE, '1');
    } catch {
      /* sin almacenamiento solo vuelve a salir en la siguiente visita */
    }
  };

  return (
    <aside
      aria-label="Descarga la app de TalentHub"
      className="fixed bottom-6 right-6 z-40 hidden w-[300px] overflow-hidden rounded-card border border-accent/15 bg-[#eef1ff] px-6 pt-6 text-center lg:block"
    >
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar aviso de la app"
        className="absolute right-3 top-3 rounded-pill p-1.5 text-ink-2 transition-colors hover:bg-white hover:text-ink"
      >
        <X size={18} strokeWidth={1.8} />
      </button>

      <div className="mx-auto w-fit rounded-ui bg-canvas p-3">
        <QRCodeSVG value={PLAY_STORE_URL} size={120} bgColor="#ffffff" fgColor="#161616" level="M" />
      </div>

      <h2 className="mt-4 font-heading text-[1.375rem] font-demi leading-tight tracking-[-0.01em] text-ink">
        Las vacantes, también en tu celular
      </h2>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">
        Escanea el código con la cámara de tu celular y descarga la app.
      </p>
      <p className="mt-1.5 text-[0.75rem] text-muted">En prueba cerrada: por ahora solo para testers.</p>

      <Celular />
    </aside>
  );
};

export default AppPromo;
