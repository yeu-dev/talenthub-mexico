import api from '../services/api';
import { VacantePublica } from './vacantes';

/**
 * El catálogo público, pedido una vez por minuto como máximo y compartido.
 *
 * Lo usa el pie, que se monta en todas las páginas: sin esto pediría
 * `/vacantes/` en cada navegación. Si la petición falla, se olvida para que la
 * siguiente lo intente otra vez.
 *
 * La portada y el listado no lo usan: tienen su propio estado de carga, error
 * y "Reintentar", y necesitan saber exactamente cuándo pidieron.
 */
const VIGENCIA_MS = 60_000;
let cache: { promesa: Promise<VacantePublica[]>; desde: number } | null = null;

export function vacantesPublicas(): Promise<VacantePublica[]> {
  if (cache && Date.now() - cache.desde < VIGENCIA_MS) return cache.promesa;
  const promesa = api.get<VacantePublica[]>('/vacantes/').then(({ data }) => data);
  cache = { promesa, desde: Date.now() };
  promesa.catch(() => {
    cache = null;
  });
  return promesa;
}
