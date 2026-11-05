import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { post: () => Promise.resolve({ data: {} }), get: () => Promise.resolve({ data: [] }) },
}));

const renderRegister = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Register />
    </MemoryRouter>
  );

test('?rol=empresa llega con "Publico vacantes" ya elegido', () => {
  renderRegister('/register?rol=empresa');
  expect(screen.getByRole('radio', { name: /publico vacantes/i })).toBeChecked();
});

test('sin parámetro, o con cualquier otro, se queda en aspirante', () => {
  renderRegister('/register?rol=admin');
  expect(screen.getByRole('radio', { name: /busco empleo/i })).toBeChecked();
});
