import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCambiosDeSesion } from '../lib/sesion';
import { useMedia } from '../hooks/useMedia';

/** Minimizado en esta visita: en la siguiente vuelve a abrirse grande. */
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

interface Estado {
  /** Hay aviso en esta página: sin sesión, fuera de las pantallas cerradas. */
  mostrar: boolean;
  /** Encogido al botón "Descarga la app". */
  mini: boolean;
  encoger: () => void;
  abrir: () => void;
  /** Una página puede pedir que no aparezca (la 404): ahí nada debe competir con la salida. */
  silenciar: (silenciado: boolean) => void;
}

const Contexto = createContext<Estado>({
  mostrar: false,
  mini: true,
  encoger: () => {},
  abrir: () => {},
  silenciar: () => {},
});

/**
 * El estado del aviso de la app, compartido: lo usa el aviso para dibujarse y
 * `App` para dejarle la columna derecha libre mientras está abierto. Así la
 * página se recorre cuando la tarjeta se abre y se estira cuando se minimiza.
 */
export const PromoAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const [mini, setMini] = useState(leer);
  const [listo, setListo] = useState(false);
  const [silenciado, silenciar] = useState(false);

  // Un momento después de cargar, para no competir con lo primero que se lee.
  useEffect(() => {
    const t = window.setTimeout(() => setListo(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  // El aviso es para visitantes: si la sesión vence, vuelve a aparecer.
  useCambiosDeSesion();
  const conSesion = Boolean(localStorage.getItem('token'));
  const cerrada = SIN_AVISO.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
  const mostrar = listo && !conSesion && !cerrada && !silenciado;

  const encoger = useCallback(() => {
    setMini(true);
    guardar(true);
  }, []);
  const abrir = useCallback(() => {
    setMini(false);
    guardar(false);
  }, []);

  const valor = useMemo(() => ({ mostrar, mini, encoger, abrir, silenciar }), [mostrar, mini, encoger, abrir]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const usePromoApp = () => useContext(Contexto);

/**
 * `true` cuando la página deja libre la columna derecha para el aviso abierto
 * (desde `lg`, ver `Pagina` en App.tsx). Lo usan los fondos a todo lo ancho
 * para desvanecerse hacia la derecha en lugar de cortarse en seco ahí.
 */
export const useColumnaAviso = () => {
  const { mostrar, mini } = usePromoApp();
  const desdeLg = useMedia('(min-width: 1024px)');
  return mostrar && !mini && desdeLg;
};

/** Oculta el aviso de la app mientras la página que lo llama está montada. */
export const useSinAvisoApp = () => {
  const { silenciar } = useContext(Contexto);
  useEffect(() => {
    silenciar(true);
    return () => silenciar(false);
  }, [silenciar]);
};
