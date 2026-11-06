/**
 * Lo que comparten la portada y el listado: el tipo de una vacante pública,
 * el filtro y los chips de búsqueda rápida. Vive aquí para que las dos
 * páginas busquen exactamente igual: un chip de la portada lleva a la misma
 * lista que escribir lo mismo en el buscador.
 */

/** Vacante tal como la sirve el endpoint público `/vacantes/`. */
export interface VacantePublica {
  id: number;
  titulo: string;
  empresa_nombre: string;
  descripcion: string;
  salario_min: string;
  salario_max: string;
  modalidad: string;
  ubicacion: string;
  fecha_publicacion: string;
  /** Dashboard guarda `{lenguajes, experiencia, otros}`; las viejas pueden traer otra cosa. */
  requisitos?: unknown;
}

export interface Filtros {
  /** Puesto, empresa o tecnología. */
  q?: string;
  /** Ciudad, o "remoto". */
  lugar?: string;
  modalidad?: string;
}

/** Minúsculas y sin acentos: "Querétaro" y "queretaro" son la misma búsqueda. */
export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const tecnologias = (vacante: VacantePublica): string[] => {
  const req = vacante.requisitos as { lenguajes?: unknown } | null | undefined;
  if (!req || typeof req !== 'object' || !Array.isArray(req.lenguajes)) return [];
  return req.lenguajes.filter((l): l is string => typeof l === 'string' && l.trim() !== '');
};

const REMOTO = 'remoto';

export function coincide(vacante: VacantePublica, { q, lugar, modalidad }: Filtros): boolean {
  if (modalidad && vacante.modalidad !== modalidad) return false;

  if (q && normalizar(q)) {
    const buscado = normalizar(q);
    // Si lo buscado es una tecnología de la lista curada ("java", "node"), se
    // busca como palabra completa y con sus variantes, igual que la cuenta de
    // la portada: así "Java · 2" lleva a 2 vacantes y no a las de JavaScript.
    // Cualquier otra búsqueda sigue siendo por pedazo ("desarr" encuentra
    // "Desarrollador").
    const tecnologia = stackDe(buscado);
    if (tecnologia) {
      if (!tecnologia.claves.some((clave) => mencionaPalabra(textoDeStack(vacante), clave))) return false;
    } else {
      const texto = normalizar(
        [vacante.titulo, vacante.empresa_nombre, vacante.descripcion, ...tecnologias(vacante)].join(' ')
      );
      if (!texto.includes(buscado)) return false;
    }
  }

  if (lugar && normalizar(lugar)) {
    const buscado = normalizar(lugar);
    // "Remoto" no es una ciudad: es la modalidad. Quien lo escribe en el campo
    // de lugar busca trabajo desde casa, viva donde viva la empresa.
    if (buscado === REMOTO) return vacante.modalidad === REMOTO;
    if (!normalizar(vacante.ubicacion).includes(buscado)) return false;
  }

  return true;
}

const MXN = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

/** "$28,000 – $38,000 MXN", o lo que haya si falta un extremo. */
export function formatoSalario(min: string, max: string): string {
  const a = parseFloat(min);
  const b = parseFloat(max);
  const okA = Number.isFinite(a) && a > 0;
  const okB = Number.isFinite(b) && b > 0;
  if (okA && okB) return `$${MXN.format(a)} – $${MXN.format(b)} MXN`;
  if (okA) return `Desde $${MXN.format(a)} MXN`;
  if (okB) return `Hasta $${MXN.format(b)} MXN`;
  return 'Salario por definir';
}

/**
 * El sueldo partido en dos: la cifra grande y si lleva moneda. Las tarjetas
 * pintan "MXN" en chico junto a "mensual" para que la cifra quepa en un
 * renglón; sin monto ("Salario por definir") no hay moneda que poner.
 */
export function partesSalario(min: string, max: string): { cifra: string; conMoneda: boolean } {
  const texto = formatoSalario(min, max);
  const conMoneda = texto.endsWith(' MXN');
  return { cifra: conMoneda ? texto.slice(0, -4) : texto, conMoneda };
}

const DIA = 24 * 60 * 60 * 1000;

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas", o la fecha. */
export function haceCuanto(fecha: string, ahora = Date.now()): string {
  const t = new Date(fecha).getTime();
  if (!Number.isFinite(t)) return '';
  const dias = Math.floor((ahora - t) / DIA);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 14) return `hace ${dias} días`;
  if (dias < 60) return `hace ${Math.floor(dias / 7)} semanas`;
  return new Date(t).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface Chip {
  etiqueta: string;
  filtros: Filtros;
}

