import React from 'react';
import { render, screen } from '@testing-library/react';
import TitularGiratorio, { palabrasDelTitular } from './TitularGiratorio';
import { VacantePublica } from '../lib/vacantes';

const vacante = (id: number, lenguajes: string[]): VacantePublica => ({
  id,
  titulo: 'Desarrollador',
  empresa_nombre: 'Nebula Labs',
  descripcion: 'Producto real',
  salario_min: '28000.00',
  salario_max: '38000.00',
  modalidad: 'remoto',
  ubicacion: 'Puebla, Pue.',
  fecha_publicacion: '2026-11-01T10:00:00Z',
  requisitos: { lenguajes },
});

describe('palabrasDelTitular', () => {
  it('arranca en TI y sigue con el stack curado que piden las vacantes, de lo más pedido a lo menos', () => {
    const lista = [
      vacante(1, ['Python', 'React', 'etc.']),
      vacante(2, ['React', 'Docker']),
      vacante(3, ['react', 'SQL y OWASP']),
    ];
    // Docker no está en la lista curada; "SQL y OWASP" sale con su nombre limpio.
    expect(palabrasDelTitular(lista)).toEqual(['TI', 'React', 'Python', 'SQL']);
  });

  it('no pasa de 8 palabras además de TI', () => {
    const todo = ['Java', 'JavaScript', 'TypeScript', 'Python', 'PHP', 'C#', 'Go', 'Kotlin', 'SQL', 'MySQL'];
    expect(palabrasDelTitular([vacante(1, todo)])).toHaveLength(9);
  });

  it('sin vacantes se queda en TI', () => {
    expect(palabrasDelTitular([])).toEqual(['TI']);
  });
});

test('el titular se anuncia completo una sola vez y arranca en la primera palabra', () => {
  render(
    <h1>
      <TitularGiratorio palabras={['TI', 'React']} />
    </h1>
  );
  expect(screen.getByRole('heading', { level: 1, name: 'Tu siguiente empleo en TI ya trae el sueldo' })).toBeInTheDocument();
  // La parte visible va oculta al lector, para que el giro no se anuncie.
  const visible = screen.getByText('Tu siguiente empleo').parentElement;
  expect(visible).toHaveAttribute('aria-hidden', 'true');
  expect(visible).toHaveTextContent('Tu siguiente empleoen TIya trae el sueldo');
});
