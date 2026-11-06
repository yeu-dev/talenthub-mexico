import type { Miga } from '../components/PageHeader';

// Las pestañas "Mi perfil · Mis postulaciones" (y las de empresa) se
// quitaron: repetían el menú de cuenta de la barra. La navegación no se
// repite (DESIGN.md).

/** "Mi cuenta › {seccion}". */
export function migasDeCuenta(seccion: string): Miga[] {
  return [{ etiqueta: 'Mi cuenta' }, { etiqueta: seccion }];
}
