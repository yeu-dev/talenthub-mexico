import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import BotonMantener, { DURACION_MANTENER } from './BotonMantener';

let confirmados = 0;
const montar = (disabled = false) =>
  render(
    <BotonMantener accion="eliminar la vacante" alConfirmar={() => (confirmados += 1)} disabled={disabled}>
      Mantén para eliminar
    </BotonMantener>
  );

beforeEach(() => {
  confirmados = 0;
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

const boton = () => screen.getByRole('button', { name: /mantén para eliminar/i });

test('anuncia qué pasa al mantenerlo', () => {
  montar();
  expect(boton()).toHaveAccessibleDescription('Mantén presionado para eliminar la vacante');
});

test('un clic suelto no confirma', () => {
  montar();
  fireEvent.click(boton());
  act(() => jest.advanceTimersByTime(DURACION_MANTENER * 2));
  expect(confirmados).toBe(0);
});

test('mantener Espacio hasta el final confirma una sola vez', () => {
  montar();
  fireEvent.keyDown(boton(), { key: ' ' });
  fireEvent.keyDown(boton(), { key: ' ', repeat: true });
  act(() => jest.advanceTimersByTime(DURACION_MANTENER));
  expect(confirmados).toBe(1);
});

test('soltar antes de tiempo cancela', () => {
  montar();
  fireEvent.keyDown(boton(), { key: 'Enter' });
  act(() => jest.advanceTimersByTime(DURACION_MANTENER / 2));
  fireEvent.keyUp(boton(), { key: 'Enter' });
  act(() => jest.advanceTimersByTime(DURACION_MANTENER));
  expect(confirmados).toBe(0);
});

test('deshabilitado no hace nada', () => {
  montar(true);
  fireEvent.keyDown(boton(), { key: ' ' });
  act(() => jest.advanceTimersByTime(DURACION_MANTENER));
  expect(confirmados).toBe(0);
});
