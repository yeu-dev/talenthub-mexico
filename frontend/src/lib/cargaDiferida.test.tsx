import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { diferida } from './cargaDiferida';

const LLAVE = 'talenthub:recarga-por-pagina';

const montar = (Pagina: React.ComponentType) =>
  render(
    <Suspense fallback={<p>Cargando</p>}>
      <Pagina />
    </Suspense>
  );

beforeEach(() => sessionStorage.clear());

test('una página que llega se pinta y borra la marca de recarga', async () => {
  sessionStorage.setItem(LLAVE, '1');
  const Pagina = diferida(() => Promise.resolve({ default: () => <h1>Vacantes</h1> }));
  montar(Pagina);

  expect(await screen.findByRole('heading', { name: 'Vacantes' })).toBeInTheDocument();
  expect(sessionStorage.getItem(LLAVE)).toBeNull();
});

test('si ya se recargó una vez y sigue sin llegar, muestra cómo reintentar en vez de quedarse en blanco', async () => {
  sessionStorage.setItem(LLAVE, '1');
  const Pagina = diferida(() => Promise.reject(new Error('ChunkLoadError')));
  montar(Pagina);

  expect(await screen.findByRole('heading', { name: 'No pudimos abrir esta página' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
});
