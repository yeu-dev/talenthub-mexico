import {
  chipsPopulares,
  coincide,
  formatoSalario,
  haceCuanto,
  mencionaPalabra,
  normalizar,
  partesSalario,
  rutaBusqueda,
  stackConSueldos,
  stackPresente,
  vacantesPorCiudad,
  vacantesPorModalidad,
  VacantePublica,
} from './vacantes';

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

  it('ignora el relleno que las empresas escriben como tecnología', () => {
    const chips = chipsPopulares([vacante({ requisitos: { lenguajes: ['React', 'etc.', 'Otros', ''] } })]);
    const etiquetas = chips.map((c) => c.etiqueta);
    expect(etiquetas).toContain('React');
    expect(etiquetas).not.toContain('etc.');
    expect(etiquetas).not.toContain('Otros');
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

describe('partesSalario', () => {
  test('separa la moneda de la cifra cuando hay monto', () => {
    expect(partesSalario('28000.00', '38000.00')).toEqual({ cifra: '$28,000 – $38,000', conMoneda: true });
  });

  test('sin monto no hay moneda que poner', () => {
    expect(partesSalario('0', '0')).toEqual({ cifra: 'Salario por definir', conMoneda: false });
  });
});

describe('mencionaPalabra', () => {
  it('busca la palabra completa, no un pedazo de otra', () => {
    expect(mencionaPalabra('javascript y css', 'java')).toBe(false);
    expect(mencionaPalabra('backend en java 17', 'java')).toBe(true);
    expect(mencionaPalabra('trabajo en google', 'go')).toBe(false);
    expect(mencionaPalabra('postgresql', 'sql')).toBe(false);
    expect(mencionaPalabra('sql y owasp', 'sql')).toBe(true);
    expect(mencionaPalabra('apis con node.js', 'node.js')).toBe(true);
    expect(mencionaPalabra('c# y .net', 'c#')).toBe(true);
  });
});

describe('stackPresente', () => {
  it('solo da lo que piden las vacantes, con su nombre limpio y sin importar acentos ni mayúsculas', () => {
    const lista = [
      vacante({ id: 1, titulo: 'Backend Python', requisitos: { lenguajes: ['PostgreSQL'] } }),
      vacante({ id: 2, descripcion: 'Buscamos experiencia con PYTHON y Node', requisitos: { lenguajes: [] } }),
      vacante({ id: 3, requisitos: { lenguajes: ['JavaScript', 'SQL y OWASP'] } }),
    ];
    // Python en 2 vacantes va primero; los empates van en el orden de la lista.
    // Ninguna pide Java: "JavaScript" no cuenta como Java.
    expect(stackPresente(lista)).toEqual(['Python', 'JavaScript', 'SQL', 'PostgreSQL', 'Node.js']);
  });

  it('sin vacantes no da nada y respeta el máximo', () => {
    expect(stackPresente([])).toEqual([]);
    expect(stackPresente([vacante({})], 1)).toEqual(['TypeScript']);
  });
});

describe('coincide con tecnologías del stack curado', () => {
  it('"java" no trae las de JavaScript, y "node" encuentra "Node.js"', () => {
    const js = vacante({ requisitos: { lenguajes: ['JavaScript'] } });
    const java = vacante({ titulo: 'Backend Java', requisitos: { lenguajes: [] } });
    const node = vacante({ requisitos: { lenguajes: ['Node.js'] } });
    expect(coincide(js, { q: 'Java' })).toBe(false);
    expect(coincide(java, { q: 'java' })).toBe(true);
    expect(coincide(node, { q: 'node' })).toBe(true);
    expect(coincide(node, { q: 'Node.js' })).toBe(true);
  });

  it('lo que no es del stack se sigue buscando por pedazo', () => {
    expect(coincide(vacante({}), { q: 'desarr' })).toBe(true);
  });

  it('cada renglón del stack lleva exactamente a sus vacantes', () => {
    const lista = [
      vacante({ id: 1, requisitos: { lenguajes: ['JavaScript'] } }),
      vacante({ id: 2, titulo: 'Backend Java', requisitos: { lenguajes: ['SQL'] } }),
      vacante({ id: 3, requisitos: { lenguajes: ['PostgreSQL'] } }),
    ];
    for (const item of stackConSueldos(lista)) {
      expect(lista.filter((v) => coincide(v, { q: item.etiqueta }))).toHaveLength(item.n);
    }
  });
});

describe('stackConSueldos', () => {
  it('da el rango de sueldo de las vacantes de cada tecnología', () => {
    const lista = [
      vacante({ id: 1, salario_min: '20000', salario_max: '30000', requisitos: { lenguajes: ['Python'] } }),
      vacante({ id: 2, salario_min: '35000', salario_max: '50000', requisitos: { lenguajes: ['Python'] } }),
    ];
    expect(stackConSueldos(lista)).toEqual([{ etiqueta: 'Python', n: 2, min: 20000, max: 50000 }]);
  });
});

describe('conteos de la portada', () => {
  const lista = [
    vacante({ id: 1, empresa_nombre: 'Nebula Labs', ubicacion: 'Puebla, Pue.', modalidad: 'remoto' }),
    vacante({ id: 2, empresa_nombre: 'Nebula Labs', ubicacion: 'Puebla', modalidad: 'hibrido' }),
    vacante({ id: 3, empresa_nombre: 'Orbita', ubicacion: 'Monterrey, N.L.', modalidad: 'remoto' }),
  ];

  it('cuenta ciudades de la que más tiene a la que menos', () => {
    expect(vacantesPorCiudad(lista)).toEqual([
      { etiqueta: 'Puebla', n: 2 },
      { etiqueta: 'Monterrey', n: 1 },
    ]);
  });

  it('solo da las modalidades que tienen vacantes, y cada ciudad lleva a sus vacantes', () => {
    expect(vacantesPorModalidad(lista).map((m) => [m.valor, m.n])).toEqual([
      ['remoto', 2],
      ['hibrido', 1],
    ]);
    for (const c of vacantesPorCiudad(lista)) {
      expect(lista.filter((v) => coincide(v, { lugar: c.etiqueta }))).toHaveLength(c.n);
    }
  });
});
