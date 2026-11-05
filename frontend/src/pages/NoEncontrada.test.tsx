import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import NoEncontrada from './NoEncontrada';

/** Muestra la ruta y la búsqueda actuales, para comprobar a dónde llevó el buscador. */
const Destino: React.FC = () => {
  const { pathname, search } = useLocation();
  return <p>destino: {pathname + search}</p>;
};

const renderEn = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/vacantes" element={<Destino />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </MemoryRouter>
  );

test('una ruta que no existe muestra la página y las salidas, sin repetir la ruta', () => {
  renderEn('/esta-ruta-no-existe');

  expect(screen.getByRole('heading', { level: 1, name: 'Esta página no existe' })).toBeInTheDocument();
  // Lo que se escribe en la URL no se pinta en la página.
  expect(screen.queryByText(/esta-ruta-no-existe/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /ver vacantes/i })).toHaveAttribute('href', '/vacantes');
  expect(screen.getByRole('link', { name: /ir al inicio/i })).toHaveAttribute('href', '/');
  expect(document.title).toBe('Página no encontrada · TalentHub');
});

test('el buscador lleva a las vacantes con lo que se escribió', () => {
  renderEn('/vacante-vieja');

  userEvent.type(screen.getByPlaceholderText(/busca una vacante/i), 'React');
  userEvent.click(screen.getByRole('button', { name: /^buscar$/i }));

  expect(screen.getByText('destino: /vacantes?q=React')).toBeInTheDocument();
});

test('los enlaces no llevan un botón adentro', () => {
  renderEn('/otra');

  screen.getAllByRole('link').forEach((enlace) => {
    expect(enlace.querySelector('button')).toBeNull();
  });
});
