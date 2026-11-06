import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageHeader, { Familia } from './PageHeader';

const montar = (familia: Familia, extra: Partial<React.ComponentProps<typeof PageHeader>> = {}) =>
  render(
    <MemoryRouter>
      <PageHeader tono="oscuro" familia={familia} titulo="Título" {...extra} />
    </MemoryRouter>
  );

test.each<[Familia, boolean]>([
  ['explorar', true],
  ['ficha', true],
  ['venta', true],
  ['trabajo', false],
  ['lectura', false],
])('la familia %s lleva velo: %s', (familia, conVelo) => {
  const { container } = montar(familia);
  expect(container.querySelector('canvas') !== null).toBe(conVelo);
});

test('venta centra el título solo si no hay nada a los lados', () => {
  const { rerender } = montar('venta');
  expect(screen.getByRole('heading', { name: 'Título' }).closest('.justify-center')).not.toBeNull();

  rerender(
    <MemoryRouter>
      <PageHeader tono="oscuro" familia="venta" titulo="Título" acciones={<button type="button">Acción</button>} />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: 'Título' }).closest('.justify-center')).toBeNull();
});
