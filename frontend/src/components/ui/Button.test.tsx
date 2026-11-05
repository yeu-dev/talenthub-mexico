import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button, { clasesBoton } from './Button';

// jsdom no dibuja en canvas: sin esto avisa "Not implemented" en cada clic.
beforeEach(() => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

test('un botón normal no lleva borde de luz ni lienzo de chispas', () => {
  const { container } = render(<Button>Guardar</Button>);
  expect(screen.getByRole('button', { name: 'Guardar' })).not.toHaveClass('borde-luz');
  expect(container.querySelector('canvas')).toBeNull();
});

test('el botón destacado lleva el borde de luz y su lienzo, oculto al lector', () => {
  const { container } = render(<Button destacado>Buscar vacantes</Button>);
  const boton = screen.getByRole('button', { name: 'Buscar vacantes' });
  expect(boton).toHaveClass('borde-luz');
  const lienzo = container.querySelector('canvas');
  expect(lienzo).not.toBeNull();
  expect(boton).toContainElement(lienzo as HTMLElement);
  expect(lienzo).toHaveAttribute('aria-hidden', 'true');
});

test('las chispas no le quitan el clic al botón destacado', () => {
  const alClic = jest.fn();
  render(
    <Button destacado onClick={alClic}>
      Buscar vacantes
    </Button>
  );
  userEvent.click(screen.getByRole('button', { name: 'Buscar vacantes' }));
  expect(alClic).toHaveBeenCalledTimes(1);
});

test('clasesBoton marca como destacado también a un enlace', () => {
  expect(clasesBoton({ destacado: true })).toContain('borde-luz');
  expect(clasesBoton()).not.toContain('borde-luz');
});
