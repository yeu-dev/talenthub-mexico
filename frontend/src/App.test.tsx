import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from './pages/Home';

// La portada pide `/vacantes/`: aquí se responde con una lista fija para no
// depender de la red. Función normal y no `jest.fn`: CRA corre con
// `resetMocks`, que borra la implementación de los jest.fn antes de cada prueba.
// `mockFalla` decide si la petición responde o falla; jest permite que la
// fábrica del mock lea variables solo si su nombre empieza con `mock`.
let mockFalla = false;

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: () =>
      mockFalla
        ? Promise.reject(new Error('sin red'))
        : Promise.resolve({
            data: [
              {
                id: 1,
                titulo: 'Desarrollador Frontend React',
                empresa_nombre: 'Nebula Labs',
                descripcion: 'Producto real',
                salario_min: '28000.00',
                salario_max: '38000.00',
                modalidad: 'remoto',
                ubicacion: 'Puebla, Pue.',
                fecha_publicacion: '2026-11-01T10:00:00Z',
                requisitos: { lenguajes: ['React'] },
              },
            ],
          }),
  },
}));

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

afterEach(() => {
  mockFalla = false;
});

test('la portada muestra el buscador y las vacantes reales', async () => {
  renderHome();

  expect(screen.getByRole('search')).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/puesto, empresa o tecnología/i)).toBeInTheDocument();
  expect((await screen.findAllByText('Desarrollador Frontend React'))[0]).toBeInTheDocument();
  expect(screen.getAllByText('$28,000 – $38,000')[0]).toBeInTheDocument();
});

test('si la API falla, la portada lo dice, ofrece reintentar y conserva el enlace para empresas', async () => {
  mockFalla = true;
  renderHome();

  expect(await screen.findByText('No pudimos cargar las vacantes')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  // La banda para empresas no depende de la API: sigue a la vista con error.
  expect(screen.getByRole('heading', { name: /publica gratis/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /para empresas/i })).toHaveAttribute('href', '/empresas');
});

test('reintentar vuelve a pedir las vacantes y las muestra', async () => {
  mockFalla = true;
  renderHome();

  const reintentar = await screen.findByRole('button', { name: /reintentar/i });
  mockFalla = false;
  userEvent.click(reintentar);

  expect((await screen.findAllByText('Desarrollador Frontend React'))[0]).toBeInTheDocument();
  expect(screen.queryByText('No pudimos cargar las vacantes')).not.toBeInTheDocument();
});

test('el titular de la portada se ve desde el primer cuadro (no arranca en opacidad 0)', async () => {
  renderHome();

  const titular = screen.getByRole('heading', { level: 1 });
  // `rise` lo dejaba en `opacity: 0` hasta que corría la animación, y eso
  // retrasa el LCP. La entrada de ahora solo lo mueve.
  expect(titular.style.opacity).not.toBe('0');
  expect(titular).toHaveAccessibleName('Tu siguiente empleo en TI ya trae el sueldo');

  // Espera a que termine la carga de la lista para no dejar estado pendiente.
  expect((await screen.findAllByText('Desarrollador Frontend React'))[0]).toBeInTheDocument();
});
