import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AvisoLento from './AvisoLento';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('no aparece si la carga es rápida', () => {
  render(<AvisoLento cargando />);
  act(() => jest.advanceTimersByTime(3000));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('a los 4 s dice qué pasa y cuánto lleva, y al minuto ofrece reintentar', () => {
  let reintentos = 0;
  render(<AvisoLento cargando alReintentar={() => (reintentos += 1)} />);

  act(() => jest.advanceTimersByTime(5000));
  expect(screen.getByRole('status')).toHaveTextContent('Despertando el servidor');
  expect(screen.getByRole('status')).toHaveTextContent('5 s');
  expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();

  act(() => jest.advanceTimersByTime(56000));
  fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
  expect(reintentos).toBe(1);
});

test('desaparece en cuanto termina la carga', () => {
  const { rerender } = render(<AvisoLento cargando />);
  act(() => jest.advanceTimersByTime(5000));
  rerender(<AvisoLento cargando={false} />);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
