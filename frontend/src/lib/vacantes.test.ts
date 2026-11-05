import { chipsPopulares, coincide, formatoSalario, haceCuanto, normalizar, rutaBusqueda, VacantePublica } from './vacantes';

const vacante = (over: Partial<VacantePublica>): VacantePublica => ({
  id: 1,
  titulo: 'Desarrollador Frontend',
  empresa_nombre: 'Nebula Labs',
  descripcion: 'Producto real',
  salario_min: '28000.00',
  salario_max: '38000.00',
  modalidad: 'hibrido',
  ubicacion: 'Puebla, Pue.',
  fecha_publicacion: '2026-11-01T10:00:00Z',
  requisitos: { lenguajes: ['React', 'TypeScript'], experiencia: '2 años' },
  ...over,
});

describe('normalizar', () => {
  it('quita acentos y mayúsculas', () => {
    expect(normalizar('  Querétaro ')).toBe('queretaro');
  });
});

describe('coincide', () => {
  it('busca en título, empresa y tecnologías sin importar acentos', () => {
    expect(coincide(vacante({}), { q: 'typescript' })).toBe(true);
    expect(coincide(vacante({}), { q: 'nebula' })).toBe(true);
    expect(coincide(vacante({ titulo: 'Analista de Datos' }), { q: 'análisis' })).toBe(false);
    expect(coincide(vacante({ titulo: 'Análisis de Datos' }), { q: 'analisis' })).toBe(true);
    expect(coincide(vacante({}), { q: 'python' })).toBe(false);
  });

  it('"remoto" en lugar filtra por modalidad, no por ciudad', () => {
    expect(coincide(vacante({ modalidad: 'remoto', ubicacion: 'Monterrey, N.L.' }), { lugar: 'Remoto' })).toBe(true);
    expect(coincide(vacante({ modalidad: 'presencial' }), { lugar: 'remoto' })).toBe(false);
  });

  it('busca la ciudad sin acentos', () => {
    expect(coincide(vacante({ ubicacion: 'Ciudad de México' }), { lugar: 'mexico' })).toBe(true);
    expect(coincide(vacante({}), { lugar: 'Guadalajara' })).toBe(false);
  });

  it('respeta la modalidad y tolera requisitos raros', () => {
    expect(coincide(vacante({}), { modalidad: 'remoto' })).toBe(false);
    expect(coincide(vacante({ requisitos: 'texto libre' }), { q: 'frontend' })).toBe(true);
    expect(coincide(vacante({ requisitos: null }), {})).toBe(true);
  });
});

describe('chipsPopulares', () => {
  it('pone Remoto primero solo si hay remotas, y cada chip lleva a resultados', () => {
    const lista = [
      vacante({ id: 1 }),
      vacante({ id: 2, modalidad: 'remoto', ubicacion: 'Monterrey, N.L.', requisitos: { lenguajes: ['React'] } }),
    ];
    const chips = chipsPopulares(lista);
    const etiquetas = chips.map((c) => c.etiqueta);
    expect(etiquetas[0]).toBe('Remoto');
    expect(etiquetas).toContain('React');
    expect(etiquetas).toContain('Puebla');
    for (const chip of chips) expect(lista.some((v) => coincide(v, chip.filtros))).toBe(true);
  });

  it('sin remotas no hay chip Remoto, y respeta el máximo', () => {
    const chips = chipsPopulares([vacante({})], 3);
    expect(chips.map((c) => c.etiqueta)).not.toContain('Remoto');
    expect(chips.length).toBeLessThanOrEqual(3);
  });

  it('sin vacantes no hay chips', () => {
    expect(chipsPopulares([])).toEqual([]);
  });
});

describe('formato', () => {
  it('formatea el salario', () => {
    expect(formatoSalario('28000.00', '38000.00')).toBe('$28,000 – $38,000 MXN');
    expect(formatoSalario('', '')).toBe('Salario por definir');
  });

  it('dice hace cuánto', () => {
    const ahora = new Date('2026-11-05T12:00:00Z').getTime();
    expect(haceCuanto('2026-11-05T08:00:00Z', ahora)).toBe('hoy');
    expect(haceCuanto('2026-11-04T08:00:00Z', ahora)).toBe('ayer');
    expect(haceCuanto('2026-11-01T08:00:00Z', ahora)).toBe('hace 4 días');
  });

  it('arma la ruta de búsqueda sin parámetros vacíos', () => {
    expect(rutaBusqueda({ q: ' react ', lugar: '' })).toBe('/vacantes?q=react');
    expect(rutaBusqueda({})).toBe('/vacantes');
  });
});
