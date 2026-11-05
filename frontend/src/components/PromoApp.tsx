import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCambiosDeSesion } from '../lib/sesion';

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
}

const Contexto = createContext<Estado>({ mostrar: false, mini: true, encoger: () => {}, abrir: () => {} });

/**
 * El estado del aviso de la app, compartido: lo usa el aviso para dibujarse y
 * `App` para dejarle la columna derecha libre mientras está abierto. Así la
 * página se recorre cuando la tarjeta se abre y se estira cuando se minimiza.
 */
export const PromoAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const [mini, setMini] = useState(leer);
  const [listo, setListo] = useState(false);

  // Un momento después de cargar, para no competir con lo primero que se lee.
  useEffect(() => {
    const t = window.setTimeout(() => setListo(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  // El aviso es para visitantes: si la sesión vence, vuelve a aparecer.
  useCambiosDeSesion();
  const conSesion = Boolean(localStorage.getItem('token'));
  const cerrada = SIN_AVISO.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
  const mostrar = listo && !conSesion && !cerrada;

  const encoger = useCallback(() => {
    setMini(true);
    guardar(true);
  }, []);
  const abrir = useCallback(() => {
    setMini(false);
    guardar(false);
  }, []);

  const valor = useMemo(() => ({ mostrar, mini, encoger, abrir }), [mostrar, mini, encoger, abrir]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const usePromoApp = () => useContext(Contexto);
