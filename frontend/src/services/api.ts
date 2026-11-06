import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as sesion from "../lib/sesion";
import { empezoPeticion, terminoPeticion } from "../lib/cargas";

// Configuración de URLs dinámicas
const API_URL = process.env.REACT_APP_API_URL || "https://talenthub-mexico.onrender.com/api";
// -----> Para pruebas en local const API_URL = "http://localhost:8000/api";
const BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
  baseURL: API_URL
});

/**
 * `silencioso`: la petición no enciende la barra de carga global (sondeos y el
 * aviso que despierta al servidor). Se pasa en la config de axios.
 */
declare module "axios" {
  interface AxiosRequestConfig {
    silencioso?: boolean;
  }
}

/**
 * `_sinToken`: una petición que ya se repitió sin token, para no entrar en bucle.
 * `_contada`: ya sumó en la barra de carga; al terminar se resta una sola vez.
 */
type ConfigReintento = InternalAxiosRequestConfig & { _sinToken?: boolean; _contada?: boolean };

/** Resta de la barra de carga la petición que terminó, si había sumado. */
const descontar = (config?: ConfigReintento) => {
  if (config?._contada) {
    config._contada = false;
    terminoPeticion();
  }
};

api.interceptors.request.use(
  (config: ConfigReintento) => {
    if (!config.silencioso && !config.url?.startsWith('/notificaciones')) {
      config._contada = true;
      empezoPeticion();
    }
    const token = localStorage.getItem('token');
    if (token && !config._sinToken) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Un 401 con token significa que la sesión venció o se cerró en otro lado.
 *
 * Antes cualquier 401 mandaba a /login, aunque la persona estuviera en una
 * página pública: con un token viejo, abrir la portada te sacaba a iniciar
 * sesión. Ahora:
 * - la sesión se borra siempre;
 * - en una ruta privada se manda a /login, porque sin sesión ahí no hay nada;
 * - en una pública la petición se repite una vez sin token. DRF rechaza un
 *   token inválido aunque el endpoint sea abierto, así que sin el token la
 *   lista de vacantes sí carga, y la persona sigue como visitante.
 * Un 401 sin token (credenciales mal escritas en el login) no toca nada: lo
 * maneja la propia pantalla.
 */
api.interceptors.response.use(
  (response) => {
    descontar(response.config as ConfigReintento);
    return response;
  },
  (error: AxiosError) => {
    const config = error.config as ConfigReintento | undefined;
    descontar(config);
    const llevabaToken = Boolean(config?.headers?.Authorization);

    if (error.response?.status === 401 && config && llevabaToken && !config._sinToken) {
      sesion.cerrarSesionLocal();

      if (sesion.esRutaPrivada(window.location.pathname)) {
        sesion.redirigirALogin();
        return Promise.reject(error);
      }

      config._sinToken = true;
      delete config.headers.Authorization;
      return api(config);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper Pro para formatear URLs de archivos media.
 * Resuelve el problema del "Círculo Blanco" y enlaces rotos.
 */
export const getMediaUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BASE_URL}${url}`;
};

export default api;
