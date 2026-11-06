import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

/** Una notificación tal como la sirve `GET /api/notificaciones/` (de la más nueva a la más vieja). */
export interface Notificacion {
  id: number;
  mensaje: string;
  leido: boolean;
  fecha: string;
}

const CADA_MS = 60_000;

/**
 * Las notificaciones de quien tiene sesión, para la campana.
 *
 * Se piden al entrar, en cada cambio de página y cada minuto mientras la
 * pestaña está visible: antes solo al cambiar de página, y un aviso nuevo no
 * aparecía hasta navegar. Si la petición falla, `error` lo dice; antes solo
 * se escribía en la consola y la campana se quedaba con el número viejo.
 *
 * `marcarLeidas` usa `POST /api/notificaciones/marcar-leidas/`: baja el
 * contador al momento y, si el servidor falla, vuelve a pedir la lista.
 */
export function useNotificaciones(activo: boolean) {
  const { pathname } = useLocation();
  const [lista, setLista] = useState<Notificacion[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const cargar = useCallback(async () => {
    if (!activo) return;
    try {
      const { data } = await api.get<Notificacion[]>('/notificaciones/');
      if (!vivo.current) return;
      setLista(data);
      setEstado('listo');
    } catch {
      if (vivo.current) setEstado('error');
    }
  }, [activo]);

  useEffect(() => {
    cargar();
  }, [cargar, pathname]);

  useEffect(() => {
    if (!activo) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') cargar();
    }, CADA_MS);
    return () => window.clearInterval(id);
  }, [activo, cargar]);

  const marcarLeidas = useCallback(async () => {
    if (!lista.some((n) => !n.leido)) return;
    setLista((actual) => actual.map((n) => ({ ...n, leido: true })));
    try {
      await api.post('/notificaciones/marcar-leidas/');
    } catch {
      cargar();
    }
  }, [lista, cargar]);

  const sinLeer = lista.filter((n) => !n.leido).length;
  return { lista, estado, sinLeer, marcarLeidas, recargar: cargar };
}
