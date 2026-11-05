import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './pages/Home';

// La portada pide `/vacantes/`: aquí se responde con una lista fija para no
// depender de la red. Función normal y no `jest.fn`: CRA corre con
// `resetMocks`, que borra la implementación de los jest.fn antes de cada prueba.
jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: () =>
      Promise.resolve({
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

test('la portada muestra el buscador y las vacantes reales', async () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

  expect(screen.getByRole('search')).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/puesto, empresa o tecnología/i)).toBeInTheDocument();
  expect(await screen.findByText('Desarrollador Frontend React')).toBeInTheDocument();
  expect(screen.getByText('$28,000 – $38,000')).toBeInTheDocument();
});
