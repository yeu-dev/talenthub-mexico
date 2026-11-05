import type { Miga, Pestana } from '../components/PageHeader';

/**
 * Las secciones de "Mi cuenta" según el rol. Son las mismas que la barra de
 * navegación, pero aquí van como pestañas para moverse entre hermanas sin
 * subir hasta arriba.
 */
export function pestanasDeCuenta(tipo: string | null): Pestana[] {
  if (tipo === 'aspirante') {
    return [
      { etiqueta: 'Mi perfil', to: '/mi-perfil' },
      { etiqueta: 'Mis postulaciones', to: '/mis-aplicaciones' },
    ];
  }
  if (tipo === 'empresa') {
    return [
      { etiqueta: 'Mis vacantes', to: '/dashboard' },
      { etiqueta: 'Postulaciones', to: '/aplicaciones-empresa' },
    ];
  }
  return [];
}

/** "Mi cuenta › {seccion}". */
export function migasDeCuenta(seccion: string): Miga[] {
  return [{ etiqueta: 'Mi cuenta' }, { etiqueta: seccion }];
}
