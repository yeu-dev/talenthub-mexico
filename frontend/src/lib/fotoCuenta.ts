import { useEffect, useState } from 'react';
import api, { getMediaUrl } from '../services/api';

/**
 * La foto de quien tiene sesión, para el avatar de la barra.
 *
 * Solo el aspirante tiene foto (`Aspirante.foto`). La URL que da el backend
 * puede ser firmada (Supabase Storage) y caducar en una hora, así que se
 * guarda 10 minutos y se vuelve a pedir: ni una petición extra por página ni
 * un enlace vencido.
 *
 * Cuando el perfil carga o se guarda, avisa con `avisarFotoCuenta`: la barra
 * se actualiza al momento, sin recargar.
 */
const VIGENCIA_MS = 10 * 60_000;
const EVENTO = 'talenthub:foto-cuenta';

let cache: { promesa: Promise<string | null>; desde: number } | null = null;

function pedirFoto(): Promise<string | null> {
  if (cache && Date.now() - cache.desde < VIGENCIA_MS) return cache.promesa;
  const promesa = api
    .get<{ foto_url?: string | null }>('/perfil/aspirante/')
    .then(({ data }) => getMediaUrl(data?.foto_url ?? null))
    // Sin perfil todavía (404) o sin red: se quedan las iniciales.
    .catch(() => null);
  cache = { promesa, desde: Date.now() };
  return promesa;
}

/** El perfil avisa que la foto cambió (o que se quitó, con `null`). */
export function avisarFotoCuenta(url: string | null) {
  const resuelta = getMediaUrl(url);
  cache = { promesa: Promise.resolve(resuelta), desde: Date.now() };
  window.dispatchEvent(new CustomEvent<string | null>(EVENTO, { detail: resuelta }));
}

/** Olvida la foto guardada: al cerrar sesión, para que la siguiente cuenta no herede la anterior. */
export function olvidarFotoCuenta() {
  cache = null;
}

/** La URL de la foto, o `null` si no hay (o si el rol no tiene foto). */
export function useFotoCuenta(tipo: string | null, conSesion: boolean): string | null {
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    if (!conSesion || tipo !== 'aspirante') {
      setFoto(null);
      return;
    }
    let vivo = true;
    pedirFoto().then((url) => vivo && setFoto(url));
    const alCambiar = (e: Event) => setFoto((e as CustomEvent<string | null>).detail);
    window.addEventListener(EVENTO, alCambiar);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO, alCambiar);
    };
  }, [tipo, conSesion]);

  return foto;
}
