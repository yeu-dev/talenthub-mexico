import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageHeader, { Familia, fondoHaloFicha } from './PageHeader';
import { tonoRgb } from './Iniciales';

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

// jsdom descarta `radial-gradient` al asignarlo a `style`, así que se prueba
// la función que arma el fondo; en el navegador se revisó a mano.
test('el halo de la ficha usa el color de la empresa, y el tono neutro también tiene color', () => {
  expect(fondoHaloFicha('45,212,191')).toContain('rgba(45,212,191,0.22)');
  // "Santander SA de CV" cae en el tono neutro (gris en sus iniciales).
  expect(tonoRgb('Santander SA de CV')).toBe('74,102,255');
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