/** La parte de la ciudad antes de la coma: "Puebla, Pue." → "Puebla". */
const ciudad = (ubicacion: string) => ubicacion.split(',')[0].trim();

// Lo que las empresas escriben como relleno en la lista de tecnologías. Un
// chip "etc." no lleva a ninguna búsqueda útil.
const RELLENO = new Set(['etc', 'etc.', 'otros', 'otro', 'otras', 'n/a', 'na', 'ninguno', 'ninguna', '-', '...']);

/** Un valor y cuántas vacantes lo tienen. */
export interface Conteo {
  etiqueta: string;
  n: number;
}

/**
 * Valores distintos (sin acentos ni mayúsculas) con cuántas veces salen, de
 * más a menos; los empates en orden alfabético.
 */
function contar(valores: string[]): Conteo[] {
  const conteo = new Map<string, Conteo>();
  for (const valor of valores) {
    const clave = normalizar(valor);
    if (clave.length < 2 || RELLENO.has(clave)) continue;
    const actual = conteo.get(clave);
    if (actual) actual.n += 1;
    else conteo.set(clave, { etiqueta: valor.trim(), n: 1 });
  }
  return Array.from(conteo.values()).sort((a, b) => b.n - a.n || a.etiqueta.localeCompare(b.etiqueta, 'es'));
}

const porFrecuencia = (valores: string[]): string[] => contar(valores).map((item) => item.etiqueta);

/** Las ciudades con vacantes, de la que más tiene a la que menos. */
export const vacantesPorCiudad = (vacantes: VacantePublica[], maximo = 6): Conteo[] =>
  contar(vacantes.map((v) => ciudad(v.ubicacion))).slice(0, maximo);

/** Las modalidades que maneja la API, con su nombre para mostrar. */
export const MODALIDADES = [
  { valor: 'remoto', etiqueta: 'Remoto' },
  { valor: 'hibrido', etiqueta: 'Híbrido' },
  { valor: 'presencial', etiqueta: 'Presencial' },
] as const;

/** Cada modalidad con al menos una vacante, en el orden de `MODALIDADES`. */
export const vacantesPorModalidad = (vacantes: VacantePublica[]) =>
  MODALIDADES.map((m) => ({ ...m, n: vacantes.filter((v) => v.modalidad === m.valor).length })).filter(
    (m) => m.n > 0
  );

/**
 * Lenguajes, bases de datos y stack web con su nombre bien escrito, para el
 * titular de la portada. Es una lista curada para que los nombres se vean
 * limpios ("SQL" y no "SQL y OWASP" tal como lo capturó una empresa), pero
 * no se muestra tal cual: `stackPresente` deja solo lo que de verdad piden
 * las vacantes publicadas.
 *
 * `claves` son las formas en que se escribe cada uno, ya sin acentos y en
 * minúsculas. Se buscan como palabra completa (ver `mencionaPalabra`).
 */
const STACK: { etiqueta: string; claves: string[] }[] = [
  { etiqueta: 'Java', claves: ['java'] },
  { etiqueta: 'JavaScript', claves: ['javascript'] },
  { etiqueta: 'TypeScript', claves: ['typescript'] },
  { etiqueta: 'Python', claves: ['python'] },
  { etiqueta: 'PHP', claves: ['php'] },
  { etiqueta: 'C#', claves: ['c#'] },
  { etiqueta: 'Go', claves: ['go', 'golang'] },
  { etiqueta: 'Kotlin', claves: ['kotlin'] },
  { etiqueta: 'SQL', claves: ['sql'] },
  { etiqueta: 'PostgreSQL', claves: ['postgresql', 'postgres'] },
  { etiqueta: 'MySQL', claves: ['mysql'] },
  { etiqueta: 'MongoDB', claves: ['mongodb', 'mongo'] },
  { etiqueta: 'HTML', claves: ['html', 'html5'] },
  { etiqueta: 'CSS', claves: ['css', 'css3'] },
  { etiqueta: 'React', claves: ['react', 'reactjs', 'react.js'] },
  { etiqueta: 'Angular', claves: ['angular'] },
  { etiqueta: 'Node.js', claves: ['node.js', 'nodejs', 'node'] },
];

