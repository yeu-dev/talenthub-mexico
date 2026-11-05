import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Fingerprint, X } from 'lucide-react';
import { PLAY_STORE_URL } from '../lib/app';

const CLAVE = 'th_app_promo_cerrado';

const yaCerrado = () => {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
};

/**
 * Un celular dibujado con CSS que muestra la pantalla de la app de verdad: el
 * candado con huella que abre la sesión guardada. No es un teléfono genérico
 * con íconos de relleno; es lo primero que ve quien ya tiene la app.
 * Asoma desde abajo de la franja oscura: la tarjeta lo corta a propósito.
 */
const Celular: React.FC = () => (
  <div
    aria-hidden="true"
    className="absolute left-1/2 top-6 h-[232px] w-[148px] -translate-x-1/2 rounded-[30px] border-[5px] border-[#2a2a2e] bg-[#0f1530] p-3"
  >
    {/* Isla y barra de estado */}
    <div className="mx-auto h-[14px] w-[46px] rounded-pill bg-black" />
    <div className="mt-1.5 flex justify-between px-1 text-[8px] font-mid text-ink-2d">
      <span className="tabular">9:41</span>
      <span>TalentHub</span>
    </div>

    {/* El candado de la app: huella, saludo y botón */}
    <div className="mt-5 flex flex-col items-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-pill border border-accent-on-dark/60 bg-white/[0.06]">
        <Fingerprint size={22} strokeWidth={1.6} className="text-accent-on-dark" />
      </span>
      <p className="mt-2.5 text-[7px] uppercase tracking-[0.08em] text-muted-d">Sesión protegida</p>
      <p className="mt-1 font-heading text-[13px] font-mid leading-tight text-ink-d">Hola de nuevo.</p>
      <span className="mt-3 rounded-pill bg-accent px-4 py-1 text-[8px] font-mid text-white">Desbloquear</span>
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
      className="fixed bottom-6 right-6 z-40 hidden w-[300px] overflow-hidden rounded-card border border-hairline bg-canvas lg:block"
    >
      {/* Franja oscura con el celular asomando */}
      <div className="relative h-[176px] overflow-hidden bg-night">
        <Celular />
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar aviso de la app"
          className="absolute right-3 top-3 rounded-pill p-1.5 text-ink-2d transition-colors hover:bg-white/[0.08] hover:text-ink-d"
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex gap-4 border-t border-hairline p-5">
        <div className="flex-none rounded-ui border border-hairline p-1.5">
          <QRCodeSVG value={PLAY_STORE_URL} size={84} bgColor="#ffffff" fgColor="#161616" level="M" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[1rem] font-demi leading-snug text-ink">Lleva TalentHub en tu celular</h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">
            Escanea con la cámara para bajar la app para Android.
          </p>
        </div>
      </div>
      <p className="border-t border-hairline bg-surface px-5 py-2.5 text-[0.75rem] leading-relaxed text-muted">
        En prueba cerrada en Google Play: por ahora abre solo para testers.
      </p>
    </aside>
  );
};

export default AppPromo;
