import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Checkout from './Checkout';

// Funciones normales y no `jest.fn`: CRA corre con `resetMocks`. Los avisos de
// error se guardan en `mockErrores` para contarlos.
let mockErrores: string[] = [];
let mockRespuestaCrear: () => Promise<unknown> = () => Promise.resolve({ data: { id: 'ORDEN' } });

jest.mock('../utils/alerts', () => ({
  __esModule: true,
  showError: (texto: string) => {
    mockErrores.push(texto);
  },
  showSuccess: () => {},
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { post: () => mockRespuestaCrear() },
}));

// El SDK real carga un script de PayPal. Este botón hace lo mismo que él con
// `createOrder`: si la promesa falla, llama a `onError`.
jest.mock('@paypal/react-paypal-js', () => ({
  __esModule: true,
  PayPalScriptProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PayPalButtons: ({ createOrder, onError }: { createOrder: () => Promise<string>; onError: (e: unknown) => void }) => (
    <button type="button" onClick={() => createOrder().catch(onError)}>
      Pagar con PayPal
    </button>
  ),
}));

const montar = () =>
  render(
    <MemoryRouter initialEntries={['/checkout/3']}>
      <Routes>
        <Route path="/checkout/:planId" element={<Checkout />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  mockErrores = [];
});

test('una falla del servidor al crear la orden da un solo aviso, con su motivo', async () => {
  mockRespuestaCrear = () =>
    Promise.reject({
      response: {
        status: 503,
        data: { error: 'PAGOS_NO_DISPONIBLES', detail: 'El servicio de pagos no responde en este momento.' },
      },
    });
  montar();

  await userEvent.click(screen.getByRole('button', { name: 'Pagar con PayPal' }));

  await waitFor(() => expect(mockErrores).toHaveLength(1));
  expect(mockErrores[0]).toBe('El servicio de pagos no responde en este momento.');
});

test('si la orden se crea, no sale ningún aviso de error', async () => {
  let creada = false;
  mockRespuestaCrear = () => {
    creada = true;
    return Promise.resolve({ data: { id: 'ORDEN' } });
  };
  montar();

  await userEvent.click(screen.getByRole('button', { name: 'Pagar con PayPal' }));

  await waitFor(() => expect(creada).toBe(true));
  expect(mockErrores).toHaveLength(0);
});