const escaparRegex = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * `true` si `clave` aparece como palabra completa en `texto` (los dos ya
 * normalizados). Con un `includes` simple, "java" coincidía dentro de
 * "javascript", "go" dentro de "google" y "sql" dentro de "postgresql".
 */
export function mencionaPalabra(texto: string, clave: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escaparRegex(clave)}(?![a-z0-9])`).test(texto);
}

/** Dónde se busca el stack de una vacante: título, descripción y tecnologías. */
const textoDeStack = (v: VacantePublica) => normalizar([v.titulo, v.descripcion, ...tecnologias(v)].join(' '));

/** La entrada del stack curado que corresponde a lo buscado ("node" → Node.js), si hay. */
function stackDe(buscado: string) {
  return STACK.find((item) => normalizar(item.etiqueta) === buscado || item.claves.includes(buscado));
}

/** Una tecnología del stack curado con sus vacantes y el rango de sueldo que pagan. */
export interface StackConSueldo extends Conteo {
  /** El `salario_min` más bajo entre sus vacantes. */
  min: number;
  /** El `salario_max` más alto entre sus vacantes. */
  max: number;
}

/**
 * Del stack curado, lo que menciona al menos una vacante publicada, con
 * cuántas lo piden y el rango de sueldo de esas vacantes; de lo más pedido a
 * lo menos, y los empates en el orden de la lista. Si nadie pide Java, Java
 * no sale.
 */
export function stackConSueldos(vacantes: VacantePublica[], maximo = 8): StackConSueldo[] {
  const textos = vacantes.map(textoDeStack);
  return STACK.map((item, orden) => {
    const suyas = vacantes.filter((_, i) => item.claves.some((clave) => mencionaPalabra(textos[i], clave)));
    const mins = suyas.map((v) => parseFloat(v.salario_min)).filter((n) => Number.isFinite(n) && n > 0);
    const maxs = suyas.map((v) => parseFloat(v.salario_max)).filter((n) => Number.isFinite(n) && n > 0);
    return {
      etiqueta: item.etiqueta,
      orden,
      n: suyas.length,
      min: mins.length ? Math.min(...mins) : 0,
      max: maxs.length ? Math.max(...maxs) : 0,
    };
  })
    .filter((item) => item.n > 0)
    .sort((a, b) => b.n - a.n || a.orden - b.orden)
    .slice(0, maximo)
    .map((item) => ({ etiqueta: item.etiqueta, n: item.n, min: item.min, max: item.max }));
}

/** Solo los nombres de `stackConSueldos`: lo que gira en el titular. */
export const stackPresente = (vacantes: VacantePublica[], maximo = 8): string[] =>
  stackConSueldos(vacantes, maximo).map((item) => item.etiqueta);

/**
 * Búsquedas rápidas sacadas de las vacantes que hay. Nunca un chip escrito a
 * mano: uno que lleva a cero resultados es peor que no tener chip.
 * "Remoto" va primero si existe al menos una; después lo más frecuente,
 * intercalando tecnologías y ciudades para que no salgan solo de un tipo.
 */
export function chipsPopulares(vacantes: VacantePublica[], maximo = 6): Chip[] {
  const chips: Chip[] = [];
  if (vacantes.some((v) => v.modalidad === REMOTO)) {
    chips.push({ etiqueta: 'Remoto', filtros: { lugar: 'Remoto' } });
  }

  const techs = porFrecuencia(vacantes.flatMap(tecnologias));
  const ciudades = porFrecuencia(vacantes.map((v) => ciudad(v.ubicacion)));

  for (let i = 0; chips.length < maximo && (i < techs.length || i < ciudades.length); i += 1) {
    if (i < techs.length) chips.push({ etiqueta: techs[i], filtros: { q: techs[i] } });
    if (chips.length < maximo && i < ciudades.length) {
      chips.push({ etiqueta: ciudades[i], filtros: { lugar: ciudades[i] } });
    }
  }
  return chips;
}

/** `/vacantes?q=…&lugar=…`, sin parámetros vacíos. */
export function rutaBusqueda({ q, lugar, modalidad }: Filtros): string {
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  if (lugar?.trim()) params.set('lugar', lugar.trim());
  if (modalidad) params.set('modalidad', modalidad);
  const qs = params.toString();
  return qs ? `/vacantes?${qs}` : '/vacantes';
}
