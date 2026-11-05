import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import api from './api';
import * as sesion from '../lib/sesion';

/**
 * Un servidor de mentira: responde 401 a toda petición que lleve token (como
 * DRF con un token vencido, aunque el endpoint sea abierto) y 200 a las demás.
 * Guarda las peticiones para revisar cuántas se hicieron y con qué cabecera.
 */
const peticiones: InternalAxiosRequestConfig[] = [];

const responder = (config: InternalAxiosRequestConfig, status: number): AxiosResponse => ({
  data: status === 200 ? [{ id: 1 }] : { detail: 'Token inválido.' },
  status,
  statusText: status === 200 ? 'OK' : 'Unauthorized',
  headers: {},
  config,
});

const irA = (ruta: string) => window.history.pushState({}, '', ruta);

let redirigir: jest.SpyInstance;

beforeEach(() => {
  peticiones.length = 0;
  localStorage.clear();
  api.defaults.adapter = async (config) => {
    peticiones.push(config);
    if (config.headers?.Authorization) {
      throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, responder(config, 401));
    }
    return responder(config, 200);
  };
  redirigir = jest.spyOn(sesion, 'redirigirALogin').mockImplementation(() => {});
});

afterEach(() => {
  redirigir.mockRestore();
  irA('/');
});

test('en una página pública, un token vencido se borra y la petición se repite sin token', async () => {
  localStorage.setItem('token', 'vencido');
  localStorage.setItem('user_tipo', 'aspirante');
  irA('/vacantes');

  const respuesta = await api.get('/vacantes/');

  expect(respuesta.status).toBe(200);
  expect(peticiones).toHaveLength(2);
  expect(peticiones[1].headers?.Authorization).toBeUndefined();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('user_tipo')).toBeNull();
  expect(redirigir).not.toHaveBeenCalled();
});

test('en una página privada, un token vencido manda a iniciar sesión', async () => {
  localStorage.setItem('token', 'vencido');
  irA('/dashboard');

  await expect(api.get('/mis-vacantes/')).rejects.toBeInstanceOf(AxiosError);

  expect(peticiones).toHaveLength(1);
  expect(localStorage.getItem('token')).toBeNull();
  expect(redirigir).toHaveBeenCalledTimes(1);
});

test('un 401 sin token (credenciales incorrectas) no repite ni redirige', async () => {
  api.defaults.adapter = async (config) => {
    peticiones.push(config);
    throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, responder(config, 401));
  };
  irA('/login');

  await expect(api.post('/login/', { username: 'x', password: 'y' })).rejects.toBeInstanceOf(AxiosError);

  expect(peticiones).toHaveLength(1);
  expect(redirigir).not.toHaveBeenCalled();
});

test('el aviso de sesión cerrada llega a quien escucha', () => {
  const escucha = jest.fn();
  window.addEventListener('talenthub:sesion', escucha);
  localStorage.setItem('token', 'x');

  sesion.cerrarSesionLocal();

  expect(escucha).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem('token')).toBeNull();
  window.removeEventListener('talenthub:sesion', escucha);
});
