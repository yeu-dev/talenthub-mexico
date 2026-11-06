import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PerfilAspirante from './PerfilAspirante';

// Respuestas fijas del perfil. Funciones normales y no `jest.fn`: CRA corre
// con `resetMocks`. Los POST se guardan en `mockEnviados` para revisarlos, y
// `mockErrorPost` hace que el siguiente falle como lo haría DRF.
let mockEnviados: FormData[] = [];
let mockErrorPost: unknown = null;
const mockPerfil = {
  profesion: 'Frontend',
  experiencia_resumen: '',
  habilidades: ['React'],
  cv: 'cvs/Mi%20CV.pdf',
  cv_url: 'https://x.supabase.co/cvs/Mi%20CV.pdf',
  foto: '',
  foto_url: null,
  completitud: 65,
};

jest.mock('../services/api', () => ({
  __esModule: true,
  getMediaUrl: (url: string | null) => url,
  default: {
    get: (url: string) =>
      Promise.resolve({
        data: url === '/user-info/' ? { username: 'Yeu123', email: 'yeu@x.com', telefono: '' } : mockPerfil,
      }),
    post: (_url: string, datos: FormData) => {
      mockEnviados.push(datos);
      if (mockErrorPost) {
        const error = mockErrorPost;
        mockErrorPost = null;
        return Promise.reject(error);
      }
      return Promise.resolve({ data: {} });
    },
  },
}));

// La confirmación real va por <ConfirmHost/>, que aquí no está montado.
jest.mock('../utils/alerts', () => ({
  showSuccess: () => undefined,
  showError: () => undefined,
  showConfirm: () => Promise.resolve(true),
}));

const renderPerfil = () =>
  render(
    <MemoryRouter>
      <PerfilAspirante />
    </MemoryRouter>
  );

afterEach(() => {
  mockEnviados = [];
  mockErrorPost = null;
});

test('muestra los datos en modo lectura y dice qué le falta al perfil', async () => {
  renderPerfil();
  expect(await screen.findByText('yeu@x.com')).toBeInTheDocument();
  expect(screen.getByText('Sin teléfono')).toBeInTheDocument();
  expect(screen.getByText(/te falta: foto, teléfono, experiencia/i)).toBeInTheDocument();
  expect(screen.getByText(/al 65%/)).toBeInTheDocument();
  // Sin campos abiertos hasta que se pide editar.
  expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument();
});

test('editar un bloque marca los cambios sin guardar, y Cancelar regresa a lo guardado', async () => {
  renderPerfil();
  userEvent.click(await screen.findByRole('button', { name: /editar información de cuenta/i }));

  const telefono = screen.getByLabelText('Teléfono');
  userEvent.type(telefono, '2221234567');
  expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();
  expect(screen.getByText('Sin teléfono')).toBeInTheDocument();
});

test('cada bloque manda solo sus campos', async () => {
  renderPerfil();
  userEvent.click(await screen.findByRole('button', { name: /editar información de cuenta/i }));
  userEvent.type(screen.getByLabelText('Teléfono'), '2221234567');
  userEvent.click(screen.getByRole('button', { name: /guardar/i }));

  await waitFor(() => expect(mockEnviados).toHaveLength(1));
  expect(mockEnviados[0].get('telefono')).toBe('2221234567');
  expect(mockEnviados[0].get('profesion')).toBeNull();
});

test('un error del servidor sale junto a su campo', async () => {
  mockErrorPost = { response: { status: 400, data: { username: ['Ese nombre de usuario ya está tomado.'] } } };
  renderPerfil();
  userEvent.click(await screen.findByRole('button', { name: /editar información de cuenta/i }));
  const usuario = screen.getByLabelText('Nombre de usuario');
  userEvent.clear(usuario);
  userEvent.type(usuario, 'beto');
  userEvent.click(screen.getByRole('button', { name: /guardar/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Ese nombre de usuario ya está tomado.');
});

test('las habilidades son chips: Enter agrega, la X quita, y se mandan como lista', async () => {
  renderPerfil();
  userEvent.click(await screen.findByRole('button', { name: /editar perfil profesional/i }));

  userEvent.type(screen.getByLabelText('Habilidades'), 'Python{enter}');
  expect(screen.getByRole('button', { name: 'Quitar Python' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Quitar React' }));

  userEvent.click(screen.getByRole('button', { name: /guardar/i }));
  await waitFor(() => expect(mockEnviados).toHaveLength(1));
  expect(JSON.parse(mockEnviados[0].get('habilidades') as string)).toEqual(['Python']);
});

test('el CV muestra cuál tienes, y Quitar se puede deshacer o confirmar manteniendo presionado', async () => {
  renderPerfil();
  const fila = (await screen.findByText('Mi CV.pdf')).closest('div.rounded-ui') as HTMLElement;
  expect(within(fila).getByRole('link', { name: /ver/i })).toHaveAttribute('href', mockPerfil.cv_url);

  userEvent.click(within(fila).getByRole('button', { name: 'Quitar' }));
  expect(screen.getByText(/Sin CV no puedes postularte/)).toBeInTheDocument();
  userEvent.click(within(fila).getByRole('button', { name: /deshacer/i }));
  expect(screen.queryByText(/Sin CV no puedes postularte/)).not.toBeInTheDocument();

  userEvent.click(within(fila).getByRole('button', { name: 'Quitar' }));
  const mantener = within(fila).getByRole('button', { name: /mantén para quitar/i });
  // Un clic suelto no quita nada: hay que mantenerlo.
  userEvent.click(mantener);
  expect(mockEnviados).toHaveLength(0);
  // Mantener Espacio hasta que el relleno llega al final.
  fireEvent.keyDown(mantener, { key: ' ' });
  await waitFor(() => expect(mockEnviados).toHaveLength(1), { timeout: 2500 });
  expect(mockEnviados[0].get('quitar_cv')).toBe('true');
});
