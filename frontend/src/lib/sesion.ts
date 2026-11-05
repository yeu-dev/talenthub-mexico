import { useEffect, useState } from 'react';

/** Las claves de la sesión en localStorage. */
const CLAVES = ['token', 'user_tipo', 'user_username'] as const;

/** Evento propio: `storage` solo avisa a las OTRAS pestañas, no a esta. */
const EVENTO = 'talenthub:sesion';

/**
 * Rutas que solo tienen sentido con sesión. Si el token vence en una de
 * estas, se manda a iniciar sesión; en cualquier otra (portada, vacantes,
 * detalle, planes…) la persona sigue donde estaba, ya como visitante.
 */
const RUTAS_PRIVADAS = [
  '/dashboard',
  '/mis-aplicaciones',
  '/aplicaciones-empresa',
  '/perfil',
  '/mi-perfil',
  '/validador',
  '/checkout',
];

export const esRutaPrivada = (pathname: string) =>
  RUTAS_PRIVADAS.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));

/** Manda a iniciar sesión con una recarga completa: deja limpio todo el estado. */
export const redirigirALogin = () => {
  window.location.href = '/login';
};

/** Borra la sesión de este navegador y avisa a la barra, el pie y el aviso de la app. */
export const cerrarSesionLocal = () => {
  CLAVES.forEach((clave) => localStorage.removeItem(clave));
  window.dispatchEvent(new Event(EVENTO));
};

/**
 * Vuelve a pintar el componente cuando la sesión cambia: en esta pestaña
 * (`cerrarSesionLocal`) o en otra (`storage`). Los componentes siguen leyendo
 * localStorage como antes; esto solo les avisa que lo vuelvan a leer.
 */
export const useCambiosDeSesion = () => {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const avisar = () => setVersion((v) => v + 1);
    window.addEventListener(EVENTO, avisar);
    window.addEventListener('storage', avisar);
    return () => {
      window.removeEventListener(EVENTO, avisar);
      window.removeEventListener('storage', avisar);
    };
  }, []);
};
