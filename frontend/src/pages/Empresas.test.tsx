import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Empresas from './Empresas';

// La landing pide `/vacantes/` y `/planes/`. Función normal y no `jest.fn`:
// CRA corre con `resetMocks`, que borra la implementación antes de cada prueba.
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: (url: string) =>
      Promise.resolve({
        data: url.startsWith('/planes')
          ? [
              { id: 1, nombre: 'GRATIS', tipo_usuario: 'aspirante', precio: '0.00' },
              { id: 2, nombre: 'PREMIUM', tipo_usuario: 'aspirante', precio: '129.00' },
              { id: 3, nombre: 'GRATIS', tipo_usuario: 'empresa', precio: '0.00' },
              { id: 4, nombre: 'PRO', tipo_usuario: 'empresa', precio: '399.00' },
            ]
          : [
              {
                id: 1,
                titulo: 'Desarrollador Backend Python',
                empresa_nombre: 'Nebula Labs',
                descripcion: 'Producto real',
                salario_min: '30000.00',
                salario_max: '45000.00',
                modalidad: 'remoto',
                ubicacion: 'Puebla, Pue.',
                fecha_publicacion: '2026-11-01T10:00:00Z',
                requisitos: { lenguajes: ['Python'] },
              },
            ],
      }),
  },
}));

const renderEmpresas = () =>
  render(
    <MemoryRouter>
      <Empresas />
    </MemoryRouter>
  );

test('el hero le habla a quien contrata y lleva al registro como empresa', async () => {
  renderEmpresas();
  expect(screen.getByRole('heading', { level: 1, name: 'Contrata gente de TI que ya sabe cuánto pagas' })).toBeInTheDocument();
  const publicar = screen.getByRole('link', { name: /publica tu primera vacante/i });
  expect(publicar).toHaveAttribute('href', '/register?rol=empresa');
  // Espera a que lleguen los datos para no dejar estado pendiente.
  // La empresa sale en la vacante del hero y en la franja de empresas.
  expect((await screen.findAllByText('Nebula Labs')).length).toBeGreaterThan(0);
});

test('solo muestra los planes de empresa, con su precio real', async () => {
  renderEmpresas();
  expect(await screen.findByText('PRO')).toBeInTheDocument();
  expect(screen.getByText('$399')).toBeInTheDocument();
  expect(screen.queryByText('PREMIUM')).not.toBeInTheDocument();
});

test('las postulaciones de ejemplo están marcadas como tales', async () => {
  renderEmpresas();
  expect(screen.getByText('Vista de ejemplo de tu panel')).toBeInTheDocument();
  expect(screen.getByText(/postulación recibida · vista de ejemplo/i)).toBeInTheDocument();
  // La empresa sale en la vacante del hero y en la franja de empresas.
  expect((await screen.findAllByText('Nebula Labs')).length).toBeGreaterThan(0);
});
