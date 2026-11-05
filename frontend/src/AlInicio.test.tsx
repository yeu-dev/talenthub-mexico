import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link, Route, Routes, useNavigate } from 'react-router-dom';
import { AlInicio } from './App';

/** Un filtro que reescribe la URL con `replace`, como el buscador de /vacantes. */
const Filtro: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate('/vacantes?q=py', { replace: true })}>
      Filtrar
    </button>
  );
};

const montar = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <AlInicio />
      <Link to="/vacantes">Ir a vacantes</Link>
      <Link to="/vacantes?q=Python">Empleos de Python</Link>
      <Routes>
        <Route path="*" element={<Filtro />} />
      </Routes>
    </MemoryRouter>
  );

let scrollTo: jest.Mock;
beforeEach(() => {
  scrollTo = jest.fn();
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
});

test('cada enlace sube al inicio de la página nueva, también si solo cambia la búsqueda', () => {
  montar();
  scrollTo.mockClear();

  userEvent.click(screen.getByText('Ir a vacantes'));
  expect(scrollTo).toHaveBeenCalledTimes(1);
  expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 0 }));

  userEvent.click(screen.getByText('Empleos de Python'));
  expect(scrollTo).toHaveBeenCalledTimes(2);
});

test('los filtros que reescriben la URL con replace no mueven la página', () => {
  montar();
  scrollTo.mockClear();

  userEvent.click(screen.getByText('Filtrar'));
  expect(scrollTo).not.toHaveBeenCalled();
});
