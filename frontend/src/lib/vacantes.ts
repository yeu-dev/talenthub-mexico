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
    const texto = normalizar(
      [vacante.titulo, vacante.empresa_nombre, vacante.descripcion, ...tecnologias(vacante)].join(' ')
    );
    if (!texto.includes(buscado)) return false;
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

/** Valores distintos (sin acentos ni mayúsculas) ordenados por frecuencia. */
function porFrecuencia(valores: string[]): string[] {
  const conteo = new Map<string, { etiqueta: string; n: number }>();
  for (const valor of valores) {
    const clave = normalizar(valor);
    if (clave.length < 2 || RELLENO.has(clave)) continue;
    const actual = conteo.get(clave);
    if (actual) actual.n += 1;
    else conteo.set(clave, { etiqueta: valor.trim(), n: 1 });
  }
  return Array.from(conteo.values())
    .sort((a, b) => b.n - a.n || a.etiqueta.localeCompare(b.etiqueta, 'es'))
    .map((item) => item.etiqueta);
}

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
