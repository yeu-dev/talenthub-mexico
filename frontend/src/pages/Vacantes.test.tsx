import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Vacantes from './Vacantes';

// 30 vacantes fijas. Función normal y no `jest.fn`: CRA corre con `resetMocks`.
const mockVacantes = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  titulo: `Puesto ${i + 1}`,
  empresa_nombre: `Empresa ${i + 1}`,
  descripcion: 'Descripción',
  salario_min: '20000.00',
  salario_max: '30000.00',
  modalidad: 'remoto',
  ubicacion: 'Puebla, Pue.',
  fecha_publicacion: '2026-11-01T10:00:00Z',
  requisitos: { lenguajes: ['React'] },
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: () => Promise.resolve({ data: mockVacantes }) },
}));

const montar = () =>
  render(
    <MemoryRouter initialEntries={['/vacantes']}>
      <Vacantes />
    </MemoryRouter>
  );

test('pinta 12 vacantes y "Ver más" agrega otras 12', async () => {
  montar();
  expect(await screen.findByText('Puesto 1')).toBeInTheDocument();
  expect(screen.getByText('Puesto 12')).toBeInTheDocument();
  expect(screen.queryByText('Puesto 13')).not.toBeInTheDocument();
  expect(screen.getByText('Ves 12 de 30 vacantes')).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: /ver más vacantes/i }));
  expect(await screen.findByText('Puesto 24')).toBeInTheDocument();
  expect(screen.queryByText('Puesto 25')).not.toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: /ver más vacantes/i }));
  expect(await screen.findByText('Puesto 30')).toBeInTheDocument();
  // Ya no queda nada más que cargar.
  expect(screen.queryByRole('button', { name: /ver más vacantes/i })).not.toBeInTheDocument();
});
