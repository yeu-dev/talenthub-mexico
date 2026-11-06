import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './navbar';
import { destinoDe } from './Campana';
import { AvatarCuenta } from './MenuCuenta';

// La barra pide las notificaciones y las marca como leídas. Funciones normales
// y no `jest.fn`: CRA corre con `resetMocks`. `mockMarcadas` cuenta los POST.
let mockMarcadas = 0;
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: () =>
      Promise.resolve({
        data: [
          { id: 1, mensaje: "Tu postulación a 'Backend' ha sido revisada.", leido: false, fecha: new Date().toISOString() },
          { id: 2, mensaje: '¡Tu pago fue procesado! Tu cuenta ha sido mejorada al plan PRO.', leido: false, fecha: new Date().toISOString() },
          { id: 3, mensaje: 'Un aviso viejo', leido: true, fecha: new Date().toISOString() },
        ],
      }),
    post: () => {
      mockMarcadas += 1;
      return Promise.resolve({ data: { marcadas: 2 } });
    },
  },
}));

const sesion = (tipo: string) => {
  localStorage.setItem('token', 'abc');
  localStorage.setItem('user_tipo', tipo);
  localStorage.setItem('user_username', 'Yeu123');
};

const renderBarra = () =>
  render(
    <MemoryRouter initialEntries={['/vacantes']}>
      <Navbar />
    </MemoryRouter>
  );

afterEach(() => {
  localStorage.clear();
  mockMarcadas = 0;
});

test('la campana muestra cuántos avisos hay sin leer y al abrirla los marca como leídos', async () => {
  sesion('aspirante');
  renderBarra();

  const campana = await screen.findByRole('button', { name: 'Notificaciones: 2 sin leer' });
  userEvent.click(campana);

  const panel = screen.getByRole('dialog', { name: /notificaciones/i });
  expect(within(panel).getByText(/ha sido revisada/)).toBeInTheDocument();
  expect(within(panel).getByText('Un aviso viejo')).toBeInTheDocument();
  expect(mockMarcadas).toBe(1);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument());
});

test('cada aviso lleva a donde se resuelve', () => {
  const aviso = (mensaje: string) => ({ id: 1, mensaje, leido: false, fecha: '' });
  expect(destinoDe(aviso("Tu postulación a 'X' fue rechazada."), 'aspirante')).toBe('/mis-aplicaciones');
  expect(destinoDe(aviso('¡Tu pago fue procesado! … plan PRO'), 'empresa')).toBe('/planes');
  // A una empresa nunca se le manda a la página de postulaciones del aspirante.
  expect(destinoDe(aviso("Tu postulación a 'X' fue rechazada."), 'empresa')).toBeNull();
});

test('con sesión la barra no lleva enlaces: todo vive en el menú de cuenta, con la página actual marcada', async () => {
  sesion('aspirante');
  renderBarra();
  await screen.findByRole('button', { name: /notificaciones/i });

  // Ni enlaces de secciones, ni "Hola, usuario", ni las tres líneas.
  expect(screen.queryByRole('link', { name: 'Vacantes' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Mis postulaciones' })).not.toBeInTheDocument();
  expect(screen.queryByText(/hola,/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /abrir menú/i })).not.toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Cuenta de Yeu123' }));
  const menu = screen.getByRole('menu');
  const opciones = within(menu).getAllByRole('menuitem');
  expect(opciones.map((o) => o.textContent)).toEqual(['Vacantes', 'Mis postulaciones', 'Mi perfil', 'Planes', 'Cerrar sesión']);
  // La barra se montó en /vacantes: esa opción va marcada.
  expect(within(menu).getByRole('menuitem', { name: 'Vacantes' })).toHaveAttribute('aria-current', 'page');
});

test('el menú de la empresa trae sus propias opciones', async () => {
  sesion('empresa');
  renderBarra();
  await screen.findByRole('button', { name: /notificaciones/i });

  userEvent.click(screen.getByRole('button', { name: 'Cuenta de Yeu123' }));
  const opciones = within(screen.getByRole('menu')).getAllByRole('menuitem').map((o) => o.textContent);
  expect(opciones).toEqual(['Mis vacantes', 'Postulaciones', 'Planes', 'Cerrar sesión']);
});

test('el menú se recorre con flechas y se cierra con Escape devolviendo el foco', async () => {
  sesion('aspirante');
  renderBarra();
  await screen.findByRole('button', { name: /notificaciones/i });

  const boton = screen.getByRole('button', { name: 'Cuenta de Yeu123' });
  boton.focus();
  userEvent.keyboard('{arrowdown}');
  const opciones = within(screen.getByRole('menu')).getAllByRole('menuitem');
  await waitFor(() => expect(opciones[0]).toHaveFocus());

  userEvent.keyboard('{arrowup}');
  expect(opciones[opciones.length - 1]).toHaveFocus();

  userEvent.keyboard('{escape}');
  await waitFor(() => expect(boton).toHaveFocus());
  expect(boton).toHaveAttribute('aria-expanded', 'false');
});

test('sin sesión no hay campana ni menú de cuenta', () => {
  renderBarra();
  expect(screen.queryByRole('button', { name: /notificaciones/i })).not.toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Iniciar sesión' }).length).toBeGreaterThan(0);
});

test('el avatar usa la foto si hay y vuelve a las iniciales si no carga', () => {
  const { container, rerender } = render(<AvatarCuenta nombre="Yeu123" foto="https://x.supabase.co/foto.jpg" />);
  const img = container.querySelector('img');
  expect(img).toHaveAttribute('src', 'https://x.supabase.co/foto.jpg');

  fireEvent.error(img as HTMLImageElement);
  expect(container.querySelector('img')).toBeNull();
  expect(container).toHaveTextContent('Y');

  rerender(<AvatarCuenta nombre="Yeu123" foto={null} />);
  expect(container.querySelector('img')).toBeNull();
});
