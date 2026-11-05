import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
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
      className="fixed bottom-6 right-6 z-40 hidden w-[288px] rounded-card border border-hairline bg-canvas p-5 lg:block"
    >
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar aviso de la app"
        className="absolute right-3 top-3 rounded-pill p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <X size={16} strokeWidth={1.8} />
      </button>

      <div className="flex justify-center rounded-ui bg-surface p-4">
        <QRCodeSVG value={PLAY_STORE_URL} size={132} bgColor="transparent" fgColor="#161616" level="M" />
      </div>

      <h2 className="mt-4 text-sub font-demi leading-snug text-ink">Lleva TalentHub en tu celular</h2>
      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-2">
        Escanea el código con la cámara para descargar la app para Android.
      </p>
      <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted">
        Está en prueba cerrada en Google Play: por ahora solo abre para quien está en la lista de testers.
      </p>
    </aside>
  );
};

export default AppPromo;
