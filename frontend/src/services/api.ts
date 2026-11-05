import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as sesion from "../lib/sesion";

// Configuración de URLs dinámicas
const API_URL = process.env.REACT_APP_API_URL || "https://talenthub-mexico.onrender.com/api";
// -----> Para pruebas en local const API_URL = "http://localhost:8000/api";
const BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
  baseURL: API_URL
});

/** Marca de una petición que ya se repitió sin token, para no entrar en bucle. */
type ConfigReintento = InternalAxiosRequestConfig & { _sinToken?: boolean };

api.interceptors.request.use(
  (config: ConfigReintento) => {
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
  (response) => response,
  (error: AxiosError) => {
    const config = error.config as ConfigReintento | undefined;
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
